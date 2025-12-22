<template>
  <v-container>
    <v-overlay :model-value="loading" class="align-center justify-center">
      <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
    </v-overlay>

    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center">
          <v-avatar color="primary" class="mr-3">
            <span class="white--text text-h6">{{ userInitials }}</span>
          </v-avatar>
          <div>
            <h2 class="text-h5 font-weight-bold">ส่งผลงานการประเมิน</h2>
            <div class="text-caption grey--text">
              ผู้รับการประเมิน: {{ currentUser.name_th }} | แผนก: {{ currentUser.dept_id || '-' }}
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <div v-if="!loading">
      
      <v-expansion-panels multiple variant="accordion">
        
        <v-expansion-panel 
          v-for="(topic, tIndex) in evaluationData" 
          :key="topic.id" 
          elevation="1"
        >
          
          <v-expansion-panel-title>
            <div class="d-flex align-center w-100 mr-2">
              <span class="text-subtitle-1 font-weight-bold primary--text mr-auto">
                {{ topic.title_th }}
              </span>
              
              <v-chip
                size="small"
                :color="isTopicComplete(topic) ? 'success' : 'grey-lighten-1'"
                variant="flat"
                class="ml-2"
              >
                {{ getTopicProgress(topic) }}
              </v-chip>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <v-list lines="two" class="pa-0">
              <template v-for="(indicator, iIndex) in topic.indicators" :key="indicator.id">
                <v-list-item class="px-0">
                  
                  <div class="mb-2">
                    <v-list-item-title class="font-weight-medium mb-1 text-wrap">
                      <v-chip size="x-small" color="primary" label class="mr-2">
                        {{ indicator.code }}
                      </v-chip>
                      {{ indicator.name_th }}
                    </v-list-item-title>
                    
                    <v-list-item-subtitle class="text-wrap">
                      {{ indicator.description }}
                    </v-list-item-subtitle>

                    <div v-if="indicator.uploaded_files && indicator.uploaded_files.length > 0" class="d-flex flex-wrap gap-2 mt-2">
                      <v-chip
                        v-for="file in indicator.uploaded_files"
                        :key="file.id"
                        color="success"
                        variant="tonal"
                        size="small"
                        closable
                        @click:close="deleteFile(file.id)"
                      >
                        <template v-slot:prepend>
                          <v-icon icon="mdi-file-check" start></v-icon>
                        </template>
                        {{ file.file_name }}
                      </v-chip>
                    </div>
                  </div>

                  <template v-slot:append>
                    <div class="d-flex align-center mt-2" style="width: 100%; min-width: 350px; gap: 10px;">
                      
                      <v-select
                        v-if="indicator.allowed_evidence.length > 1"
                        v-model="indicator.selectedEvidenceType"
                        :items="indicator.allowed_evidence"
                        item-title="name_th"
                        item-value="id"
                        label="เลือกประเภท"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="width: 160px;"
                      ></v-select>

                      <div v-else class="text-right d-flex flex-column align-end justify-center" style="width: 140px;">
                        <span class="text-caption text-medium-emphasis">สิ่งที่ต้องส่ง:</span>
                        <v-chip size="x-small" variant="tonal" color="grey-darken-2">
                          {{ indicator.allowed_evidence[0]?.name_th || 'เอกสาร' }}
                        </v-chip>
                      </div>

                      <v-file-input
                        v-model="indicator.tempFile"
                        :loading="uploadingId === indicator.id"
                        :disabled="uploadingId === indicator.id"
                        label="เลือกไฟล์..."
                        prepend-icon=""
                        prepend-inner-icon="mdi-paperclip"
                        variant="outlined"
                        density="compact"
                        hide-details
                        single-line
                        @update:modelValue="handleFileUpload(indicator)"
                        style="flex: 1;"
                      ></v-file-input>
                    </div>
                  </template>

                </v-list-item>
                <v-divider v-if="iIndex < topic.indicators.length - 1" class="my-2"></v-divider>
              </template>
            </v-list>
          </v-expansion-panel-text>

        </v-expansion-panel>
      </v-expansion-panels>
      
      <v-alert v-if="evaluationData.length === 0" type="info" variant="tonal" class="mt-4">
        ไม่พบรายการประเมินสำหรับปีการศึกษานี้
      </v-alert>
    </div>

  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  name: "EvidenceSubmission",
  data() {
    return {
      currentUser: { name_th: 'User', role: '', dept_id: '', id: null },
      token: '',
      loading: false,
      uploadingId: null,
      evaluationData: []
    };
  },
  computed: {
    userInitials() {
      return this.currentUser.name_th ? this.currentUser.name_th.charAt(0) : 'U';
    }
  },
  mounted() {
    this.initPage();
  },
  methods: {
    // Helper: นับความคืบหน้าของแต่ละหัวข้อ
    getTopicProgress(topic) {
      if (!topic.indicators) return '0/0';
      const completed = topic.indicators.filter(i => i.uploaded_files && i.uploaded_files.length > 0).length;
      return `${completed} / ${topic.indicators.length}`;
    },
    // Helper: เช็คว่าหัวข้อนี้ทำครบทุกข้อหรือยัง (เพื่อเปลี่ยนสี Chip)
    isTopicComplete(topic) {
        if (!topic.indicators) return false;
        const completed = topic.indicators.filter(i => i.uploaded_files && i.uploaded_files.length > 0).length;
        return completed === topic.indicators.length && topic.indicators.length > 0;
    },

    // --- Logic เดิมทั้งหมด ---
    parseJwt(token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (e) {
        return {};
      }
    },

    async initPage() {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        this.$router.push('/login');
        return;
      }
      this.token = token;

      const userStr = localStorage.getItem('user_info');
      if (userStr) {
        try { this.currentUser = JSON.parse(userStr); } catch(e) {}
      } 
      
      if (!this.currentUser.id) {
        const decoded = this.parseJwt(token);
        this.currentUser = {
          id: decoded.id || decoded.sub, 
          name_th: decoded.name || decoded.username || 'ผู้ใช้งาน',
          dept_id: decoded.dept_id || '-',
          role: decoded.role || 'user'
        };
      }

      await this.fetchEvaluationData();
    },

    async fetchEvaluationData() {
      this.loading = true;
      try {
        const response = await axios.get('http://localhost:7000/api/evaluatee/form-data', {
          headers: { Authorization: `Bearer ${this.token}` },
          params: { period_id: 1 } 
        });
        this.evaluationData = response.data;
        this.processEvaluationData();
      } catch (error) {
        console.error("Fetch Error:", error);
        if (error.response && error.response.status === 401) {
            alert('Session หมดอายุ กรุณา Login ใหม่');
            this.$router.push('/login');
        }
      } finally {
        this.loading = false;
      }
    },

    processEvaluationData() {
      this.evaluationData.forEach(topic => {
        topic.indicators.forEach(ind => {
          ind.tempFile = null;
          if (ind.allowed_evidence && ind.allowed_evidence.length === 1) {
            ind.selectedEvidenceType = ind.allowed_evidence[0].id;
          } else {
            ind.selectedEvidenceType = null;
          }
        });
      });
    },

    async handleFileUpload(indicator) {
      const file = Array.isArray(indicator.tempFile) ? indicator.tempFile[0] : indicator.tempFile;
      if (!file) return;

      if (!indicator.selectedEvidenceType) {
        alert('กรุณาเลือกประเภทเอกสารก่อน');
        indicator.tempFile = null;
        return;
      }

      this.uploadingId = indicator.id;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('period_id', 1);
      formData.append('evaluatee_id', this.currentUser.id);
      formData.append('indicator_id', indicator.id);
      formData.append('evidence_type_id', indicator.selectedEvidenceType);

      try {
        const res = await axios.post('http://localhost:7000/api/upload/file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${this.token}`
          }
        });

        if (!indicator.uploaded_files) indicator.uploaded_files = [];
        indicator.uploaded_files.push({
          id: res.data.attachment_id || Date.now(),
          file_name: file.name
        });
        indicator.tempFile = null;

      } catch (error) {
        alert('อัปโหลดล้มเหลว: ' + (error.response?.data?.message || error.message));
        indicator.tempFile = null;
      } finally {
        this.uploadingId = null;
      }
    },

    async deleteFile(fileId) {
       if(!confirm('ต้องการลบไฟล์นี้ใช่ไหม?')) return;
       console.log('Delete:', fileId);
    }
  }
};
</script>