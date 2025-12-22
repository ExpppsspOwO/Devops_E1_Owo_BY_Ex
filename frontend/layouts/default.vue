<script setup>
import { ref } from 'vue'
import { useMenu } from '~/composables/useMenu'

// TODO: โหลด role จาก store/cookie หลัง login จริง
const role = ref('user') // 'admin' | 'evaluator' | 'user'
const { menu } = useMenu(role)
const drawer = ref(true)

// Mock User Data (สมมติข้อมูลผู้ใช้)
const userProfile = {
  name: 'Somchai Jaidee',
  email: 'somchai@vec.go.th',
  initials: 'SJ'
}
</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" width="280" elevation="0" class="border-e">
      
      <div class="pa-4 d-flex align-center">
        <v-avatar color="primary" class="mr-3" rounded="lg">
          <v-icon icon="mdi-shield-account" color="white"></v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">VEC Evaluation</div>
          <div class="text-caption text-medium-emphasis">System v1.0</div>
        </div>
      </div>

      <v-divider></v-divider>

      <v-list density="comfortable" nav class="mt-2">
        <template v-for="(section, i) in menu" :key="i">
          <div v-if="section.label" class="px-4 py-2 text-caption text-uppercase text-medium-emphasis font-weight-bold mt-2">
            {{ section.label }}
          </div>
          
          <v-list-item
            v-for="(it, j) in section.items"
            :key="j"
            :to="it.to"
            :href="it.href"
            :target="it.target"
            :prepend-icon="it.icon"
            :title="it.label"
            :value="it.to || it.href"
            active-color="primary"
            rounded="lg"
            class="mb-1"
          />
        </template>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <v-btn block color="error" variant="tonal" prepend-icon="mdi-logout">
            ออกจากระบบ
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar color="white" elevation="1" density="comfortable">
      <v-app-bar-nav-icon @click="drawer = !drawer" color="grey-darken-1" />
      
      <v-toolbar-title class="text-body-1 font-weight-bold text-grey-darken-2">
        ระบบประเมินบุคลากร
      </v-toolbar-title>

      <v-spacer />

      <v-tooltip text="เปลี่ยนธีม" location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn icon="mdi-theme-light-dark" variant="text" color="grey-darken-1" to="/theme" v-bind="props"></v-btn>
        </template>
      </v-tooltip>

      <v-menu location="bottom end" transition="scale-transition">
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" class="ml-2 mr-2">
            <v-avatar color="primary" size="36">
              <span class="text-caption font-weight-bold white--text">{{ userProfile.initials }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list width="200" elevation="2" rounded="lg">
          <v-list-item :subtitle="userProfile.email" :title="userProfile.name">
            <template v-slot:prepend>
              <v-avatar color="primary" size="24" class="mr-2">
                <span class="text-caption">{{ userProfile.initials }}</span>
              </v-avatar>
            </template>
          </v-list-item>
          <v-divider class="my-2"></v-divider>
          <v-list-item prepend-icon="mdi-account-cog" title="ตั้งค่าบัญชี" value="settings"></v-list-item>
          <v-list-item prepend-icon="mdi-logout" title="ออกจากระบบ" value="logout" color="error"></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="py-6 px-6">
        <slot />
      </v-container>
      
      <v-footer color="transparent" class="text-caption justify-center text-medium-emphasis mt-4">
        © 2025 VEC Skills — Evaluation System
      </v-footer>
    </v-main>
  </v-app>
</template>

<style scoped>
/* เพิ่ม CSS เล็กน้อยถ้าต้องการ */
</style>