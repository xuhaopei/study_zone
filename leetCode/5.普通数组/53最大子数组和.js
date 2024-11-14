/**
 * 给你一个整数数组 nums ，请你找出一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。
 * nums = [-2,1,-3,4,-1,2,1,-5,4]
 * 连续子数组 [4,-1,2,1] 的和最大，为 6 。
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    let max = Number.MIN_SAFE_INTEGER
    let curMax = 0
    for(let i = 0; i < nums.length; i++) {
        if (curMax >= 0) {
            curMax += nums[i]
        } else {
            curMax = nums[i]
        }
        max = Math.max(max, curMax)
    }
    return max
};