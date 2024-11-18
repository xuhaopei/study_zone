/**
 * @param {number[][]} matrix
 * @return {number[]}
 */
var spiralOrder = function(matrix) {
    let rowStart = 0, rowEnd = matrix.length - 1;
    let columnStart = 0, columnEnd = matrix[0].length - 1;
    let ans = []
    while(1) {
        // 从左到右
        for(let i = columnStart; i <= columnEnd; i++) ans.push(matrix[rowStart][i])
        rowStart++
        if (rowStart > rowEnd) break

        // 从上到下
        for(let i = rowStart; i <= rowEnd; i++) ans.push(matrix[i][columnEnd])
        columnEnd--
        if (columnStart > columnEnd) break


        // 从右到左
        for(let i = columnEnd; i >= columnStart; i--) ans.push(matrix[rowEnd][i])
        rowEnd--
        if (rowStart > rowEnd) break

        
        // 从下到上
        for(let i = rowEnd; i >= rowStart; i--) ans.push(matrix[i][columnStart])
        columnStart++
        if (columnStart > columnEnd) break
    }

    return ans
};