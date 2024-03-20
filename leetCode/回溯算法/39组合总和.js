/**
 * @param {number[]} candidates
 * @param {number} target
 * @return {number[][]}
 */
var combinationSum = function(candidates, target) {
    let array = []
    const getArray = (item) => {
        let sum = item.reduce((preSum, num) => preSum + num, 0)
        if (sum === target) {
            array.push(item)
        }
        if (sum > target) {
            return
        }
        for(let i = 0; i < candidates.length; i++) {
            item.push(candidates[i])
            getArray([...item])
            item.pop()
        }
    }
    getArray([])
    return array
};