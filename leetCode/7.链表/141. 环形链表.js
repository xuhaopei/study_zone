/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} head
 * @return {boolean}
 */
var hasCycle = function(head) {
    if (!head) return false
    let slowNode = head.next
    if (!slowNode) return false
    let fastNode = slowNode.next
    while(slowNode && fastNode && fastNode.next) {
        if (slowNode === fastNode) return true
        slowNode = slowNode.next
        fastNode = fastNode.next.next
    }
    return false
};