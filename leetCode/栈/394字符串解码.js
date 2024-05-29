/**
 * @param {string} s
 * @return {string}
 */
var decodeString = function(s) {
    let stack = []
    for (const c of s) {
        if (c !== ']') {
            stack.push(c)
        } else {
            // 这一步获取堆栈一次[]里面所有的字母
            let popChart = stack.pop()
            let subStr = ''
            while(/[a-z]/g.test(popChart)) {
                subStr = popChart + subStr
                popChart = stack.pop()  // 这一步刚好把 [ 退出栈
            }

            // 这一步获取一次[]前面的数字
            let num = ''
            while(/\d/g.test(stack.slice(-1))) {
                num = stack.pop() + num
            }
            num = Number(num)

            // 这一步获取 num * subStr
            let sumStr = ''
            while(num--) sumStr += subStr


            // 这一步 将 sumStr 转成 数组 重新 入栈， 方便嵌套2[b3[a]]的解密
            stack = stack.concat(Array.from(sumStr))
        }
    }
    return stack.join('')
};