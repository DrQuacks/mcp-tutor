import { useState , useEffect } from 'react';

function EffectLifecycle() {
  useEffect(()=>{
    console.log('Component mounted')
    return(()=>{
      console.log('Component unmounted')
    })
  },[])
  return (
    <div>
      <h2>useEffect Lifecycle</h2>
    </div>
  );
}

export default EffectLifecycle;