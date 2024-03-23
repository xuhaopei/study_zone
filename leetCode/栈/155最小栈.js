
var MinStack = function() {
    this.stack = []
    this.min = Number.MAX_SAFE_INTEGER 
};

/** 
 * @param {number} val
 * @return {void}
 */
MinStack.prototype.push = function(val) {
    this.min = Math.min(this.min, val)
    this.stack.push(val)
};

/**
 * @return {void}
 */
MinStack.prototype.pop = function() {
    let val = this.stack.pop()
    this.min = Math.min(...this.stack)
    return val

};

/**
 * @return {number}
 */
MinStack.prototype.top = function() {
    return this.stack.slice(-1)
};

/**
 * @return {number}
 */
MinStack.prototype.getMin = function() {
    return this.min
};

/**
 * Your MinStack object will be instantiated and called as such:
 * var obj = new MinStack()
 * obj.push(val)
 * obj.pop()
 * var param_3 = obj.top()
 * var param_4 = obj.getMin()
 */