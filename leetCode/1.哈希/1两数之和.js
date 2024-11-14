/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    let map = new Map()
    nums.forEach((val, index) => map.set(val, index))
    for(let i = 0; i < nums.length; i++) {
        let rest = target - nums[i]
        let otherIndex = map.get(rest)
        if (otherIndex && i !== otherIndex) {
            return [i, otherIndex]
        }
    }
    return []
};