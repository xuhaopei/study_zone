import React, { useState, memo, useReducer, useSyncExternalStore, useEffect, useTransition } from 'react';
import { createContext, useContext } from 'react';
import './index.css'
// ==============常用场景：本质上是用于一些不是很急迫的更新上，交互体验优化，使用transition控制的组件显示能够被中断，以此保证交互性。============================


const ComNormal1 = () => {
    return <div>正常组件1hhhhhhhhhhhhhhhhh</div>
}
const ComNormal2 = () => {
    return <div>正常组件2hhhhhhhhhhhhhhhhh</div>
}
const ComSlow = () => {
    let startTime = 1000000000;
    while (startTime-- > 1) {
    }
    let items = [];
    for (let i = 0; i < 500; i++) {
      items.push(<ComSlowItem key={i} index={i} />);
    }
    return <div>{items}</div>
}
const ComSlowItem = ({ index }) => {
    let startTime = performance.now();
    while (performance.now() - startTime < 1) {
      // 每个 item 都等待 1 毫秒以模拟极慢的代码。
    }
  
    return (
      <li className="item">
        Post #{index + 1}
      </li>
    );
  } 
// =============业务使用=================
export default () => {
    let [name, setName] = useState(1)
    let [isPending, transition] = useTransition()
    return <div className='wrapper'>
        <button onClick={() => setName(1)}>正常组件1</button>
        <button onClick={() => transition(() => setName(2))}>使用transition的慢组件，可以中断点击其他按钮</button>
        <button onClick={() => setName(2)}>不使用transition的慢组件，不能中断点击其他按钮</button>
        <button onClick={() => setName(3)}>正常组件2</button>
        { isPending && <div>ppppending</div>}
        {
            name === 1 && <ComNormal1></ComNormal1>
        }
        {
            name === 2 && <ComSlow></ComSlow>
        }
        {
            name === 3 && <ComNormal2></ComNormal2>
        }
    </div>

}