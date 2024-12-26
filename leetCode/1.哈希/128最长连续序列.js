// https://leetcode.cn/problems/longest-consecutive-sequence/description/?envType=study-plan-v2&envId=top-100-liked
/**
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function(nums) {
    let set = new Set()
    let maxLength = 0;
    nums.forEach((val) => set.add(val))
    for (const val of set) {
        // 这里获取需要判断最小数字的值，有两个作用
        // 1个是避免重复计算
        // 另外一个是保证值都是从最小加起的
        if (set.has(val - 1)) {
            continue
        }
        let currentMax = 0;
        let currentVal = val;
        while(set.has(currentVal)) {
            currentVal++
            currentMax++
            console.log(currentMax)
        }
        maxLength = Math.max(currentMax, maxLength)
    }
    return maxLength
};