/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
var addTwoNumbers = function(l1, l2) {
    let newL1 = l1
    let newL2 = l2
    let answer = new ListNode(0)
    let currentAnswer = answer
    let isNeedGo10 = false
    while (newL1 && newL2) {
        let val = isNeedGo10 ? 1 : 0
        val += newL1.val
        val += newL2.val

        if (val >= 10) {
            isNeedGo10 = true
            val %= 10
        } else {
            isNeedGo10 = false
        }
        newL1 = newL1.next
        newL2 = newL2.next
        currentAnswer.next = new ListNode(val)
        currentAnswer = currentAnswer.next
    }
    while(newL1) {
        let val = isNeedGo10 ? 1 : 0
        val += newL1.val

        if (val >= 10) {
            isNeedGo10 = true
            val %= 10
        } else {
            isNeedGo10 = false
        }
        newL1 = newL1.next
        currentAnswer.next = new ListNode(val)
        currentAnswer = currentAnswer.next

    }
    while(newL2) {
        let val = isNeedGo10 ? 1 : 0
        val += newL2.val

        if (val >= 10) {
            isNeedGo10 = true
            val %= 10
        } else {
            isNeedGo10 = false
        }
        newL2 = newL2.next
        currentAnswer.next = new ListNode(val)
        currentAnswer = currentAnswer.next
    }
    if (isNeedGo10) {
        currentAnswer.next = new ListNode(1)
        currentAnswer = currentAnswer.next
    }
    answer = answer.next
    return answer
};

var reverList = function (head) {
    let newHead = null
    while (head) {
        let temp = head.next
        head.next = newHead
        newHead = head
        head = temp
    }
    return newHead
}