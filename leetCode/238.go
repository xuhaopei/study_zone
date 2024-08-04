func productExceptSelf(nums []int) []int {
    size := len(nums)
    ans := make([]int,size)
    left := make([]int,size)
    right := make([]int,size)
    left[0] = 1
    right[size- 1] = 1
    for i := 1; i < len(nums); i++ {
        left[i] = left[i - 1] * nums[i - 1]
    }
        fmt.Println(left)
    for i := len(nums) - 2; i >= 0; i-- {
        right[i] = right[i + 1] * nums[i + 1]
    }

    for i,_ := range ans {
        ans[i] = left[i] * right[i]
    }

    return ans
}