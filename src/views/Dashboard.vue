<template>
  <v-app>
    <v-container fluid>
      <v-data-table
        :headers="headerRestaurante"
        :items="registroMesa"
        :single-expand="singleExpand"
        :expanded.sync="expanded"
        item-key="id"
        class="elevation-1"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Gestión de Restaurante</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="getMesas" :loading="loading">
              <v-icon left>mdi-refresh</v-icon>
              Actualizar
            </v-btn>
            <v-switch
              v-model="singleExpand"
              class="mt-2 ml-4"
            ></v-switch>
          </v-toolbar>
        </template>

        <template v-slot:item.codigo_mesa="{ item }">
          <span>{{ item.codigo_mesa }}</span>
        </template>

        <template v-slot:item.nombre="{ item }">
          <span>{{ item.nombre }}</span>
        </template>

        <template v-slot:item.capacidad="{ item }">
          <span>{{ item.capacidad }}</span>
        </template>

        <template v-slot:item.seccion="{ item }">
          <span>{{ item.seccion }}</span>
        </template>

        <template v-slot:item.precio_anticipo="{ item }">
          <span>${{ item.precio_anticipo }}</span>
        </template>

        <template v-slot:item.estatus="{ item }">
          <v-chip
            :color="item.estatus === 'true' ? 'warning' : 'success'"
            text-color="white"
            small
          >
            {{ item.estatus }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn small icon color="primary" @click="editMesa(item)">
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>
          <v-btn small icon color="error" @click="deleteMesa(item)">
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </template>

        <template v-slot:no-data>
        <v-data-table
          item-key="name"
          class="elevation-1"
          loading
          loading-text="Loading... Please wait"
        ></v-data-table>
        </template>
      </v-data-table>
    </v-container>
  </v-app>
</template>

<script>
import axios from 'axios'
import Swal from 'sweetalert2'

export default {
  name: 'Mesas',
  data () {
    return {
      headerRestaurante: [
        { text: 'Código Mesa', align: 'start', value: 'codigo_mesa' },
        { text: 'Nombre', align: 'center', value: 'nombre' },
        { text: 'Capacidad', align: 'center', value: 'capacidad' },
        { text: 'Sección', align: 'center', value: 'seccion' },
        { text: 'Precio de Anticipo', align: 'center', value: 'precio_anticipo' },
        { text: 'Estatus', align: 'center', value: 'estatus' },
        { text: 'Opciones', align: 'center', value: 'actions', sortable: false }
      ],
      registroMesa: [],
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
    this.getMesas()
  },
  methods: {
    getMesas () {
      this.loading = true
      const token = localStorage.getItem('token')

      axios
        .get(this.URL('mesas'), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then((response) => {
          this.registroMesa = response.data.mesas || response.data
        })
        .catch((error) => {
          console.error('Error al obtener las mesas:', error)
          Swal.fire({
            title: 'Error',
            text: error.response?.data?.message || 'Error al cargar las mesas',
            icon: 'error',
            confirmButtonText: 'Reintentar'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },

    editMesa (item) {
      Swal.fire({
        title: `Editar Mesa: ${item.nombre}`,
        text: 'Esta funcionalidad se implementará pronto',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      })
    },

    deleteMesa (item) {
      Swal.fire({
        title: '¿Eliminar mesa?',
        text: `¿Estás seguro de eliminar la mesa "${item.nombre}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          const token = localStorage.getItem('token')
          axios
            .delete(this.URL(`mesas/${item.id}`), {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
            .then(() => {
              Swal.fire({
                title: 'Eliminada',
                text: 'La mesa ha sido eliminada correctamente',
                icon: 'success'
              })
              this.getMesas()
            })
            .catch((error) => {
              Swal.fire({
                title: 'Error',
                text: error.response?.data?.message || 'Error al eliminar la mesa',
                icon: 'error'
              })
            })
        }
      })
    }
  }
}
</script>

<style scoped>
</style>