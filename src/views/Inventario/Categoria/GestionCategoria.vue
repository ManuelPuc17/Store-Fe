<template>
  <v-app>
    <v-container fluid>

      <CategoriaDialog
        ref="dialog"
        @guardado="getCategorias"
      />

      <v-data-table
        :headers="headers"
        :items="categorias"
        :loading="loading"
        item-key="id"
        class="elevation-1"
      >
        <template v-slot:top>
          <v-toolbar flat color="primary" dark>
            <v-toolbar-title>Categorías</v-toolbar-title>
            <v-spacer></v-spacer>

            <v-btn color="white" @click="$refs.dialog.abrir()">
              <v-icon color="primary">mdi-plus</v-icon>
            </v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item.estatus="{ item }">
          <v-chip
            :color="item.estatus ? 'success' : 'error'"
            small
            dark
          >
            {{ item.estatus ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon small color="primary" @click="$refs.dialog.abrir(item)">
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>
        </template>

      </v-data-table>

    </v-container>
  </v-app>
</template>

<script>
import axios from 'axios'
import Swal from 'sweetalert2'
import CategoriaDialog from './CategoriaDialog.vue'

export default {
  components: { CategoriaDialog },

  data () {
    return {
      categorias: [],
      loading: false,
      headers: [
        { text: 'Nombre', value: 'nombre' },
        { text: 'Descripción', value: 'descripcion' },
        { text: 'Estatus', value: 'estatus' },
        { text: 'Acciones', value: 'actions', sortable: false }
      ]
    }
  },

  computed: {
    URL () {
      return endpoint => `${process.env.VUE_APP_API_URL}/${endpoint}`
    }
  },

  mounted () {
    this.getCategorias()
  },

  methods: {
    async getCategorias () {
      this.loading = true
      const token = localStorage.getItem('token')

      try {
        const res = await axios.get(this.URL('categorias'), {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.categorias = res.data.data || res.data
      } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar las categorías', 'error')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>