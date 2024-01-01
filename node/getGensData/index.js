const axios = require('axios')
const cheerio = require('cheerio')
const ExcelJS = require('exceljs')
const moment = require('moment')
let Officials = []
let Genes = []
let Errors = []
// 爬取的最大symbolId
let w = 10000
let k = 1000
let h = 100
// 爬取基因 从 1 到 1 * h   丰子 你就只需要在这里改需要爬的数据量， 比如 1 到 10000
let min_symbol_id = 101      
let max_symbol_id = 1001   

const getData = (symbolId) => {
    const url = `https://www.ncbi.nlm.nih.gov/gene/${symbolId}`
    // console.log(`正在的网页地址为:${url}`)
    return axios({
        url: `https://www.ncbi.nlm.nih.gov/gene/${symbolId}`,
        timeout: 60 * 1000,
    })
        .then(response => {
            const $ = cheerio.load(response.data)

            // 这里判断是不是Official Symbol
            const isOfficialSymbol = $('#summaryDl dt')[0].children[0].data.indexOf('Official') > 0

            // 这里获取Official Symbol / Gene Symbol
            const Symbol = $('#summaryDl dd')[0].children[0].data

            // 这里获取Official Full Name / Gene description
            const nameOrdescription = $('#summaryDl dd')[1].children[0].data

            // 这里存储数据
            const data = [symbolId, Symbol, nameOrdescription, url]

            if (isOfficialSymbol) {
                Officials.push(data)
            } else {
                Genes.push(data)
            }

        })
        .catch(error => {
            let { code } = error
            if (code) {
                console.error('爬取此页面数据失败，重新抓取')
                return getData(symbolId)
            } else {
                console.error('爬取此页面数据失败，已记录')
                Errors.push([symbolId, url])
            }
        })
}
const writeExcel = (header = [], listDat = [], sheetName) => {
    // 创建一个新的工作簿
    const workbook = new ExcelJS.Workbook()

    // 添加一个工作表
    const worksheet = workbook.addWorksheet(sheetName)

    // 添加数据到工作表
    worksheet.addRow(header)
    listDat.forEach((item) => worksheet.addRow(item))

    // 保存工作簿到文件
    return workbook.xlsx.writeFile(`./excel/${sheetName}.xlsx`)
        .then(() => {
            console.log(`写入${sheetName}完成`)
        })
        .catch(error => {
            console.error(`写入${sheetName}失败`, error)
        })
}
const main = async () => {
    console.log('开始爬取数据', moment().format('YYYY-MM-DD HH:mm:ss'))
    let promise = []
    for (let i = min_symbol_id; i <= max_symbol_id; i++) {
        // await getData(`${i}`, )
        promise.push(getData(`${i}`, ))
    }
    await Promise.all(promise)
    console.log('爬取数据完成', moment().format('YYYY-MM-DD HH:mm:ss'))
    Officials.sort((a, b) => a[0] - b[0])
    Genes.sort((a, b) => a[0] - b[0])
    await writeExcel(['Symbol ID','Official Symbol', 'Official Full Name', 'url'], Officials, `Officials_${min_symbol_id}~${max_symbol_id}`)
    await writeExcel(['Symbol ID','Gene Symbol', 'Gene description', 'url'], Genes, `Genes_${min_symbol_id}~${max_symbol_id}`)
    await writeExcel(['Symbol ID', '爬取失败的url地址'], Errors, `Errors_${min_symbol_id}~${max_symbol_id}`)
}
main()