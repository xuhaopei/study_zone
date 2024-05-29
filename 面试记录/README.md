# 面试送分题
## 1、自我介绍
## 2、说一下项目遇到的挑战
分为技术面还是业务面
### 技术面的话
#### A,白屏优化问题
- 从`Lighthouse` 和 `webpack-bundle-analyzer`入手
- 非首屏组件进行懒加载
- 预加载组件与图片
- 三方sdk考虑使用异步imort的导入方式，避免三方sdk被打包到入口文件里面。
- cdn

#### B,兼容性问题
- ios13.1 input光标错位。解决：input聚焦的时候调用window.scrollTop(0)
- ios图片渲染只有一半。解决：加动画效果
- swiper在android上滑动错位问题，swiper中的swiper-slide滑动切换的时候，如果滑动的区域刚好有滚动元素，则会出现滑动异常问题。解决：给滚动元素绑定touchuStart、touchMove、touchEnd事件，touchuStart时禁止swiper滚动，并记录滑动的x位置，touchMove时获取此时的x与记录的x之间的差值，如大于一定数值，则调用swiper方法滚动swiper-slide。

### 业务面的话
#### A,视频直播与连麦业务上怎么做
- 最多存在三个直播房间策略，兼容性能与视频秒开
- 从后台切回前台后需自动播放策略，
- 直播自动拉流策略
#### B,1V1聊天业务上怎么做
- 确定消息协议，文字、语音、礼物。
- 消息发送的状态，发送中、失败重发、成功。
- 获取上一页数据时，页面的滚动定位。
#### C,站内活动秒开策略
- 前端上传本地包并加上版本号
- 客户端加载本地包，若客户端判断用户已经加载完这个本地包，则展示此活动。

# 2024年面试记录
## olaparty
### 一面
#### js
- 常用的es6语法有哪些
- Promise A+规范是什么
```
定义了Promise对象必须含有then方法接受两个参数,onfufilled与onrejected
要求Promise有三种状态，pending、fufilled、rejected
pending 能转为 fufilled 或者 rejected
fufilled、reject 不能转
```
- Async
```
async是gennerator的语法糖，它通过与promise的结合，使我们通过写同步代码实现异步的效果。
```
- 严格模式下，声明的var能在window对象下访问到么？
```
如果以模块的形式导入到html，在文件里面声明的var不能被window访问到。
如果以普通文件的形式引入到html，则可以。
```
- js能遍历哪些类型？能遍历的原因是什么？
```
能遍历的类型，string、array、set、map
原因是该对象含有[Sympol.interoter]属性，这个属性放回一个含有next方法的对象
next方法返回一个对象{value，done}，通过done来判断是否可以继续遍历。
```
- 作用域
```
分为全局作用域、函数作用域、块级作用域
js在查找变量的时候，会先从当前作用域查找，找不到再往上一层查找
```
- 事件循环
- 桥接方法
```
H5与native的通信方式。

native跟h5通信，调用h5的window对象

h5跟native通信，使用postMessage，或者发出请求让native进行拦截
```
- ts的语法有哪些，泛型是什么？有哪些内部的ts方法？
#### 项目
- 如果html都访问不到的白屏，你应该怎么定位？
```
1. 让运维同学帮忙定位页面为什么访问不到，需要其他同学进行配合定位
2. 如果是站内活动，可以让客户端同学一起定位问题。
```
- 说一下滚动盘动画的实现思路
```
1. canvas实现的话，分成三部分，第一部分快速，中间匀速，最后一部分快速。
```
### 二面
### webpack
- module、chunk、buble的区别
### http
- content-type的值有哪些
- 跨域有哪些方法解决
### css
- 如何实现一个元素的宽是高的两倍？
### 项目
- 聊天里面，你的撤回是怎么做的？
## 携程
### 一面
#### js
- this指向问题
```js
let b = {
    a: 1,
    getA(){
        this.a = 4
        return function(){
            return this.a
        }
    }
}
let c = b.getA()() 

问题1： c输出什么
问题2： 不能改动b， 如何让c=4
问题3： 不能改动b，如何让c=1
```
- 事件循环
- 白屏优化做了什么
- 虚拟滚动怎么做
#### 项目
- 预加载与懒加载你是怎么做的 
#### 算法
- 将多维数组改成一维数组
- 字符串排列
### 二面
#### react
- react18并发渲染是什么？
```
并发渲染是react根据用户的设备以及网络情况进行的一种渲染优化机制，最大程度保证用户的对页面的可交互性。
避免页面长时间卡顿。
```
- 多个setState会触发多次渲染么？
```
不会，在合成事件里面就不会，在非合成事件就会，但是在react18之后就都不会了。
```
#### webpack
- 什么情况下tree shaking会失效。
```
最主要的原因是函数存在副作用。
首先理解下函数副作用，当我们调用某个函数时，该函数除了返回值之外，还产生附加的影响，
例如修改全局变量，函数外的变量或修改参数等，称为存在副作用。
```
- 说一下webpack原理
#### node
- ssr是什么？
- 有用node做了什么么
#### 项目
- H5向APP获取音视频的是哪个方法？
- 如果app拒绝了，返回给h5的是一个什么？
- 可以一次性获取两个权限么？
- 兼容性问题
### 三面
#### 项目
- 自动化测试
- 项目的交付流程
## 希因
### 一面
#### 项目
- 难点，傻逼面试官，20分钟结束了。
## 拼多多
### 一面
#### css
- 左右布局，右边固定，左边自适应沾满，两种方式
- 居中布局，三种方式

