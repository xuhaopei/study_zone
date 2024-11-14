func merge(intervals [][]int) [][]int {
    sortIntervals :=  sort(intervals)
    window := sortIntervals[0]
    result := [][]int{}
    for i := 1; i < len(sortIntervals); i++ {
        if (window[1] >= sortIntervals[i][0]) {
            if window[1] >= sortIntervals[i][1] {
                continue
            } else {
                window[1] = sortIntervals[i][1]
            }
        } else {
            result = append(result, window)
            window = sortIntervals[i]
        }
    }
    result = append(result, window)
    return result
}
func sort(nums [][]int) [][]int {
    if len(nums) == 0 {
        return nil
    }
    val := nums[0]
    leftArray := [][]int{}
    rightArray := [][]int{}

    for i := 1; i < len(nums); i++ {
        if nums[i][0] <= val[0] {
            leftArray = append(leftArray, nums[i])
        } else {
            rightArray = append(rightArray, nums[i])
        }
    }
    return append(append(sort(leftArray), val), sort(rightArray)...)

}