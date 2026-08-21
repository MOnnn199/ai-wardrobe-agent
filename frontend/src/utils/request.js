// uni-app 请求封装：统一 /api 前缀（H5 走 vite 代理到 localhost:8000）
const BASE = '/api'

function request(method, url, data = {}, options = {}) {
  const token = uni.getStorageSync('token')
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE + url,
      method,
      data,
      header: Object.assign(
        { 'Content-Type': 'application/json' },
        token ? { Authorization: 'Bearer ' + token } : {},
        options.header || {}
      ),
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // uni-app H5 可能把 res.data 包成只读 Proxy，深拷贝剥离，避免 Vue 响应式化时报错
          try {
            resolve(JSON.parse(JSON.stringify(res.data)))
          } catch (e) {
            resolve(res.data)
          }
        } else {
          reject(res)
        }
      },
      fail: (err) => reject(err)
    })
  })
}

export function get(url, params) {
  let u = url
  if (params && Object.keys(params).length) {
    const qs = Object.keys(params)
      .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&')
    u += (u.indexOf('?') > -1 ? '&' : '?') + qs
  }
  return request('GET', u)
}

export function post(url, data, options) {
  return request('POST', url, data, options)
}

export function del(url, data) {
  return request('DELETE', url, data)
}

export function put(url, data, options) {
  return request('PUT', url, data, options)
}

// 文件上传（图片），filePath 为本地临时路径
export function upload(url, filePath, name = 'file', formData = {}) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: BASE + url,
      filePath,
      name,
      formData,
      header: token ? { Authorization: 'Bearer ' + token } : {},
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(res.data))
          } catch (e) {
            resolve(res.data)
          }
        } else {
          reject(res)
        }
      },
      fail: (err) => reject(err)
    })
  })
}
