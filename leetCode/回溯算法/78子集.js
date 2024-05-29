/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var subsets = function(nums) {
    let arrays = []
    let getArray = (array, start) => {
        arrays.push(array)
        for(let i = start; i < nums.length; i++) {
            array.push(nums[i])
            getArray([...array], i + 1)
            array.pop()
        }
    }
    getArray([], 0)
    return arrays
};