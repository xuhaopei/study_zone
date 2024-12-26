/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} headA
 * @param {ListNode} headB
 * @return {ListNode}
 */
var getIntersectionNode = function(headA, headB) {
    let headASize = 0
    let headBSize = 0
    let temp = headA
    while(temp) {
        headASize++
        temp = temp.next
    }
    temp = headB
    while(temp) {
        headBSize++
        temp = temp.next
    }
    if (headASize > headBSize) {
        let diff = headASize - headBSize
        while(diff--) headA = headA.next
    } else {
        let diff = headBSize - headASize
        while(diff--) headB = headB.next
    }
    while(headA != headB) {
        headA = headA.next
        headB = headB.next
    }
    return headA
};