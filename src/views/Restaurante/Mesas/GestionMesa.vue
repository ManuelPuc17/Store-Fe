<template>
  <v-app>
    <v-container fluid>
      <!-- Dialog para crear/editar -->
      <MesaDialog
        ref="mesaDialog"
        @mesa-creada="onMesaCreada"
        @mesa-actualizada="onMesaActualizada"
      />

      <v-data-table
        :headers="headerRestaurante"
        :items="registroMesa"
        :single-expand="singleExpand"
        :expanded.sync="expanded"
        item-key="id"
        :loading="loading"
        class="elevation-1"
      >
        <template v-slot:top>
          <v-toolbar flat color="primary" dark>
            <v-toolbar-title>Gestión de Restaurante</v-toolbar-title>
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
            :color="item.estatus === true ? 'success' : 'warning'"
            text-color="white"
            small
          >
            {{ item.estatus }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <!-- Botón editar -->
          <v-btn small icon color="primary" @click="abrirEditar(item)">
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>

          <!-- Botón eliminar -->
          <v-btn small icon color="error" @click="deleteMesa(item)">
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </template>

        <template v-slot:no-data>
          <v-alert type="info" class="mt-4">
            No hay mesas registradas
          </v-alert>
        </template>
      </v-data-table>
    </v-container>
  </v-app>
</template>

<script>
import axios from 'axios'
import Swal from 'sweetalert2'
import MesaDialog from './s-dialog-mesas.vue'

export default {
  name: 'Mesas',
  components: {
    MesaDialog
  },
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
          console.log('Mesas cargadas:', response.data)
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

    // Abrir dialog para CREAR
    abrirCrear () {
      this.$refs.mesaDialog.abrirCrear()
    },

    // Abrir dialog para EDITAR
    abrirEditar (item) {
      this.$refs.mesaDialog.abrirEditar(item)
    },

    // Eliminar mesa
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
          this.loading = true

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
            .finally(() => {
              this.loading = false
            })
        }
      })
    },

    // Cuando se crea una mesa
    onMesaCreada (data) {
      console.log('Mesa creada:', data)
      this.getMesas()
    },

    // Cuando se actualiza una mesa
    onMesaActualizada (data) {
      console.log('Mesa actualizada:', data)
      this.getMesas()
    }
  }
}
</script>

<style>
</style>