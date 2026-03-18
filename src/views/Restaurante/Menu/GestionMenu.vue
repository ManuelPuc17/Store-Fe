<template>
  <v-app>
    <v-container fluid>

      <!-- Dialog -->
      <MenuDialog
        ref="menuDialog"
        @menu-creado="onMenuCreado"
        @menu-actualizado="onMenuActualizado"
      />

      <v-data-table
        :headers="headers"
        :items="menus"
        item-key="id"
        :loading="loading"
        class="elevation-1"
      >
        <!-- TOP -->
        <template v-slot:top>
          <v-toolbar flat color="primary" dark>
            <v-toolbar-title>Gestión de Menú</v-toolbar-title>
            <v-spacer></v-spacer>

            <v-btn color="white" @click="abrirCrear">
              <v-icon color="primary">mdi-plus</v-icon>
            </v-btn>
          </v-toolbar>
        </template>

        <!-- COLUMNAS -->

        <template v-slot:item.nombre="{ item }">
          {{ item.nombre }}
        </template>

        <template v-slot:item.descripcion="{ item }">
          {{ item.descripcion }}
        </template>

        <template v-slot:item.precio="{ item }">
          ${{ item.precio }}
        </template>

        <template v-slot:item.categoria="{ item }">
          {{ item.categoria?.nombre || 'Sin categoría' }}
        </template>

        <template v-slot:item.estatus="{ item }">
          <v-chip
            :color="item.estatus ? 'success' : 'error'"
            small
            dark
          >
            {{ item.estatus ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <!-- ACCIONES -->
        <template v-slot:item.actions="{ item }">
          <v-btn small icon color="primary" @click="abrirEditar(item)">
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>

          <v-btn small icon color="error" @click="eliminarMenu(item)">
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </template>

        <!-- NO DATA -->
        <template v-slot:no-data>
          <v-alert type="info" class="mt-4">
            No hay menús registrados
          </v-alert>
        </template>

      </v-data-table>
    </v-container>
  </v-app>
</template>
<script>
import axios from 'axios'
import Swal from 'sweetalert2'
import MenuDialog from './s-dialog-menu.vue'

export default {
  name: 'Menus',
  components: {
    MenuDialog
  },
  data () {
    return {
      headers: [
        { text: 'Nombre', value: 'nombre' },
        { text: 'Descripción', value: 'descripcion' },
        { text: 'Precio', value: 'precio' },
        { text: 'Categoría', value: 'categoria' },
        { text: 'Estatus', value: 'estatus' },
        { text: 'Opciones', value: 'actions', sortable: false }
      ],
      menus: [],
      loading: false
    }
  },

  computed: {
    URL () {
      return (endpoint) => `${process.env.VUE_APP_API_URL}/${endpoint}`
    }
  },

  mounted () {
    this.getMenus()
  },

  methods: {

    // 🔥 GET MENUS
    getMenus () {
      this.loading = true
      const token = localStorage.getItem('token')

      axios.get(this.URL('menu'), {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        this.menus = res.data.data || res.data
      })
      .catch(err => {
        Swal.fire('Error', 'Error al cargar menús', 'error')
      })
      .finally(() => {
        this.loading = false
      })
    },

    abrirCrear () {
      this.$refs.menuDialog.abrirCrear()
    },

    abrirEditar (item) {
      this.$refs.menuDialog.abrirEditar(item)
    },

    eliminarMenu (item) {
      Swal.fire({
        title: '¿Eliminar?',
        text: item.nombre,
        icon: 'warning',
        showCancelButton: true
      }).then(result => {
        if (result.isConfirmed) {
          const token = localStorage.getItem('token')

          axios.delete(this.URL(`menu/${item.id}`), {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(() => {
            this.getMenus()
          })
        }
      })
    },

    onMenuCreado () {
      this.getMenus()
    },

    onMenuActualizado () {
      this.getMenus()
    }

  }
}
</script>