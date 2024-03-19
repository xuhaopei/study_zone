/**
 * @param {string} digits
 * @return {string[]}
 */
var letterCombinations = function(digits) {
    let map = new Map()
    map.set('2', 'abc')
    map.set('3', 'def')
    map.set('4', 'ghi')
    map.set('5', 'jkl')
    map.set('6', 'mno')
    map.set('7', 'pqrs')
    map.set('8', 'tuv')
    map.set('9', 'wxyz')
    if (digits.length === 0) return []
    let arrange = []
    const getArrange = (digits, arrangeItem, index) => {
        if (arrangeItem.length === digits.length) {
            arrange.push(arrangeItem.join(""))
            return
        }
        let digit = digits[index]
        if (!digit) return
        let letters = map.get(digit)
        for(let i = 0; i < letters.length; i++) {
            arrangeItem.push(letters[i])
            getArrange(digits, [...arrangeItem], index + 1)
            arrangeItem.pop()
        }
    }
    getArrange(digits, [], 0)
    return arrange
};