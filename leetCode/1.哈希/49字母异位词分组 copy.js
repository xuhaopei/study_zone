/**
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function(strs) {
    let map = new Map()
    for(let str of strs) {
        let keyCode = Array.from(str).sort((a,b) => a.charCodeAt()-b.charCodeAt()).join('')
        let list = map.get(keyCode) || []
        map.set(keyCode, [...list, str])
    }
    return Array.from(map.values())
}