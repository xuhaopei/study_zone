function findAnagrams(s: string, p: string): number[] {
    let result:number[] = []
    for (let i = 0; i <= s.length - p.length; i++) {
        let str1 = s.slice(i, i + p.length)
        if (isJudeg(str1, p)) {
            result.push(i)
        }
    }
    return result
};
const isJudeg = (str1: string, str2: string) => {
    console.log(str1, str2)
    let map = new Map()
    for (const s of str2) {
        if (map.has(s)) {
            map.set(s, map.get(s) + 1)
        } else {
            map.set(s, 1)
        }
    }

    for (const s of str1) {
        if (map.has(s)) {
            let num = map.get(s)
            if (num === 0) return false
            map.set(s, num - 1)
        } else {
            return false
        }
    }
    return true
}