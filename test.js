function main(array) {
    let list = []
    const getList = (array) => {
        for(let item of array) {
            if (item instanceof Array) {
                getList(item)
            }
            else {
                list.push(item)
            }
        }
    }
    getList(array)
    list = Array.from(new Set())
    list.sort((a, b) => a - b)

    return list
}
function main(array) {
    return array.toString().replace(/[\]\[]]/g, '').split(',')
}

function main(str) {
    let list = Array.from(str)
    let answer = []
    const getItem = () => {
        
    }
}
console.log(main([6, 3, [3, 4, [4, 2], 1]]))