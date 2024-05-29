/**
 * @param {number[]} candidates
 * @param {number} target
 * @return {number[][]}
 */
var combinationSum = function(candidates, target) {
    let array = []
    const getArray = (item, start) => {
        let sum = item.reduce((preSum, num) => preSum + num, 0)
        if (sum === target) {
            array.push(item)
        }
        if (sum > target) {
            return
        }
        for(let i = start; i < candidates.length; i++) {
            item.push(candidates[i])
            getArray([...item], i)
            item.pop()
        }
    }
    getArray([], 0)
    return array
};