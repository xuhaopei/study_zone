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
 * @return {boolean}
 */
var isSymmetric = function(root) {
    return isCheck(root.left, root.right)
};
function isCheck(nodeLeft,nodeRight) {
    if (!nodeLeft && !nodeRight) return true
    if ((!nodeLeft && nodeRight) || (nodeLeft && !nodeRight)) return false
    return nodeLeft.val === nodeRight.val && isCheck(nodeLeft.left, nodeRight.right) && isCheck(nodeLeft.right, nodeRight.left) 
}