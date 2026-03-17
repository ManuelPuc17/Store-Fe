<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <v-card>
      <!-- Toolbar -->
      <v-toolbar dark color="primary">
        <v-toolbar-title>{{ tituloDialog }}</v-toolbar-title>
        <v-spacer></v-spacer>

        <v-btn
          dark
          text
          @click="guardarReserva()"
          :loading="loading"
        >
          <v-icon left>mdi-content-save</v-icon>
          Guardar
        </v-btn>

        <v-btn icon dark @click="cerrarDialog()">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Contenido -->
      <v-card-text class="pa-6">
        <v-form ref="reservaForm" v-model="formValido" lazy-validation>
          <v-row dense>

            <!-- ── Columna 1: Datos del cliente ── -->
            <v-col cols="12" sm="6" md="4">
              <div class="subtitle-2 mb-2 primary--text">
                <v-icon small color="primary" class="mr-1">mdi-account</v-icon>
                Datos del Cliente
              </div>

              <v-text-field
                v-model="registroActual.cliente_nombre"
                label="Nombre del Cliente"
                dense
                outlined
                :rules="nombreRules"
                required
              />

              <v-text-field
                v-model="registroActual.cliente_numero"
                label="Teléfono"
                dense
                outlined
                :rules="telefonoRules"
                required
                class="mt-2"
                prepend-inner-icon="mdi-phone"
              />

              <v-text-field
                v-model="registroActual.cliente_email"
                label="Correo Electrónico"
                dense
                outlined
                :rules="emailRules"
                class="mt-2"
                prepend-inner-icon="mdi-email"
              />

              <v-textarea
                v-model="registroActual.detalles"
                label="Detalles / Notas"
                dense
                outlined
                rows="3"
                class="mt-2"
                prepend-inner-icon="mdi-note-text"
              />
            </v-col>

            <!-- ── Columna 2: Datos de la reserva ── -->
            <v-col cols="12" sm="6" md="4">
              <div class="subtitle-2 mb-2 primary--text">
                <v-icon small color="primary" class="mr-1">mdi-calendar-check</v-icon>
                Datos de la Reserva
              </div>

              <v-select
                v-model="registroActual.tipo_reserva_id"
                :items="tiposReserva"
                item-text="nombre"
                item-value="id"
                label="Tipo de Reserva"
                dense
                outlined
                :rules="requeridoRules"
                required
                :loading="loadingTipos"
              />

              <v-select
                v-model="registroActual.mesa_id"
                :items="mesas"
                item-text="nombre"
                item-value="id"
                label="Mesa"
                dense
                outlined
                :rules="requeridoRules"
                required
                class="mt-2"
                :loading="loadingMesas"
                @change="calcularPrecio"
              >
                <template v-slot:item="{ item }">
                  <v-list-item-content>
                    <v-list-item-title>{{ item.nombre }}</v-list-item-title>
                    <v-list-item-subtitle>
                      Sección: {{ item.seccion }} · Cap: {{ item.capacidad }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </v-select>

              <v-text-field
                v-model="registroActual.fecha_reserva"
                label="Fecha de Reserva"
                type="date"
                dense
                outlined
                :rules="requeridoRules"
                required
                class="mt-2"
                prepend-inner-icon="mdi-calendar"
              />
            </v-col>

            <!-- ── Columna 3: Horario y precio ── -->
            <v-col cols="12" sm="6" md="4">
              <div class="subtitle-2 mb-2 primary--text">
                <v-icon small color="primary" class="mr-1">mdi-clock-outline</v-icon>
                Horario
              </div>

              <v-text-field
                v-model="registroActual.hora_inicio"
                label="Hora de Inicio"
                type="time"
                dense
                outlined
                :rules="requeridoRules"
                required
                prepend-inner-icon="mdi-clock-start"
                @change="calcularPrecio"
              />

              <v-text-field
                v-model="registroActual.hora_fin"
                label="Hora de Fin"
                type="time"
                dense
                outlined
                :rules="horaFinRules"
                required
                class="mt-2"
                prepend-inner-icon="mdi-clock-end"
                @change="calcularPrecio"
              />

              <!-- Resumen de precio (calculado localmente) -->
              <v-card
                v-if="resumenPrecio"
                outlined
                class="mt-4 pa-3"
                color="blue lighten-5"
              >
                <div class="subtitle-2 mb-1">Resumen de Precio</div>
                <v-divider class="mb-2" />
                <div class="d-flex justify-space-between caption">
                  <span>Duración:</span>
                  <span class="font-weight-medium">{{ Math.floor(resumenPrecio.duracion / 60) }}h
{{ resumenPrecio.duracion % 60 }}m </span>
                </div>
                <div class="d-flex justify-space-between caption mt-1">
                  <span>Precio base:</span>
                  <span class="font-weight-medium">${{ resumenPrecio.precioBase }}</span>
                </div>
                <div v-if="resumenPrecio.horasExtra > 0" class="d-flex justify-space-between caption mt-1">
                  <span>Horas extra ({{ resumenPrecio.horasExtra }}):</span>
                  <span class="font-weight-medium">${{ resumenPrecio.precioExtra }}</span>
                </div>
                <v-divider class="my-2" />
                <div class="d-flex justify-space-between subtitle-2">
                  <span>Total estimado:</span>
                  <span class="primary--text font-weight-bold">${{ resumenPrecio.total }}</span>
                </div>
              </v-card>
            </v-col>

          </v-row>
        </v-form>
      </v-card-text>

      <!-- Snackbar -->
      <v-snackbar
        v-model="mostrarMensaje"
        :color="tipoMensaje"
        bottom
        right
      >
        {{ textoMensaje }}
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from 'axios'
import Swal from 'sweetalert2'

export default {
  name: 'ReservaDialog',
  data () {
    return {
      dialog: false,
      loading: false,
      loadingMesas: false,
      loadingTipos: false,
      formValido: false,
      esNueva: true,
      reservaIdEdicion: null,

      registroActual: {
        tipo_reserva_id: null,
        mesa_id: null,
        cliente_nombre: '',
        cliente_numero: '',
        cliente_email: '',
        detalles: '',
        fecha_reserva: '',
        hora_inicio: '',
        hora_fin: ''
      },

      mesas: [],
      tiposReserva: [],
      resumenPrecio: null,

      mostrarMensaje: false,
      textoMensaje: '',
      tipoMensaje: 'success',

      // Reglas de validación
      requeridoRules: [
        v => !!v || 'Este campo es requerido'
      ],
      nombreRules: [
        v => !!v || 'El nombre es requerido',
        v => (v && v.length >= 2) || 'Mínimo 2 caracteres'
      ],
      telefonoRules: [
        v => !!v || 'El teléfono es requerido',
        v => /^[0-9+\-\s]{7,15}$/.test(v) || 'Teléfono inválido'
      ],
      emailRules: [
        v => !v || /.+@.+\..+/.test(v) || 'Correo inválido'
      ],
      horaFinRules: [
        v => !!v || 'La hora de fin es requerida',
        v => {
          if (!this.registroActual.hora_inicio || !v) return true
          return v > this.registroActual.hora_inicio || 'La hora fin debe ser mayor que la hora inicio'
        }
      ]
    }
  },
  computed: {
    URL () {
      return (endpoint) => `${process.env.VUE_APP_API_URL}/${endpoint}`
    },
    tituloDialog () {
      return this.esNueva
        ? 'Nueva Reserva'
        : `Editar Reserva - ${this.registroActual.cliente_nombre || ''}`
    }
  },
  watch: {
    'registroActual.hora_inicio': 'calcularPrecio',
    'registroActual.hora_fin': 'calcularPrecio',
    'registroActual.mesa_id': 'calcularPrecio'
  },
  methods: {
    abrirCrear () {
      this.esNueva = true
      this.reservaIdEdicion = null
      this.limpiarFormulario()
      this.cargarCatalogos()
      this.dialog = true
    },

    abrirEditar (reserva) {
      this.esNueva = false
      this.reservaIdEdicion = reserva.id
      this.registroActual = {
        tipo_reserva_id: reserva.tipo_reserva_id,
        mesa_id: reserva.mesa_reserva ? reserva.mesa_reserva.mesa_id : null,
        cliente_nombre: reserva.cliente_nombre,
        cliente_numero: reserva.cliente_numero,
        cliente_email: reserva.cliente_email,
        detalles: reserva.detalles,
        fecha_reserva: reserva.fecha_reserva,
        hora_inicio: reserva.mesa_reserva ? reserva.mesa_reserva.hora_inicio : '',
        hora_fin: reserva.mesa_reserva ? reserva.mesa_reserva.hora_fin : ''
      }
      this.cargarCatalogos()
      this.calcularPrecio()
      this.dialog = true
    },

    cargarCatalogos () {
      this.cargarMesas()
      this.cargarTiposReserva()
    },

    cargarMesas () {
      this.loadingMesas = true
      const token = localStorage.getItem('token')
      axios
        .get(this.URL('mesas'), {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          this.mesas = res.data.mesas || res.data
        })
        .catch(() => {
          this.mostrarError('Error al cargar las mesas')
        })
        .finally(() => {
          this.loadingMesas = false
        })
    },

    cargarTiposReserva () {
      this.loadingTipos = true
      const token = localStorage.getItem('token')
      axios
        .get(this.URL('tipos-reserva'), {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          this.tiposReserva = res.data.tipos || res.data
        })
        .catch(() => {
          this.mostrarError('Error al cargar tipos de reserva')
        })
        .finally(() => {
          this.loadingTipos = false
        })
    },

    calcularPrecio () {

      const { hora_inicio, hora_fin, mesa_id } = this.registroActual

      if (!hora_inicio || !hora_fin || hora_fin <= hora_inicio || !mesa_id) {
        this.resumenPrecio = null
        return
      }

      const mesa = this.mesas.find(m => m.id === mesa_id)

      if (!mesa) {
        this.resumenPrecio = null
        return
      }

      const inicio = new Date(`2000-01-01T${hora_inicio}`)
      const fin = new Date(`2000-01-01T${hora_fin}`)

      const duracion = (fin - inicio) / 60000

      const precioBase = mesa.precio_anticipo
      const precioExtraHora = 100

      const horas = Math.ceil(duracion / 60)
      const horasExtra = horas > 1 ? horas - 1 : 0
      const precioExtra = horasExtra * precioExtraHora

      const total = precioBase + precioExtra

      this.resumenPrecio = {
        duracion,
        precioBase,
        horasExtra,
        precioExtra,
        total
      }

    },

    guardarReserva () {
      if (!this.$refs.reservaForm.validate()) {
        this.mostrarError('Por favor completa todos los campos correctamente')
        return
      }

      this.loading = true
      const token = localStorage.getItem('token')

      // Usar endpoint storeCompleto para crear
      const url = this.esNueva
        ? this.URL('reservas')
        : this.URL(`reservas/${this.reservaIdEdicion}`)

      const payload = { ...this.registroActual }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const request = this.esNueva
        ? axios.post(url, payload, config)
        : axios.post(url, payload, config)

      request
        .then((response) => {
          const mensaje = this.esNueva
            ? 'Reserva creada correctamente'
            : 'Reserva actualizada correctamente'

          Swal.fire({
            title: 'Éxito',
            text: mensaje,
            icon: 'success',
            confirmButtonText: 'Aceptar'
          })

          if (this.esNueva) {
            this.$emit('reserva-creada', response.data)
          } else {
            this.$emit('reserva-actualizada', response.data)
          }

          this.cerrarDialog()
        })
        .catch((error) => {
          const mensaje = error.response?.data?.message || 'Error al guardar la reserva'
          this.mostrarError(mensaje)
          Swal.fire({
            title: 'Error',
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Reintentar'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },

    cerrarDialog () {
      this.dialog = false
      this.limpiarFormulario()
    },

    limpiarFormulario () {
      if (this.$refs.reservaForm) {
        this.$refs.reservaForm.reset()
      }
      this.registroActual = {
        tipo_reserva_id: null,
        mesa_id: null,
        cliente_nombre: '',
        cliente_numero: '',
        cliente_email: '',
        detalles: '',
        fecha_reserva: '',
        hora_inicio: '',
        hora_fin: ''
      }
      this.resumenPrecio = null
      this.esNueva = true
      this.reservaIdEdicion = null
    },

    mostrarError (mensaje) {
      this.textoMensaje = mensaje
      this.tipoMensaje = 'error'
      this.mostrarMensaje = true
    },

    mostrarExito (mensaje) {
      this.textoMensaje = mensaje
      this.tipoMensaje = 'success'
      this.mostrarMensaje = true
    }
  }
}
</script>

<style scoped>
</style>