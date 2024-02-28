/**
 * @param {number[]} nums
 * @return {number}
 */

// 好理解的方式，记录当前结果累计为正的值，如果累计小于  0 贼直接舍弃 取最新的值
var maxSubArray = function(nums) {
    let maxNum = Number.MIN_SAFE_INTEGER
    let cur = 0
    for(let i = 0; i < nums.length; i++) {
        if (cur >= 0) {
            cur += nums[i]
        } else {
            cur = nums[i]
        }
        maxNum = Math.max(maxNum, cur)
    }
    return maxNum
};
// 动态规划
var maxSubArray2 = function(nums) {
    let dp = new Array(nums.length)
    dp[0] = nums[0]
    for(let i = 1; i < nums.length; i++) {
        if (dp[i - 1] <= 0) {
            dp[i] = nums[i]
        } else {
            dp[i] = dp[i - 1] + nums[i]
        }
    }
    return Math.max(...dp)
};
// 暴力解法 o n^2超时
var maxSubArray1 = function(nums) {
    let maxNum = Number.MIN_SAFE_INTEGER
    for(let i = 0; i < nums.length; i++) {
        let sum = 0
        for(let j = i; j < nums.length; j++) {
            sum += nums[j]
            maxNum = Math.max(sum, maxNum)
        }
    }
    return maxNum
};