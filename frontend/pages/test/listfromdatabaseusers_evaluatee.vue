<template>
  <div>
    <v-sheet border rounded>
      <v-data-table :headers="headers" :items="categories">
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>
              <v-icon color="medium-emphasis" icon="mdi-book-multiple" size="x-small" start></v-icon>
              รายชื่อผู้ใช้งาน (admin List)
            </v-toolbar-title>

            <v-btn class="me-2" prepend-icon="mdi-plus" rounded="lg" text="Add User" border @click="add"></v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item.name_th="{ value }">
          <v-chip :text="value" border="thin opacity-25" prepend-icon="mdi-account" label>
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex ga-2 justify-end">
            <v-icon color="medium-emphasis" icon="mdi-pencil" size="small" @click="edit(item.id)"></v-icon>
            <v-icon color="medium-emphasis" icon="mdi-delete" size="small" @click="remove(item.id)"></v-icon>
          </div>
        </template>

        <template v-slot:no-data>
          <v-btn prepend-icon="mdi-refresh" rounded="lg" text="Reload Data" variant="text" border
            @click="fetchData"></v-btn>
        </template>
      </v-data-table>
    </v-sheet>

    <v-dialog v-model="dialog" max-width="500">
      <v-card :subtitle="`${isEditing ? 'Update' : 'Create'} User Data`" :title="`${isEditing ? 'Edit' : 'Add'} User`">
        <template v-slot:text>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formModel.email" label="Email"></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-select v-model="formModel.status" label="Status" :items="['active', 'disabled']"></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field v-model="formModel.name_th" label="ชื่อไทย"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="formModel.password_hash" label="password" :type="visible ? 'text' : 'password'"
                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="visible = !visible"></v-text-field>
            </v-col>
          </v-row>
        </template>

        <v-divider></v-divider>

        <v-card-actions class="bg-surface-light">
          <v-btn text="Cancel" variant="plain" @click="dialog = false"></v-btn>
          <v-spacer></v-spacer>
          <v-btn text="Save" color="primary" @click="save"></v-btn>
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

// กำหนดฟิลด์เริ่มต้นให้ตรงกับฐานข้อมูล
function createNewRecord() {
  return {
    email: '',
    name_th: '',
    password_hash: '',
    status: 'active',
    // id จะถูกเติมเองเมื่อกด Edit หรือมาจาก Database
  }
}

const formModel = ref(createNewRecord())

// เช็คว่าเป็นการ Edit หรือไม่ (ถ้ามี id แปลว่า Edit)
const isEditing = toRef(() => !!formModel.value.id)

const headers = [
  { title: 'ID', key: 'id', align: 'start' },
  { title: 'Email', key: 'email' },
  { title: 'ชื่อไทย', key: 'name_th' },
  { title: 'Status', key: 'status', align: 'end' },
  { title: 'วันที่สร้าง', key: 'created_at', align: 'end' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

// --- 2. ฟังก์ชันหลักสำหรับดึงข้อมูล (Key สำคัญที่ทำให้หน้าจออัปเดต) ---
const fetchData = async () => {
  try {
    // ดึงข้อมูลใหม่จาก Server
    const { data } = await axios.get("http://localhost:7000/api/users/list_users_all_evaluatee");
    categories.value = data.list; // อัปเดตตัวแปร categories หน้าจอจะเปลี่ยนทันที
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// เรียกใช้ตอนเปิดหน้าเว็บครั้งแรก
onMounted(async () => {
  await fetchData();
})

// --- 3. ฟังก์ชันจัดการ Events ---

function add() {
  formModel.value = createNewRecord()
  dialog.value = true
}

async function edit(id) {
  // หาข้อมูลจากรายการที่มีอยู่แล้วมาใส่ในฟอร์ม
  const found = categories.value.find(item => item.id === id)
  if (found) {
    formModel.value = { ...found } // Clone ข้อมูลมาใส่ฟอร์ม
    dialog.value = true
  }
}

async function remove(id) {
  const ok = confirm("แน่ใจนะหนุ่มว่าจะลบ?")
  if (!ok) return

  try {
    console.log("Deleting ID:", id)
    await axios.delete(`http://localhost:7000/api/users/deleteusers/${id}`)

    // ลบเสร็จ -> ดึงข้อมูลใหม่ทันที
    await fetchData()
  } catch (error) {
    console.error("Delete error:", error)
  }
}

async function save() {
  try {
    if (isEditing.value) {
      // --- กรณีแก้ไข ---
      const { data } = await axios.put("http://localhost:7000/api/users/usersedit", formModel.value)
      console.log("Update Response -> ", data)
    } else {
      // --- กรณีเพิ่มใหม่ ---
      const { data } = await axios.post("http://localhost:7000/api/users/createevaluatee", formModel.value)
      console.log("Create Response -> ", data)
    }

    // ปิด Dialog
    dialog.value = false

    // หัวใจสำคัญ: โหลดข้อมูลใหม่ทันทีหลังเซฟเสร็จ หน้าจอจะอัปเดตเอง
    await fetchData()

  } catch (error) {
    console.error("Save error:", error)
  }
}
</script>