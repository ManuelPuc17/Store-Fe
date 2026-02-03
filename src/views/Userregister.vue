<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-10">
          <v-card-title class="text-center">
            Registrarse
          </v-card-title>

          <v-card-text>
            <v-alert v-if="error" type="error" dismissible @input="clearError">
              {{ error }}
            </v-alert>

            <v-form @submit.prevent="handleRegister">
              <v-text-field
                v-model="form.name"
                label="Nombre"
                outlined
                required
                :error-messages="errors.name"
              ></v-text-field>

              <v-text-field
                v-model="form.email"
                label="Email"
                type="email"
                outlined
                required
                :error-messages="errors.email"
              ></v-text-field>

              <v-text-field
                v-model="form.password"
                label="Contraseña"
                type="password"
                outlined
                required
                :error-messages="errors.password"
              ></v-text-field>

              <v-text-field
                v-model="form.password_confirmation"
                label="Confirmar Contraseña"
                type="password"
                outlined
                required
              ></v-text-field>

              <v-btn
                color="primary"
                block
                type="submit"
                :loading="loading"
              >
                Registrarse
              </v-btn>
            </v-form>

            <v-divider class="my-4"></v-divider>

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
export default {
  name: 'UserRegister',
  data () {
    return {
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
    loading () {
      return this.$store.state.auth.loading
    },
    error () {
      return this.$store.state.auth.error
    }
  },
  methods: {
    async handleRegister () {
      this.errors = { name: [], email: [], password: [] }

      try {
        await this.$store.dispatch('auth/register', this.form)
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
a {
  text-decoration: none;
  color: #1976d2;
}
</style>