/**
 * @param {character[][]} board
 * @param {string} word
 * @return {boolean}
 */
var exist = function(board, word) {
    let hasSearch = false
    let dfs = (array, i, j, start) => {
        let m = board.length;
        let n = board[0].length;
        if (
            i < 0 ||
            i >= m ||
            j < 0 ||
            j >= n ||
            board[i][j] !== word[start] ||
            board[i][j] === 0 ||
            hasSearch 
        ) {
            return
        }
        array.push(board[i][j])
        if (array.length === word.length && array.join('') === word) {
            hasSearch = true
            return
        }
        let temp = board[i][j]
        board[i][j] = 0
        dfs([...array], i - 1, j, start + 1)
        dfs([...array], i + 1, j, start + 1)
        dfs([...array], i, j - 1, start + 1)
        dfs([...array], i, j + 1, start + 1)
        board[i][j] = temp
    }
    for(let i = 0; i < board.length; i++) {
        for(let j = 0; j < board[0].length; j++) {
            dfs([], i, j, 0)
        }
    }
    return hasSearch
};