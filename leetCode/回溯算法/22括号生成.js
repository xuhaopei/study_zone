/**
 * @param {number} n
 * @return {string[]}
 */
var generateParenthesis = function(n) {
    let arrays = []
    const getArray = (array,leftNum, rightNum) => {
        if (array.length === n * 2) {
            arrays.push(array.join(''))
            return
        }
        if (leftNum < n) {
            array.push('(')
            getArray([...array], leftNum + 1, rightNum)
            array.pop()
        } 
        if (rightNum < leftNum) {
            array.push(')')
            getArray([...array], leftNum, rightNum + 1)
            array.pop()
        }
    }
    getArray([], 0 , 0)
    return arrays
};