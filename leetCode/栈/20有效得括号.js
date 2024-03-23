/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
    let map = new Map()
    map.set('(', ')')
    map.set('{', '}')
    map.set('[', ']')

    let stack = []
    for (const chart of s) {
        if (map.has(chart)) {
            stack.push(chart)
        } else {
            let right = chart
            let left = stack.pop()
            if (map.get(left) !== right) return false 
        }
    }
    return stack.length === 0
};