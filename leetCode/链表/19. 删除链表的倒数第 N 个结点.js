/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @param {number} n
 * @return {ListNode}
 */
var removeNthFromEnd = function(head, n) {
    let currentHead = head
    let length = 0
    while(currentHead) {
        length++
        currentHead = currentHead.next
    }
    let delIndx = length - n
    if (delIndx === 0) return head.next
    console.log('delIndx', delIndx)
    currentHead = head
    let record = 0
    while ( delIndx - 1 !== record) {
        currentHead = currentHead.next
        record++
    }
    currentHead.next = currentHead.next.next
    return head
};