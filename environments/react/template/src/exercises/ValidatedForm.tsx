import { useState } from "react";

type Priority = "low"|"medium"|"high"
type FormData = {title:string,description:string,priority:string}
//type FormErrors = {title:string,description:string,priority:string}
const validate = (formData:FormData) => {
  const newErrors:FormData = {
    title:"",
    description:"",
    priority:""
  }
  let isError = false
  const {title,description,priority} = formData
  if (title.trim().length === 0) {
    newErrors.title = "Title is required"
    isError = true
  } else if (title.trim().length < 3) {
    newErrors.title = "Title must be at least 3 characters"
    isError = true
  }
  if (description.trim().length === 0) {
    newErrors.description = "Description is required"
    isError = true
  } else if (description.trim().length < 10) {
    newErrors.description = "Description must be at least 10 characters"
    isError = true
  }
  if (!(priority === "low" || priority === "medium" || priority === "high")) {
    newErrors.priority = "Priority must be low, medium, or high"
    isError = true
  }
  return {newErrors,isError}
}

export default function ValidatedForm() {
  const [formData,setFormData] = useState({
    title:"",
    description:"",
    priority:"medium"
  })
  const [errors,setErrors] = useState({
    title:"",
    description:"",
    priority:""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name,value} = e.currentTarget
    setFormData(prev=>({...prev,[name]:value}))
    if (name in errors) {
      if (errors[name as 'title'|'description'|'priority']) {
        setErrors(prev =>({...prev,[name]:''}))
      }
    }
  }
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const {newErrors,isError} = validate(formData)
    if (!isError) {
      console.log(formData)
      setFormData({
        title:"",
        description:"",
        priority:"medium"
      })
    }
    setErrors(newErrors)
  }
  return (
    <div>
      <h2>Create Task</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type = "text"
            id = "title"
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
          />
          {errors.title.length > 0 && <p>{errors.title}</p>}
        </div>
        <div>
          <textarea
            id = "description"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description.length > 0 && <p>{errors.description}</p>}
        </div>
        <div>
          <select id = "priority" name="priority" value={formData.priority} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {errors.priority.length > 0 && <p>{errors.priority}</p>}
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}