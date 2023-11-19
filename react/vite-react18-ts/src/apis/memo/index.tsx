import React, { useState, memo } from 'react';
import { createContext, useContext } from 'react';
export const Context = createContext<{ value, setValue }>(null)

// ==============常用场景，性能优化，让子组件不会因为组件的更新而更新（没有diff算法）。使用说明：当 props 没有改变时跳过重新渲染===========================
// 当父组件更新 该组件会render执行diff 表现是：有执行console.log方法
const SonSon1 = ({ title }: any) => {
    console.log(title)
    return <div >{title}</div>
}
// 当父组件更新 该组件并没有render 表现是：没有执行console.log方法 
const SonSon2 = memo(({ title }: any) => {
    console.log(title)
    return <div >{title}</div>
})

export default () => {
    const [data, setData] = useState(0)
    console.log('父组件更新，导致子组件更新')
    return <>
        <button onClick={() => setData(data + 1)}>调用setState, 使组件更新, {data}</button>
        <SonSon1 title={'no memo SonSon1'}></SonSon1>
        <SonSon2 title={'memo SonSon2'}></SonSon2>
    </>
}