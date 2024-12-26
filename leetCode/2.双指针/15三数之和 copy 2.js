/**
 * @param {number[]} nums
 * @return {number[][]} -4 -1 -1 0 1 2
 */
var threeSum = function(nums) {
    const answer = []
    nums = sort(nums)
    for(let i = 0; i < nums.length; i++) {
        let pL = i + 1
        let pR = nums.length - 1
        if (i > 0 && nums[i] === nums[i - 1]) continue
        while(pL < pR) {
            const sum = nums[i] + nums[pL] + nums[pR] 
            if (sum < 0) {
                while(pL < pR && nums[pL] === nums[++pL]);
            }
            if (sum > 0) {
                while(pL < pR && nums[pR] === nums[--pR]);
            }
            if (sum === 0) {
                answer.push([nums[i],nums[pL],nums[pR]])
                while(pL < pR && nums[pL] === nums[++pL]);
                while(pL < pR && nums[pR] === nums[--pR]);
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