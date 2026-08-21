import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/user' },
  { path: '/user', name: 'User', component: () => import('../views/user/Index.vue') },
  { path: '/stylist', name: 'Stylist', component: () => import('../views/stylist/Index.vue') },
  { path: '/config', name: 'Config', component: () => import('../views/config/Index.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes
})
