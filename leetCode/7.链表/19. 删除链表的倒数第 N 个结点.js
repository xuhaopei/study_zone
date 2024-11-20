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
    let size = 0
    let temp = head

    while(temp) {
        size++
        temp = temp.next
    }

    let pos = size - n

    if(pos === 0) {
        return head.next
    }
    else if(pos === size) {
        let temp = head
        while(pos - 1) {
            pos--
            temp = temp.next
        }
        temp.next = null
        return head
    }
    else {
        let beforNode = head
        while(pos - 1) {
            pos--
            beforNode = beforNode.next
        }
        beforNode.next = beforNode.next.next
        return head
    }

};