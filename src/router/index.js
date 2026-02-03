import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'

Vue.use(VueRouter)

const routes = [
  {
      path: '/',
      redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Userlogin.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Userregister.vue'),
    meta: { requiresAuth: false }
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = store.getters['auth/isAuthenticated']

  if (requiresAuth) {
    if (!isAuthenticated) {
      next('/login')
    } else {
      try {
        // Verificar si el token aún es válido
        if (!store.state.auth.user) {
          await store.dispatch('auth/fetchCurrentUser')
        }
        next()
      } catch (error) {
        next('/login')
      }
    }
  } else if (isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router