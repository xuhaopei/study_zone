import { templateHtml } from './templateHtml.js'
export const wxPares = async() => {
    let html = await (await fetch('./js/testHtml.html')).text()
    let htmlDom = await new DOMParser().parseFromString(html, 'text/html')
    let jsContentDom = htmlDom.getElementById('js_content')
    let newHtml = templateHtml.replace('wxParse', jsContentDom.innerHTML)

    console.log(newHtml)
}