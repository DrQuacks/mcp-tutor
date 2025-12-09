import { useState } from 'react';


export default function FetchWithTryCatch() {
  // Your code here
  const [user,setUser] = useState<string|null>(null)
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<string|null>(null)

  const fetchUser = async () => {
    try {
      //logic
      setLoading(true)
      setError(null)
      const response = await fetch('https://jsonplaceholder.typicode.com/users/1')
      const result = await response.json()
      setUser(result.name)
      setLoading(false)
    } catch (err:any) {
      //more logic
      setError(err.message || 'Failed to fetch user')
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Fetch User Data</h2>
      {/* Your UI here */}
      <button onClick={fetchUser}>Fetch User</button>
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      {user ? <div>{user}</div>:<div>No user loaded</div>}
    </div>
  );
}