/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    let sortNums = sort(nums)
    console.log(sortNums)
    let answer = []
    for(let i = 0; i < sortNums.length; i++) {
       let p_left = i + 1;
       let p_right = sortNums.length - 1
       if(i > 0 && sortNums[i - 1] == sortNums[i]) continue
       while(p_left < p_right) {
          let sum = sortNums[p_left] + sortNums[p_right] +sortNums[i]
           if ( sum < 0 )  {
                while(p_left < p_right && sortNums[p_left] === sortNums[++p_left]);
           }
           else if (sum > 0) {
                while(p_left < p_right && sortNums[p_right] === sortNums[--p_right]);
           }
           else {
               answer.push([sortNums[i], sortNums[p_left], sortNums[p_right]])
               while(p_left < p_right && sortNums[p_left] === sortNums[++p_left]);
               while(p_left < p_right && sortNums[p_right] === sortNums[--p_right]);
           }
           
       }
    }
    return answer
};
var sort = (array) => {
   if (array.length === 0) return []
   let val = array[0]
   let leftArray = []
   let rightArray = []
   for(let i = 1; i < array.length; i++) {
       if (array[i] < val) {
           leftArray.push(array[i])
       } else {
           rightArray.push(array[i])
       }
   }
   return [...sort(leftArray), val, ...sort(rightArray)]
}