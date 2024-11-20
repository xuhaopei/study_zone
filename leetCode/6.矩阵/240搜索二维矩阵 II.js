/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {boolean}
 * [1,4,7,11,15],
 * [2,5,8,12,19],
 * [3,6,9,16,22],
 * [10,13,14,17,24],
 * [18,21,23,26,30]
 * target = 5
 */
var searchMatrix = function(matrix, target) {
    for(let i = 0; i < matrix.length; i++) 
        if (search(matrix[i], target)) return true
    return false
};
function search(list = [], target) {
    let l = 0
    let r = list.length - 1
    while(l <= r) {
        const m = Math.floor((r + l) / 2)
        if (list[m] === target) return true
        if (list[m] > target) r = m - 1
        else l = m + 1
    }
    return false
}