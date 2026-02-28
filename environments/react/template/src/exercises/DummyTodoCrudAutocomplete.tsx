import {useState,useEffect} from 'react'
import React from 'react'

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
    useEffect(()=>{
        // const getData = async () => {
        //     setIsLoading(true)
        //     setError(null)
        //     try {
        //         const response = await fetch('http://localhost:4000/api/todos')
        //         if (!response.ok) throw new Error('Data fetch failed')
        //         const data = await response.json() as Todos[]
        //         setList(data)
        //     } catch (err:unknown) {
        //         setError(err as Error)
        //     }
        //     setIsLoading(false)
        // }
        getData()
    },[])
    const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
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
            setUserText("")
        } catch(err:unknown) {
            setError(err as Error)
        }
    }
    const toggleCompletion = async (id:number,completed:boolean) => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch(`http://localhost:4000/api/todos/${id}`,{
                method:'PATCH',
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({completed:!completed})
            })
            if(!res.ok) throw new Error(`Update error ${res.status}`)
            const data = await res.json() as Todos
            setList(prev => {
                return (prev.map(todo => {
                    if (todo.id !== id) return todo
                    else return data
                }))
            })
        } catch (e:unknown) {
            setError(e as Error)
        } finally {
            setIsLoading(false)
        }
    }
    const handleDelete = async (id:number) => {
        
    }
  return (
    <div>
      <h2>Todo CRUD with Autocomplete</h2>
      <li>
        {list.map((todo,index) => {
            const completeText = todo.completed ? "Task Complete!" : "In Progress"
            return (
                <li key = {todo.id}>
                    <p>{todo.title} | {completeText}</p>
                    <button onClick={() => toggleCompletion(todo.id,todo.completed)} disabled={todo.completed}>Mark Complete</button>
                    <button onClick={() => handleDelete(todo.id)}>Delete</button>
                </li>
            )
        })}
      </li>
      <form onSubmit={handleSubmit}>
        <input type='text' value={userText} onChange={(e)=>setUserText(e.currentTarget.value)}/>
        <button type='submit'>Submit</button>
      </form>
    </div>
  );
}
