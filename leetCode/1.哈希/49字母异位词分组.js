/**
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function(strs) {
    let map = new Map()
    strs.forEach((ele) => {
        let sortStr = Array.from(ele).sort().join('')
        if (map.get(sortStr)) {
            map.set(sortStr, [...map.get(sortStr), ele])
        } else {
            map.set(sortStr, [ele])
        }
    })
    return Array.from(map.values())
}