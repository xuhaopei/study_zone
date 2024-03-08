/**
 * @param {number[][]} matrix
 * @return {void} Do not return anything, modify matrix in-place instead.
 */
var setZeroes = function(matrix) {
    const render0 = (matrix, i, j) => {
        // 获取列的长度
        for(let m = 0; m < matrix[0].length; m++) {
            if (matrix[i][m] !== 'a') matrix[i][m] = 0
        }
        // 获取行的长度   
        for(let n = 0; n < matrix.length; n++) {
            if (matrix[n][j] !== 'a') matrix[n][j] = 0
        }  
    }
    // 1. 考虑将为0的元素设置为A
    // 2. 再次遍历，判断当前元素如果为a，则将其他四周的元素全部渲染成0，如果是a则跳过
    // 3. 再次遍历吗， 将元素为a的改成0
    for(let i = 0; i < matrix.length; i++) {
        for(let j = 0; j < matrix[0].length; j++) {
            if (matrix[i][j] === 0) matrix[i][j] = 'a'
        }
    }

    for(let i = 0; i < matrix.length; i++) {
        for(let j = 0; j < matrix[0].length; j++) {
            if (matrix[i][j] === 'a') render0(matrix, i, j)
        }
    }

    
    for(let i = 0; i < matrix.length; i++) {
        for(let j = 0; j < matrix[0].length; j++) {
            if (matrix[i][j] === 'a') matrix[i][j] = 0
        }
    }



};