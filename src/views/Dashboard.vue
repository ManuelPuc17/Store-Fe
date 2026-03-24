<template>
  <v-app>
    <v-container fluid>

      <!-- INPUT SCANNER -->
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="codigo"
            label="Escanear código de barras o ID"
            outlined
            autofocus
            @keyup.enter="buscarProducto"
          />
        </v-col>
      </v-row>

      <v-row>

        <!--  CARRITO -->
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>Venta</v-card-title>
            <v-divider></v-divider>

            <v-data-table
              :headers="headers"
              :items="carrito"
              item-key="producto_id"
              dense
            >

              <template v-slot:item.cantidad="{ item }">
                <v-btn icon @click="restar(item)">
                  <v-icon small>mdi-minus</v-icon>
                </v-btn>

                {{ item.cantidad }}

                <v-btn icon @click="sumar(item)">
                  <v-icon small>mdi-plus</v-icon>
                </v-btn>
              </template>

              <template v-slot:item.subtotal="{ item }">
                $ {{ (item.precio * item.cantidad).toFixed(2) }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon color="red" @click="eliminar(item)">
                  <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </template>

            </v-data-table>
          </v-card>
        </v-col>

        <!--  TOTAL -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Total</v-card-title>
            <v-divider></v-divider>

            <v-card-text>
              <h2>$ {{ total }}</h2>
            </v-card-text>

            <v-text-field
              v-model="monto_pagado"
              label="Monto pagado"
              type="number"
            />

            <v-card-text>
              Cambio: $ {{ cambio }}
            </v-card-text>

            <v-card-actions>
              <v-btn color="success" block @click="finalizarVenta">
                Cobrar
              </v-btn>
            </v-card-actions>

          </v-card>
        </v-col>

      </v-row>

    </v-container>
  </v-app>
</template>
<script>
import axios from 'axios'
import Swal from 'sweetalert2'

export default {
  data () {
    return {
      codigo: '',
      carrito: [],
      monto_pagado: 0,
      headers: [
        { text: 'Producto', value: 'nombre' },
        { text: 'Precio', value: 'precio' },
        { text: 'Cantidad', value: 'cantidad' },
        { text: 'Subtotal', value: 'subtotal' },
        { text: 'Acciones', value: 'actions', sortable: false }
      ]
    }
  },

  computed: {
    total () {
      return this.carrito.reduce((sum, i) => sum + (i.precio * i.cantidad), 0)
    },
    cambio () {
      return Math.max(0, this.monto_pagado - this.total)
    },
    URL () {
      return endpoint => `${process.env.VUE_APP_API_URL}/${endpoint}`
    }
  },

  methods: {

    async buscarProducto () {
      if (!this.codigo) return

      const token = localStorage.getItem('token')

      try {
        const res = await axios.get(this.URL(`productos/buscar/${this.codigo}`), {
          headers: { Authorization: `Bearer ${token}` }
        })

        const producto = res.data
        this.agregarProducto(producto)
        this.codigo = ''

      } catch (error) {
        Swal.fire(
          'Error',
          error.response?.data?.message || 'Producto no encontrado',
          'error'
        )
        this.codigo = ''
      }
    },

    agregarProducto (producto) {
      const existente = this.carrito.find(p => p.producto_id === producto.id)

      if (existente) {
        existente.cantidad++
      } else {
        this.carrito.push({
          producto_id: producto.id,
          nombre: producto.nombre,
          precio: parseFloat(producto.precio_base),
          cantidad: 1
        })
      }
    },

    sumar (item) {
      item.cantidad++
    },

    restar (item) {
      if (item.cantidad > 1) item.cantidad--
      else this.eliminar(item)
    },

    eliminar (item) {
      this.carrito = this.carrito.filter(p => p.producto_id !== item.producto_id)
    },

    async finalizarVenta () {

      //  Validaciones frontend
      if (this.carrito.length === 0) {
        return Swal.fire('Error', 'No hay productos en el carrito', 'warning')
      }

      if (!this.monto_pagado || this.monto_pagado <= 0) {
        return Swal.fire('Error', 'Ingresa el monto pagado', 'warning')
      }

      if (this.monto_pagado < this.total) {
        return Swal.fire(
          'Pago insuficiente',
          `El total es $${this.total.toFixed(2)} y estás pagando $${this.monto_pagado}`,
          'error'
        )
      }

      const token = localStorage.getItem('token')

      try {
        const payload = {
          metodo_pago: 'efectivo',
          monto_pagado: this.monto_pagado,
          items: this.carrito.map(i => ({
            producto_id: i.producto_id,
            cantidad: i.cantidad,
            precio_unitario: i.precio
          }))
        }

        const res = await axios.post(this.URL('ventas'), payload, {
          headers: { Authorization: `Bearer ${token}` }
        })

        Swal.fire(
          'Éxito',
          res.data.message || 'Venta realizada correctamente',
          'success'
        )

        // Reset
        this.carrito = []
        this.monto_pagado = 0

      } catch (error) {
        Swal.fire(
          'Error',
          error.response?.data?.message || 'No se pudo procesar la venta',
          'error'
        )
      }
    }
  }
}
</script>