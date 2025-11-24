/**
 * React Counter Component
 * 
 * Create a Counter component with increment and reset functionality. This exercise will help you practice React state management using hooks.
 * 
 * Requirements:
 * - Use React.useState hook to manage a count state (starting at 0)
 * - Display the current count value in a paragraph element
 * - Create an 'Increment' button that increases the count by 1 when clicked
 * - Create a 'Reset' button that sets the count back to 0 when clicked
 * - Export the Counter component as the default export
 */

import { useState } from 'react';

function Counter() {
  // TODO: Add state management here
  const [count,setCount] = useState<number>(0)
  
  return (
    <div>
      {/* TODO: Display count and add buttons */}
      <button onClick={()=>{setCount(prev=>prev+1)}}>Increment</button>
      <button onClick={()=>{setCount(0)}}>Reset</button>
      <span>{count}</span>
    </div>
  );
}

export default Counter;