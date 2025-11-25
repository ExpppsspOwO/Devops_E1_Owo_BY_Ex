<template>
  <div class="pa-4"> <v-card elevation="4" rounded="lg">
      <v-data-table 
        :headers="headers" 
        :items="categories"
        hover 
        density="comfortable"
      >
        <template v-slot:top>
          <v-toolbar color="indigo-darken-1" flat rounded="t-lg">
            <v-toolbar-title class="font-weight-bold">
              <v-icon icon="mdi-account-group" start></v-icon>
              รายชื่อผู้ใช้งาน (Admin List)
            </v-toolbar-title>

            <v-spacer></v-spacer>

            <v-btn 
              class="me-4 text-none" 
              color="white" 
              variant="flat"
              prepend-icon="mdi-plus-circle" 
              rounded="pill" 
              text="Add New User" 
              @click="add"
            ></v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item.name_th="{ value }">
          <div class="font-weight-medium text-indigo-darken-2">
            {{ value }}
          </div>
        </template>

        <template v-slot:item.status="{ value }">
          <v-chip 
            :color="value === 'active' ? 'success' : 'grey'" 
            :text="value" 
            class="text-uppercase font-weight-bold"
            size="small"
            variant="flat"
            prepend-icon="mdi-circle-medium"
          >
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex ga-2 justify-end">
            <v-btn 
              icon="mdi-pencil" 
              size="small" 
              color="amber-darken-2" 
              variant="text" 
              @click="edit(item.id)"
            ></v-btn>
            <v-btn 
              icon="mdi-delete" 
              size="small" 
              color="red-lighten-1" 
              variant="text" 
              @click="remove(item.id)"
            ></v-btn>
          </div>
        </template>

        <template v-slot:no-data>
          <div class="pa-4 text-center">
            <v-icon icon="mdi-alert-circle-outline" size="large" color="grey-lighten-1" class="mb-2"></v-icon>
            <div class="text-medium-emphasis mb-2">ไม่พบข้อมูลในระบบ</div>
            <v-btn 
              prepend-icon="mdi-refresh" 
              rounded="pill" 
              color="indigo" 
              variant="outlined"
              @click="fetchData"
            >
              Reload Data
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500" transition="dialog-bottom-transition">
      <v-card rounded="xl">
        <v-toolbar :color="isEditing ? 'amber-darken-1' : 'indigo'" theme="dark">
          <v-toolbar-title class="text-h6 font-weight-bold">
            <v-icon :icon="isEditing ? 'mdi-pencil-box' : 'mdi-account-plus'" start></v-icon>
            {{ isEditing ? 'Edit User' : 'New User' }}
          </v-toolbar-title>
          <v-btn icon="mdi-close" variant="text" @click="dialog = false"></v-btn>
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-row dense>
            <v-col cols="12">
              <v-text-field 
                v-model="formModel.email" 
                label="Email Address" 
                prepend-inner-icon="mdi-email-outline"
                variant="outlined"
                color="indigo"
                density="comfortable"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-select 
                v-model="formModel.status" 
                label="Status" 
                :items="['active', 'disabled']"
                prepend-inner-icon="mdi-toggle-switch-outline"
                variant="outlined"
                color="indigo"
                density="comfortable"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field 
                v-model="formModel.name_th" 
                label="ชื่อภาษาไทย" 
                prepend-inner-icon="mdi-account-outline"
                variant="outlined"
                color="indigo"
                density="comfortable"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field 
                v-model="formModel.password_hash" 
                label="Password" 
                :type="visible ? 'text' : 'password'"
                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="visible = !visible"
                prepend-inner-icon="mdi-lock-outline"
                variant="outlined"
                color="indigo"
                hint="ปล่อยว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน"
                persistent-hint
                density="comfortable"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4 bg-grey-lighten-5">
          <v-btn 
            text="Cancel" 
            variant="text" 
            color="grey-darken-1" 
            @click="dialog = false"
          ></v-btn>
          <v-spacer></v-spacer>
          <v-btn 
            :text="isEditing ? 'Update Changes' : 'Save User'" 
            :color="isEditing ? 'amber-darken-3' : 'indigo-darken-1'" 
            variant="elevated" 
            rounded="pill"
            class="px-6"
            @click="save"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, shallowRef, toRef } from 'vue'
import axios from 'axios'

// --- 1. การตั้งค่าตัวแปร ---
const categories = ref([])
const dialog = shallowRef(false)
const visible = ref(false)  

function createNewRecord() {
  return {
    email: '',
    name_th: '',
    password_hash: '',
    status: 'active',
  }
}

const formModel = ref(createNewRecord())
const isEditing = toRef(() => !!formModel.value.id)

// ปรับ Header ให้สวยขึ้น
const headers = [
  { title: 'ID', key: 'id', align: 'start' },
  { title: 'EMAIL', key: 'email' },
  { title: 'ชื่อไทย', key: 'name_th' },
  { title: 'STATUS', key: 'status', align: 'center' }, // จัดกลาง
  { title: 'CREATED DATE', key: 'created_at', align: 'end' },
  { title: 'ACTIONS', key: 'actions', align: 'end', sortable: false },
]

// --- 2. ฟังก์ชันหลักสำหรับดึงข้อมูล ---
const fetchData = async () => {
  try {
    const { data } = await axios.get("http://localhost:7000/api/users/list_users_all_admin");
    categories.value = data.list; 
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

onMounted(async () => {
  await fetchData();
})

// --- 3. ฟังก์ชันจัดการ Events ---

function add() {
  formModel.value = createNewRecord()
  dialog.value = true
}

async function edit(id) {
  const found = categories.value.find(item => item.id === id)
  if (found) {
    // Clone ข้อมูลมา แต่เคลียร์ password ให้ว่างไว้ เพื่อความสวยงาม
    formModel.value = { ...found, password_hash: '' } 
    dialog.value = true
  }
}

async function remove(id) {
  const ok = confirm("แน่ใจนะหนุ่มว่าจะลบ?")
  if (!ok) return

  try {
    await axios.delete(`http://localhost:7000/api/users/deleteusers/${id}`)
    await fetchData()
  } catch (error) {
    console.error("Delete error:", error)
  }
}

async function save() {
  try {
    if (isEditing.value) {
      await axios.put("http://localhost:7000/api/users/usersedit", formModel.value)
    } else {
      await axios.post("http://localhost:7000/api/users/createadmin", formModel.value)
    }
    dialog.value = false
    await fetchData()

  } catch (error) {
    console.error("Save error:", error)
  }
}
</script>