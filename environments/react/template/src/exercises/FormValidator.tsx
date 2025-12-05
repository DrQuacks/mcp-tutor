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

const emailError = "Email does not contain '@'"
const passwordError = "Password needs to be at least 8 characters"

function FormValidator() {
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  // const [error,setError] = useState<string[]>([])

  // const handleSubmit = () => {
  //   console.log('Submit')
  //   let messages:string[] = []
  //   if (!email.includes('@')) {
  //     console.log('bad email')
  //     messages = [...messages,emailError]
  //   }
  //   if (password.length < 8 && password.length > 0) {
  //     messages = [...messages,passwordError]
  //   }
  //   console.log('Messages: ',messages)
  //   setError(messages)
  // }

  return (
    <div>
      <h2>Sign Up Form</h2>
      <input type='email' value={email} onChange={(e)=>setEmail(e.currentTarget.value)}/>
      <input type='password' value={password} onChange={(e)=>setPassword(e.currentTarget.value)}/>
      <button>Submit</button>
      {email.length > 0 && !email.includes('@') && <p>{emailError}</p>}
      {password.length < 8 && password.length > 0 && <p>{passwordError}</p>}
      {/* {error.map(m => {
        return <p>{m}</p>
      })} */}
    </div>
  );
}

export default FormValidator;