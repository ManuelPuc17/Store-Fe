<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <v-card>
      <v-card-title class="pa-0">
        <s-toolbar-modal
          titulo="Producto"
          :id="productoIdEdicion"
          @guardar="guardarProducto"
          @cerrar="cerrarDialog"
        />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="productoForm" v-model="formValido" lazy-validation>
          <v-row dense>

            <!-- Columna imagen -->
            <v-col cols="12" sm="4" md="3">
              <div class="text-center">
                <v-img
                  v-if="imagenActual"
                  max-width="200"
                  max-height="200"
                  :src="imagenActual"
                  alt="Imagen producto"
                  class="mx-auto rounded"
                />
                <div v-else class="pa-4 grey lighten-3 rounded">
                  <v-icon size="80" color="grey">mdi-package-variant</v-icon>
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

            <!-- Columna datos -->
            <v-col cols="12" sm="8" md="6">

              <v-text-field
                v-model="registroActual.nombre"
                label="Nombre del producto"
                dense
                outlined
                :rules="requerido"
                required
              />

              <v-textarea
                v-model="registroActual.descripcion"
                label="Descripción"
                dense
                outlined
                rows="2"
                class="mt-2"
              />

              <v-autocomplete
                v-model="registroActual.categoria_id"
                :items="categorias"
                item-text="nombre"
                item-value="id"
                label="Categoría"
                dense
                outlined
                :rules="requerido"
                required
                class="mt-2"
              />

              <v-autocomplete
                v-model="registroActual.tipo_unidad_id"
                :items="tiposUnidad"
                item-text="nombre"
                item-value="id"
                label="Tipo de unidad"
                dense
                outlined
                :rules="requerido"
                required
                class="mt-2"
              />

              <v-row dense class="mt-2">
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="registroActual.precio_base"
                    label="Precio base"
                    type="number"
                    step="0.01"
                    min="0"
                    prefix="$"
                    dense
                    outlined
                    :rules="requerido"
                    required
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="registroActual.stock"
                    label="Stock inicial"
                    type="number"
                    step="0.001"
                    min="0"
                    dense
                    outlined
                  />
                </v-col>
              </v-row>

              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="registroActual.sku"
                    label="SKU"
                    dense
                    outlined
                    class="mt-2"
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="registroActual.codigo_barras"
                    label="Código de barras"
                    dense
                    outlined
                    class="mt-2"
                  />
                </v-col>
              </v-row>

              <!-- <v-select
                v-model="registroActual.estatus"
                :items="estatusOpciones"
                item-text="texto"
                item-value="valor"
                label="Estatus"
                dense
                outlined
                class="mt-2"
              /> -->

            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

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
  name: 'ProductoDialog',
  components: {
    SToolbarModal
  },
  data () {
    return {
      dialog: false,
      loading: false,
      formValido: false,
      esNuevo: true,
      productoIdEdicion: null,

      registroActual: {
        nombre: '',
        descripcion: '',
        categoria_id: null,
        tipo_unidad_id: null,
        precio_base: null,
        stock: 0,
        sku: '',
        codigo_barras: '',
        estatus: true
      },

      imgSeleccionada: null,
      imagenActual: null,

      categorias: [],
      tiposUnidad: [],

      estatusOpciones: [
        { texto: 'Activo',   valor: true  },
        { texto: 'Inactivo', valor: false }
      ],

      mostrarMensaje: false,
      textoMensaje: '',
      tipoMensaje: 'success',

      requerido: [v => !!v || 'Este campo es requerido']
    }
  },
  computed: {
    URL () {
      return (endpoint) => `${process.env.VUE_APP_API_URL}/${endpoint}`
    },
    baseUrl () {
      return process.env.VUE_APP_API_URL.replace('/api', '')
    }
  },
  methods: {
    // ── Abrir ────────────────────────────────────────
    abrirCrear () {
      this.esNuevo = true
      this.productoIdEdicion = null
      this.limpiarFormulario()
      this.cargarCatalogos()
      this.dialog = true
    },

    abrirEditar (producto) {
      this.esNuevo = false
      this.productoIdEdicion = producto.id

      this.registroActual = {
        nombre:         producto.nombre,
        descripcion:    producto.descripcion,
        categoria_id:   producto.categoria_id,
        tipo_unidad_id: producto.tipo_unidad_id,
        precio_base:    parseFloat(producto.precio_base),
        stock:          parseFloat(producto.stock),
        sku:            producto.sku,
        codigo_barras:  producto.codigo_barras,
        estatus:        producto.estatus
      }

      if (producto.imagen) {
        this.imagenActual = `${this.baseUrl}/storage/${producto.imagen}`
      }

      this.cargarCatalogos()
      this.dialog = true
    },

    // ── Catálogos ────────────────────────────────────
    cargarCatalogos () {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      axios.get(this.URL('categorias'), { headers })
        .then(r => { this.categorias = r.data.data || r.data })
        .catch(() => { this.mostrarError('Error al cargar categorías') })

      axios.get(this.URL('tipos-unidad'), { headers })
        .then(r => { this.tiposUnidad = r.data.data || r.data })
        .catch(() => { this.mostrarError('Error al cargar tipos de unidad') })
    },

    // ── Imagen ───────────────────────────────────────
    previewImagen () {
      if (this.imgSeleccionada) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.imagenActual = e.target.result
        }
        reader.readAsDataURL(this.imgSeleccionada)
      }
    },

    // ── Guardar ──────────────────────────────────────
    guardarProducto () {
      if (!this.$refs.productoForm.validate()) {
        this.mostrarError('Por favor completa todos los campos requeridos')
        return
      }

      this.loading = true
      const token = localStorage.getItem('token')

      const formData = new FormData()
      formData.append('nombre',         this.registroActual.nombre)
      formData.append('descripcion',    this.registroActual.descripcion || '')
      formData.append('categoria_id',   this.registroActual.categoria_id)
      formData.append('tipo_unidad_id', this.registroActual.tipo_unidad_id)
      formData.append('precio_base',    this.registroActual.precio_base)
      formData.append('stock',          this.registroActual.stock || 0)
      formData.append('sku',            this.registroActual.sku || '')
      formData.append('codigo_barras',  this.registroActual.codigo_barras || '')
      formData.append('estatus',        this.registroActual.estatus ? 1 : 0)

      if (this.imgSeleccionada) {
        formData.append('imagen', this.imgSeleccionada)
      }

      let url = this.URL('productos')
      if (!this.esNuevo) {
        url = this.URL(`productos/${this.productoIdEdicion}`)
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
          const mensaje = this.esNuevo ? 'Producto creado correctamente' : 'Producto actualizado correctamente'
          Swal.fire({
            title: 'Éxito',
            text: mensaje,
            icon: 'success',
            confirmButtonText: 'Aceptar'
          })

          if (this.esNuevo) {
            this.$emit('producto-creado', response.data.data || response.data)
          } else {
            this.$emit('producto-actualizado', response.data.data || response.data)
          }

          this.cerrarDialog()
        })
        .catch((error) => {
          const mensaje = error.response?.data?.message || 'Error al guardar el producto'
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

    // ── Cerrar / limpiar ─────────────────────────────
    cerrarDialog () {
      this.dialog = false
      this.limpiarFormulario()
    },

    limpiarFormulario () {
      if (this.$refs.productoForm) {
        this.$refs.productoForm.reset()
      }
      this.registroActual = {
        nombre: '',
        descripcion: '',
        categoria_id: null,
        tipo_unidad_id: null,
        precio_base: null,
        stock: 0,
        sku: '',
        codigo_barras: '',
        estatus: true
      }
      this.imgSeleccionada = null
      this.imagenActual = null
      this.esNuevo = true
      this.productoIdEdicion = null
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