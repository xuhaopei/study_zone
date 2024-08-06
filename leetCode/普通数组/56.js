/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
var merge = function(intervals) {
    let result = []
    intervals.sort((a, b) => a[0] - b[0])
    let window = intervals[0]
    for(let i = 1; i < intervals.length; i++) {
        if (window[1] >= intervals[i][0]) {
            if (window[1] >= intervals[i][1]) continue
            else window[1] = intervals[i][1]
        } else {
            result.push(window)
            window = intervals[i]
        }
    }
    result.push(window)
    return result
};