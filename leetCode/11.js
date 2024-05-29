const getDepth = (array) => {
    for(let i = 0; i < array.length; i++) {
        if(array[i] instanceof Array) {
            return getDepth(array, depth + 1)
        } 
    }
}