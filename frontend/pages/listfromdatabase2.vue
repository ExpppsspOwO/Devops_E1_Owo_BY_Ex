<template>
  <div>
    <v-sheet border rounded>
      <v-data-table :headers="headers" :hide-default-footer="categories.length < 11" :items="categories">
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>
              <v-icon color="medium-emphasis" icon="mdi-book-multiple" size="x-small" start></v-icon>

              Popular categories
            </v-toolbar-title>
            <v-btn variant="outlined" @click="logout" style="color: #ff0000; border-color: #ff0000;">
              Logout
            </v-btn>
            <v-btn class="me-2" prepend-icon="mdi-plus" rounded="lg" text="Add a Book" border @click="add"></v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item.title="{ value }">
          <v-chip :text="value" border="thin opacity-25" prepend-icon="mdi-book" label>
            <template v-slot:prepend>
              <v-icon color="medium-emphasis"></v-icon>
            </template>
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex ga-2 justify-end">
            <v-icon color="medium-emphasis" icon="mdi-pencil" size="small" @click="edit(item.id)"></v-icon>

            <v-icon color="medium-emphasis" icon="mdi-delete" size="small" @click="remove(item.id)"></v-icon>
          </div>
        </template>

        <template v-slot:no-data>
          <v-btn prepend-icon="mdi-backup-restore" rounded="lg" text="Reset data" variant="text" border
            @click="reset"></v-btn>
        </template>
      </v-data-table>
    </v-sheet>
    <v-dialog v-model="dialog" max-width="500">
      <v-card :subtitle="`${isEditing ? 'Update' : 'Create'} your favorite book`"
        :title="`${isEditing ? 'Edit' : 'Add'} a Book`">
        <template v-slot:text>
          <v-row>
            <!-- <v-col cols="12">
              <v-text-field v-model="formModel.id" label="id" readonly></v-text-field>
            </v-col> -->

            <v-col cols="12" md="6">
              <v-text-field v-model="formModel.code" label="code"></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field v-model="formModel.name_th" label="ชื่อไทย"></v-text-field>
            </v-col>

            <!-- <v-col cols="12" md="6">
            <v-text-field v-model="formModel.created_at" label="สร้างเมื่อ" readonly></v-text-field>
            </v-col> -->

          </v-row>
        </template>

        <v-divider></v-divider>

        <v-card-actions class="bg-surface-light">
          <v-btn text="Cancel" variant="plain" @click="dialog = false"></v-btn>

          <v-spacer></v-spacer>

          <v-btn text="Save" @click="save"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup>
import { onMounted, ref, shallowRef, toRef } from 'vue'
import { useRouter } from 'vue-router' // อย่าลืม import useRouter
import axios from 'axios'

const router = useRouter()
const currentYear = new Date().getFullYear()

function createNewRecord() {
  return {
    title: '',
    author: '',
    genre: '',
    year: currentYear,
    pages: 1,
  }
}

const formModel = ref(createNewRecord())
const dialog = shallowRef(false)
const isEditing = toRef(() => !!formModel.value.id)
const categories = ref([]); 

const headers = [
  { title: 'ID', key: 'id', align: 'start' },
  { title: 'CODE', key: 'code' },
  { title: 'ชื่อไทย', key: 'name_th' },
  { title: 'วันที่สร้าง', key: 'created_at', align: 'end' },
  { title: 'Pages', key: 'pages', align: 'end' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

// --- 1. สร้างฟังก์ชันสำหรับดึงข้อมูล ---
const fetchData = async () => {
  try {
    const { data } = await axios.get("http://localhost:7000/api/users/list_all");
    categories.value = data.list; 
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    console.warn('⚠️ No auth token found, redirecting to login page')
    router.push('/login')
    return
  }
  
  // --- 2. เรียกใช้ตอนเข้าหน้าเว็บครั้งแรก ---
  await fetchData(); 
})

function add() {
  formModel.value = createNewRecord()
  dialog.value = true
}

async function edit(id) {
  // หาข้อมูลจาก local state มาโชว์ในฟอร์มก่อนแก้ไข
  const found = categories.value.find(book => book.id === id)
  if(found) {
    formModel.value = {
        id: found.id,
        code: found.code,
        name_th: found.name_th,
        created_at: found.created_at,
        year: found.year,
        pages: found.pages,
    }
    dialog.value = true
  }
}

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

async function remove(id) {
  const ok = confirm("แน่ใจนะหนุ่มว่าจะลบ?")
  if (!ok) return
  
  try {
    const { data } = await axios.delete(`http://localhost:7000/api/cat/catdelete/${id}`)
    console.log("Response -> ", data)
    
    // --- 3. เรียกโหลดข้อมูลใหม่หลังจากลบเสร็จ ---
    await fetchData(); 
    
  } catch (error) {
    console.error(error)
  }
}


async function save() {
  try {
    if (isEditing.value) {
        const { data } = await axios.put("http://localhost:7000/api/cat/updateCatigory", formModel.value)
        console.log("Update Response -> ", data)
    } else {
        const { data } = await axios.post("http://localhost:7000/api/cat/createCatigory", formModel.value)
        console.log("Create Response -> ", data)
    }

    // --- 4. เรียกโหลดข้อมูลใหม่หลังจากบันทึกเสร็จ ---
    await fetchData();

    dialog.value = false
  } catch (error) {
    console.error(error)
  }
}

function reset() {
  // ฟังก์ชันนี้ดูเหมือนเอาไว้ Mock data ถ้าใช้ API จริงอาจจะไม่จำเป็นต้องใช้
  // หรือเอาไว้เคลียร์ค่าเฉยๆ
  dialog.value = false
  formModel.value = createNewRecord()
  // categories.value = [] // ไม่ควร set ค่าหลอกถ้าเราต่อ API แล้ว
}
</script>