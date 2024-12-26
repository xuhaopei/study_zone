function Node(key,value) {
    this.key = key
    this.value = value
    this.prev = null
    this.next = null
}
/**
 * @param {number} capacity
 */
var LRUCache = function(capacity) {
    this.capacity = capacity
    this.currentSize = 0
    this.vHead = new Node(0,0)
    this.vTail = new Node(0,0)
    this.vHead.next = this.vTail
    this.vTail.prev = this.vHead
    this.map = new Map()
};

/** 
 * @param {number} key
 * @return {number}
 * 对于 get 操作，首先判断 key 是否存在：
 * 如果 key 不存在，则返回 −1；
 * 如果 key 存在，则 key 对应的节点是最近被使用的节点。
 * 通过哈希表定位到该节点在双向链表中的位置，并将其移动到双向链表的头部，最后返回该节点的值。
 */
LRUCache.prototype.get = function(key) {
    const node = this.map.get(key)
    if(node === undefined) {
        return -1
    }
    this.moveToHead(node)
    return node.value
};

/** 
 * @param {number} key 
 * @param {number} value
 * @return {void}
 * 对于 put 操作，首先判断 key 是否存在：
 * 如果 key 不存在，使用 key 和 value 创建一个新的节点，在双向链表的头部添加该节点，并将 key 和该节点添加进哈希表中。
 * 然后判断双向链表的节点数是否超出容量，如果超出容量，则删除双向链表的尾部节点，并删除哈希表中对应的项；
 * 如果 key 存在，则与 get 操作类似，先通过哈希表定位，再将对应的节点的值更新为 value，并将该节点移到双向链表的头部。
 */
LRUCache.prototype.put = function(key,value) {
    let node = this.map.get(key)
    if (node === undefined) {
        node = new Node(key,value)
        this.currentSize++
        this.map.set(key,node)
        this.addToHead(node)
        if (this.currentSize > this.capacity) {
            const deleteNode =  this.removeTail()
            this.map.delete(deleteNode.key)
            this.currentSize--
        }
    } else {
        node.value = value
        this.moveToHead(node)
    }
};
LRUCache.prototype.addToHead = function(node) {
    node.next = this.vHead.next
    node.prev = this.vHead
    this.vHead.next.prev = node
    this.vHead.next = node
};
LRUCache.prototype.removeNode = function(node) {
    node.prev.next = node.next
    node.next.prev = node.prev
};
LRUCache.prototype.moveToHead = function(node) {
    this.removeNode(node)
    this.addToHead(node)
};
LRUCache.prototype.removeTail = function() {
    const deleteNode = this.vTail.prev
    this.removeNode(deleteNode)
    return deleteNode
};
/** 
 * Your LRUCache object will be instantiated and called as such:
 * var obj = new LRUCache(capacity)
 * var param_1 = obj.get(key)
 * obj.put(key,value)
 */