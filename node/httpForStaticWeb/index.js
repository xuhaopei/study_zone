let http = require('http')
var fs = require('fs')
var url = require('url')
var path = require('path')
let util = require('../util/index')
const port = 8088
http.createServer((request, response) => {
    // 解析请求，包括文件名
    var pathname = url.parse(request.url).pathname
    // 输出请求的文件名
    console.log("Request for " + pathname + " received.")

    // 获取文件路径
    var staticPath = path.resolve(__dirname, `./dist${pathname}`)
    // 从文件系统中读取请求的文件内容
    fs.readFile(staticPath, function (err, data) {
        if (err) {
            console.log(err)
            // HTTP 状态码: 404 : NOT FOUND
            // Content Type: text/html
            response.writeHead(404, { 'Content-Type': 'text/html' })
        } else {
            // HTTP 状态码: 200 : OK
            // 根据文件类型设置对应的响应头与内容
            let type = staticPath.split('.')[1]
            switch (type) {
                case 'html':
                    response.writeHead(200, { 'Content-Type': 'text/html' })
                    response.write(data.toString())
                    break
                case 'js':
                    response.writeHead(200, { 'Content-Type': 'text/javascript' })
                    response.write(data.toString())
                    break
                case 'css':
                    response.writeHead(200, { 'Content-Type': 'text/css' })
                    response.write(data.toString())
                    break
                case 'jpg':
                    contentType = 'image/jpg'
                    break
                case 'jpeg':
                    response.writeHead(200, { 'Content-Type': 'image/jpeg' })
                    response.write(data, 'binary')
                    break
                case 'png':
                    contentType = 'image/png'
                    break
                case 'gif':
                    contentType = 'image/gif'
                    break
                case 'svg':
                    contentType = 'image/svg'
                    break
            }
        }
        //  发送响应数据
        response.end()
    })
}).listen(port)

console.log(`http://${util.getIPAdress()}:${port}`)