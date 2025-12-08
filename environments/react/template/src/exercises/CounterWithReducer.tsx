import { useReducer } from 'react'

function counterReducer(state,action) {
  console.log('action is: ',action)
  switch (action.type) {
    case 'increment':
      return state + 1
    case 'decrement':
      return state - 1
    case 'reset':
      return 0
    default:
      return state
  }
}

function CounterWithReducer() {
  const [count,dispatch] = useReducer(counterReducer,0)
  return (
    <div>
      <h2>Counter with useReducer</h2>
      <p>Count: {count}</p>
      <button onClick={()=>dispatch({type:'increment'})}>Increment</button>
      <button onClick={()=>dispatch({type:'decrement'})}>Decrement</button>
      <button onClick={()=>dispatch({type:'reset'})}>Reset</button>
    </div>
  )
}

export default CounterWithReducer
