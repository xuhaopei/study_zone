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
 * @return {number}
 */
var maxDepth = function(root) {
    let max = 0
    digui(root, max)
    return max
    function digui(root, depth) {
        if (root === null) {
            max = Math.max(depth, max)
            return
        }
        digui(root.left, depth + 1)
        digui(root.right, depth + 1)
    }
};