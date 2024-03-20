/**
 * @param {number[]} nums
 * @return {number[][]}
 */

var permute = function (nums) {
    let arrays = []
    const getArray = (array) => {
        if (nums.length === array.length) {
            arrays.push(array)
            return
        }
        for(let i = 0; i < nums.length; i++) {
            if (array.includes(nums[i])) continue
            array.push(nums[i])
            getArray([...array])
            array.pop()
        }
    }
    getArray([])
    return arrays
}