let http = require('http')
var fs = require('fs')
var url = require('url')
var path = require('path')
let util = require('../util/index')
const port = 8088
const mime = {
    'html': 'text/html; chartset=utf-8', // 如果html设置了chartset=utf-8，那么后面的css与js都会以它为标准来设置字符编码 
    'js': 'text/javascript',
    'css': 'text/css',
    'jpg': 'image/jpg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
}
http.createServer((request, response) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'text/html; chartset=utf-8' })
        response.end('<h1>405 method not allow</h1>')
        return
    }
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
            response.writeHead(404, { 'Content-Type': 'text/html; chartset=utf-8' })
            //  发送响应数据
            response.end('<h1>404 NOT Found</h1>')
        } else {
            // HTTP 状态码: 200 : OK
            // 根据文件类型设置对应的响应头与内容
            let type = staticPath.split('.')[1]
            response.writeHead(200, { 'Content-Type': mime[type]})
            //  发送响应数据
            response.end(data)
        }
    })
}).listen(port)

console.log(`http://${util.getIPAdress()}:${port}`)