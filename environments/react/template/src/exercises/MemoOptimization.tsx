import { useState , useMemo, useEffect } from 'react';

function MemoOptimization() {
  const [numbers,setNumbers] = useState([1,2,3,4,5])
  const [count,setCount] = useState(0)
  const [userId,setUserId] = useState(1)
  const [renderCount,setRenderCount] = useState(0)
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
      <p>Count is: {count}</p>
      <p>Sum is: {sum}</p>
      <p>Render count is: {renderCount}</p>
      <p>Username is: {user.name}</p>
    </div>
  );
}

export default MemoOptimization;