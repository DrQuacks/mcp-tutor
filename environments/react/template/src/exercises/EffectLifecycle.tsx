import { useState , useEffect } from 'react';

type User = {name:string,age:number}
function EffectLifecycle() {
  const [count,setCount] = useState(0)
  const [user,setUser] = useState<User>({name:'Alice',age:25})
  const dummy:User = {name:"joe",age:13}
  useEffect(()=>{
    console.log('Component mounted')
    return(()=>{
      console.log('Component unmounted')
    })
  },[])
  useEffect(()=>{
    console.log('Count changed to: ',count)
    return(()=>{
      console.log('Cleanup ran')
    })
  },[count])
  useEffect(()=>{
    console.log('Component rendered')
  })
  useEffect(()=>{
    console.log('Name is: ',user.name)
  },[user.name])
  useEffect(()=>{
    console.log('Dummy name is: ',dummy.name)
  },[dummy.name])
  console.log('Component rendered outside useEffect')
  return (
    <div>
      <h2>useEffect Lifecycle</h2>
      <button onClick={()=>setCount(prev=>prev+1)}>Increment</button>
      <p>Count is: {count}</p>
      <button onClick={()=>setUser(prev=>{return {...prev,age:prev.age+1}})}>Add age</button>
      <p>Name: {user.name}, Age: {user.age}</p>
    </div>
  );
}

export default EffectLifecycle;