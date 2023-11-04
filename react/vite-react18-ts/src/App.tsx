import UseContext from '@/hooks/useContext'
import UseDeferredValue from '@/hooks/useDeferredValue'
import UseMemo from '@/hooks/useMemo'
import UseLayoutEffect from './hooks/useLayoutEffect'
import './App.css'
import * as React from 'react'

function App() {
  return (
    <>
    {/* <UseContext></UseContext>*/}
    {/* <UseMemo></UseMemo> */}
    {/* <UseDeferredValue></UseDeferredValue> */}
    <UseLayoutEffect></UseLayoutEffect>
    </>
  )
}

export default App
