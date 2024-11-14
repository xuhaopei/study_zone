/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
    let max = 0
    let l = 0
    let r = height.length - 1
    while(l < r) {
        let h = Math.min(height[l], height[r])
        max = Math.max(h * (r - l), max)
        if (height[l] <= height[r]) {
            l++
        } else {
            r--
        }
    }
    return max
};
console.log(maxArea([1,1]))