/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var detectCycle = function(head) {
    if (!head) return null
    let slow = head
    let fast = head
    while(true) {
        if(!slow || !fast || !fast.next) return null
        slow = slow.next
        fast = fast.next.next
        if (slow === fast) break
    }
    fast = head
    while(slow !== fast) {
        slow = slow.next
        fast = fast.next
    }
    return fast
};
