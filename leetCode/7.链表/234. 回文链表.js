/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {boolean}
 */
var isPalindrome = function(head) {
    const tempList = []
    while (head) {
        tempList.push(head.val)
        head = head.next
    }
    let l = 0
    let r = tempList.length - 1
    while(l <= r) {
        if (tempList[l] != tempList[r]) return false
        l++
        r--
    }
    return true
};