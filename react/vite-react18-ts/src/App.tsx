import UseContext from '@/hooks/useContext'
import UseDeferredValue from '@/hooks/useDeferredValue'
import UseMemo from '@/hooks/useMemo'
import UseLayoutEffect from './hooks/useLayoutEffect'
import UseReducer from './hooks/useReducer'
import UseSyncExternalStore from './hooks/useSyncExternalStore'
import UseTransition from './hooks/useTransition'
import Memo from './apis/memo'
import './App.css'
import * as React from 'react'

function App() {
  return (
    <>
    {/* <UseContext></UseContext>*/}
    {/* <UseMemo></UseMemo> */}
    {/* <UseDeferredValue></UseDeferredValue> */}
    {/* <UseLayoutEffect></UseLayoutEffect> */}
    {/* <UseReducer></UseReducer> */}
    {/* <UseSyncExternalStore></UseSyncExternalStore> */}
    {/* <UseTransition></UseTransition> */}
    <Memo></Memo>
    </>
  )
}

export default App
