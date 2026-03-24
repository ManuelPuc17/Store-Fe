<template>
  <v-app>
    <v-container fluid>

      <!-- Dialog detalle -->
      <MovimientoDetalleDialog
        ref="MovimientoDetalleDialog"
      />

      <v-data-table
        :headers="headers"
        :items="movimientos"
        :loading="loading"
        item-key="id"
        class="elevation-1"
      >
        <template v-slot:top>
          <v-toolbar flat color="primary" dark>
            <v-toolbar-title>Movimientos de Inventario</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
        </template>

        <!-- Producto -->
        <template v-slot:item.producto.nombre="{ item }">
          <strong>{{ item.producto?.nombre }}</strong>
        </template>

        <!-- Tipo -->
        <template v-slot:item.tipo_movimiento="{ item }">
          <v-chip
            small
            text-color="white"
            :color="colorMovimiento(item.tipo_movimiento)"
          >
            {{ item.tipo_movimiento }}
          </v-chip>
        </template>

        <!-- Cantidad -->
        <template v-slot:item.cantidad="{ item }">
          <span :class="item.cantidad < 0 ? 'red--text' : 'green--text'">
            {{ item.cantidad }}
          </span>
        </template>

        <!-- Stock -->
        <template v-slot:item.stock_nuevo="{ item }">
          {{ item.stock_nuevo }}
        </template>

        <!-- Fecha -->
        <template v-slot:item.created_at="{ item }">
          {{ formatFecha(item.created_at) }}
        </template>

        <!-- Acciones -->
        <template v-slot:item.actions="{ item }">
          <v-btn small icon color="primary" @click="verDetalle(item)">
            <v-icon small>mdi-eye</v-icon>
          </v-btn>
        </template>

        <template v-slot:no-data>
          <v-alert type="info" class="mt-4">
            No hay movimientos registrados
          </v-alert>
        </template>

      </v-data-table>

    </v-container>
  </v-app>
</template>
<script>
import axios from 'axios'
import Swal from 'sweetalert2'
import MovimientoDetalleDialog from './DetallesMovimiento.vue'

export default {
  name: 'Movimientos',
  components: {
    MovimientoDetalleDialog
  },
  data () {
    return {
      headers: [
        { text: 'Producto', align: 'center', value: 'producto.nombre' },
        { text: 'Tipo', align: 'center', value: 'tipo_movimiento' },
        {text: 'Especificación', align: 'center', value: 'descripcion'},
        { text: 'Cantidad', align: 'center', value: 'cantidad' },
        { text: 'Stock final', align: 'center', value: 'stock_nuevo' },
        // { text: 'Usuario', align: 'center', value: 'usuario.name' },
        { text: 'Fecha', align: 'center', value: 'created_at' },
        { text: 'Acciones', align: 'center', value: 'actions', sortable: false }
      ],
      movimientos: [],
      loading: false
    }
  },
  computed: {
    URL () {
      return (endpoint) => `${process.env.VUE_APP_API_URL}/${endpoint}`
    }
  },
  mounted () {
    this.getMovimientos()
  },
  methods: {

    getMovimientos () {
      this.loading = true
      const token = localStorage.getItem('token')

      axios
        .get(this.URL('movimientos-stock'), {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          this.movimientos = res.data.data || res.data
        })
        .catch((error) => {
          Swal.fire('Error', error.response?.data?.message || 'Error al cargar movimientos', 'error')
        })
        .finally(() => {
          this.loading = false
        })
    },

    verDetalle (item) {
      this.$refs.MovimientoDetalleDialog.abrir(item)
    },

    colorMovimiento (tipo) {
      switch (tipo) {
        case 'entrada': return 'green'
        case 'venta': return 'red'
        case 'ajuste': return 'orange'
        case 'devolucion': return 'blue'
        default: return 'grey'
      }
    },

    formatFecha (fecha) {
      return new Date(fecha).toLocaleString()
    }
  }
}
</script>