/**
 * @param {number[]} nums
 * @return {number[][]}
 */

var permute = function (nums) {
    let arrange = []
    const getArrange = (nums, arrangeItem) => {
        if (arrangeItem.length === nums.length) {
            arrange.push(arrangeItem)
            return
        }

        for (let i = 0; i < nums.length; i++ ) {
            if (arrangeItem.includes(nums[i])) continue
            arrangeItem.push(nums[i])
            getArrange(nums, [...arrangeItem])
            arrangeItem.pop()
        }
    }
    getArrange(nums, [])
    return arrange
}