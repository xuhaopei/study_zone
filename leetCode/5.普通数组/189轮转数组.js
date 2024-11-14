/**
 * @param {number[]} nums
 * @param {number} k
 * @return {void} Do not return anything, modify nums in-place instead.
 * 给定一个整数数组 nums，将数组中的元素向右轮转 k 个位置，其中 k 是非负数。
 * nums = [1,2,3,4,5,6,7], k = 3
 * [5,6,7,1,2,3,4]
 * 
 * 向右轮转 1 步: [7,1,2,3,4,5,6]
 * 向右轮转 2 步: [6,7,1,2,3,4,5]
 * 向右轮转 3 步: [5,6,7,1,2,3,4]
 */
var rotate = function(nums, k) {
    k = k % nums.length
    nums.unshift(...nums.splice(nums.length - k, k))
    return nums
};
console.log(rotate([1,2,3,4,5,6,7], 3))