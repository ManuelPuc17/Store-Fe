<template>
  <div>
    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar"
      :color="color"
      bottom
      right
    >
      {{ text }}
    </v-snackbar>
  </div>
</template>

<script>
export default {
  data () {
    return {
      snackbar: false,
      text: '',
      color: 'success'
    }
  },

  methods: {
    show (message, type = 'success') {
      this.text = message
      this.color = type
      this.snackbar = true
    }
  }
}
</script>