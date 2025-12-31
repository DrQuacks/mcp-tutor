import { useState , useRef, useEffect } from 'react';

function RefMastery() {
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<number>(null)
  const [count,setCount] = useState(0)
  const [score,setScore] = useState(0)
  const [stateClicks,setStateClicks] = useState(0)
  const refClicksRef = useRef(0)

  const previousScoreRef = useRef(0)
  const startTimer = () => {
    timerRef.current = setInterval(()=>{
      setCount(prev=>prev+1)
    },1000)
  }
  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
    }
  }
  useEffect(()=>{
    console.log('Previous score: ',previousScoreRef.current)
    console.log('Current score: ',score)
    previousScoreRef.current = score
  },[score])
  const clickMeHandler = () => {
    refClicksRef.current = refClicksRef.current + 1
    console.log('Ref clicks: ',refClicksRef.current)
  }
  return (
    <div>
      <h2>useRef Mastery</h2>
      <input ref={inputRef} type='text'></input>
      <button onClick={()=>{inputRef.current?.focus()}}>Focus Input</button>
      <button onClick={startTimer}>Start Timer</button>
      <button onClick={stopTimer}>Stop Timer</button>
      <button onClick={()=>setScore(prev=>prev+10)}>Increase Score</button>
      <button onClick={clickMeHandler}>Click Me</button>
      <button onClick={()=>setStateClicks(prev=>prev+1)}>Trigger Re-render</button>
      <p>Count is: {count}</p>
      <p>Score is: {score}</p>
      <p>State: {stateClicks}</p>
      <p>Ref: {refClicksRef.current}</p>
    </div>
  );
}

export default RefMastery;