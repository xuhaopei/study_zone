/**
 * // Definition for a _Node.
 * function _Node(val, next, random) {
 *    this.val = val;
 *    this.next = next;
 *    this.random = random;
 * };
 */

/**
 * @param {_Node} head
 * @return {_Node}
 */
var copyRandomList = function(head) {
    // 这里的难点就是 怎么复制random， 
    // 解决方法就是 用两个map 一个map来确定node 对应的 位置
    // 另外一个map 用来获取通过位置 获取对应的 node

    let mapNodePos = new Map()
    let mapPosNode = new Map()
    let list = new _Node(0,null, null)
    let temp = head
    let ans = list
    let pos = 0
    // 这里记录被复制链 节点对应的位置
    while(temp){
        mapNodePos.set(temp, pos++)
        temp = temp.next
    }
    temp = head
    pos = 0
    // 这里简单复制链的next结构， 同时记录每个node节点对应的位置
    while(temp) {
        let node = new _Node(temp.val, null, null)
        mapPosNode.set(pos++, node)
        list.next = node
        list = list.next
        temp = temp.next
    }
    temp = head
    list = ans.next
    // 这里通过mapNodePos来获取random node的位置
    // 再通过node的位置 获取到 对应的 node
    while(temp) {
        list.random = mapPosNode.get(mapNodePos.get(temp.random))
        list = list.next
        temp = temp.next
    }
    return ans.next
};