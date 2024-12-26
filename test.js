const list = [
    { id: 1, },
    { id: 2, p: 1},
    { id: 3, p: 2},
    { id: 4, p: 2},
    { id: 5, p: 1},
    { id: 6, p: 1},
    { id: 7, p: 1},
    { id: 8, p: 4},
  ]

function buildNode(id, p) {
    this.id = id
    this.p = p
    this.children = []
}
function buildTree() {
    let map = new Map()
    const tree = []
    list.forEach((item) => {
        const node = new buildNode(item.id,item.p)
        map.set(node.id, node)
    })
    list.forEach((item) => {
        const {id, p} = item
        const fatherNode = map.get(p)
        const node = map.get(id)
        if (fatherNode === undefined){
            tree.push(node)
        } else {
            fatherNode.children.push(node)
        }
    })
    return tree
}
console.log(JSON.stringify(buildTree()))