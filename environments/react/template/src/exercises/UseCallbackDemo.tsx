import { useState , useCallback , memo } from "react"

const LogButton = memo(({onClick,text}:{onClick:()=>void,text:string}) => {
  console.log('Button Rendered')
  return (
    <button onClick={onClick}>{text}</button>
  )
})

function UseCallbackDemo() {
  const [count,setCount] = useState(0)
  const handleLog = useCallback(() => {
    console.log('handleLog')
  },[])
  return (
    <div>
      <h2>useCallback Demo</h2>
      <button onClick={()=>{setCount(prev=>prev+1)}}>Increment Counter</button>
      <p>Count: {count}</p>
      <LogButton onClick={handleLog} text="Log Button"/>
    </div>
  )
}

export default UseCallbackDemo
