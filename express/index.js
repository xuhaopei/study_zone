const Express = require('express')
const bodyParser = require('body-parser')
const path =require('path')
const app = Express();
const os = require('os')
const fs = require('fs');
// 创建 application/json 解析
var jsonParser = bodyParser.json()

// 创建 application/x-www-form-urlencoded 解析
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const getIPAdress = () => {
  let interfaces = os.networkInterfaces()
  for (let devName in interfaces) {
    let iface = interfaces[devName]
    for (let i = 0; i < iface.length; i++) {
      let alias = iface[i]
      if (
        alias.family === 'IPv4' &&
        alias.address !== '127.0.0.1' &&
        !alias.internal
      ) {
        return alias.address
      }
    }
  }
}
app.use(Express.static(path.resolve(__dirname,'./dist/')))

app.get('/*',(req,res)=>{
  res.setHeader('Content-Type','text/html')
  res.setHeader('Set-Cookie','username=xuhaopei')
  res.sendFile(path.resolve(__dirname,'./dist/index.html'))
})
app.get('/c',(req,res)=>{
  res.setHeader('Content-Type','text/html')
  res.setHeader('Set-Cookie','username=xuhaopei')
  res.sendFile(path.resolve(__dirname,'./dist/index.html'))
})
app.post('/a',urlencodedParser, (req,res)=>{
  console.log('/a', req.body)
  res.setHeader('Content-Type','text/html')
  res.setHeader('Set-Cookie','username=xuhaopei')
  res.sendFile(path.resolve(__dirname,'./dist/index.html'))
})
app.get('/b',(req,res)=>{
  console.log('/b',req.query)
})
const port = 8080
app.listen(port, () => {
    console.log(`http://${getIPAdress()}:${port}`)
})