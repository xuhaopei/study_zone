import { useState, useLayoutEffect, useEffect } from 'react'
import './index.css'
import * as React from 'react'
const Loading = () => {
  return <div>loading...</div>
}
const count = () => {
  console.log('count')
}
export default () => { 
  const [query, setQuery] = useState('a');
  // const [num1, setNum1] = useState()
  useEffect(() => {
    console.log('useEffect')
    count()
  },[query])
  useLayoutEffect(() => {
    console.log('useLayoutEffect')
  },[query])
    return (
      <div>
        <input value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      
    )
  }
