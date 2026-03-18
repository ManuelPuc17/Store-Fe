import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'

import VueSweetalert2 from 'vue-sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

Vue.config.productionTip = false

Vue.use(VueSweetalert2)

// MENSAJES GLOBALES
Vue.prototype.$msg = {

  success (msg) {
    Vue.prototype.$swal({
      title: 'Éxito',
      text: msg,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
  },

  error (msg) {
    Vue.prototype.$swal({
      title: 'Error',
      text: msg,
      icon: 'error',
      confirmButtonText: 'Aceptar'
    })
  },

  warning (msg) {
    Vue.prototype.$swal({
      title: 'Atención',
      text: msg,
      icon: 'warning'
    })
  },

  confirm (msg) {
    return Vue.prototype.$swal({
      title: 'Confirmar',
      text: msg,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    })
  }
}

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')