import { createRouter, createWebHistory } from 'vue-router'

// 角色 -> URL 路径前缀
// 注意：配置端的账号角色是 'admin'，但前端路径前缀是 'config'，两者必须解耦，
// 否则用 role 拼路径会变成 '/admin' 这类不存在的地址，导致白屏。
const PREFIX = { stylist: 'stylist', admin: 'config' }

const routes = [
  { path: '/', redirect: '/login' },
  {
    // 合并后的统一登录页：页面内用身份选择切换 stylist / admin
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/stylist',
    name: 'Stylist',
    component: () => import('../views/stylist/Index.vue'),
    meta: { role: 'stylist', prefix: 'stylist', requiresAuth: true }
  },
  {
    path: '/config',
    name: 'Config',
    component: () => import('../views/config/Index.vue'),
    meta: { role: 'admin', prefix: 'config', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  // 登录态存在 sessionStorage（重新打开网页即自动清空）
  const token = sessionStorage.getItem('web_token')
  const role = sessionStorage.getItem('web_role')

  if (to.path === '/login') {
    // 已登录用户访问登录页 -> 直接进自己角色的主页
    if (token && role) {
      next('/' + (PREFIX[role] || 'stylist'))
    } else {
      next()
    }
    return
  }

  if (to.meta.requiresAuth) {
    if (!token) {
      next('/login')
    } else if (role !== to.meta.role) {
      // 已登录但角色不匹配（比如用 admin 账号访问 /stylist）-> 回登录页
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
