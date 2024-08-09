/**
 * @param {number[][]} matrix
 * @return {void} Do not return anything, modify matrix in-place instead.
 */
var rotate = function(matrix) {
    // 这道题就背公式即可 [j][n - 1 - i] = [i][j]
    let temp = JSON.parse(JSON.stringify(matrix))
    for(let i = 0; i < matrix.length; i++) {
        for(let j = 0; j < matrix[0].length; j++)
            matrix[j][matrix.length - 1 - i] = temp[i][j]
    }

};