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
    let halfStart = reverse(findNode(head).next)
    let start = head
    let result = true
    while(result && start && halfStart) {
        if (start.val != halfStart.val) return false
        start = start.next
        halfStart = halfStart.next
    }
    return true

};
var findNode = function(head) {
    let fastNode = head
    let slowNode = head
    while(fastNode.next && fastNode.next.next) {
        fastNode = fastNode.next.next
        slowNode = slowNode.next
    }
    return slowNode
}
var reverse = function(head) {
    let pre = null
    let temp = head
    while (temp) {
        let save = temp.next
        temp.next = pre
        pre = temp
        temp = save
    }
    return pre
}