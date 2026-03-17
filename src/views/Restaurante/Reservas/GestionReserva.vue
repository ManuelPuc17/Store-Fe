<template>
  <v-app>
    <v-container fluid>

      <!-- Dialog para crear/editar reserva -->
      <ReservaDialog
        ref="reservaDialog"
        @reserva-creada="onReservaCreada"
        @reserva-actualizada="onReservaActualizada"
      />

      <!-- Dialog para ver detalle -->
      <ReservaDetalle
        ref="reservaDetalle"
      />

      <v-data-table
        :headers="headerReservas"
        :items="registroReservas"
        :loading="loading"
        item-key="id"
        class="elevation-1"
        :search="busqueda"
      >
        <template v-slot:top>
          <v-toolbar flat color="primary" dark>
            <v-toolbar-title>Gestión de Reservas</v-toolbar-title>
            <v-spacer></v-spacer>

            <!-- Buscador -->
            <v-text-field
              v-model="busqueda"
              append-icon="mdi-magnify"
              label="Buscar"
              single-line
              hide-details
              dense
              dark
              class="mr-4"
              style="max-width: 250px"
            />

            <!-- Botón nueva reserva -->
            <v-btn color="white" @click="abrirCrear">
              <v-icon color="primary">mdi-plus</v-icon>
            </v-btn>
          </v-toolbar>
        </template>

        <!-- Código reserva -->
        <template v-slot:item.codigo_reserva="{ item }">
          <span class="font-weight-bold">{{ item.codigo_reserva }}</span>
        </template>

        <!-- Tipo reserva -->
        <template v-slot:item.tipo_reserva="{ item }">
          <v-chip small outlined color="primary">
            {{ item.tipo_reserva ? item.tipo_reserva.nombre : '-' }}
          </v-chip>
        </template>

        <!-- Cliente -->
        <template v-slot:item.cliente_nombre="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.cliente_nombre || '-' }}</div>
            <div class="caption grey--text">{{ item.cliente_email || '' }}</div>
          </div>
        </template>

        <!-- Teléfono -->
        <template v-slot:item.cliente_numero="{ item }">
          <span>{{ item.cliente_numero || '-' }}</span>
        </template>

        <!-- Fecha -->
        <template v-slot:item.fecha_reserva="{ item }">
          <v-chip small color="blue lighten-4">
            <v-icon x-small left>mdi-calendar</v-icon>
            {{ formatFecha(item.fecha_reserva) }}
          </v-chip>
        </template>

        <!-- Detalles -->
        <template v-slot:item.detalles="{ item }">
          <span class="text-truncate d-inline-block" style="max-width: 150px">
            {{ item.detalles || '-' }}
          </span>
        </template>

        <!-- Acciones -->
        <template v-slot:item.actions="{ item }">
          <v-btn small icon color="info" @click="verDetalle(item)" title="Ver detalle">
            <v-icon small>mdi-eye</v-icon>
          </v-btn>
          <v-btn small icon color="primary" @click="abrirEditar(item)" title="Editar">
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>
          <v-btn small icon color="error" @click="eliminarReserva(item)" title="Eliminar">
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </template>

        <template v-slot:no-data>
          <v-alert type="info" class="mt-4">
            No hay reservas registradas
          </v-alert>
        </template>
      </v-data-table>
    </v-container>
  </v-app>
</template>

<script>
import axios from 'axios'
import Swal from 'sweetalert2'
import ReservaDialog from './s-dialog-reserva.vue'
// import ReservaDetalle from './s-detalle-reserva.vue' // opcional

export default {
  name: 'Reservas',
  components: {
    ReservaDialog
    // ReservaDetalle
  },
  data () {
    return {
      busqueda: '',
      loading: false,
      registroReservas: [],
      headerReservas: [
        { text: 'Código', align: 'start', value: 'codigo_reserva' },
        { text: 'Tipo Reserva', align: 'center', value: 'tipo_reserva.nombre' },
        { text: 'Cliente', align: 'start', value: 'cliente_nombre' },
        { text: 'Teléfono', align: 'center', value: 'cliente_numero' },
        { text: 'Fecha', align: 'center', value: 'fecha_reserva' },
        { text: 'Detalles', align: 'center', value: 'detalles' },
        { text: 'Opciones', align: 'center', value: 'actions', sortable: false }
      ]
    }
  },
  computed: {
    URL () {
      return (endpoint) => `${process.env.VUE_APP_API_URL}/${endpoint}`
    }
  },
  mounted () {
    this.getReservas()
  },
  methods: {
    getReservas () {
      this.loading = true
      const token = localStorage.getItem('token')

      axios
        .get(this.URL('reservas'), {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
          this.registroReservas = response.data.reservas || response.data
        })
        .catch((error) => {
          Swal.fire({
            title: 'Error',
            text: error.response?.data?.message || 'Error al cargar las reservas',
            icon: 'error',
            confirmButtonText: 'Reintentar'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },

    abrirCrear () {
      this.$refs.reservaDialog.abrirCrear()
    },

    abrirEditar (item) {
      this.$refs.reservaDialog.abrirEditar(item)
    },

    verDetalle (item) {
      // this.$refs.reservaDetalle.abrir(item.id)
      // Puedes implementar un dialog de detalle similar
      console.log('Ver detalle:', item)
    },

    eliminarReserva (item) {
      Swal.fire({
        title: '¿Eliminar reserva?',
        text: `¿Estás seguro de eliminar la reserva "${item.codigo_reserva}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          const token = localStorage.getItem('token')
          this.loading = true

          axios
            .delete(this.URL(`reservas/${item.id}`), {
              headers: { Authorization: `Bearer ${token}` }
            })
            .then(() => {
              Swal.fire({
                title: 'Eliminada',
                text: 'La reserva ha sido eliminada correctamente',
                icon: 'success'
              })
              this.getReservas()
            })
            .catch((error) => {
              Swal.fire({
                title: 'Error',
                text: error.response?.data?.message || 'Error al eliminar la reserva',
                icon: 'error'
              })
            })
            .finally(() => {
              this.loading = false
            })
        }
      })
    },

    onReservaCreada (data) {
      console.log('Reserva creada:', data)
      this.getReservas()
    },

    onReservaActualizada (data) {
      console.log('Reserva actualizada:', data)
      this.getReservas()
    },

    formatFecha (fecha) {
      if (!fecha) return '-'
      const d = new Date(fecha)
      return d.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
</style>