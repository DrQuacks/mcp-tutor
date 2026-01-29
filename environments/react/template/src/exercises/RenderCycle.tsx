import { useState , useEffect } from 'react';

const Child = () => {
  console.log('Child Rendered')
  return (
    <div>I'm a Child</div>
  )
}
function RenderCycle() {
  console.log('Component Rendered')
  const [counter,setCounter] = useState(0)
  const [renderCount,setRenderCount] = useState(0)
  console.log('RENDER PHASE: Computing JSX, renderCount = ' + renderCount)
  useEffect(()=>{
    console.log("COMMIT PHASE: DOM updated")
  })
  useEffect(()=>{
    console.log("COMMIT PHASE: Initial mount only")
  },[])

  return (
    <div>
      <h2>React Render Cycle</h2>
      <button onClick={()=>setCounter(prev=>prev+1)}>Raise Count</button>
      <button onClick={()=>setRenderCount(prev=>prev+1)}>Raise Render Count</button>
      <Child/>
      <p>Parent Count is: {counter}</p>
      <p>Render Count is: {renderCount}</p>
    </div>
  );
}

export default RenderCycle;