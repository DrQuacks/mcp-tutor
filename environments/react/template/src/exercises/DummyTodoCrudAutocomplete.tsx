import {useState,useEffect} from 'react'

type Todos = {
    id: number;
    title: string;
    completed: boolean;
}
export default function DummyTodoCrudAutocomplete() {
    const [list,setList] = useState<Todos[]>([])
    const [isLoading,setIsLoading] = useState(false)
    const [error,setError] = useState<Error|null>(null)
    const [userText,setUserText] = useState("")
    useEffect(()=>{
        const getData = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await fetch('http://localhost:4000/api/todos')
                if (!response.ok) throw new Error('Data fetch failed')
                const data = await response.json() as Todos[]
                setList(data)
            } catch (err:unknown) {
                setError(err as Error)
            }
            setIsLoading(false)
        }
        getData()
    },[])
    const handleSubmit = async (e:React.MouseEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('http://localhost:4000/api/todos',{
                method:'POST',
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({title:userText})
            })
            if (!res.ok) throw new Error(`Post error ${res.status}`)
            const data = await res.json() as Todos
            setList(prev => [...prev,data])
        } catch(err:unknown) {
            setError(err as Error)
        }
    }
  return (
    <div>
      <h2>Todo CRUD with Autocomplete</h2>
      <input type='text' value={userText} onChange={(e)=>setUserText(e.currentTarget.value)}/>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
