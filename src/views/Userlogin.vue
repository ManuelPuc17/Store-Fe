<template>
  
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card elevation="10">
          <v-card-title class="justify-center text-h6">
            Iniciar Sesión
          </v-card-title>

          <v-card-text>
            <v-alert
              v-if="error"
              type="error"
              dense
              dismissible
              @input="clearError"
            >
              {{ error }}
            </v-alert>

            <v-form
              ref="loginForm"
              v-model="valid"
              lazy-validation
              @submit.prevent="handleLogin"
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
export default {
  name: 'UserLogin',
  data () {
    return {
      valid: false,
      email: '',
      password: '',
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
      }
    }
  },
  computed: {
    loading () {
      return this.$store.state.auth.loading
    },
    error () {
      return this.$store.state.auth.error
    }
  },
  methods: {
    async handleLogin () {
      this.errors = { email: [], password: [] }

      try {
        await this.$store.dispatch('auth/login', this.form)
        this.$router.push('/dashboard')
      } catch (error) {
        if (error.response?.data?.errors) {
          this.errors = error.response.data.errors
        }
      }
    },
    clearError () {
      this.$store.commit('auth/CLEAR_ERROR')
    }
  }
}
</script>

<style scoped>
</style>