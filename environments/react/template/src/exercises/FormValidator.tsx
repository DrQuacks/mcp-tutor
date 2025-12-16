/**
 * Form Validator
 * 
 * Create a simple form with email and password inputs that validates user input and shows error messages. This exercise teaches form handling, validation logic, conditional rendering, and managing multiple pieces of state.
 * 
 * Requirements:
 * - Use React.useState to manage email input (starting as empty string)
 * - Use React.useState to manage password input (starting as empty string)
 * - Render an email input field (type='email')
 * - Render a password input field (type='password')
 * - Render a submit button with text 'Submit'
 * - Show an error message if email is non-empty and doesn't contain '@'
 * - Show an error message if password is non-empty and has less than 8 characters
 * - Error messages should appear as paragraph elements with the text of the error
 * - Export the FormValidator component as the default export
 */

import { useState } from 'react';

function FormValidator() {
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [errors,setErrors] = useState({email:'',password:''})
  const submitHandler = (e) => {
    e.preventDefault()
    let isValid = true
    if (email.length > 0 && !email.includes('@')){
      setErrors(prev=>({...prev,email:'Please enter valid email'}))
      isValid=false
    }
    if (password.length > 0 && password.length < 8) {
      setErrors(prev=>({...prev,password:'Please enter a valid password'}))
      isValid=false
    }
    if (isValid) {
      console.log('Email is: ',email,'. Password is: ',password)
    }
  }
  return (
    <div>
      <h2>Sign Up Form</h2>
      <form onSubmit={submitHandler} noValidate>
        <input
          type="email"
          value={email}
          onChange={(e)=>{
            setErrors(prev=>({...prev,'email':''}))
            setEmail(e.currentTarget.value)
          }}
          required
          placeholder='Email'
        />
        <input
          type="password"
          value={password}
          onChange={(e)=>{
            setErrors(prev=>({...prev,'password':''}))
            setPassword(e.currentTarget.value)
          }}          
          required
          placeholder='Password'
        />
        <button type="submit">Submit</button>
        {(email.length > 0 && !email.includes('@')) && <p>Please enter valid email with a @</p>}
        {(password.length > 0 && password.length < 8) && <p>Please enter a valid password at least 8 characters</p>}
      </form>
    </div>
  );
}

export default FormValidator;