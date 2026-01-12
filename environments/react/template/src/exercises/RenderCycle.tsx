import { useState } from 'react';

const ChildComponent = () => {
  return(
    <div>I am a child component</div>
  )
}
function RenderCycle() {
  console.log('RenderCycle rendered')
  const [parentCount,setParentCount] = useState(0)
  return (
    <div>
      <h2>React Render Cycle</h2>
      <button onClick={()=>setParentCount(prev=>prev+1)}>Update Parent</button>
      <ChildComponent/>
      <p>Parent count is: {parentCount}</p>
    </div>
  );
}

export default RenderCycle;