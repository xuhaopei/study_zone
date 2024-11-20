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
var swapPairs = function(head) {
    let temp = head 
    let newList = new ListNode(0)
    let ans = newList
    while(temp) {
        let firstNode = temp
        let secondeNode = temp.next

        // 说明凑不成 2个节点，且是最后一个节点，不需要交换。
        if (!secondeNode) {
            newList.next = firstNode
            break
        }
        temp = secondeNode.next

        secondeNode.next = firstNode
        firstNode.next = null

        newList.next = secondeNode
        newList = firstNode
    }
    return ans.next
};