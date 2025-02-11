import { f1 } from '../utils/index'
// const fn = require('../utils/index2')
import fn from '../utils/index2'
function f2() {
    console.log(1245)
    f1()
}
function f3() {
    fn()
}
f2()
f3()