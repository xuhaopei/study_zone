import React, { useState, memo, useReducer, useSyncExternalStore, useEffect } from 'react';
import { createContext, useContext } from 'react';

// ==============常用场景：订阅浏览器API事件 或者 订阅第三方SDK事件， 建议封装成HOOK============================
const getSnapshot = () => {
    return document.hidden
}
const subscribe = (callback) => {
    window.addEventListener('visibilitychange', callback)

    return () => {
        window.removeEventListener('visibilitychange', callback)
    }
}
const useHookVisibilitychange = () => {
    const documentIsHidden = useSyncExternalStore(subscribe, getSnapshot)
    return documentIsHidden
}


// =============业务使用=================
export default () => {
    const documentIsHidden = useHookVisibilitychange()
    useEffect(() => {
        console.log('documentIsHidden', documentIsHidden)
    }, [documentIsHidden])
    return <div className='wrapper'>
        {documentIsHidden + '_'}
    </div>

}