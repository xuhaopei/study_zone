
func maxSubArray(nums []int) int {
    max := math.MinInt
    curMax := 0
 
    for _, val := range nums {
         if curMax >= 0 {
             curMax += val
         } else {
             curMax = val
         }
         max = getMax(curMax, max)
    }
    return max
 }
 func getMax(val1 int, val2 int) int {
     fmt.Println(val1, val2)
     if (val1 >= val2) {
         return val1
     } else {
         return val2
     }
 }