import "fmt"

func getMin(val1 int, val2 int) int {
	if val1 < val2 {
		return val1
	} else {
		return val2
	}
}
func getMax(val1 int, val2 int) int {
	if val1 > val2 {
		return val1
	} else {
		return val2
	}
}
func getAbs(val int) int {
	if val < 0 {
		return val * -1
	} else {
		return val
	}
}
func maxArea(height []int) int {
	max := 0
	p_left := 0
	p_right := len(height) - 1
	for p_left < p_right {
		currentHeight := getMin(height[p_left], height[p_right])
		currentArea := currentHeight * getAbs(p_right-p_left)
		max = getMax(max, currentArea)

		if height[p_left] <= height[p_right] {
			p_left++
		} else {
			p_right--
		}
	}
	return max
}