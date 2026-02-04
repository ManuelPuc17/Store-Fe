<template>
  <v-app>
    <!-- Navbar Superior -->
    <v-app-bar app color="primary" dark elevation="4" clipped-left>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title class="font-weight-bold ml-2">
        Store Control
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Icono de Notificaciones -->
      <v-btn icon class="mr-2">
        <v-badge color="red" dot>
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>

      <!-- Menú de Usuario -->
      <v-menu offset-y left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list min-width="200">
          <v-list-item link>
            <v-list-item-icon>
              <v-icon>mdi-account</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Mi Perfil</v-list-item-title>
          </v-list-item>
          <v-list-item link>
            <v-list-item-icon>
              <v-icon>mdi-cog</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Configuración</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="logout" link>
            <v-list-item-icon>
              <v-icon>mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Cerrar Sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Sidebar Expandible -->
    <v-navigation-drawer
      v-model="drawer"
      app
      clipped
      width="250"
    >
      <v-list>
        <v-list-item>
          <v-list-item-avatar>
            <v-icon x-large>mdi-account-circle</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>Usuario</v-list-item-title>
            <v-list-item-subtitle>Admin</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :to="item.path"
          router
          exact
          link
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider class="my-4"></v-divider>

      <!-- Sección inferior -->
      <v-list dense>
        <v-list-item link>
          <v-list-item-icon>
            <v-icon>mdi-help-circle</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Ayuda</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Contenido Principal -->
    <v-main class="grey lighten-4">
      <v-container fluid class="pa-4">
        <router-view />
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer app color="primary" dark class="pa-4">
      <v-row no-gutters>
        <v-col cols="12" sm="6" class="text-center text-sm-left">
          <strong>© 2026 Store Control</strong>
        </v-col>
        <v-col cols="12" sm="6" class="text-center text-sm-right">
          <span class="text-caption">Versión 1.0.0</span>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      drawer: true,
      menuItems: [
        {
          title: 'Dashboard',
          icon: 'mdi-view-dashboard',
          path: '/dashboard'
        },
        {
          title: 'Usuarios',
          icon: 'mdi-account-multiple',
          path: '/users'
        },
        {
          title: 'Productos',
          icon: 'mdi-package-variant',
          path: '/products'
        },
        {
          title: 'Ventas',
          icon: 'mdi-cash-multiple',
          path: '/sales'
        },
        {
          title: 'Reportes',
          icon: 'mdi-file-chart',
          path: '/reports'
        }
      ]
    }
  },
  methods: {
    logout () {
      this.$router.push('/login')
    }
  }
}
</script>