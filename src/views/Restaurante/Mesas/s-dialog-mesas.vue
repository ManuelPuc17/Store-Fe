<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <v-card>
      <!-- Toolbar del diálogo -->
        <v-card-title class="pa-0">
          <s-toolbar-modal
            titulo="Mesa"
            :id="mesaIdEdicion"
            @guardar="guardarMesa"
            @cerrar="cerrarDialog"
          />
        </v-card-title>

      <!-- Contenido del diálogo -->
      <v-card-text class="pa-6">
        <v-form ref="mesaForm" v-model="formValido" lazy-validation>
          <v-row dense>
            <!-- Columna de Imagen -->
            <v-col cols="12" sm="4" md="3">
              <div class="text-center">
                <v-img
                  v-if="imagenActual"
                  max-width="200"
                  max-height="200"
                  :src="imagenActual"
                  alt="Imagen mesa"
                  class="mx-auto"
                />
                <div v-else class="pa-4 grey lighten-3 rounded">
                  <v-icon size="80" color="grey">mdi-image</v-icon>
                  <p class="grey--text">Sin imagen</p>
                </div>

                <v-file-input
                  v-model="imgSeleccionada"
                  accept="image/*"
                  label="Seleccionar imagen"
                  dense
                  outlined
                  class="mt-4"
                  @change="previewImagen"
                />
              </div>
            </v-col>

            <!-- Columna 1 -->
            <v-col cols="12" sm="4" md="3">
              <v-text-field
                v-model="registroActual.codigo_mesa"
                label="Código de Mesa"
                dense
                outlined
                :rules="codigoRules"
                required
              />

              <v-text-field
                v-model="registroActual.nombre"
                label="Nombre de Mesa"
                dense
                outlined
                :rules="nombreRules"
                required
                class="mt-2"
              />

              <v-text-field
                v-model.number="registroActual.capacidad"
                label="Capacidad"
                type="number"
                dense
                outlined
                :rules="capacidadRules"
                required
                class="mt-2"
              />
            </v-col>

            <!-- Columna 2 -->
            <v-col cols="12" sm="4" md="3">
              <v-text-field
                v-model="registroActual.seccion"
                label="Sección"
                dense
                outlined
                :rules="seccionRules"
                required
              />

              <v-text-field
                v-model.number="registroActual.precio_anticipo"
                label="Precio de Anticipo"
                type="number"
                prefix="$"
                dense
                outlined
                :rules="precioRules"
                required
                class="mt-2"
              />

              <v-select
                v-model="registroActual.estatus"
                :items="estatusOpciones"
                label="Estatus"
                dense
                outlined
                required
                class="mt-2"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <!-- Alertas de error -->
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
import SToolbarModal from '@/components/s-toolbar-modal.vue'

export default {
  name: 'MesaDialog',
  components: {
    SToolbarModal
  },
  data () {
    return {
      dialog: false,
      loading: false,
      formValido: false,
      esNueva: true,
      mesaIdEdicion: null,
      registroActual: {
        codigo_mesa: '',
        nombre: '',
        capacidad: '',
        seccion: '',
        precio_anticipo: '',
        estatus: 'disponible'
      },
      imgSeleccionada: null,
      imagenActual: null,
      estatusOpciones: [false, true],
      mostrarMensaje: false,
      textoMensaje: '',
      tipoMensaje: 'success',
      codigoRules: [
        v => !!v || 'El código de mesa es requerido',
        v => (v && v.length >= 1 && v.length <= 64) || 'Debe contener entre 1 y 64 caracteres'
      ],
      nombreRules: [
        v => !!v || 'El nombre de mesa es requerido',
        v => (v && v.length >= 1 && v.length <= 64) || 'Debe contener entre 1 y 64 caracteres'
      ],
      capacidadRules: [
        v => !!v || 'La capacidad es requerida',
        v => (v && v > 0) || 'La capacidad debe ser mayor que 0'
      ],
      seccionRules: [
        v => !!v || 'La sección es requerida',
        v => (v && v.length >= 1 && v.length <= 64) || 'Debe contener entre 1 y 64 caracteres'
      ],
      precioRules: [
        v => !!v || 'El precio es requerido',
        v => (v && v >= 0) || 'El precio debe ser mayor o igual a 0'
      ]
    }
  },
  computed: {
    URL () {
      return (endpoint) => `${process.env.VUE_APP_API_URL}/${endpoint}`
    }
  },
  methods: {
    abrirCrear () {
      this.esNueva = true
      this.mesaIdEdicion = null
      this.limpiarFormulario()
      this.dialog = true
    },

    abrirEditar (mesa) {
      this.esNueva = false
      this.mesaIdEdicion = mesa.id

      this.registroActual = {
        codigo_mesa: mesa.codigo_mesa,
        nombre: mesa.nombre,
        capacidad: mesa.capacidad,
        seccion: mesa.seccion,
        precio_anticipo: mesa.precio_anticipo,
        estatus: mesa.estatus || 'disponible'
      }

      if (mesa.imagen) {
        this.imagenActual = mesa.imagen
      }
      this.dialog = true
    },

    previewImagen () {
      if (this.imgSeleccionada) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.imagenActual = e.target.result
        }
        reader.readAsDataURL(this.imgSeleccionada)
      }
    },

    guardarMesa () {
      if (!this.$refs.mesaForm.validate()) {
        this.mostrarError('Por favor completa todos los campos correctamente')
        return
      }

      this.loading = true
      const token = localStorage.getItem('token')

      // Crear FormData
      const formData = new FormData()
      formData.append('codigo_mesa', this.registroActual.codigo_mesa)
      formData.append('nombre', this.registroActual.nombre)
      formData.append('capacidad', this.registroActual.capacidad)
      formData.append('seccion', this.registroActual.seccion)
      formData.append('precio_anticipo', this.registroActual.precio_anticipo)
      formData.append('estatus', this.registroActual.estatus)

      if (this.imgSeleccionada) {
        formData.append('imagen', this.imgSeleccionada)
      }

      let url
      if (this.esNueva) {
        url = this.URL('mesas')
      } else {
        url = this.URL(`mesas/${this.mesaIdEdicion}`)
        formData.append('_method', 'PUT')  
      }

      axios
        .post(url, formData, {  
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
        .then((response) => {
          const mensaje = this.esNueva ? 'Mesa guardada correctamente' : 'Mesa actualizada correctamente'
          Swal.fire({
            title: 'Éxito',
            text: mensaje,
            icon: 'success',
            confirmButtonText: 'Aceptar'
          })

          if (this.esNueva) {
            this.$emit('mesa-creada', response.data.data || response.data)
          } else {
            this.$emit('mesa-actualizada', response.data.data || response.data)
          }

          this.cerrarDialog()
        })
        .catch((error) => {
          console.error('Error:', error.response?.data || error.message)
          const mensaje = error.response?.data?.message || 'Error al guardar la mesa'
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
      if (this.$refs.mesaForm) {
        this.$refs.mesaForm.reset()
      }
      this.registroActual = {
        codigo_mesa: '',
        nombre: '',
        capacidad: '',
        seccion: '',
        precio_anticipo: '',
        estatus: 'disponible'
      }
      this.imgSeleccionada = null
      this.imagenActual = null
      this.esNueva = true
      this.mesaIdEdicion = null
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