var fs = require('fs')

// 通过path读
fs.readFile('./1.txt', (err, data) => {
    if (err) {
        return console.error(err)
    }
    console.log('readFile：', data)
})

// 通过path写
const writeFilePath = `./writeFile_${new Date().getTime()}.txt`
const writeFileData = '我是通 过fs.writeFile 写入文件的内容' + path
fs.writeFile(writeFilePath, writeFileData, (err) => {
    if (err) {
        return console.error(err)
    }
    console.log('writeFile: 写入成功')
})
// 此方法可以用来打开文件， 设置打开后的文件权限，当打开完成后会获得一个fd(文件描述符), 为后面 调用 fs.read、fs.write做准备。
// https://www.runoob.com/nodejs/nodejs-fs.html
// r	以读取模式打开文件。如果文件不存在抛出异常。
// r+	以读写模式打开文件。如果文件不存在抛出异常。
// rs	以同步的方式读取文件。
// rs+	以同步的方式读取和写入文件。
// w	以写入模式打开文件，如果文件不存在则创建。
// wx	类似 'w'，但是如果文件路径存在，则文件写入失败。
// w+	以读写模式打开文件，如果文件不存在则创建。
// wx+	类似 'w+'， 但是如果文件路径存在，则文件读写失败。
// a	以追加模式打开文件，如果文件不存在则创建。
// ax	类似 'a'， 但是如果文件路径存在，则文件追加失败。
// a+	以读取追加模式打开文件，如果文件不存在则创建。
// ax+	类似 'a+'， 但是如果文件路径存在，则文件读取追加失败。
fs.open('./open_r.txt', 'r', (err, fd) => {
    if (err) {
        return console.error(err)
    }

})