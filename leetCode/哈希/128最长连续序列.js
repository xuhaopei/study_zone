/**
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function(nums) {
    let set = new Set()
    nums.forEach(sum => set.add(sum))
    let max = 0
    for (const num of set) {
        if (set.has(num - 1)) continue  // 判断当前遍历元素是不是第一个计数的元素，不是则跳过
        let currentMax = 0
        let crrrentNum = num
        while(set.has(crrrentNum)) {
            currentMax++
            crrrentNum++
        }
        max = Math.max(max, currentMax)
    }
    return max
};