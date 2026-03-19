<template>
  <v-app>
    <v-container fluid>

      <!-- Dialog para crear/editar pedido -->
      <PedidoDialog ref="pedidoDialog" @pedido-creado="getPedidos" />
      <PedidoDetalle ref="PedidoDetalle" />

      <!-- Tabla de pedidos -->
      <v-data-table
        :headers="headers"
        :items="pedidos"
        item-key="id"
        :loading="loading"
        class="elevation-1"
      >
        <!-- Toolbar -->
        <template v-slot:top>
          <v-toolbar flat color="primary" dark>
            <v-toolbar-title>Lista de Pedidos</v-toolbar-title>
            <v-spacer></v-spacer>

            <!-- Refresh -->
            <v-btn icon color="white" @click="getPedidos" title="Actualizar lista">
              <v-icon>mdi-refresh</v-icon>
            </v-btn>

            <!-- Nuevo pedido -->
            <v-btn icon color="white" @click="nuevoPedido" title="Nuevo pedido">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-toolbar>
        </template>

        <!-- Columnas -->
        <template v-slot:item.mesa="{ item }">{{ item.mesa?.nombre || 'Sin mesa' }}</template>
        <template v-slot:item.total="{ item }">${{ item.total }}</template>
        <template v-slot:item.fecha="{ item }">{{ new Date(item.created_at).toLocaleString() }}</template>
        <template v-slot:item.items="{ item }">
          <ul>
            <li v-for="i in item.detalles" :key="i.id">{{ i.menu.nombre }} x {{ i.cantidad }}</li>
          </ul>
        </template>
        <template v-slot:item.estatus="{ item }">
          <v-chip
            :color="item.estatus === 'pagado' ? 'success' : item.estatus === 'cancelado' ? 'error' : 'warning'"
            small
            dark
          >
            {{ item.estatus || 'Pendiente' }}
          </v-chip>
        </template>

        <!-- Acciones por fila -->
        <template v-slot:item.actions="{ item }">
          <v-btn small icon color="primary" @click.stop="verDetalle(item)" title="Ver detalle">
            <v-icon>mdi-eye</v-icon>
          </v-btn>

          <v-btn
            small
            icon
            color="primary"
            @click.stop="editarPedido(item)"
            :disabled="item.estatus !== 'abierto'"
            title="Editar pedido"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>

        <!-- No data -->
        <template v-slot:no-data>
          <v-alert type="info" class="mt-4">No hay pedidos registrados</v-alert>
        </template>
      </v-data-table>
    </v-container>
  </v-app>
</template>

<script>
import axios from 'axios'
import PedidoDialog from './PedidosCarrito.vue'
import PedidoDetalle from './s-dialog-detallepedido.vue'

export default {
  name: 'Pedidos',
  components: { PedidoDialog, PedidoDetalle },
  data() {
    return {
      pedidos: [],
      loading: false,
      headers: [
        { text: 'Mesa', value: 'mesa' },
        { text: 'Productos', value: 'items' },
        { text: 'Total', value: 'total' },
        { text: 'Fecha', value: 'fecha' },
        { text: 'Estatus', value: 'estatus' },
        { text: 'Acciones', value: 'actions', sortable: false }
      ]
    }
  },
  computed: {
    URL() { return endpoint => `${process.env.VUE_APP_API_URL}/${endpoint}` }
  },
  mounted() {
    this.getPedidos()
  },
  methods: {
    async getPedidos() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(this.URL('pedido'), { headers: { Authorization: `Bearer ${token}` } })
        this.pedidos = res.data.data || res.data
      } catch (error) {
        console.error(error)
        this.$msg.error('Error al cargar pedidos')
      } finally {
        this.loading = false
      }
    },
    nuevoPedido() {
      this.$refs.pedidoDialog.reset()
      this.$refs.pedidoDialog.open = true
    },
    editarPedido(pedido) {
      if (pedido.estatus !== 'abierto') return
      this.$refs.pedidoDialog.cargarPedido(pedido.id)
    },
    verDetalle(pedido) {
      this.$refs.PedidoDetalle.abrir(pedido)
    }

  }
}
</script>