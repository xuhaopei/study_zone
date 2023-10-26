import { useDeferredValue, useState } from 'react'
import './index.css'
import * as React from 'react'

export default () => { 
    const [count, setCount] = useState<number>(1)
    const deferredValue = useDeferredValue(count)
    return (
      <>
        <h1>Vite + React {deferredValue}</h1>
        <div className="card">
          {
            new Array(10000).fill('_').map((item, index) => {
              return  <button key={index} onClick={() => setCount((count) => count + 1)}>
                count is {count}
              </button>
            })
          }
          <p>
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </>
    )
  }
