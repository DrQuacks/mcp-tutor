import { useState , useCallback , memo } from "react"

const LogButton = memo(({onClick,text}:{onClick:()=>void,text:string}) => {
  console.log('Button Rendered ',text)
  return (
    <button onClick={onClick}>{text}</button>
  )
})

function UseCallbackDemo() {
  const [count,setCount] = useState(0)
  const [theme,setTheme] = useState<'light'|'dark'>('light')
  const handleLog = useCallback(() => {
    console.log('handleLog count is: ',count)
  },[count])
  const handleThemeToggle = () => {
    if (theme === 'light') setTheme('dark')
    else setTheme('light')
  }
  return (
    <div>
      <h2>useCallback Demo</h2>
      <button onClick={()=>{setCount(prev=>prev+1)}}>Increment Counter</button>
      <p>Count: {count}</p>
      <LogButton onClick={handleLog} text="Log Button"/>
      <LogButton onClick={handleThemeToggle} text="Toggle Theme"/>
      <p>{theme}</p>
    </div>
  )
}

export default UseCallbackDemo