flex
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        .parent{
            position: relative;
            width: 100vw;
            height: 100vh;
            display: flex;
        }
        .left {
            flex: 1 0 auto;
            background-color: red;
        }
        .right {
            /* flex-shrink: 0;
            flex-basis: 100px; */
            flex: 0 0 100px;
            background-color: blue;
        }
    </style>
</head>
<body>
    <div class="parent">
        <div class="left"></div>
        <div class="right"></div>
    </div>
</body>
</html>
```
#### js
- 判断数组的最大深度
- 事件循环
- 异步任务类似红绿灯，麻痹，宏任务跟微任务记反了。
- jsBridge的方式
#### 自己的总结
1. 真垃圾啊，那些基础知识都忘光了，妈的
2. 八股文还是要背的，草

### 二面
#### js
还是事件循环的时候，但是会有个特别的问题如下
```js
Promise.reslove(1).then(() => {
    console.log(1)
}).then(() => {
    return Promise.reject(2)
}).then(() => {
    console.log(3)
}).catch(() => {
    console.log(4)
}).then(() => {
    console.log(5)
})

function Foo(){
    foo.a = function(){
        console.log(1)
    }
    this.a = function(){
        console.log(2)
    }
}
Foo.a = function(){
    console.log(4)
}
Foo.a() // 4
let obj = new Foo()
Foo.prototype.a = function(){
    console.log(3)
}
obj.a() // 2
Foo.a() // 1
```
#### 算法
- leetcode 判断【】（）{}的匹配
#### webpack
- 怎么从0到1用webpack构建一个react环境。
#### 项目
- 项目挑战
## moego
### 一面
#### 闭包
闭包是指在一个函数内部定义的函数可以访问外部函数的变量，即使外部函数执行结束后，内部函数仍然可以访问外部函数的变量。

作用
1. 封装，将变量或者函数封装在一个作用域内，防止其被外部访问和修改。
2. 保存状态，内部函数可以访问外部函数的变量，因此可以通过闭包来保存变量的状态，如保存计时器。
3. 模块化，避免了全局命名空间的污染
#### https
https是http的基础上进行了加密。它的原理是当浏览器访问服务器的时候，服务器会返回证书，这个证书有签名与公钥，待浏览器拿到证书的时候会对签名进行验签，通过之后浏览器会自己产生一个对称密钥，之后用公钥对对称密钥进行加密，之后的加密都是对称加密。总结起来就是先非对称加密，后对称加密

作用：
1. 保证传输数据安全。

#### 火山引擎音视频sdk原理
音视频是指通过物理设备实时采集用户的音视频后对数据进行编码、解码并传输，从而实现音视频的传输与播放。

工作原理：
1. 采集，通过物理设备进行音视频数据进行采集
2. 编码，对采集到的数据进行编码，视频的编码常见的有H264、h265，音频编码有pcm、aac
3. 传输，对数据进行编码后需要通过一些协议进行传输，常见的传输协议如下：
    - RTMP(推拉流)
    - HLS(拉流)
    - Http-Flv(拉流)
    - webRtc(实时推拉流）

4. 解码，对采集到的数据进行解码，解码与编码的格式一一对应。
5. 渲染并播放。
#### 腾讯IM的sdk原理
Im即时通讯是通过浏览器与服务器建立连接，实现用户之间的实时通讯和消息交换。其工作原理就是基于webSocket协议实现双端通信。

工作原理：
1. 建立连接，前端调用new WebSocket('ws://localhost:3000')进行连接。
2. 身份验证，连接成功后，前端需要发送信息给服务进行身份验证
3. 消息发送或常见的功能
    - 用户a发送消息给服务，服务再将消息转发给用户b
    - 用户a发送消息给用户b，若用户b不在线，则存储，待用户b上线后，服务再发送消息给用户b
    - 服务主动发送消息给用户
 

#### web实现动画有哪些方式
1. css animation transition
2. js requestAnimationFrame、canvas、svg
#### 编程题目
##### 写一个节流hooks
```tsx
import React, { useEffect, useRef, useState } from 'react';

