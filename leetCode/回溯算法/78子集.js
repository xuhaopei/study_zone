/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var subsets = function(nums) {
    let arrange = []
    const getArrange = (nums, arrangeItem, j) => {
        arrange.push(arrangeItem)
        for (let i = j; i < nums.length; i++) {
            arrangeItem.push(nums[i])
            getArrange(nums, [...arrangeItem], i + 1)
            arrangeItem.pop()
        }
    }
    getArrange(nums, [], 0)
    return arrange
};