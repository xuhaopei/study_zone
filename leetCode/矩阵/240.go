func searchMatrix(matrix [][]int, target int) bool {
    mapNum := make(map[int]int, 1)
    for i,_ :=range matrix {
        for j,_ := range matrix[i] {
            mapNum[matrix[i][j]] = 1 
        }
    }
    for key,val := range mapNum {
        if (target % key == 0) {
            _, ok := mapNum[target % key]
            if (ok) {
                return true
            }
        } 
    }

    return false
}