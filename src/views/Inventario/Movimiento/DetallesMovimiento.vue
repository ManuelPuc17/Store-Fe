<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>Detalle del Movimiento</v-card-title>

      <v-card-text v-if="movimiento">
        <p><strong>Producto:</strong> {{ movimiento.producto?.nombre }}</p>
        <p><strong>Tipo:</strong> {{ movimiento.tipo_movimiento }}</p>
        <p><strong>Especificación:</strong> {{ movimiento.descripcion }}</p>
        <p><strong>Cantidad:</strong> {{ movimiento.cantidad }}</p>
        <p><strong>Stock anterior:</strong> {{ movimiento.stock_anterior }}</p>
        <p><strong>Stock nuevo:</strong> {{ movimiento.stock_nuevo }}</p>
        <p><strong>Usuario:</strong> {{ movimiento.usuario?.name }}</p>
        <p><strong>Fecha:</strong> {{ formatFecha(movimiento.created_at) }}</p>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="dialog = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  data () {
    return {
      dialog: false,
      movimiento: null
    }
  },
  methods: {
    abrir (item) {
      this.movimiento = item
      this.dialog = true
    },
    formatFecha (fecha) {
      return new Date(fecha).toLocaleString()
    }
  }
}
</script>