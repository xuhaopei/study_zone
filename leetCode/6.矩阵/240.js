/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {boolean}
 */
var searchMatrix = function(matrix, target) {
    for(let i = 0; i < matrix.length; i++) {
        if (search(matrix[i], target)) return true
    }
    return false
};
var search = (array, target) => {
    let left = 0;
    let right = array.length - 1
    while (left <= right) {
        let middle = left + Math.floor((right - left) / 2)
        if (array[middle] === target) return true
        else if (array[middle] < target) left = middle + 1
        else right = middle - 1
    }
    return false

}
// 超时
var searchMatrix1 = function(matrix, target) {
    let strs = '[' + JSON.stringify(matrix).replace(/[\[\]]/g, '') + ']'
    let arrays = JSON.parse(strs)
    arrays = customSort(arrays)
    console.log(arrays)
    let left = 0;
    let right = arrays.length - 1
    while (left <= right) {
        let middle = left + Math.floor((right - left) / 2)
        if (arrays[middle] === target) return true
        else if (arrays[middle] < target) left = middle + 1
        else right = middle - 1
    }
    return false
};
var customSort = function(array) {
    if (array.length === 0) return []
    let leftArray = []
    let rightArray = []
    let val = array[0]
    for(let i = 1; i < array.length; i++) {
        if (array[i] >= val) rightArray.push(array[i]) 
        else leftArray.push(array[i])
    }
    return [...customSort(leftArray), val, ...customSort(rightArray)]

}