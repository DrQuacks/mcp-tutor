import { useState } from "react";

const tasks = [
  { id: 1, title: 'Review pull request', status: 'completed' },
  { id: 2, title: 'Write documentation', status: 'pending' },
  { id: 3, title: 'Fix bug in auth', status: 'pending' },
  { id: 4, title: 'Update dependencies', status: 'completed' },
  { id: 5, title: 'Design new feature', status: 'pending' }
]
const filterTypes = ['all','completed','pending']
export default function FilterableList() {
  const [searchQuery,setSearchQuery] = useState("")
  const [statusFilter,setStatusFilter] = useState('all')

  const filteredTasks = tasks.filter(task => {
    const isTitle = task.title.toLowerCase().includes(searchQuery.toLowerCase())
    const isStatus = statusFilter === 'all' ? true : task.status === statusFilter
    return isTitle && isStatus
  })
  return (
    <div>
      <h2>Task List</h2>
      <input 
        type="text" 
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e)=>setSearchQuery(e.currentTarget.value)}
      />
      {filterTypes.map(fil => {
        return (
          <button
            key={fil}
            style={{fontWeight: statusFilter === fil ? 'bold':'normal'}}
            onClick={()=>setStatusFilter(fil)}
          >
            {fil}
          </button>
        )
      })}
      <p>Showing {filteredTasks.length} of {tasks.length} tasks</p>
      <ul>
        {filteredTasks.map(task =>{
          return(
            <li key={task.id}>Task: {task.title} Status: {task.status}</li>
          )
        })}
      </ul>
    </div>
  );
}