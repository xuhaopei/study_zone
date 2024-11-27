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
var diameterOfBinaryTree = function(root) {
    let max = 0;
    getDepth(root)
    function getDepth(node) {
        if(node === null) return 0
        let left = getDepth(node.left)
        let right = getDepth(node.right)
        max = Math.max(left + right, max)
        return Math.max(left, right) + 1
    }
    return max
};