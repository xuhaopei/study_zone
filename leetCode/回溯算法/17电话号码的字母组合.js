/**
 * @param {string} digits
 * @return {string[]}
 */
var letterCombinations = function(digits) {
    if (!digits) return []
    let map = new Map()
    map.set('2', 'abc')
    map.set('3', 'def')
    map.set('4', 'ghi')
    map.set('5', 'jkl')
    map.set('6', 'mno')
    map.set('7', 'pqrs')
    map.set('8', 'tuv')
    map.set('9', 'wxyz')
    let arrays = []
    const getArray = (array, start) => {
        if (array.length === digits.length) {
            arrays.push(array.join(''))
            return
        }
        let digit = digits[start]
        let digitMapLetters = map.get(digit)
        if (!digitMapLetters) return
        for(let i = 0; i < digitMapLetters.length; i++) {
            array.push(digitMapLetters[i])
            getArray([...array], start + 1)
            array.pop()
        }
    }
    getArray([], 0)
    return arrays
};