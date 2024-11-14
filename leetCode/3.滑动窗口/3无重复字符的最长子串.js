/**
 * @param {string} s
 * @return {number}
 * abcabcbb pwwkew 3
 * bbb 1
 */
var lengthOfLongestSubstring = function(s) {
    const map = new Map()
    let max = 0
    let left = 0
    for(let i = 0; i < s.length; i++) {
        if (map.has(s[i])) {
            left = Math.max(left, map.get(s[i]) + 1)
        }
        max = Math.max(max, i - left + 1)
        map.set(s[i], i)
    }
    return max
};
console.log(lengthOfLongestSubstring('abcabcbb'))