import { useState , useMemo } from 'react';

function MemoOptimization() {
  const [numbers,setNumbers] = useState([1,2,3,4,5])
  const [count,setCount] = useState(0)
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
      <p>Count is: {count}</p>
      <p>Sum is: {sum}</p>
    </div>
  );
}

export default MemoOptimization;