<template>
  <v-toolbar dark color="primary">
    
    <v-toolbar-title>
      {{ titulo }}
      <span v-if="id" class="ml-2 subtitle-2">#{{ id }}</span>
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <!-- Guardar -->
    <v-btn
      v-if="guardar !== undefined"
      text
      dark
      @click="$emit('guardar')"
    >
      <v-icon left>mdi-content-save</v-icon>
      Guardar
    </v-btn>

    <v-menu bottom  left offset-y max-height="400" width="300px" v-if="modelo != '' && modelo != undefined && id != undefined && id != null" :close-on-content-click="false" :close-on-click="true" class="d-flex align-center">
        <template v-slot:activator="{ on, attrs }">
            <v-btn dark icon v-bind="attrs" v-on="on" @click="mostrarLog()">
            <v-icon>mdi-message-bulleted</v-icon>
            </v-btn>
        </template>
        
        <v-card class="elevation-2" min-width="280px"> 
            <v-card-text> 
            <v-list-item>
                <div class="d-flex align-center" style="flex-grow: 1;">
                <v-textarea
                    dense
                    v-model="registro_log"
                    label="Log"
                    rows="2"
                    auto-grow
                    style="flex-grow: 1; width: 100%;" 
                ></v-textarea>
                <v-btn 
                    dense
                    icon 
                    class="px-0"
                    :color="registro_log ? 'green' : 'gray'"
                    @click="guardarLog(item)"
                >
                    <v-icon>mdi-check-circle</v-icon>
                </v-btn>
                </div>
            </v-list-item>
            <v-list-item v-for="e in logs" :key="e.id">
                <v-list-item-avatar>
                <img :src="e.user?.foto">
                </v-list-item-avatar>

                <v-list-item-content>
                <v-list-item-title
                    class="text-wrap"
                    style="white-space: normal; word-break: break-word;"
                >
                    {{ e.user.name }} el {{ e.created_at | formatFecha }}
                </v-list-item-title>
                <v-list-item-subtitle
                    class="text-wrap"
                    style="white-space: normal; word-break: break-word;"
                >
                    {{ e.tipo_log }} 
                    <v-icon>mdi-arrow-right-bold</v-icon> 
                    {{ e.log }}
                </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>
            </v-card-text>
        </v-card>
    </v-menu>

    <!-- Cerrar -->
    <v-btn icon dark @click="$emit('cerrar')">
      <v-icon>mdi-close</v-icon>
    </v-btn>

  </v-toolbar>
</template>

<script>
import axios from 'axios'
import Swal from 'sweetalert2'
export default {
  name: "SToolbarModal",

  props: {
    titulo: String,
    id: [Number, String],
    guardar: Boolean,
    modelo: String,
    permiso: {
    type: Object,
    default: null
  }
  },

  data() {
    return {
      registro_log: '',
      logs: []
    }
  },
  computed:{
    URL(){
        return (endpoint,params='') => `${process.env.VUE_APP_API_URL}${endpoint}${params}`
      },
    esNuevo() {
        return !this.id
    },

    puedeGuardar() {
        if (!this.permiso) return true
        return this.esNuevo
        ? this.permiso.nuevo
        : this.permiso.editar
    },

    puedeEliminar() {
        if (!this.permiso) return true
        return this.permiso.eliminar
    }
    },
    methods: {
        mostrarLog() {
            if (this.modelo != undefined && this.modelo != null) this.getLogs(this.modelo);  
        },
        getLogs(m){
            const token = localStorage.getItem('token')
            axios.get(
                this.URL(`/logs?tabla=${m}&documento_id=${this.id}`),
                {
                headers:{
                    Authorization:`Bearer ${token}`
                }
                }
            )
            .then(response=>{
                this.logs = response.data
            })
            .catch(err=>{
                console.error(err)
            })
        },

        //guardar log
        guardarLog(){
            const token = localStorage.getItem('token')
            if(!this.registro_log || this.registro_log=='')return;

            let data={
                tabla:this.modelo,
                documento_id:this.id,
                log:this.registro_log,
                tipo_log:'Notas'
            };

            axios 
                .post(
                this.URL(`/logs?tabla=${this.modelo}`),
                data,
                {
                headers:{
                    Authorization:`Bearer ${token}`
                }
                }
            )
            .then(response => {
            swal.fire({
            icon: "success", 
            title: "Log guardado con exito",
            timer: "1000"});
            this.registro_log='';
            this.getLogs(this.modelo);
            this.$forceUpdate();
            }).catch(this.MSGBOX);
        }
    }
}
</script>

<style scoped>
.subtitle-2{
  opacity: 0.7;
}
</style>