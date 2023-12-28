import React, { useState } from 'react';
import { createContext, useContext } from 'react';
export const Context = createContext<{ value, setValue }>(null)
export const Context2 = createContext<{ value, setValue }>(null)

// ==============常用场景：跨组件通信================
const SonSon1 = () => {
    console.log('SonSon1')
    const { value, } = useContext(Context)
    return <div>{value}</div>
}
const SonSon2 = () => {
    console.log('SonSon2')
    const { value, setValue } = useContext(Context)
    return <div onClick={() => setValue(value + 1)}>change value: {value}</div>
}
const SonSon3 = () => {
    console.log('SonSon3')
    return <div >SonSon3</div>
}

const SonSon4 = ({ children }) => {
    console.log('SonSon3')
    const [value, setValue] = useState(12)
    return <Context2.Provider value={{ value, setValue }}>
        {children}
    </Context2.Provider>
}
const SonSon4Son1 = () => {
    const { value } = useContext(Context2)
    return <div >SonSon4Son1 {value}</div>
}
const Son = () => {
    console.log('son')
    return <div>
        <SonSon1></SonSon1>
        <SonSon2></SonSon2>
        <SonSon3></SonSon3>
        <SonSon4>
            <SonSon4Son1></SonSon4Son1>
        </SonSon4>
    </div>
}
const CustomContext = ({ children }) => {
    const [value, setValue] = useState(0)
    return <Context.Provider value={{ value, setValue }}>
        {children}
    </Context.Provider>
}
export default () => {
    return <CustomContext>
        <Son></Son>
    </CustomContext>
}