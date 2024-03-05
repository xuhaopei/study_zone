/**
 * @param {number[]} nums
 * @return {number[]}
 */
// 左右乘机列表
var productExceptSelf = function(nums) {
    let ans = new Array(nums.length).fill(1)
    let left = new Array(nums.length).fill(1)
    let right = new Array(nums.length).fill(1)
    for(let i = 1; i < nums.length; i++) {
        left[i] =  nums[i - 1] * left[i - 1]
    }
    for(let i = nums.length - 2; i >= 0; i--) {
        right[i] =  nums[i + 1] * left[i + 1]
    }

    for(let i = 0 ; i < nums.length; i++ ) {
        ans[i] = left[i] * right[i]
    }
    return ans
};
/**
 * @param {number[]} nums
 * @return {number[]}
 */
// 采用除法 + 记录每一次合层的数据
var productExceptSelf1 = function(nums) {
    let answers = [1]
    for(let i = 1; i < nums.length; i++) answers[0] *= nums[i]
    for(let i = 1; i < nums.length; i++) {
        if (nums[i] === 0) {
            answers[i] = 1
            for (let j = 0; j < nums.length; j++) {
                if (j === i) continue;
                answers[i] *= nums[j]
            }
        } else {
            answers[i] = answers[i - 1] * nums[i - 1] / nums[i]
        }
    }

    return answers
};