/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var moveZeroes = function(nums) {
    let length = nums.length;
    let p_left = 0;
    let p_right = 0;
    while(p_right < length) {
        if (nums[p_right]) {
            let temp = nums[p_right]
            nums[p_right] = nums[p_left]
            nums[p_left] = temp
            p_left++
        }
        p_right++
    }
};