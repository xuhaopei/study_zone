import UseContext from '@/hooks/useContext'
import UseDeferredValue from '@/hooks/useDeferredValue'
import UseMemo from '@/hooks/useMemo'
import UseLayoutEffect from './hooks/useLayoutEffect'
import UseReducer from './hooks/useReducer'
import UseSyncExternalStore from './hooks/useSyncExternalStore'
import UseTransition from './hooks/useTransition'
import Memo from './apis/memo'
import UseDebonce from './hooks/useDebonce'
import './App.css'
import * as React from 'react'
import { initStore, initReducer, Context } from '@/stroe'
function App() {
  // const [state, dispacth] = React.useReducer(initReducer, initStore)
  console.log('app')
  const [data, setData] = React.useState(1)
  const [hegiht, setHeight] = React.useState(100)
  const ele = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    console.log('useEffect',ele.current.getBoundingClientRect())
    ele.current.style.height = '200px'
  }, [])
  React.useLayoutEffect(() => {
    console.log('useLayoutEffect',ele.current.getBoundingClientRect())
    ele.current.style.height = '200px'
  }, [hegiht])

  return (
    <>
    {/* <UseContext></UseContext> */}
    {/* <UseMemo></UseMemo> */}
    {/* <UseDeferredValue></UseDeferredValue> */}
    {/* <UseLayoutEffect></UseLayoutEffect> */}
    {/* <UseReducer></UseReducer> */}
    {/* <UseSyncExternalStore></UseSyncExternalStore> */}
    {/* <UseTransition></UseTransition> */}
    {/* <Memo></Memo> */}
    {/* <UseDebonce></UseDebonce> */}
    {/* <Context.Provider value={{state, dispacth}}></Context.Provider> */}
    <div style={{height: `${hegiht}px`, background: 'red', width: '100px'}} ref={ele}></div>
    </>
  )
}

export default App
