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
    let aSize = 0
    let bSize = 0
    let temp = headA
    while(temp) {
        aSize++
        temp = temp.next
    }
    temp = headB
    while(temp) {
        bSize++
        temp = temp.next
    }
    let tempHeadA = headA
    let tempHeadB = headB
    if (aSize > bSize) {
        let diff = aSize - bSize
        while(diff--) {
            tempHeadA = tempHeadA.next
        }
        while(tempHeadA !== tempHeadB) {
            tempHeadA = tempHeadA.next
            tempHeadB = tempHeadB.next
        }
        return tempHeadA
    } else {
        let diff = bSize - aSize
        while(diff--) {
            tempHeadB = tempHeadB.next
        }
        while(tempHeadA !== tempHeadB) {
            tempHeadA = tempHeadA.next
            tempHeadB = tempHeadB.next
        }
        return tempHeadA

    }
};