// https://leetcode.cn/studyplan/top-100-liked/
function lengthOfLongestSubstring(s: string): number {
    let zone_left = 0;
    let zone_max = 0;
    for(let i = 0; i < s.length; i++) {
        let substr = s.slice(zone_left, i)
        // 如果发现新字母在旧字串里面有存在，则滑动窗口向右减少宽度 【left + 1, right】
        if (substr.indexOf(s[i]) >= 0) {
            zone_left++
            i--
        // 否则滑动窗口向右边宽度 + 1，并记录当前最大宽度 【left, right + 1】
        } else {
            zone_max = Math.max(zone_max, i - zone_left + 1)
        }
    }
    return zone_max;
}
