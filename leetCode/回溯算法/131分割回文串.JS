/**
 * @param {string} s
 * @return {string[][]}
 */
var partition = function(s) {
    let arrays = []
    let getArray = (array, start ) => {

    }
    let isHuiwen = (array) => {
        let left = 0
        let right = array.length - 1;
        while(left < right) {
            if (array[left] != array[right]) return false
            left++
            right--
        }
        return true
    }
};