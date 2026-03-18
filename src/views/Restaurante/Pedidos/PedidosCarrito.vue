<template>
  <v-dialog v-model="open" max-width="900px">
    <v-card>
      <v-card-title>
        Agregar productos
        <v-spacer></v-spacer>
        <v-btn icon @click="open = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>

      <v-card-text>
        <v-container fluid>
          <v-row>
            <v-col cols="12" md="4">
              <v-select v-model="mesaSeleccionada" :items="mesas" item-text="nombre" item-value="id"
                label="Seleccionar mesa" outlined />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="8">
              <v-row>
                <v-col v-for="item in menu" :key="item.id" cols="12" sm="6" md="4">
                  <v-card @click="agregarProducto(item)" class="pa-2" outlined>
                    <v-card-title>{{ item.nombre }}</v-card-title>
                    <v-card-subtitle>${{ item.precio }}</v-card-subtitle>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>

            <v-col cols="12" md="4">
              <v-card>
                <v-card-title>Pedido</v-card-title>
                <v-divider></v-divider>

                <v-list dense>
                  <v-list-item v-for="(item, index) in carrito" :key="item.menu_id">
                    <v-list-item-content>
                      <v-list-item-title>{{ item.nombre }}</v-list-item-title>
                      <v-list-item-subtitle>${{ item.precio }} x {{ item.cantidad }}</v-list-item-subtitle>
                    </v-list-item-content>

                    <v-btn icon @click="sumar(index)"><v-icon>mdi-plus</v-icon></v-btn>
                    <v-btn icon @click="restar(index)"><v-icon>mdi-minus</v-icon></v-btn>
                  </v-list-item>
                </v-list>

                <v-divider></v-divider>
                <v-card-text><strong>Total: ${{ total }}</strong></v-card-text>
                <v-card-actions>
                  <v-btn color="primary" block :loading="loading" @click="enviarPedido">
                    Enviar pedido
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from 'axios'

export default {
  name: 'PedidoDialog',
  data() {
    return {
      open: false,
      mesas: [],
      menu: [],
      carrito: [],
      mesaSeleccionada: null,
      loading: false,
      pedidoId: null
    }
  },
  computed: {
    total() {
      return this.carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
    },
    URL() { return endpoint => `${process.env.VUE_APP_API_URL}/${endpoint}` }
  },
  mounted() {
    this.getMesas()
    this.getMenu()
  },
  methods: {
    reset() {
      this.pedidoId = null
      this.carrito = []
      this.mesaSeleccionada = null
      this.open = true
    },
    async cargarPedido(id) {
      this.pedidoId = id
      const token = localStorage.getItem('token')
      try {
        const res = await axios.get(this.URL(`pedido/${id}`), { headers: { Authorization: `Bearer ${token}` } })
        const data = res.data.data || res.data
        this.carrito = data.detalles.map(i => ({ menu_id: i.menu.id, nombre: i.menu.nombre, precio: i.precio, cantidad: i.cantidad }))
        this.mesaSeleccionada = data.mesa_id
        this.open = true
      } catch (err) {
        this.$msg.error('Error al cargar pedido')
      }
    },
    async getMesas() {
      const token = localStorage.getItem('token')
      const res = await axios.get(this.URL('mesas'), { headers: { Authorization: `Bearer ${token}` } })
      this.mesas = res.data
    },
    async getMenu() {
      const token = localStorage.getItem('token')
      const res = await axios.get(this.URL('menu'), { headers: { Authorization: `Bearer ${token}` } })
      this.menu = res.data
    },
    agregarProducto(producto) {
      const existente = this.carrito.find(p => p.menu_id === producto.id)
      if (existente) existente.cantidad++
      else this.carrito.push({ menu_id: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 })
    },
    sumar(index) { this.carrito[index].cantidad++ },
    restar(index) {
      if (this.carrito[index].cantidad > 1) this.carrito[index].cantidad--
      else this.carrito.splice(index, 1)
    },
    async enviarPedido() {
      if (!this.mesaSeleccionada) { this.$msg.warning('Selecciona una mesa'); return }
      if (this.carrito.length === 0) { this.$msg.warning('Agrega productos'); return }

      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const payload = {
          mesa_id: this.mesaSeleccionada,
          total: this.total,
          items: this.carrito.map(i => ({ menu_id: i.menu_id, cantidad: i.cantidad, precio: i.precio }))
        }

        const url = this.pedidoId ? this.URL(`pedido/${this.pedidoId}`) : this.URL('pedido')
        const method = this.pedidoId ? 'put' : 'post'

        const res = await axios[method](url, payload, { headers: { Authorization: `Bearer ${token}` } })
        this.$msg.success(res.data.message || 'Pedido guardado')
        this.$emit('pedido-creado', res.data.data)
        this.reset()
      } catch (err) {
        this.$msg.error(err.response?.data?.message || 'Error al guardar pedido')
      } finally { this.loading = false }
    }
  }
}
</script>