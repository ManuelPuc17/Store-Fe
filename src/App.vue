<template>
  <v-app>
    <!-- Si está en login o register, mostrar solo el contenido -->
    <template v-if="isAuthPage">
      <v-main>
        <router-view />
      </v-main>
    </template>

    <!-- Si está autenticado, mostrar layout completo -->
    <template v-else>
        <layout>
          <router-view />
        </layout>
    </template>
  </v-app>
</template>

<script>
import Layout from '@/components/Layout.vue'

export default {
  name: 'App',
  components: {
    Layout
  },
  computed: {
    isAuthPage () {
      return this.$route.name === 'Login' || this.$route.name === 'Register'
    }
  }
}
</script>