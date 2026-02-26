import { useEffect, useState } from 'react';

type Todos = {
    id: number;
    title: string;
    completed: boolean;
}

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



const useResource = (identifier:string) => {
  const [data,setData] = useState<Todos[]|null>(null)
  const [isLoading,setIsLoading] = useState(false)
  const [error,setError] = useState<Error|null>(null)
  const [sessionID,setSessionID] = useState(0)

  const refetch = () => {
    setSessionID(prev => prev+1)
  }

  useEffect(()=>{
    const getData = async () => {
      setIsLoading(true)
      setData(null)
      setError(null)
      try {
        const response = await fetch(`http://localhost:4000/api/${identifier}`)
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`)
        }
        const newData = await response.json()
        setData(newData as Todos[])
      } catch (err:unknown) {
        setError(err as Error)
      }
      setIsLoading(false)
    }
    getData()
  },[identifier,sessionID])
  return {data,isLoading,error,refetch}
}


function CustomHooks() {
  const {value,changeValue} = useStoreData({identifier:'my-data',fallback:'Empty String'})
  const {data,isLoading,error,refetch} = useResource('todos')
  const isSmall = useSmall()
  const sizeText = isSmall ? "Window is small" : "Window is large"
  return (
    <div> 
      <h2>Custom Hooks</h2>
      <input type="text" value={value} onChange={(e) => changeValue(e.currentTarget.value)}/>
      <p>{sizeText}</p>
      <ul>
      {data && data.map(d => {
        return (<li>{d.title}</li>)
      })}
      </ul>
      {isLoading ? <p>Patience Please!</p>:<p>All Done!</p>}
      {error && <p>{error.message}</p>}
      <button onClick={refetch}>Refetch</button>
    </div>
    
  );
}

export default CustomHooks;