const useDebonce = (value, limitTime) => {
    const [debonceValue, setDebonceValue] = useState(value)
    useEffect(() => {
        let timer = setTimeout(() => {
            setDebonceValue(value)
        }, limitTime);
        return () => {
            clearTimeout(timer)
        }
    }, [value])
    return debonceValue
}
export default () => {
    const [value, setValue] = useState(0)
    const value1 = useDebonce(value, 500)
    return <div>
        <p>value {value}</p>
        <p>value1 {value1}</p>
        <button onClick={() => setValue(value + 1)}>add</button>
    </div>
}
```
##### 实现ts的Exclude方法
```ts
type MyExclude<T, U> = T extends U ? never : T;
```
#### 面试官反馈
```
候选人在独立开发能力和学习能力上比较可靠，但对于技术深度和新技术的追求还需提高。
从面试中表现是能够独立解决问题，但解决问题的方案欠缺考虑；
对于第三方工具只限于使用，而尚未去探究其原理和实现方式，
最后的hooks和ts 题目也没有答对。
```

## 
# 2023年面试记录
## 复盘
### 自我介绍这块
1. 说些简历上没有体现的。
2. 说些自己的优势。


## 字节跳动
### 一面
1. 项目经验
```
为什么用这套模板，有什么不爽的地方，优化了什么地方，为什么升级三方库。
```
2. 算法
```
从数组中找到第一个大于1的正整数。
```
面试官给的建议
1. 介绍项目背景
2. 回答问题要简洁，不要发散。（这个我得好好练习下了，采用总分的形式回答问题，不要想到什么就说什么。根据认知觉醒，可以在脑海里模拟打一遍之后，再回答。）

## 鹰角网络
### 一面
1. 算法-数组转树形数组
```js
let arr = [
    {id: 1, parentId: 2},
    {id: 2, parentId: 4},
    {id: 4},
]
// 转化成
let arr = [
    {
        id: 4,
        children: [
            {
                id: 2, 
                parentId: 4,
                children: [
                        {
                            id: 1,
                            parentId: 2
                        }
                    ]
             },
        ]
    
    }
]

// 思路： 
// 声明一个result = []
// 声明一个map数据结构，遍历一遍arr，以id为key，存储对应的元素
// for循环arr
    // 如果当前元素没有parentId，则直接进入result
    // 根据元素的parentId通过map找到对应的父元素， 此时元素进入父元素的children
    // 如果没有找到则直接进入result
```
2. 白屏优化
3. 视频秒开策略
4. vue2、vue3的响应式原理，为什么更换了api
5. react的响应式原理
6. react是怎么保留全局上下文的？ hooks的原理？位置记录？
## 富途
### 一面
1. 算法-BM44 有效括号序列
2. 算法-BM8 链表中倒数最后k个结点
3. 算法-判断B数组是不是A数组的子串
4. HTTPS原理
5. 性能优化原理
6. 事件循环编程题目
7. 白屏优化
```js
async function fn1 () {
    console.log(1)
    
    setTimeout(() => {
        console.log(7)
    }, 0);
    await fn2() // 这里我卡住了， 其实它等价与 下面
    /*
    new Promise((res,rej) => {
        console.log(2)
        res()
    }).then()
    */
    console.log(6)
}
async function fn2 () {
    console.log(2)
}
setTimeout(() => {
    console.log(3)
    new Promise((res,rej) => {
        console.log(4)
        res()
    }).then(() => {
        console.log(5)
    })
}, 0);
fn1()

// 1263457
```
7. defer、async 普通script标签的区别

如果defer标签所引用的JS文件很大，是否会阻塞后面的defer标签的下载？
```
答案： 不会阻塞，它们是并行下载的，不会互相阻塞，但是会影响后面defer标签的代码执行。
defer标签是html解析完毕之后再执行的。
```
## 腾讯音乐
### 一面
1. 内存泄漏的定位
2. CDN原理
3. 会不会rn
4. 会不会node
5. 桥接方式
6. 性能优化的措施
7. 浏览器垃圾回收的原理
8. 技术选型

复盘：
1. 对于前端，算法不重要。
2. 基础的前端八股文不重要
3. 要扩展前端技能，不求深，但求广，如node.js
4. 面试完后，可以询问面试官如何提升自己。
5. 多提升自己的业务能力吧
## 嘉联支付
1. react18新特性
2. react hooks 原理
3. react hook 的闭包陷阱
4. 事件循环机制
5. app桥接方法
6. 发布订阅模式
7. 项目脚手架

## moego

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/21ec2f8ca43b4cc7be6df9ea4da60452~tplv-k3u1fbpfcp-watermark.image?)

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8c6ecb2963754624910ef02e46c3e73f~tplv-k3u1fbpfcp-watermark.image?)


![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/073235bd3cbd4863a311769bb8208621~tplv-k3u1fbpfcp-watermark.image?)

## 虎牙一面面试记录
1. 为什么要换工作
2. VUE双向数据绑定的原理
3. 简历上动画库的区别
4. vite的原理
5. 项目上你是怎么做到秒开的，性能优化是怎么做的
6. rtc的原理，视频直播，跟实时音视频的区别，为什么hmu38延迟那么高
7. im的原理
8. 来个项目地址，面试官可以看看。
9. 浏览器输入网页发生了什么
10. 快排
11. https的原理