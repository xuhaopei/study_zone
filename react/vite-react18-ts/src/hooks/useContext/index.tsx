import React, { useState } from 'react';
import { createContext, useContext } from 'react';
export const Context = createContext<{ value, setValue }>(null)

const SonSon1 = () => {
    console.log('SonSon1')
    const { value, setValue } = useContext(Context)
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
const Son = () => {
    console.log('son')
    return <div>
        <SonSon1></SonSon1>
        <SonSon2></SonSon2>
        <SonSon3></SonSon3>
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