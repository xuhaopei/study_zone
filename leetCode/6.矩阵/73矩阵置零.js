/**
 * @param {number[][]} matrix
 * @return {void} Do not return anything, modify matrix in-place instead.
 * 给定一个 m x n 的矩阵，如果一个元素为 0 ，则将其所在行和列的所有元素都设为 0 。请使用 原地 算法。
 * [
 * 	[1,1,1],
 * 	[1,0,1],
 * 	[1,1,1]
 * ]
 * 
 * [
 * 	[1,0,1],
 * 	[0,0,0],
 * 	[1,0,1]
 * ]
 */
var setZeroes = function(matrix) {
    for(let i = 0; i < matrix.length; i++) {
		for(let j = 0; j < matrix[0].length; j++) { 
			if (matrix[i][j] == 0) {
				setZeroeAboutColumn(matrix, j, i)
				setZeroeAboutRow(matrix, j, i)
			}
		}
	}
    for(let i = 0; i < matrix.length; i++) {
		for(let j = 0; j < matrix[0].length; j++) { 
			if (matrix[i][j] == 99) {
				matrix[i][j] = 0
			}
		}
	}
	return matrix
};
function setZeroeAboutColumn(matrix, x, y) {
	const yL = matrix.length
	for(let i = 0; i < yL; i++) {
		matrix[i][x] = matrix[i][x] === 0 ? 0 : 99
	}
}
function setZeroeAboutRow(matrix, x, y) {
	const xL = matrix[0].length
	for(let i = 0; i < xL; i++) {
		matrix[y][i] = matrix[y][i] === 0 ? 0 : 99
	}
}
console.log(setZeroes([[1,1,1],[1,0,1],[1,1,1]]))