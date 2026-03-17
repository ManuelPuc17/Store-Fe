<template>
  <v-app>
    <v-container fluid>
      <!-- Dialog para crear/editar -->
      <RolDialog
        ref="RolDialog"
        @rol-creado="onRolCreado"
        @rol-actualizado="onRolActualizada"
      />

      <v-data-table
        :headers="headerRoles"
        :items="registroRoles"
        :single-expand="singleExpand"
        :expanded.sync="expanded"
        item-key="id"
        :loading="loading"
        class="elevation-1"
      >
        <template v-slot:top>
          <v-toolbar flat color="primary" dark>
            <v-toolbar-title>Gestión de Roles</v-toolbar-title>
            <v-spacer></v-spacer>
            
            <!-- Botón para abrir dialog de crear -->
            <v-btn color="white" @click="abrirCrear">
              <v-icon color="primary">mdi-plus</v-icon>
              
            </v-btn>

            <!-- Botón para actualizar -->
            <!-- <v-btn 
              color="white" 
              @click="getMesas" 
              :loading="loading"
              class="ml-2"
            >
              <v-icon color="primary">mdi-refresh</v-icon>
            </v-btn> -->

            <v-switch 
              v-model="singleExpand"
              class="mt-2 ml-4"
            ></v-switch>
          </v-toolbar>
        </template>

        <template v-slot:item.nombre="{ item }">
          <span>{{ item.nombre }}</span>
        </template>

        <template v-slot:item.descripcion="{ item }">
          <span>{{ item.descripcion }}</span>
        </template>

        <template v-slot:item.capacidad="{ item }">
          <span>{{ item.capacidad }}</span>
        </template>

        <template v-slot:item.activo="{ item }">
          <v-chip
            :color="item.activo === true ? 'success' : 'warning'"
            text-color="white"
            small
          >
            {{ item.activo }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <!-- Botón editar -->
          <v-btn small icon color="primary" @click="abrirEditar(item)">
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>

          <!-- Botón eliminar -->
          <v-btn small icon color="error" @click="deleteRol(item)">
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </template>

        <template v-slot:no-data>
          <v-alert type="info" class="mt-4">
            No hay roles registrados
          </v-alert>
        </template>
      </v-data-table>
    </v-container>
  </v-app>
</template>

<script>
import axios from 'axios'
import Swal from 'sweetalert2'
import RolDialog from './s-dialog-roles.vue'

export default {
  name: 'Roles',
  components: {
    RolDialog
  },
  data () {
    return {
      headerRoles: [
        { text: 'Nombre', align: 'center', value: 'nombre' },
        { text: 'Descripción', align: 'center', value: 'descripcion' },
        { text: 'Estatus', align: 'center', value: 'activo' },
        { text: 'Opciones', align: 'center', value: 'actions', sortable: false }
      ],
      registroRoles: [],
      singleExpand: false,
      expanded: [],
      loading: false
    }
  },
  computed: {
    URL () {
      return (endpoint) => `${process.env.VUE_APP_API_URL}/${endpoint}`
    }
  },
  mounted () {
    this.getRoles()
  },
  methods: {
    getRoles () {
      this.loading = true
      const token = localStorage.getItem('token')

      axios
        .get(this.URL('tipos-usuario'), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then((response) => {
          this.registroRoles = response.data.tipos_usuario || response.data
        })
        .catch((error) => {
          console.error('Error al obtener los roles:', error)
          Swal.fire({
            title: 'Error',
            text: error.response?.data?.message || 'Error al cargar los roles',
            icon: 'error',
            confirmButtonText: 'Reintentar'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },

    // Abrir dialog para CREAR
    abrirCrear () {
      this.$refs.RolDialog.abrirCrear()
    },

    // Abrir dialog para EDITAR
    abrirEditar (item) {
      this.$refs.RolDialog.abrirEditar(item)
    },

    // Eliminar rol
    deleteRol (item) {
      Swal.fire({
        title: '¿Eliminar rol?',
        text: `¿Estás seguro de eliminar el rol "${item.nombre}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          const token = localStorage.getItem('token')
          this.loading = true

          axios
            .delete(this.URL(`tipos-usuario/${item.id}`), {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
            .then(() => {
              Swal.fire({
                title: 'Eliminado',
                text: 'El rol ha sido eliminado correctamente',
                icon: 'success'
              })
              this.getRoles()
            })
            .catch((error) => {
              Swal.fire({
                title: 'Error',
                text: error.response?.data?.message || 'Error al eliminar el rol',
                icon: 'error'
              })
            })
            .finally(() => {
              this.loading = false
            })
        }
      })
    },

    // Cuando se crea una mesa
    onRolCreado (data) {
      console.log('Rol creado:', data)
      this.getRoles()
    },

    // Cuando se actualiza una mesa
    onRolActualizada (data) {
      console.log('Rol actualizado:', data)
      this.getRoles()
    }
  }
}
</script>

<style>
</style>