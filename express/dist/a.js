let array = []
for(let i = 0; i < 3; i++) {
    array[i] = function() {
        console.log(i)
    }
}
array[0]()
array[1]()
array[2]()