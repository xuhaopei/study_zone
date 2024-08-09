func rotate(matrix [][]int) {
	temp := make([][]int, len(matrix))
	for i, _ := range temp {
		temp[i] = make([]int, len(matrix[0]))
		copy(temp[i], matrix[i])
	}
	for i, _ := range matrix {
		for j, _ := range matrix[0] {
			fmt.Println(i, j)
			matrix[j][len(matrix)-1-i] = temp[i][j]
		}
	}
}