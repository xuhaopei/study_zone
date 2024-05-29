/**
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function(strs) {
    let map = new Map()
    for (const str of strs) {
        let key =  Array.from(str).sort((a,b) => a.charCodeAt() - b.charCodeAt()).join('')
        if (map.get(key)) {
            let array = map.get(key)
            array.push(str)
            map.set(key, array)
        } else {
            map.set(key, [str])
        }
    }
    return Array.from(map.values())
};