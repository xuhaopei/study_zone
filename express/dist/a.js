let oldArray = [1,2,3]
let newArray = Array.from(oldArray)
let newArray1 = [...oldArray]
let newArray2 = oldArray.concat()
let newArray3 = oldArray.slice()
let oldObj = {
    name: 'phxxhp'
}
let newObj = {...oldObj}
let newObj1 = Object.assign({}, newObj)

let deepClone = (obj, hash = new WeakMap()) => {
    if (obj === null) return null
    if (obj instanceof Date) return new Date(obj)
    if (obj instanceof RegExp) return new RegExp(obj)
    if (typeof obj !== 'object') return obj
    if (hash.has(obj)) return hash.get(obj)
    let cloneObj = new obj.construct()
    hash.set(obj, cloneObj)
    for(let key in obj) {
        cloneObj[key] = deepClone(obj[key], hash)
    }
    return cloneObj
}