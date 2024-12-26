/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {number[]} nums
 * @return {TreeNode}
 */
var sortedArrayToBST = function(nums) {
    return build(nums, 0, nums.length - 1)
};
function build(nums, left, right) {
    if (left > right) return null
    let m = Math.floor((left + right) / 2)
    let node = new TreeNode(nums[m])
    node.left = build(nums, left, m - 1)
    node.right = build(nums, m + 1, right)
    return node
}