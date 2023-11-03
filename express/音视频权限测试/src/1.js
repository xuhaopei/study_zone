function getUserMedia() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(function (stream) {
            // 用户授予了权限
        })
        .catch(function (error) {
            console.error(error)
            alert('权限关闭了')
            if (error.name === 'NotAllowedError') {
                // 用户之前拒绝了权限，现在再次请求权限
                // 这里触发新的权限请求
            } else {
                // 处理其他错误
            }
        })

}