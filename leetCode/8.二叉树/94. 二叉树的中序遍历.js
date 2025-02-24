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
 * @return {number[]}
 */
var inorderTraversal = function(root) {
    const ans = []
    digui(root)
    return ans
    function digui(root) {
        if (root === null) return
        digui(root.left)
        ans.push(root.val)
        digui(root.right)
    }
};
