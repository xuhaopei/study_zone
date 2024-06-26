/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    let map = new Map()

    for(let i = 0; i < nums.length; i++) {
        let resVal = target - nums[i]
        if(map.has(resVal)) {
            return [i, map.get(resVal)]
        }
        map.set(nums[i], i)
    }
    return []
};