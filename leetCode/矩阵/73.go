func setZeroes(matrix [][]int) {
	row := len(matrix)
	cloumn := len(matrix[0])
	for i := 0; i < row; i++ {
		for j := 0; j < cloumn; j++ {
			if matrix[i][j] == 0 {
				setZeroTop2Bottom(matrix, j)
				setZeroLeft2Right(matrix, i)
			}
		}
	}
	fmt.Println(matrix)
	for i := 0; i < row; i++ {
		for j := 0; j < cloumn; j++ {
			if matrix[i][j] == 999 {
				matrix[i][j] = 0
			}
		}
	}
}
func setZeroTop2Bottom(matrix [][]int, cloumn int) {
	row := len(matrix)
	for i := 0; i < row; i++ {
		if matrix[i][cloumn] != 0 {
			matrix[i][cloumn] = 999
		}
	}
}

func setZeroLeft2Right(matrix [][]int, row int) {
	cloumn := len(matrix[0])
	for i := 0; i < cloumn; i++ {
		if matrix[row][i] != 0 {
			matrix[row][i] = 999
		}
	}
}