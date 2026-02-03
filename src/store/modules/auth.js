import authService from '@/services/auth'

const state = {
  user: null,
  token: null,
  loading: false,
  error: null
}

const getters = {
  isAuthenticated: state => !!state.token,
  getUser: state => state.user,
  getToken: state => state.token,
  getError: state => state.error
}

const mutations = {
  SET_USER (state, user) {
    state.user = user
  },
  SET_TOKEN (state, token) {
    state.token = token
  },
  SET_LOADING (state, loading) {
    state.loading = loading
  },
  SET_ERROR (state, error) {
    state.error = error
  },
  CLEAR_ERROR (state) {
    state.error = null
  },
  LOGOUT (state) {
    state.user = null
    state.token = null
  }
}

const actions = {
  async login ({ commit }, credentials) {
    commit('SET_LOADING', true)
    commit('CLEAR_ERROR')

    try {
      const response = await authService.login(credentials)
      const { token, user } = response.data

      commit('SET_TOKEN', token)
      commit('SET_USER', user)
      authService.setToken(token)

      return response.data
    } catch (error) {
      const message = error.response?.data?.message || error.message
      commit('SET_ERROR', message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async register ({ commit }, userData) {
    commit('SET_LOADING', true)
    commit('CLEAR_ERROR')

    try {
      const response = await authService.register(userData)
      const { token, user } = response.data

      commit('SET_TOKEN', token)
      commit('SET_USER', user)
      authService.setToken(token)

      return response.data
    } catch (error) {
      const message = error.response?.data?.message || error.message
      commit('SET_ERROR', message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchCurrentUser ({ commit }) {
    try {
      const response = await authService.getCurrentUser()
      commit('SET_USER', response.data)
      return response.data
    } catch (error) {
      commit('LOGOUT')
      authService.removeToken()
      throw error
    }
  },

  async logout ({ commit }) {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Error durante logout:', error)
    } finally {
      commit('LOGOUT')
      authService.removeToken()
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}