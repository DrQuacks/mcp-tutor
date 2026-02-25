import { useEffect, useState } from 'react';

function useStoreData({identifier,fallback}:{identifier:string,fallback:string}) {
  const [value,setValue] = useState(localStorage.getItem(identifier) || fallback)
  useEffect(() => {
    localStorage.setItem(identifier,value)
  },[value,identifier])
  const changeValue = (newValue:string) => {
    setValue(newValue)
  }
  return {value,changeValue}
}

const useWindowSize = () => {
  const [size,setSize] = useState({width:window.innerWidth,height:window.innerHeight})
  const updateSize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    console.log('width is: ', width)
    setSize({width,height})
  }
  useEffect(() => {
    window.addEventListener('resize',updateSize)
    return () => {
      window.removeEventListener('resize',updateSize)
    }
  },[])
  return size
}

const useSmall = () => {
  const size = useWindowSize()
  const isSmall = size.width < 450
  return isSmall
}


function CustomHooks() {
  const {value,changeValue} = useStoreData({identifier:'my-data',fallback:'Empty String'})
  const isSmall = useSmall()
  const sizeText = isSmall ? "Window is small" : "Window is large"
  return (
    <div> 
      <h2>Custom Hooks</h2>
      <input type="text" value={value} onChange={(e) => changeValue(e.currentTarget.value)}/>
      <p>{sizeText}</p>
    </div>
    
  );
}

export default CustomHooks;