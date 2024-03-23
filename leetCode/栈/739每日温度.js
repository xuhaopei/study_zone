/**
 * @param {number[]} temperatures
 * @return {number[]}
 */
// 暴力解决
var dailyTemperatures1 = function(temperatures) {
    let answer = []
    for(let i = 0; i < temperatures.length; i++) {
        let end = 0
        for(let j = i + 1; j < temperatures.length; j++) {
            if (temperatures[i] < temperatures[j]) {
                end = j
                break;
            }
        }
        answer.push(end === 0 ? 0 : end - i + 1)
    }
    return answer
};

/**
 * @param {number[]} temperatures
 * @return {number[]}
 */
// 递减栈
var dailyTemperatures = function(temperatures) {
    let sortStack = [{
        i:0,
        val: temperatures[0]
    }]
    let answer = Array(temperatures.length).fill(0)

    for(let i = 1; i < temperatures.length; i++) {
        while(sortStack[sortStack.length - 1] && sortStack[sortStack.length - 1].val < temperatures[i]) {
            let  item = sortStack.pop()
            answer[item.i] = i - item.i
        }
        sortStack.push({
                i,
                val: temperatures[i]
            })
    }
    return answer
};