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

    <!-- Sidebar con Menú Jerárquico -->
    <v-navigation-drawer
      v-model="drawer"
      app
      clipped
      width="250"
    >
      <v-list>
        <v-list-item>
          <v-list-item-avatar>
            <v-icon x-large>mdi-store</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>Store Control</v-list-item-title>
            <v-list-item-subtitle>v1.0.0</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <!-- Menú Jerárquico -->
      <v-list dense nav>
        <!-- Dashboard - Sin sub-menú -->
        <v-list-item
          to="/dashboard"
          router
          exact
          link
        >
          <v-list-item-icon>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <!-- RESTAURANTE - Con sub-menú expandible -->
        <v-list-group
          :value="true"
          prepend-icon="mdi-restaurant"
        >
          <template v-slot:activator>
            <v-list-item-title>Restaurante</v-list-item-title>
          </template>

          <!-- Sub-items de Restaurante -->
          <v-list-item
            to="/restaurante/mesas/gestion"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-table-furniture</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Mesas</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/restaurante/menu"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-silverware-fork-knife</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Menú</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/restaurante/pedidos"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-clipboard-list</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Pedidos</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/restaurante/cocina"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-chef-hat</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Cocina</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/restaurante/facturacion"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-receipt</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Facturación</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- INVENTARIO - Con sub-menú expandible -->
        <v-list-group prepend-icon="mdi-warehouse">
          <template v-slot:activator>
            <v-list-item-title>Inventario</v-list-item-title>
          </template>

          <!-- Sub-items de Inventario -->
          <v-list-item
            to="/inventario/productos"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-package-variant</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Productos</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/inventario/categorias"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-tag-multiple</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Categorías</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/inventario/stock"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-warehouse</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Stock</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/inventario/entradas"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-arrow-right-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Entradas</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/inventario/salidas"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-arrow-left-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Salidas</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- VENTAS - Con sub-menú expandible -->
        <v-list-group prepend-icon="mdi-cash-multiple">
          <template v-slot:activator>
            <v-list-item-title>Ventas</v-list-item-title>
          </template>

          <v-list-item
            to="/ventas/ordenes"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-shopping-cart</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Órdenes</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/ventas/reportes"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-file-chart</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Reportes</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/ventas/clientes"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-account-multiple</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Clientes</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- CONFIGURACIÓN - Con sub-menú expandible -->
        <v-list-group prepend-icon="mdi-cog">
          <template v-slot:activator>
            <v-list-item-title>Configuración</v-list-item-title>
          </template>

          <v-list-item
            to="/configuracion/usuarios"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-account-multiple</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Usuarios</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/configuracion/roles"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-shield-account</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Roles</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            to="/configuracion/empresa"
            router
            exact
            class="pl-8"
          >
            <v-list-item-icon>
              <v-icon small>mdi-home</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Empresa</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
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
      drawer: true
    }
  },
  methods: {
    logout () {
      localStorage.removeItem('token')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
</style>