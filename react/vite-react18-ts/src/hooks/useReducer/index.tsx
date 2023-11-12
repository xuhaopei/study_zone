import React, { useState, memo, useReducer } from 'react';
import { createContext, useContext } from 'react';

// ==============使用场景：跨组件通信，不用第三方，使用useReducer + useContext + createContext 模拟 第三方store======================
// 定义 state 的类型
interface State {
    age: number;
}
// 定义 action 的类型
type Action = { type: 'increment', data: any } | { type: 'decrement', data: any };
interface Dispatch {
    (action: Action) : void
}

const reducer = (state: State, action: Action) => {
    return {
        age: state.age + action.data
    }
}
const Context = createContext<{state: State, dispatch: Dispatch}>(null)


// ================业务使用================================
const Son1 = () => {
    let { state } = useContext(Context)
    return <div>{state.age}</div>
}
const Son2 = () => {
    let { dispatch } = useContext(Context)
    console.log(111)  // 证明了 顶层  state 更新都会导致组件更新。
    const handleChange = () => {
        dispatch({
            type: 'increment',
            data: 111
        })
    }
    return <div onClick={handleChange}>handleChange</div>

}
export default () => {
    const [state, dispatch] = useReducer(reducer, { age: 42 });
    return <Context.Provider value={{state, dispatch}}>
        <div className='wrapper'>
            <Son1></Son1>
            <Son2></Son2>
        </div>
    </Context.Provider>

}