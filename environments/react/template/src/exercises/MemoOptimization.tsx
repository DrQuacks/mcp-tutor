import { useState , useMemo, useEffect, useCallback, memo } from 'react';

  const MemoChild = memo(({onClick}:{onClick:()=>void})=>{
    console.log('MemoChild rendered')
    return (
      <button onClick={onClick}>Click Child</button>
    )
  })
function MemoOptimization() {
  const [numbers,setNumbers] = useState([1,2,3,4,5])
  const [count,setCount] = useState(0)
  const [userId,setUserId] = useState(1)
  const [renderCount,setRenderCount] = useState(0)
  const [parentCount,setParentCount] = useState(0)
  const [callbackCount,setCallbackCount] = useState(0)
  const handleBadClick = useCallback(()=>{
    console.log('Bad callback, count is: ',+callbackCount)
  },[])
    const handleGoodClick = useCallback(()=>{
    console.log('Good callback, count is: ',+callbackCount)
  },[callbackCount])
    const handleBestClick = useCallback(()=>{
    setCallbackCount(prev=>prev+1)
  },[])
  const handleChildClick = useCallback(()=>{
    console.log('Child clicked!')
  },[])
  const user = useMemo(()=>{
    return {id:userId, name: 'User '+userId}
  },[userId])
  useEffect(()=>{
    console.log('User object changed: '+JSON.stringify(user))
  },[user])
  const sum = useMemo(() => {
    return (numbers.reduce((acc,num) => {
    console.log('Calculating Sum')
    return acc+num
  },0))},[numbers])

  return (
    <div>
      <h2>Memoization Optimization</h2>
      <button onClick={()=>setCount(prev=>prev+1)}>Increment Count</button>
      <button onClick={()=>setNumbers(prev=>([...prev,Math.floor(Math.random()*100)]))}>Add Number</button>
      <button onClick={()=>setRenderCount(prev=>prev+1)}>Trigger Render</button>
      <button onClick={()=>setUserId(prev=>prev+1)}>Change User</button>
      <button onClick={()=>setParentCount(prev=>prev+1)}>Update Parent</button>
      <MemoChild onClick={handleChildClick}/>
      <button onClick={handleBadClick}>Bad Callback</button>
      <button onClick={handleGoodClick}>Good Callback</button>
      <button onClick={handleBestClick}>Best Callback</button>
      <p>Count is: {count}</p>
      <p>Sum is: {sum}</p>
      <p>Render count is: {renderCount}</p>
      <p>Username is: {user.name}</p>
      <p>Callback count is: {callbackCount}</p>
    </div>
  );
}

export default MemoOptimization;