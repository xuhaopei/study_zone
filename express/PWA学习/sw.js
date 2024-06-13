const version = 'v10'

// 要求立即激活新的sw代码，如果不这么做的话，网页会一直使用旧的sw代码，这是更新sw的关键。
skipWaiting()

// install 事件会在注册成功完成之后触发. install 事件通常会这样用，将离线运行 app 产生的资源放置在浏览器离线缓存的空间。
// 当再次打开此网站的时候，因为sw已经注册完成了，不会再次触发了。
self.addEventListener("install", event => {
    const addResourcesToCache = async (resources) => {
        const cache = await caches.open(version)
        await cache.addAll(resources)
        console.log(version + 'install时缓存的数据：', resources)
    }


    console.log(version + "install事件 ==============")
    event.waitUntil(
        // 很傻逼，如果里面的路径有一个是错误的，那么里面的所有缓存都会失效,不会触发addResourcesToCache方法。
        addResourcesToCache([
            "https://img2.baidu.com/it/u=4259428193,1811830338&fm=253&app=138&size=w931&n=0&f=JPEG&fmt=auto?sec=1717261200&t=8fbfd2c76aad0477824ae2e4f39504a3",
            'https://img1.baidu.com/it/u=3625321707,2122786913&fm=253&app=138&size=w931&n=0&f=JPEG&fmt=auto?sec=1717261200&t=0d361ad1f4c3d4b8e5da0c3fea9b4fa4'
        ]),
    )
})

// 新安装的 service worker 将收到 activate 事件, 主要用途是去清理 service worker 之前版本使用的资源。 配合skipWaiting使用，浏览器会识别到有新的service worker（也就是这里的代码更新）需要执行
self.addEventListener("activate", event => {
    const deleteCache = async (key) => {
        console.log('删除缓存的版本', key)
        await caches.delete(key)
    }

    const deleteOldCaches = async () => {
        const cacheKeepList = [version]
        const keyList = await caches.keys()
        const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key))
        await Promise.all(cachesToDelete.map(deleteCache))
    }


    console.log(version + "activate 事件 =======================")
    event.waitUntil(deleteOldCaches())
    
})


// 每次获取 service worker 控制的资源时，都会触发 fetch 事件，这些资源包括了指定的作用域内的文档，和这些文档内引用的其他任何资源
self.addEventListener("fetch", event => {
    const putInCache = async (request, response) => {
        const cache = await caches.open(version)
        await cache.put(request, response)
    }
    const cacheFirst = async (request) => {
        const responseFromCache = await caches.match(request)
        if (responseFromCache) {
            console.log('缓存的数据', request.url)
            return responseFromCache
        }
        console.log('网络的数据', request.url)
        const reponseFromNetWork = await fetch(request)
        // putInCache(request, reponseFromNetWork.clone()) 这里会把index.html也给缓存住，导致html更新失效哦
        return reponseFromNetWork
    }


    console.log(version + 'fetch事件=====================================')
    event.respondWith(cacheFirst(event.request))
})

