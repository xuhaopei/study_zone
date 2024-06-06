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

app.get('/',(req,res)=>{
  res.setHeader('Content-Type','text/html')
  res.setHeader('Set-Cookie','username=xuhaopei')
  res.sendFile(path.resolve(__dirname,'./dist/index.html'))
})
app.get('/c',(req,res)=>{
  res.setHeader('Content-Type','text/html')
  res.setHeader('Set-Cookie','username=xuhaopei')
  res.sendFile(path.resolve(__dirname,'./dist/index.html'))
})
app.get('/heart',(req,res)=>{
  console.log('heart')
  res.send('heart')
})
app.post('/a',urlencodedParser, (req,res)=>{
  console.log('/a', req.body)
  res.setHeader('Content-Type','text/html')
  res.setHeader('Set-Cookie','username=xuhaopei')
  res.sendFile(path.resolve(__dirname,'./dist/index.html'))
})
app.get('/b',(req,res)=>{
  console.log('/b',req.query)
  res.send('hhhh')
})

// 动态生成webmanifest文件，根据参数进行动态变化。
app.get('/askWebmanifest',(req,res)=>{
  const stringData = JSON.stringify({
    name: "Pooke2",
    short_name: "Pooke",
    icons: [
      {
        src:"https://upload.wikimedia.org/wikipedia/commons/5/5c/Bml_x_512_y_512_p_31_iterated_32000.png",
        type: "image/png",
        sizes: "512x512"
      }
   ],
     theme_color: "#232227",
     background_color: "#232227",
     start_url: `./?op=${req.query['op']}`,
     display: "standalone"
 })
  res.setHeader('Content-Type', 'application/manifest+json');
  res.send(stringData);
})
const port = 9001
app.listen(port, () => {
    console.log(`http://${getIPAdress()}:${port}`)
})