/**
 * @param {string} s
 * @param {string} p
 * @return {number[]}  
 * s = "cbaebabacd", p = "abc" [0,6] 
 * 起始索引等于 0 的子串是 "cba", 它是 "abc" 的异位词。 
 * 起始索引等于 6 的子串是 "bac", 它是 "abc" 的异位词。
 * 我们可以在字符串 s 中构造一个长度为与字符串 p 的长度相同的滑动窗口，并在滑动中维护窗口中每种字母的数量；
 * 当窗口中每种字母的数量与字符串 p 中每种字母的数量相同时，则说明当前窗口为字符串 p 的异位词。
 */
var findAnagrams = function(s, p) {
    const sL = s.length
    const pL = p.length
    const answer = []
    if (sL < pL) return []

    const subSList = new Array(26).fill(0)
    const subPList = new Array(26).fill(0)
    for(let i = 0; i < pL; i++) {
        ++subSList[s[i].charCodeAt(0) - 'a'.charCodeAt(0)]
        ++subPList[p[i].charCodeAt(0) - 'a'.charCodeAt(0)]
    }
    if (subPList.toString() === subSList.toString()) {
        answer.push(0)
    }

    for(let i = 0; i < sL - pL; i++) {
        --subSList[s[i].charCodeAt(0) - 'a'.charCodeAt(0)]
        ++subSList[s[i + pL].charCodeAt(0) - 'a'.charCodeAt(0)]
        if (subPList.toString() === subSList.toString()) {
            answer.push(i + 1)
        }
    }
    return answer
};