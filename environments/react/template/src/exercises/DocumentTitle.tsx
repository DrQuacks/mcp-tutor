/**
 * Document Title Updater
 * 
 * Build a component that uses useEffect to update the browser's document title based on a counter value.
 * 
 * Requirements:
 * - Create a counter state initialized to 0
 * - Display the counter value
 * - Add a button with text 'Increment' that increases the counter
 * - Use useEffect to update document.title to show 'Count: X' where X is the current count
 * - The title should update whenever the count changes
 */

import { useEffect,useState } from "react"
function DocumentTitle() {
  const [count,setCount] = useState(0)
  useEffect(()=>{
    document.title = 'Count: '+count
  },[count])
  return (
    <div>
      <h2>Document Title Updater</h2>
      <p>Count: {count}</p>
      <button onClick={()=>setCount(prev=>prev+1)}>Increment</button>
    </div>
  )
}

export default DocumentTitle
