func subarraySum(nums []int, k int) int {
	// 暴力解法
    count := 0
    for index, _ := range nums {
        sum := 0
        for end := index; end >=0 ; end-- {
            sum += nums[end]
            if sum == k {
                count++
            }
        }
    }
    return count
}