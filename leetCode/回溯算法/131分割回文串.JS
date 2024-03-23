/**
 * @param {string} s
 * @return {string[][]}
 */
var partition = function(s) {
    let arrays = []
    let getArray = (array, start ) => {
        if (isHuiwen(array)) {
            arrays.push(array.join)
        }
    }
    let isHuiwen = (array) => {
        if (array.length === 0) return false
        let left = 0
        let right = array.length - 1;
        while(left++ < right--) {
            if (array[left] != array[right]) return false
        }
        return true
    }
};