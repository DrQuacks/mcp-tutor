import { useState } from 'react';

const Child = () => {
  console.log('Child Rendered')
  return (
    <div>I'm a Child</div>
  )
}
function RenderCycle() {
  console.log('Component Rendered')
  const [counter,setCounter] = useState(0)

  return (
    <div>
      <h2>React Render Cycle</h2>
      <button onClick={()=>setCounter(prev=>prev+1)}>Raise Count</button>
      <Child/>
      <p>Parent Count is: {counter}</p>
    </div>
  );
}

export default RenderCycle;