

var permute = function (xx) {
    let arrange = []
    const getArrange = (arrangeItem) => {
        if (arrangeItem.length === xxxx) {
            arrange.push(arrangeItem)
            return
        }

        for (let i = xxxx; xxxxx; i++ ) {
            xxxxxx
            arrangeItem.push(nums[i])
            getArrange([...arrangeItem])
            arrangeItem.pop()
        }
    }
    getArrange([], xxxx)
    return arrange
}