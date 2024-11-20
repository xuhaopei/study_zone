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
    let reverL1 = l1
    let reverL2 = l2
    let reverL3 = new ListNode(0)
    const temp = reverL3
    let sum = 0 
    while(reverL1 || reverL2){
        sum += reverL1 ? reverL1.val : 0
        sum += reverL2 ? reverL2.val : 0
        reverL3.next = new ListNode(sum % 10)
        sum = sum >= 10 ? 1 : 0
        if (reverL1) reverL1 = reverL1.next
        if (reverL2) reverL2 = reverL2.next
        reverL3 = reverL3.next
    }
    if (sum > 0) {
        reverL3.next = new ListNode(sum)
    }
    return temp.next
};