/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
    let max = 0
    let p_left = 0;
    let p_right = height.length - 1
    while(p_left < p_right) {
        let h = height[p_right] > height[p_left] ? height[p_left] : height[p_right]
        max = Math.max(max, h * (p_right - p_left))
        if (height[p_right] > height[p_left]) p_left++
        else p_right--
    }
    return max
};