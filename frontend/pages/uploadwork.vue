<template>
  <v-container class="fill-height align-start" fluid>
    <v-card class="mx-auto w-100" max-width="1200" elevation="4" rounded="xl">
      
      <v-toolbar color="primary" extended extension-height="60">
        <v-app-bar-nav-icon variant="text"></v-app-bar-nav-icon>
        <v-toolbar-title class="text-h5 font-weight-bold">
          {{ config.siteTitle }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-cog" variant="text" @click="tab = 'admin'"></v-btn>

        <template v-slot:extension>
          <v-tabs v-model="tab" align-tabs="title" color="white">
            <v-tab value="home" class="text-subtitle-1">
              <v-icon start>mdi-pencil-plus</v-icon> บันทึกงาน
            </v-tab>
            <v-tab value="search" class="text-subtitle-1">
              <v-icon start>mdi-magnify</v-icon> ค้นหางาน
            </v-tab>
            <v-tab value="admin" class="text-subtitle-1">
              <v-icon start>mdi-tune</v-icon> ตั้งค่า
            </v-tab>
          </v-tabs>
        </template>
      </v-toolbar>

      <v-window v-model="tab" class="pa-6">
        
        <v-window-item value="home">
          <div class="text-h5 mb-6 text-primary font-weight-bold">
            {{ config.mainHeading }}
          </div>

          <v-form ref="formRef" @submit.prevent="submitWork">
            <v-text-field
              v-model="formData.workName"
              label="ชื่อผลงาน"
              variant="outlined"
              prepend-inner-icon="mdi-format-title"
              :rules="[v => !!v || 'จำเป็นต้องระบุชื่อผลงาน']"
              required
              class="mb-2"
            ></v-text-field>

            <v-row>
              <v-col cols="12" md="8">
                <v-select
                  v-model="formData.workType"
                  :items="workTypes"
                  label="ประเภทของงาน"
                  variant="outlined"
                  prepend-inner-icon="mdi-folder-outline"
                  :rules="[v => !!v || 'จำเป็นต้องเลือกประเภท']"
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-btn 
                  block 
                  height="56" 
                  color="success" 
                  variant="tonal"
                  @click="dialogType = true"
                >
                  <v-icon start>mdi-plus</v-icon> เพิ่มประเภท
                </v-btn>
              </v-col>
            </v-row>

            <v-file-input
              v-model="formData.files"
              label="แนบไฟล์ผลงาน"
              variant="outlined"
              prepend-inner-icon="mdi-paperclip"
              show-size
              chips
              class="mb-4"
            ></v-file-input>

            <v-btn 
              type="submit" 
              color="primary" 
              size="x-large" 
              block 
              class="rounded-lg"
              :loading="loading"
            >
              <v-icon start>mdi-content-save</v-icon> บันทึกข้อมูล
            </v-btn>
          </v-form>
        </v-window-item>

        <v-window-item value="search">
          <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-4">
            <div class="text-h5 text-primary font-weight-bold">
              {{ config.searchHeading }}
            </div>
            <v-chip color="info" variant="flat">
              ทั้งหมด: {{ works.length }} รายการ
            </v-chip>
          </div>

          <v-row class="mb-2">
            <v-col cols="12" md="8">
              <v-text-field
                v-model="search"
                label="ค้นหา..."
                prepend-inner-icon="mdi-magnify"
                variant="solo-filled"
                density="compact"
                hide-details
                single-line
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="filterType"
                :items="['ทั้งหมด', ...workTypes]"
                label="กรองประเภท"
                variant="solo-filled"
                density="compact"
                hide-details
              ></v-select>
            </v-col>
          </v-row>

          <v-data-table
            :headers="headers"
            :items="filteredWorks"
            :items-per-page="5"
            class="elevation-1 rounded-lg"
          >
            <template v-slot:item.type="{ item }">
              <v-chip size="small" color="primary" variant="outlined">
                {{ item.type }}
              </v-chip>
            </template>
            
            <template v-slot:item.actions="{ item }">
              <v-btn icon="mdi-eye" size="small" variant="text" color="blue" @click="viewWork(item)"></v-btn>
              <v-btn icon="mdi-delete" size="small" variant="text" color="red"></v-btn>
            </template>
          </v-data-table>
        </v-window-item>

        <v-window-item value="admin">
          <div class="text-h5 mb-6 text-grey-darken-3 font-weight-bold">
            {{ config.adminHeading }}
          </div>
          <v-text-field
            v-model="config.siteTitle"
            label="ชื่อเว็บไซต์ (Title)"
            variant="outlined"
          ></v-text-field>
          <v-btn color="secondary" size="large" @click="snackbar = true">
            บันทึกการตั้งค่า
          </v-btn>
        </v-window-item>

      </v-window>
    </v-card>

    <v-dialog v-model="dialogType" max-width="400">
      <v-card rounded="xl">
        <v-card-title>เพิ่มประเภทงานใหม่</v-card-title>
        <v-card-text>
          <v-text-field v-model="newType" label="ชื่อประเภท" autofocus @keyup.enter="addType"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogType = false">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" @click="addType">เพิ่ม</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogView" max-width="500">
      <v-card rounded="xl">
        <v-toolbar color="primary" :title="selectedWork.workName"></v-toolbar>
        <v-list lines="two">
          <v-list-item prepend-icon="mdi-folder">
            <v-list-item-title>ประเภท</v-list-item-title>
            <v-list-item-subtitle>{{ selectedWork.workType }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item prepend-icon="mdi-calendar">
            <v-list-item-title>วันที่บันทึก</v-list-item-title>
            <v-list-item-subtitle>{{ selectedWork.createdDate }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item prepend-icon="mdi-paperclip" v-if="selectedWork.fileName">
            <v-list-item-title>ไฟล์แนบ</v-list-item-title>
            <v-list-item-subtitle>{{ selectedWork.fileName }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn block color="primary" @click="dialogView = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success" timeout="2000">
      บันทึกข้อมูลเรียบร้อย (Frontend Demo)
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">ปิด</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

// --- State ---
const tab = ref('home')
const loading = ref(false)
const snackbar = ref(false)
const dialogType = ref(false)
const dialogView = ref(false)
const newType = ref('')
const search = ref('')
const filterType = ref('ทั้งหมด')

// --- Config (Mock) ---
const config = reactive({
  siteTitle: 'ระบบจัดเก็บงานส่วนตัว',
  mainHeading: 'บันทึกงานของฉัน',
  searchHeading: 'ค้นหาผลงานย้อนหลัง',
  adminHeading: 'ตั้งค่าชื่อเว็บไซต์'
})

// --- Form Data ---
const formData = reactive({
  workName: '',
  workType: null,
  files: []
})

const workTypes = ref(['เอกสาร', 'งานนำเสนอ', 'รูปภาพ', 'วิดีโอ', 'โค้ด'])

// --- Table Data (Mock) ---
const works = ref([
  { id: 1, workName: 'ออกแบบ UX/UI', workType: 'รูปภาพ', fileName: 'design.png', createdDate: '2023-10-01' },
  { id: 2, workName: 'รายงานประจำปี', workType: 'เอกสาร', fileName: 'report.pdf', createdDate: '2023-10-05' },
  { id: 3, workName: 'ระบบ API', workType: 'โค้ด', fileName: '', createdDate: '2023-10-12' },
])

const selectedWork = ref({})

const headers = [
  { title: 'ชื่อผลงาน', key: 'workName' },
  { title: 'ประเภท', key: 'type', value: 'workType' }, // map value to workType
  { title: 'วันที่', key: 'createdDate' },
  { title: 'จัดการ', key: 'actions', sortable: false },
]

// --- Computed ---
const filteredWorks = computed(() => {
  return works.value.filter(work => {
    // 1. Filter by Type
    const typeMatch = filterType.value === 'ทั้งหมด' || work.workType === filterType.value
    
    // 2. Filter by Search Query
    const query = search.value.toLowerCase()
    const textMatch = work.workName.toLowerCase().includes(query) || 
                      work.workType.toLowerCase().includes(query)

    return typeMatch && textMatch
  })
})

// --- Methods ---
const submitWork = () => {
  // Validate basic (Mock)
  if (!formData.workName || !formData.workType) return

  loading.value = true
  
  // Simulate API delay
  setTimeout(() => {
    const newWork = {
      id: Date.now(),
      workName: formData.workName,
      workType: formData.workType,
      fileName: formData.files && formData.files[0] ? formData.files[0].name : '',
      createdDate: new Date().toISOString().split('T')[0]
    }
    
    // Add to top of list
    works.value.unshift(newWork)
    
    // Reset form
    formData.workName = ''
    formData.workType = null
    formData.files = []
    
    loading.value = false
    snackbar.value = true
  }, 1000)
}

const addType = () => {
  if (newType.value) {
    workTypes.value.push(newType.value)
    formData.workType = newType.value
    newType.value = ''
    dialogType.value = false
  }
}

const viewWork = (item) => {
  selectedWork.value = item
  dialogView.value = true
}
</script>

<style scoped>
/* ไม่มีการใช้ CSS ภายนอก ทุกอย่างใช้ Vuetify classes */
</style>