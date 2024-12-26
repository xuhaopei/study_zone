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
    const sLen = s.length, pLen = p.length;

    if (sLen < pLen) {
        return [];
    }

    const ans = [];
    const sCount = new Array(26).fill(0);
    const pCount = new Array(26).fill(0);

    // 第一个窗口比较
    for (let i = 0; i < pLen; ++i) {
        ++sCount[s[i].charCodeAt() - 'a'.charCodeAt()];
        ++pCount[p[i].charCodeAt() - 'a'.charCodeAt()];
    }
    if (sCount.toString() === pCount.toString()) {
        ans.push(0);
    }

    for (let i = 0; i < sLen - pLen; ++i) {
        // 这一步很妙，解决了第一个窗口的比较，也为下一个窗口比较做铺垫。
        --sCount[s[i].charCodeAt() - 'a'.charCodeAt()];
        ++sCount[s[i + pLen].charCodeAt() - 'a'.charCodeAt()];

        if (sCount.toString() === pCount.toString()) {
            ans.push(i + 1);
        }
    }

    return ans;
};