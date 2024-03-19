

var permute = function (xx) {
    let arrange = []
    const getArrange = (xx, arrangeItem) => {
        if (arrangeItem.length === xxxx) {
            arrange.push(arrangeItem)
            return
        }

        for (let i = xxxx; xxxxx; i++ ) {
            xxxxxx
            arrangeItem.push(nums[i])
            getArrange(nums, [...arrangeItem])
            arrangeItem.pop()
        }
    }
    getArrange(xxx, [], xxxx)
    return arrange
}