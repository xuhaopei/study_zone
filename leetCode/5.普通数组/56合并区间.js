/**
 * @param {number[][]} intervals
 * @return {number[][]}
 * 以数组 intervals 表示若干个区间的集合，其中单个区间为 intervals[i] = [starti, endi] 。
 * 请你合并所有重叠的区间，并返回 一个不重叠的区间数组，该数组需恰好覆盖输入中的所有区间 。
 * 举例：intervals = [[1,3],[2,6],[8,10],[15,18]]
 * 答案：[[1,6],[8,10],[15,18]]
 * 区间 [1,3] 和 [2,6] 重叠, 将它们合并为 [1,6].
 */
var merge = function(intervals) {
    if (intervals.length == 0) return []
    const sortIntervals = intervals.sort((a, b) => a[0] - b[0])
    const answer = [intervals[0]]
    for(let i = 1; i < sortIntervals.length; i++) {
        const lastItem = answer.pop()
        const item = sortIntervals[i]
        if (lastItem[1] >= item[0] && lastItem[1] < item[1]) {
            lastItem[1] = item[1]
        }
        if (lastItem[1] < item[0]) {
            answer.push(lastItem)
            answer.push(item)
        } else {
            answer.push(lastItem)
        }
         
    }
    return answer
}
console.log(merge([[1,3],[2,6],[8,10],[15,18]]))