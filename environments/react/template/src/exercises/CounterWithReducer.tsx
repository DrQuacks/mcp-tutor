import { useReducer } from 'react'

function counterReducer(state,action) {
  switch (action.type) {
    case 'increment':
      return state + 1
    case 'decrement':
      return state - 1
    default:
      return state
  }
}

function CounterWithReducer() {
  const [count,dispatch] = useReducer(counterReducer,0)
  return (
    <div>
      <h2>Counter with useReducer</h2>
    </div>
  )
}

export default CounterWithReducer
