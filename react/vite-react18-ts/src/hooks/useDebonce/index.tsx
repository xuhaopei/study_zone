import React, { useEffect, useRef, useState } from 'react';

const useDebonce = (value, limitTime) => {
    const [debonceValue, setDebonceValue] = useState(value)
    useEffect(() => {
        let timer = setTimeout(() => {
            setDebonceValue(value)
        }, limitTime);
        return () => {
            clearTimeout(timer)
        }
    }, [value])
    return debonceValue
}
requestAnimationFrame
export default () => {
    const [value, setValue] = useState(0)
    const value1 = useDebonce(value, 500)
    return <div>
        <p>value {value}</p>
        <p>value1 {value1}</p>
        <button onClick={() => setValue(value + 1)}>add</button>
    </div>
}