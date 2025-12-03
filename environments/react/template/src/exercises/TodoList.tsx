/**
 * Simple Todo List
 * 
 * Create a simple todo list where users can add items and mark them as complete. This exercise teaches you how to work with arrays in state, handle form submissions, and map over data to render lists.
 * 
 * Requirements:
 * - Use React.useState to manage an array of todo items (starting empty)
 * - Use React.useState to manage the current input text (starting as empty string)
 * - Each todo item should have: id (number), text (string), and completed (boolean)
 * - Render a text input for entering new todos
 * - Render an 'Add' button that adds the current input to the list
 * - Display all todos in a list, showing their text
 * - When a todo is clicked, toggle its completed status
 * - Completed todos should have a 'line-through' text decoration
 * - Export the TodoList component as the default export
 */

import { useState } from 'react';

type TodoItem = {id:number,text:string,completed:boolean}

function TodoList() {
  const [input,setInput] = useState("")
  const [list,setList] = useState<TodoItem[]>([])
  const [id,setId] = useState(0)
  console.log('list state is: ',list)

  const submitHandler = () => {
    setList((prev) => {
      const newEntry:TodoItem = {id,text:input,completed:false}
      return [...prev,newEntry]
    })
    setId((prev) => prev+1)
  }

  const clickHandler = (index:number) => {
    console.log('clicked index: ',index)
    setList(prev => {
      const newList = prev.map((item,i) => {
        if (i === index) {
          const newCompleted = !item.completed
          return {...item,completed:newCompleted}
        }
        return item
      })
      return newList
    })
  }
  
  return (
    <div>
      <h2>My Todos</h2>
      <input type="text" value={input} onChange={(e)=>{setInput(e.currentTarget.value)}}/>
      <button onClick={submitHandler}>Add</button>
      <ul>
        {list.map((item,index) => {
          return (<li style={{textDecoration: item.completed ? 'line-through' : 'none'}} onClick={() => clickHandler(index)}>{item.text}</li>)
        })}
      </ul>
    </div>
  );
}

export default TodoList;