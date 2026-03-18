<template>
<v-dialog
  v-model="dialog"
  fullscreen
  hide-overlay
  transition="dialog-bottom-transition"
>
  <v-card>

    <!-- Toolbar -->
    <v-card-title class="pa-0">
      <s-toolbar-modal
        titulo="Menú"
        :id="menuIdEdicion"
        :permiso="permiso"
        @guardar="guardarMenu"
        @cerrar="cerrarDialog"
      />
    </v-card-title>

    <!-- FORM -->
    <v-card-text class="pa-6">
      <v-form ref="menuForm" v-model="formValido" lazy-validation>
        <v-row dense>

          <!-- Columna 1 -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="registroActual.nombre"
              label="Nombre"
              dense outlined required
            />

            <v-textarea
              v-model="registroActual.descripcion"
              label="Descripción"
              dense outlined
              class="mt-2"
            />

            <v-text-field
              v-model.number="registroActual.precio"
              label="Precio"
              prefix="$"
              type="number"
              dense outlined required
              class="mt-2"
            />
          </v-col>

          <!-- Columna 2 -->
          <v-col cols="12" sm="6">

            <v-select
              v-model="registroActual.categoria_menu_id"
              :items="categorias"
              item-text="nombre"
              item-value="id"
              label="Categoría"
              dense outlined required
            />

            <v-select
              v-model="registroActual.estatus"
              :items="estatusOpciones"
              label="Estatus"
              dense outlined
              class="mt-2"
            />

            <v-file-input
              v-model="imgSeleccionada"
              label="Imagen"
              accept="image/*"
              dense outlined
              class="mt-2"
              @change="previewImagen"
            />

            <!-- preview -->
            <v-img
              v-if="imagenActual"
              :src="imagenActual"
              max-height="150"
              contain
              class="mt-2"
            />
          </v-col>

        </v-row>
      </v-form>
    </v-card-text>

    <!-- Snackbar -->
    <v-snackbar v-model="mostrarMensaje" :color="tipoMensaje" bottom right>
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
  name: 'MenuDialog',
  components: { SToolbarModal },

  data () {
    return {
      permiso: {
        nuevo: true,
        editar: true,
        eliminar: false
      },

      dialog: false,
      loading: false,
      formValido: false,
      esNuevo: true,
      menuIdEdicion: null,

      registroActual: {
        nombre: '',
        descripcion: '',
        precio: '',
        categoria_menu_id: null,
        estatus: true
      },

      categorias: [],

      imgSeleccionada: null,
      imagenActual: null,

      estatusOpciones: [true, false],

      mostrarMensaje: false,
      textoMensaje: '',
      tipoMensaje: 'success'
    }
  },

  computed: {
    URL () {
      return (endpoint) => `${process.env.VUE_APP_API_URL}/${endpoint}`
    }
  },

  mounted () {
    this.getCategorias()
  },

  methods: {

    abrirCrear () {
      this.esNuevo = true
      this.menuIdEdicion = null
      this.limpiarFormulario()
      this.dialog = true
    },

    abrirEditar (menu) {
      this.esNuevo = false
      this.menuIdEdicion = menu.id

      this.registroActual = {
        nombre: menu.nombre,
        descripcion: menu.descripcion,
        precio: menu.precio,
        categoria_menu_id: menu.categoria_menu_id,
        estatus: menu.estatus
      }

      this.imagenActual = menu.imagen || null
      this.dialog = true
    },

    previewImagen () {
      if (this.imgSeleccionada) {
        const reader = new FileReader()
        reader.onload = e => {
          this.imagenActual = e.target.result
        }
        reader.readAsDataURL(this.imgSeleccionada)
      }
    },

    guardarMenu () {
      if (!this.$refs.menuForm.validate()) return

      this.loading = true
      const token = localStorage.getItem('token')

      const formData = new FormData()
      Object.keys(this.registroActual).forEach(k => {
        formData.append(k, this.registroActual[k])
      })

      if (this.imgSeleccionada) {
        formData.append('imagen', this.imgSeleccionada)
      }

      let url = this.esNuevo
        ? this.URL('menu')
        : this.URL(`menu/${this.menuIdEdicion}`)

      if (!this.esNuevo) {
        formData.append('_method', 'PUT')
      }

      axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(res => {
        const data = res.data.data || res.data

        this.$emit(
          this.esNuevo ? 'menu-creado' : 'menu-actualizado',
          data
        )

        this.cerrarDialog()
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Error'
        this.mostrarError(msg)
      })
      .finally(() => {
        this.loading = false
      })
    },

    getCategorias () {
        const token = localStorage.getItem('token')

        axios.get(this.URL('categoria-menu'), {
            headers: {
            Authorization: `Bearer ${token}`
            }
        })
        .then(res => {
            this.categorias = res.data.data || res.data
        })
    },

    cerrarDialog () {
      this.dialog = false
      this.limpiarFormulario()
    },

    limpiarFormulario () {
      if (this.$refs.menuForm) this.$refs.menuForm.reset()

      this.registroActual = {
        nombre: '',
        descripcion: '',
        precio: '',
        categoria_menu_id: null,
        estatus: true
      }

      this.imgSeleccionada = null
      this.imagenActual = null
      this.esNuevo = true
      this.menuIdEdicion = null
    },

    mostrarError (msg) {
      this.textoMensaje = msg
      this.tipoMensaje = 'error'
      this.mostrarMensaje = true
    }
  }
}
</script>