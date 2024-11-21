/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var sortList = function(head) {
    let ans = []
    while(head) {
        ans.push(head.val)
        head = head.next
    }
    ans = ans.sort((a,b) => a - b)
    let node = new ListNode(0)
    let temp = node
    ans.forEach((val) => {
        temp.next = new ListNode(val)
        temp = temp.next
    })
    return node.next
};