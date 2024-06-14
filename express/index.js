const Express = require('express')
const bodyParser = require('body-parser')
const path =require('path')
const app = Express();
const os = require('os')
const fs = require('fs');
const axios = require('axios');
// 创建 application/json 解析
var jsonParser = bodyParser.json()

// 添加node反向代理
const { createProxyMiddleware } = require('http-proxy-middleware');
// app.use(
//   '/express1',
//   createProxyMiddleware({
//     target: 'http://192.168.24.82:9002/express1',
//     changeOrigin: true,
//   }),
// );
app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://testservice.pooke.com/api',
    changeOrigin: true,
  }),
);

// 参考资料https://www.misterma.com/archives/934/
// 设置上传文件的存储位置
const multer = require('multer');
const upload = multer({dest: path.join(__dirname, 'upload')});
app.post('/upload',upload.single('file'), (req,res)=>{
  // 获取文件信息
  const fileInfo = req.file;
  // 把文件重命名为原来的文件名
  fs.renameSync(
    fileInfo.path,
    path.join(__dirname, 'upload', fileInfo.originalname)
  );
  res.redirect('/')
})
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

// http://192.168.24.78:9001/index.html
app.use(Express.static(path.resolve(__dirname,'./dist/')))

// 配置下载文件的文件夹路径
// http://192.168.24.78:9001/download/index.html
app.use('/download',Express.static(path.resolve(__dirname,'./download/')))

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