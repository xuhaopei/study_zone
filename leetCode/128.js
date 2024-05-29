/**
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function(nums) {
    let set = new Set()
    nums.forEach(sum => set.add(sum))

    let maxSize = 0
    let length = nums.length

    nums.forEach((num) => {
        if (set.has(num - 1)) return // 只有当一个数是连续序列的第一个数的情况下才会进入内层循环 这是用来判断是否是第一个连续序列的第一个数字
        let currentMax = 1
        while(length - currentMax > 0) {
            if (set.has(num + currentMax)) {
                currentMax++
            } else {
                break;
            }
        }
        maxSize = Math.max(maxSize, currentMax)
    })
    return maxSize
};