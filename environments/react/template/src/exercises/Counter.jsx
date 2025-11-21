import { useState } from 'react';

function Counter() {
  // TODO: Add state management here
  const [count,setCount] = useState(0)
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
      <span>{count}</span>
    </div>
  );
}

export default Counter;