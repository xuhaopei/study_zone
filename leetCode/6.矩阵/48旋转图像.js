/**
 * @param {number[][]} matrix
 * @return {void} Do not return anything, modify matrix in-place instead.
 */
var rotate = function(matrix) {
    // 这道题就背公式即可 [j][matrix.length - 1 - i] = [i][j]
    const copyMatrix = JSON.parse(JSON.stringify(matrix))
    const n = matrix.length
    for(let i = 0; i < matrix.length; i++) 
        for(let j = 0; j < matrix[i].length; j++)
            matrix[j][n - 1 - i] = copyMatrix[i][j]

};