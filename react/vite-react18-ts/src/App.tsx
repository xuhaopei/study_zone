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

  React.useEffect(() => {
    setData(2)
  }, [])
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
    </>
  )
}

export default App
