import "fmt"

func swap(nums []int, left int, right int) {
	temp := nums[left]
	nums[left] = nums[right]
	nums[right] = temp
}
func moveZeroes(nums []int) {
	p_left := 0
	p_right := 0
	for p_right < len(nums) {
		if nums[p_right] != 0 {
			swap(nums, p_left, p_right)
			p_left++
		}
		p_right++
	}
}
