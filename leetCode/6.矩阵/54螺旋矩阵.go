func spiralOrder(matrix [][]int) []int {
	startRow, startColumn := 0, 0
	endRow, endColumn := len(matrix)-1, len(matrix[0])-1
	result := make([]int, 0)
	for true {
		// 从左往右
		for i := startColumn; i <= endColumn; i++ {
			result = append(result, matrix[startRow][i])
		}
		startRow++
		if startRow > endRow {
			break
		}

		// 从上往下
		for i := startRow; i <= endRow; i++ {
			result = append(result, matrix[i][endColumn])
		}
		endColumn--
		if endColumn < startColumn {
			break
		}

		// 从右往左
		for i := endColumn; i >= startColumn; i-- {
			result = append(result, matrix[endRow][i])
		}
		endRow--
		if endRow < startRow {
			break
		}

		// 从下往上
		for i := endRow; i >= startRow; i-- {
			result = append(result, matrix[i][startColumn])
		}
		startColumn++
		if startColumn > endColumn {
			break
		}
	}
	return result
}