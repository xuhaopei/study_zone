/**
 * @param {number[][]} matrix
 * @return {number[]}
 * 给你一个 m 行 n 列的矩阵 matrix ，请按照 顺时针螺旋顺序 ，返回矩阵中的所有元素。
 * [1,2,3],
 * [4,5,6],
 * [7,8,9]
 * 变成
 * [1,2,3,6,9,8,7,4,5]
 */
var spiralOrder = function(matrix) {
    const ans = []
    let minX = 0
    let minY = 0
    let maxX = matrix[0].length - 1
    let maxY = matrix.length - 1
    while(1) {
        for(let i = minX; i <= maxX; i++) ans.push(matrix[minY][i])
        minY++
        if (minY > maxY) break
        
        for(let j = minY; j <= maxY; j++) ans.push(matrix[j][maxX])
        maxX--
        if (minX > maxX) break

        for(let i = maxX; i >= minX; i--) ans.push(matrix[maxY][i])
        maxY--
        if (minY > maxY) break

        for(let j = maxY; j >= minY; j--) ans.push(matrix[j][minX])
        minX++
        if (minX > maxX) break
    }
    return ans
};

console.log(spiralOrder([[1,2,3],[4,5,6],[7,8,9]]))