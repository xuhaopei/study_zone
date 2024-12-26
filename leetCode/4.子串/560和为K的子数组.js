/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var subarraySum = function(nums, k) {
    let result = 0
    for(let i = 0; i < nums.length; i++) {
        let sum = 0
        for(let j = i; j <  nums.length; j++) {
            sum += nums[j]
            if (sum === k) {
                result++
            }
        }
    }
    return result
};
console.log(subarraySum([1,2,1,2,1], 3))