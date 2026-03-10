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

type Todo = {id:string,text:string,completed:boolean}

function TodoList() {
  const [todos,setTodos] = useState<Todo[]>([])
  const [userText,setUserText] = useState("")

  const clickHandler = () => {
    const newTodo:Todo = {id:crypto.randomUUID(),text:userText,completed:false}
    setUserText("")
    setTodos(prev => [...prev,newTodo])
  }

  const completedHandler = (id:string) => {
    setTodos(prev => {
      const newTodos = prev.map(todo => {
        if (todo.id === id) return {...todo,completed:!todo.completed}
        else return todo
      })
      return newTodos
    })
  }
  
  return (
    <div>
      <h2>My Todos</h2>
      <input type='text' value={userText} onChange={(e) => setUserText(e.currentTarget.value)} />
      <button onClick={clickHandler}>Add</button>
      <ul>
        {todos.map(todo => {
          const textType = todo.completed ? 'line-through' : 'none'
          return (<li style={{textDecoration:textType}} onClick={() => completedHandler(todo.id)}>{todo.text}</li>)
        })}
      </ul>
    </div>
  );
}

export default TodoList;