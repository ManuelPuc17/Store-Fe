<template>
  <v-app>
    <v-container fluid>

      <!-- Dialog para crear/editar -->
      <ProductoDialog
        ref="ProductoDialog"
        @producto-creado="onProductoCreado"
        @producto-actualizado="onProductoActualizado"
      />

      <v-data-table
        :headers="headerProductos"
        :items="registroProductos"
        :loading="loading"
        item-key="id"
        class="elevation-1"
      >
        <template v-slot:top>
          <v-toolbar flat color="primary" dark>
            <v-toolbar-title>Gestión de Productos</v-toolbar-title>
            <v-spacer></v-spacer>

            <v-btn color="white" @click="abrirCrear">
              <v-icon color="primary">mdi-plus</v-icon>
            </v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item.imagen="{ item }">
          <v-avatar size="36" class="my-1">
            <v-img
              v-if="item.imagen"
              :src="`${baseUrl}/storage/${item.imagen}`"
              alt="imagen"
            />
            <v-icon v-else color="grey">mdi-package-variant</v-icon>
          </v-avatar>
        </template>

        <template v-slot:item.precio_base="{ item }">
          <span>$ {{ parseFloat(item.precio_base).toFixed(2) }}</span>
        </template>

        <template v-slot:item.stock="{ item }">
          <span>{{ parseFloat(item.stock).toFixed(2) }} {{ item.tipo_unidad ? item.tipo_unidad.simbolo : '' }}</span>
        </template>

        <template v-slot:item.estatus="{ item }">
          <v-chip
            :color="item.estatus ? 'success' : 'warning'"
            text-color="white"
            small
          >
            {{ item.estatus ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn small icon color="primary" @click="abrirEditar(item)">
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>

          <v-btn small icon color="error" @click="deleteProducto(item)">
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </template>

        <template v-slot:no-data>
          <v-alert type="info" class="mt-4">
            No hay productos registrados
          </v-alert>
        </template>
      </v-data-table>

    </v-container>
  </v-app>
</template>

<script>
import axios from 'axios'
import Swal from 'sweetalert2'
import ProductoDialog from './s-dialog-producto.vue'

export default {
  name: 'Productos',
  components: {
    ProductoDialog
  },
  data () {
    return {
      headerProductos: [
        { text: 'Imagen',     align: 'center', value: 'imagen',     sortable: false },
        { text: 'Nombre',     align: 'center', value: 'nombre' },
        { text: 'Categoría',  align: 'center', value: 'categoria.nombre' },
        { text: 'Unidad',     align: 'center', value: 'tipo_unidad.nombre' },
        { text: 'Precio base',align: 'center', value: 'precio_base' },
        { text: 'Stock',      align: 'center', value: 'stock' },
        { text: 'Estatus',    align: 'center', value: 'estatus' },
        { text: 'Opciones',   align: 'center', value: 'actions', sortable: false }
      ],
      registroProductos: [],
      loading: false
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
  mounted () {
    this.getProductos()
  },
  methods: {
    getProductos () {
      this.loading = true
      const token = localStorage.getItem('token')

      axios
        .get(this.URL('productos'), {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
          this.registroProductos = response.data.data || response.data
        })
        .catch((error) => {
          Swal.fire({
            title: 'Error',
            text: error.response?.data?.message || 'Error al cargar los productos',
            icon: 'error',
            confirmButtonText: 'Reintentar'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },

    abrirCrear () {
      this.$refs.ProductoDialog.abrirCrear()
    },

    abrirEditar (item) {
      this.$refs.ProductoDialog.abrirEditar(item)
    },

    deleteProducto (item) {
      Swal.fire({
        title: '¿Eliminar producto?',
        text: `¿Estás seguro de eliminar "${item.nombre}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          const token = localStorage.getItem('token')
          this.loading = true

          axios
            .delete(this.URL(`productos/${item.id}`), {
              headers: { Authorization: `Bearer ${token}` }
            })
            .then(() => {
              Swal.fire({
                title: 'Eliminado',
                text: 'Producto eliminado correctamente',
                icon: 'success'
              })
              this.getProductos()
            })
            .catch((error) => {
              Swal.fire({
                title: 'Error',
                text: error.response?.data?.message || 'Error al eliminar el producto',
                icon: 'error'
              })
            })
            .finally(() => {
              this.loading = false
            })
        }
      })
    },

    onProductoCreado () {
      this.getProductos()
    },

    onProductoActualizado () {
      this.getProductos()
    }
  }
}
</script>

<style scoped>
</style>