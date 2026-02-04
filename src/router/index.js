import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  // Rutas de autenticación (sin layout)
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

  // Rutas principales con Layout único (pero menú jerárquico)
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },

  // RESTAURANTE - Rutas bajo el mismo layout
  {
    path: '/restaurante/mesas/gestion',
    name: 'Mesas',
    component: () => import('@/views/Restaurante/Mesas/GestionMesa.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/restaurante/mesas/nuevo',
    name: 'NuevaMesa',
    component: () => import('@/views/Restaurante/Mesas/s-dialog-mesas.vue'),
    meta: { requiresAuth: true }
  },

  // INVENTARIO - Rutas bajo el mismo layout

  // Ruta por defecto
  {
    path: '/',
    redirect: '/dashboard'
  },

  // // Rutas no encontradas
  // {
  //   path: '*',
  //   redirect: '/login'
  // }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// Protección de rutas
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (!requiresAuth) {
    next()
  } else if (token) {
    next()
  } else {
    next('/login')
  }
})

export default router