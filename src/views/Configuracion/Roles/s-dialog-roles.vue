<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <v-card>
      <!-- Toolbar del diálogo -->
      <v-toolbar dark color="primary">
        <v-toolbar-title>{{ tituloDialog }}</v-toolbar-title>
        <v-spacer></v-spacer>

        <v-btn
          dark
          text
          @click="guardarRol()"
          :loading="loading"
        >
          <v-icon left>mdi-content-save</v-icon>
          Guardar
        </v-btn>

        <v-btn
          icon
          dark
          @click="cerrarDialog()"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Contenido del diálogo -->
      <v-card-text class="pa-6">
        <v-form ref="rolForm" v-model="formValido" lazy-validation>
          <v-row dense>
            <!-- Columna de Imagen -->
            <!-- <v-col cols="12" sm="4" md="3">
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
            </v-col> -->

            <!-- Columna 1 -->
            <v-col cols="12" sm="4" md="3">
              <v-text-field
                v-model="registroActual.nombre"
                label="Nombre del Rol"
                dense
                outlined
                :rules="nombreRules"
                required
              />

              <v-text-field
                v-model="registroActual.descripcion"
                label="Descripción del Rol"
                dense
                outlined
                :rules="descripcionRules"
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

export default {
  name: 'RolDialog',
  data () {
    return {
      dialog: false,
      loading: false,
      formValido: false,
      esNueva: true,
      rolIdEdicion: null,
      registroActual: {
        nombre: '',
        descripcion: '',
        activo: true,
      },
      imgSeleccionada: null,
      imagenActual: null,
      estatusOpciones: [false, true],
      mostrarMensaje: false,
      textoMensaje: '',
      tipoMensaje: 'success',
      nombreRules: [
        v => !!v || 'El nombre del rol es requerido',
        v => (v && v.length >= 1 && v.length <= 64) || 'Debe contener entre 1 y 64 caracteres'
      ],
      descripcionRules: [
        v => !!v || 'La descripción del rol es requerida',
        v => (v && v.length >= 1 && v.length <= 255) || 'Debe contener entre 1 y 255 caracteres'
      ],
    }
  },
  computed: {
    URL () {
      return (endpoint) => `${process.env.VUE_APP_API_URL}/${endpoint}`
    },
    tituloDialog () {
      return this.esNueva ? 'Crear Nuevo Rol' : `Editar Rol - ${this.registroActual.nombre || 'Sin nombre'}`
    }
  },
  methods: {
    abrirCrear () {
      this.esNueva = true
      this.rolIdEdicion = null
      this.limpiarFormulario()
      this.dialog = true
    },

    abrirEditar (rol) {
      this.esNueva = false
      this.rolIdEdicion = rol.id

      this.registroActual = {
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        activo: rol.activo
      }

      if (rol.imagen) {
        this.imagenActual = rol.imagen
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

    guardarRol () {
      if (!this.$refs.rolForm.validate()) {
        this.mostrarError('Por favor completa todos los campos correctamente')
        return
      }

      this.loading = true
      const token = localStorage.getItem('token')

      // Crear FormData
      const formData = new FormData()
      formData.append('nombre', this.registroActual.nombre)
      formData.append('descripcion', this.registroActual.descripcion)
      formData.append('activo', this.registroActual.activo)

      if (this.imgSeleccionada) {
        formData.append('imagen', this.imgSeleccionada)
      }

      let url
      if (this.esNueva) {
        url = this.URL('tipos-usuario')
      } else {
        url = this.URL(`tipos-usuario/${this.rolIdEdicion}`)
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
          const mensaje = this.esNueva ? 'Rol guardado correctamente' : 'Rol actualizado correctamente'
          Swal.fire({
            title: 'Éxito',
            text: mensaje,
            icon: 'success',
            confirmButtonText: 'Aceptar'
          })

          if (this.esNueva) {
            this.$emit('rol-creado', response.data.data || response.data)
          } else {
            this.$emit('rol-actualizado', response.data.data || response.data)
          }

          this.cerrarDialog()
        })
        .catch((error) => {
          console.error('Error:', error.response?.data || error.message)
          const mensaje = error.response?.data?.message || 'Error al guardar el rol'
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
      if (this.$refs.rolForm) {
        this.$refs.rolForm.reset()
      }
      this.registroActual = {
        nombre: '',
        descripcion: '',
        activo: true
      }
      this.imgSeleccionada = null
      this.imagenActual = null
      this.esNueva = true
      this.rolIdEdicion = null
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