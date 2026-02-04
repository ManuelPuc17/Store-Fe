<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card elevation="10">
          <v-card-title class="justify-center text-h6">
            Iniciar Sesión
          </v-card-title>

          <v-card-text>

            <v-form
              ref="loginForm"
              v-model="valid"
              lazy-validation
              @submit.prevent="IniciarSesion"
            >
              <v-text-field
                v-model="form.email"
                label="Email"
                type="email"
                outlined
                prepend-icon="mdi-email"
                :rules="emailRules"
                required
              />

              <v-text-field
                v-model="form.password"
                label="Contraseña"
                type="password"
                outlined
                prepend-icon="mdi-lock"
                :rules="passwordRules"
                required
              />

              <v-btn
                color="primary"
                block
                large
                type="submit"
                :loading="loading"
                :disabled="!valid || loading"
                class="mt-4"
              >
                Ingresar
              </v-btn>
            </v-form>

            <v-divider class="my-4" />

            <p class="text-center">
              ¿No tienes cuenta?
              <router-link to="/register">Regístrate aquí</router-link>
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from 'axios'
import Swal from 'sweetalert2'

export default {
  name: 'UserLogin',
  data () {
    return {
      valid: false,
      loading: false,
      error: null,
      emailRules: [
        v => !!v || 'El email es requerido',
        v => /.+@.+\..+/.test(v) || 'Email inválido'
      ],
      passwordRules: [
        v => !!v || 'La contraseña es requerida',
        v => v.length >= 6 || 'Mínimo 6 caracteres'
      ],
      form: {
        email: '',
        password: ''
      },
      errors: {
        email: [],
        password: []
      },
    }
  },
  computed: {
    URL () {
      return (endpoint) => `${process.env.VUE_APP_API_URL}/${endpoint}`
    }
  },
  methods: {
    IniciarSesion () {
      if (this.$refs.loginForm.validate()) {
        this.loading = true
        axios
          .post(this.URL('auth/login'), this.form)
          .then((response) => {
            localStorage.setItem('token', response.data.token)
            Swal.fire({
              title: 'Acceso Autorizado',
              text: 'Inicio de sesión correcto',
              icon: 'success',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              this.$router.push('/dashboard')
            })
          })
          .catch((error) => {
            Swal.fire({
              title: 'Error',
              text: error.response?.data?.message || 'Error en el inicio de sesión',
              icon: 'error',
              confirmButtonText: 'Reintentar'
            })
            this.error = error.response?.data?.message || 'Error al iniciar sesión'
          })
          .finally(() => {
            this.loading = false
          })
      }
    },
    clearError () {
      this.error = null
    }
  }
}
</script>

<style scoped>

</style>