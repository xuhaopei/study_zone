/**
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function(nums) {
    let set = new Set()
    nums.forEach((val) => set.add(val))

    let max = 0;
    for (const val of set) {
        if (set.has(val - 1)) continue;

        let currentVal = val;
        let currentCount = 0;
        while (set.has(currentVal)) {
            currentVal++
            currentCount++   
        }
        max = Math.max(max, currentCount)
    }
    return max
};