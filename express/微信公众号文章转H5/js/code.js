import { templateHtml } from './templateHtml.js'
const uploadImgUrl = (url) => {
    return Promise.resolve({url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRc_cocD4mfRljTFPoEHRdnL5XZ2FWTK-ANA&usqp=CAU'})
}
const changeImgUrl = async (imgsDoms) => {
    for (const imgDom of imgsDoms) {
        let imgUrl = imgDom.getAttribute('data-src')
        let { url } = await uploadImgUrl(imgUrl)
        imgDom.setAttribute('data-src', url)
        imgDom.setAttribute('src', url)
    }
}
export const wxPares = async() => {
    let html = await (await fetch('./js/testHtml.html')).text()
    let htmlDom = await new DOMParser().parseFromString(html, 'text/html')
    let jsContentDom = htmlDom.getElementById('js_content')
    let imgsDoms = Array.from(jsContentDom.getElementsByTagName('img'))
    await changeImgUrl(imgsDoms)
    let newHtml = templateHtml.replace('wxParse', jsContentDom.innerHTML)
    const blob = new Blob([newHtml], { type: 'text/html' })
    return URL.createObjectURL(blob)    
}