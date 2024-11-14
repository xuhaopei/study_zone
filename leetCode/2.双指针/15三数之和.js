/**
 * @param {number[]} nums
 * @return {number[][]} -4 -1 -1 0 1 2
 */
var threeSum = function(nums) { 
    const answer = []
    nums = sort(nums)
    for(let i = 0; i < nums.length; i++) {
        let pl = i + 1
        let pr = nums.length - 1
        if (i > 0 && nums[i - 1] === nums[i]) continue
        while(pl < pr) {
            const sum = nums[i] + nums[pl] + nums[pr]
            if (sum < 0) {
                while(pl < pr && nums[pl] === nums[++pl]);
            }
            if (sum > 0) {
                while(pl < pr && nums[pr] === nums[--pr]);
            }
            if (sum === 0) {
                answer.push([nums[i], nums[pl], nums[pr]])
                while(pl < pr && nums[pl] === nums[++pl]);
                while(pl < pr && nums[pr] === nums[--pr]);
            }
        }
    }
    return answer
};
var sort = (array) => {
    if (array.length === 0) {
        return []
    }
    let targetI = 0
    let leftArray = []
    let rightArray = []
    for (let i = 1; i < array.length; i++) {
        if (array[i] <= array[targetI]) {
            leftArray.push(array[i])
        } else {
            rightArray.push(array[i])
        }
    }
    return [...sort(leftArray), array[targetI], ...sort(rightArray)]
}
console.log(threeSum([-1,0,1,2,-1,-4]))