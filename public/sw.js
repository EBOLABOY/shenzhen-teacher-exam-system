const CACHE_NAME = 'teacher-exam-system-v1.0.0'
const STATIC_CACHE_NAME = 'teacher-exam-static-v1.0.0'
const DYNAMIC_CACHE_NAME = 'teacher-exam-dynamic-v1.0.0'

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/practice',
  '/wrong-questions',
  '/exams',
  '/dashboard',
  '/manifest.json',
  // 添加关键的CSS和JS文件（Next.js会自动生成）
]

// 需要缓存的API路由
const API_ROUTES = [
  '/api/questions',
  '/api/wrong-questions',
  '/api/practice-tasks',
  '/api/user-progress'
]

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // 跳过非GET请求
  if (request.method !== 'GET') {
    return
  }
  
  // 跳过Chrome扩展请求
  if (url.protocol === 'chrome-extension:') {
    return
  }
  
  // 处理API请求
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }
  
  // 处理静态资源和页面请求
  event.respondWith(handleStaticRequest(request))
})

// 处理API请求 - 网络优先策略
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // 尝试网络请求
    const networkResponse = await fetch(request)
    
    // 如果是可缓存的API路由，缓存响应
    if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for', request.url)
    
    // 网络失败，尝试从缓存获取
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 如果是题目相关的API，返回离线提示
    if (url.pathname.includes('/api/questions')) {
      return new Response(
        JSON.stringify({
          error: '网络连接失败，请检查网络后重试',
          offline: true
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    throw error
  }
}

// 处理静态资源请求 - 缓存优先策略
async function handleStaticRequest(request) {
  try {
    // 先尝试从缓存获取
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 缓存中没有，尝试网络请求
    const networkResponse = await fetch(request)
    
    // 缓存成功的响应
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Failed to fetch', request.url)
    
    // 如果是页面请求，返回离线页面
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/')
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
    throw error
  }
}

// 后台同步事件
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag)
  
  if (event.tag === 'sync-answers') {
    event.waitUntil(syncAnswers())
  }
})

// 同步用户答题数据
async function syncAnswers() {
  try {
    // 这里可以实现离线答题数据的同步逻辑
    console.log('Service Worker: Syncing answers...')
  } catch (error) {
    console.error('Service Worker: Failed to sync answers', error)
  }
}

// 推送通知事件
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body || '您有新的学习提醒',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: '立即查看',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: '稍后提醒'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || '教师考编练习', options)
  )
})

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  }
})
