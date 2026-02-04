<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card elevation="10">
          <v-card-title class="justify-center text-h6">
            Registrarse
          </v-card-title>

          <v-card-text>


            <v-form
              ref="registerForm"
              v-model="valid"
              lazy-validation
              @submit.prevent="RegistroUsuario"
            >
              <v-text-field
                v-model="form.name"
                label="Nombre Completo"
                outlined
                prepend-icon="mdi-account"
                :rules="nameRules"
                required
              />

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

              <v-text-field
                v-model="form.password_confirmation"
                label="Confirmar Contraseña"
                type="password"
                outlined
                prepend-icon="mdi-lock-check"
                :rules="confirmPasswordRules"
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
                Registrarse
              </v-btn>
            </v-form>

            <v-divider class="my-4" />

            <p class="text-center">
              ¿Ya tienes cuenta?
              <router-link to="/login">Inicia sesión aquí</router-link>
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
  name: 'UserRegister',
  data () {
    return {
      valid: false,
      loading: false,
      error: null,
      nameRules: [
        v => !!v || 'El nombre es requerido',
        v => v.length >= 3 || 'Mínimo 3 caracteres'
      ],
      emailRules: [
        v => !!v || 'El email es requerido',
        v => /.+@.+\..+/.test(v) || 'Email inválido'
      ],
      passwordRules: [
        v => !!v || 'La contraseña es requerida',
        v => v.length >= 8 || 'Mínimo 8 caracteres'
      ],
      confirmPasswordRules: [
        v => !!v || 'Confirma tu contraseña',
        v => v === this.form.password || 'Las contraseñas no coinciden'
      ],
      form: {
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
      },
      errors: {
        name: [],
        email: [],
        password: []
      }
    }
  },
  computed: {
    URL () {
      return (endpoint) => `${process.env.VUE_APP_API_URL}/${endpoint}`
    }
  },
  methods: {
    RegistroUsuario () {
      if (this.$refs.registerForm.validate()) {
        this.loading = true
        axios
          .post(this.URL('auth/register'), this.form)
          .then((response) => {
            localStorage.setItem('token', response.data.token)
            Swal.fire({
              title: 'Registro Exitoso',
              text: 'Tu cuenta ha sido creada correctamente',
              icon: 'success',
              confirmButtonText: 'Continuar'
            }).then(() => {
              this.$router.push('/dashboard')
            })
          })
          .catch((error) => {
            Swal.fire({
              title: 'Error',
              text: error.response?.data?.message || 'Error en el registro',
              icon: 'error',
              confirmButtonText: 'Reintentar'
            })
            this.error = error.response?.data?.message || 'Error al registrarse'
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