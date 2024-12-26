func lengthOfLongestSubstring(s string) int {
    cmap := make(map[rune]int)
    left := 0
    max := 0

    for i,ch := range s {
        val, found := cmap[ch]
        if val >= 0 && found {
            left = getMax(left, cmap[ch] + 1)
        }
        max = getMax(max, i - left + 1)
        cmap[ch] = i
    }
    return max
}
func getMax(val1 int, val2 int) int {
    if (val1 >= val2) {
        return val1
    } else {
        return val2
    }
}