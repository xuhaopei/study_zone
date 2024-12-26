/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
var levelOrder = function(root) {
    if (root === null) return []
    let ans = []
    let queue = [root]
    while(queue.length) {
        let item = []
        let tempQueue = []
        while(queue.length) {
            let node = queue.shift()
            item.push(node.val)
            if (node.left) tempQueue.push(node.left)
            if (node.right) tempQueue.push(node.right)
        }
        queue = tempQueue
        ans.push(item)
    }
    return ans
};