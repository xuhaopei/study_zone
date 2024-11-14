/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var moveZeroes = function(nums) {
    let p1 = 0
    let p2 = p1 + 1
    let l = nums.length
    while (p2 < l) {
        // 如果p1为0 p2不为0 则需要交换
        if (nums[p1] === 0 && nums[p2] !== 0) {
            nums[p1] = nums[p2]
            nums[p2] = 0
        }
        // 如果p1不为0 说明p1需要前进一位
        if (nums[p1] != 0) p1++
        p2++
    }
    return nums
};
console.log(moveZeroes([0,1,0,3,12]))