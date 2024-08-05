package main

import (
	"fmt"
)

func sort(nums []int) []int {
	if len(nums) == 0 {
		return nil
		// return []int{}
	}
	val := nums[0]
	leftArray := []int{}
	rightArray := []int{}
	for i := 1; i < len(nums); i++ {
		if nums[i] < val {
			leftArray = append(leftArray, nums[i])
		} else {
			rightArray = append(rightArray, nums[i])
		}
	}
	return append(append(sort(leftArray), val), sort(rightArray)...)
}
func threeSum(nums []int) [][]int {
	result := [][]int{}
	sortNums := sort(nums)
	for i := 0; i < len(sortNums); i++ {
		leftP := i + 1
		rightP := len(sortNums) - 1
		if i > 0 && sortNums[i-1] == sortNums[i] {
			continue
		}
		for leftP < rightP {
			sum := sortNums[i] + sortNums[leftP] + sortNums[rightP]
			if sum < 0 {
				leftP++
			} else if sum > 0 {
				rightP--
			} else {
				item := []int{sortNums[i], sortNums[leftP], sortNums[rightP]}
				result = append(result, item)
				leftP++
				rightP--

				for leftP < rightP && sortNums[leftP] == sortNums[leftP-1] {
					leftP++
				}

				for leftP < rightP && sortNums[rightP] == sortNums[rightP+1] {
					rightP--
				}
			}
		}
	}
	return result
}
func main() {
	fmt.Println(threeSum([]int{-1, 0, 1, 2, -1, -4}))
}
