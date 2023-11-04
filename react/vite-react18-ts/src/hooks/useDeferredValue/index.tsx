import { useDeferredValue, useState, Suspense, lazy } from 'react'
import './index.css'
import * as React from 'react'
const Data = lazy(() => import('@/components/Data'))
const Loading = () => {
  return <div>loading...</div>
}
export default () => { 
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
    return (
      <div>
        <input value={query} onChange={e => setQuery(e.target.value)} />
        <Suspense fallback={<Loading></Loading>}>
          <Data data={deferredQuery}></Data>
        </Suspense>
      </div>
      
    )
  }
