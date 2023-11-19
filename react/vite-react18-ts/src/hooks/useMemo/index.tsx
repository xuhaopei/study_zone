import React, { useState, memo } from 'react';
import { createContext, useContext } from 'react';
export const Context = createContext<{ value, setValue }>(null)

const SonSon2 = ({ title }: any) => {
    console.log('SonSon2')
    const { value, setValue } = useContext(Context)
    return <div onClick={() => setValue(value + 1)}>change value: {value} SonSon2</div>
}
const SonSon3 = ({ title }: any) => {
    console.log(title)
    return <div >{title}</div>
}
const SonSon4 = memo(({ title }: any) => {
    console.log(title)
    return <div >{title}</div>
})
const Sons = () => {
    useContext(Context)
    return <div>
        <SonSon2></SonSon2>
        <SonSon3 title={'no memo SonSon3'}></SonSon3>
        <SonSon4 title={'memo SonSon4'}></SonSon4>
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
        <Sons></Sons>
    </CustomContext>
}