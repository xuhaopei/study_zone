// 资料来源：https://www.runoob.com/nodejs/nodejs-fs.html

var fs = require('fs')

/*****文件打开与关闭相关操作*****/
// 有打开就必须有关闭
// fs.open(path, flags[, mode], callback) callback(err, fd)
// fs.close(fd, callback) callback()
// 此方法可以用来打开文件， 设置打开后的文件权限，当打开完成后会获得一个fd(文件描述符), 为后面 调用 fs.read、fs.write做准备。
// flages的参数如下：
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
    console.log('fs.open',fd)
    fs.close(fd, () => {
        console.log('fs.close')
    })
})
fs.open('./open_w.txt', 'w', (err, fd) => {
    if (err) {
        return console.error(err)
    }
    console.log('fs.open',fd)
    fs.close(fd, () => {
        console.log('fs.close')
    })
})
/************获取文件信息（除了具体内容）*************/
// fs.stat(path, callback) callback(err, stats)
// stats的方法如下：
// stats.isFile()	如果是文件返回 true，否则返回 false。
// stats.isDirectory()	如果是目录返回 true，否则返回 false。
// stats.isBlockDevice()	如果是块设备返回 true，否则返回 false。
// stats.isCharacterDevice()	如果是字符设备返回 true，否则返回 false。
// stats.isSymbolicLink()	如果是软链接返回 true，否则返回 false。
// stats.isFIFO()	如果是FIFO，返回true，否则返回 false。FIFO是UNIX中的一种特殊类型的命令管道。
// stats.isSocket()	如果是 Socket 返回 true，否则返回 false。
fs.stat('./open_r.txt', (err, stats) => {
    if (err) {
        return console.error(err)
    }
    console.log('fs.stat',stats)
})

/************读文件相关操作*************/
// fs.readFile(path, callback) callback(err, data) data为buffer
fs.readFile('./1.txt', (err, data) => {
    if (err) {
        return console.error(err)
    }
    console.log('fs.readFile', data.toString())
})
// fs.read(fd, buffer, offset, length, position, callback)  callback(err, bytesRead, buffer) err 为错误信息， bytesRead 表示读取的字节数，buffer 为缓冲区对象。
// 参数使用说明如下：
// fd - 通过 fs.open() 方法返回的文件描述符。
// buffer - 数据写入的缓冲区。
// offset - 缓冲区写入的写入偏移量。
// length - 要从文件中读取的字节数。
// position - 文件读取的起始位置，如果 position 的值为 null，则会从当前文件指针的位置读取。
// callback 
fs.open('./1.txt','r', (err, fd) => {
    if (err) {
        return console.error(err);
    }
    // UTF-8 编码中，一个英文字为一个字节，一个中文为三个字节。 现在'./1.txt'的内容为“a中小城镇下” 
    // 我想读取“小城镇”。
    // 那么length应该 3 * 3 = 9
    // 那么position的位置应该 a(1) + 中(3) = 4
    var buf = new Buffer.alloc(1024);
    let offset = 0
    let length = 9
    let position = 4
    fs.read(fd, buf, offset, length, position, (err, bytes, buf1) => {
        if (err){
           console.log(err);
        }
        console.log(bytes + "字节被读取");
        
        console.log('fs.read', buf.slice(offset, length).toString())
        console.log(buf === buf1)
        fs.close(fd, () => {
            console.log('fs.close')
        })
    });
})

/************截取文件内容相关操作*************/
// fs.ftruncate(fd, len, callback) len - 文件内容截取的长度，截取的内容是[0, len) ， 此方法执行后会改变文件内容。
fs.open('./2.txt','r+', (err, fd) => {
    if (err) {
        console.log("fs.ftruncate error");
        return
    }
    // UTF-8 编码中，一个英文字为一个字节，一个中文为三个字节。 现在'./2.txt'的内容为“a中小城镇下” 
    // 我想截取"a中"
    // 那么len = a(1) + 中(3) = 4
    const len = 4
    fs.ftruncate(fd, len, (err) => {
        if (err){
            return console.log(err);
        }
        console.log("fs.ftruncate", len);
        fs.close(fd, () => {
            console.log('fs.close')
        })
    });
})


/************删除文件相关操作*************/
fs.unlink('./writeFile_1706758883155.txt',(err) => {
    if (err) {
        return console.error(err);
    }
    console.log('fs.unlink')
})

/******目录***********/
// fs.mkdir('./mkdir',(err) => {
//     if(err) {
//         return console.error(err);
//     }
//     console.log('fs.mkdir')
// })

// fs.readdir("./mkdir",function(err, files){
//     if (err) {
//         return console.error(err);
//     }
//     console.log('fs.readdir',files)
//  });

//  fs.rmdir("./mkdir", (err) => {
//     if (err) {
//         return console.error(err);
//     }
//     console.log('fs.rmdir')
//  })
// writeFile
// const writeFilePath = `./writeFile_${new Date().getTime()}.txt`
// const writeFileData = '我是通 过fs.writeFile 写入文件的内容' + writeFilePath
fs.writeFile(writeFilePath, writeFileData, (err) => {
    if (err) {
        return console.error(err)
    }
    console.log('writeFile: 写入成功')
})
