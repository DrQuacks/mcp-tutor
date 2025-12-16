import { useState,useEffect } from "react";
type User = {name:string,email:string}
export default function UserProfile() {
  const [user,setUser] = useState<User | null>(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState<string | null>(null)
  useEffect(()=>{
    const fetchUser = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users/1')
        if (!response.ok) throw new Error('Failed to fetch user')
        const result = await response.json()
        setUser(result)
      } catch (err:any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  },[])

  const DataElement = () => {
    if (loading) return <div>Loading user...</div>
    if (error) return <div>Error: {error}</div>
    if (user) return (
      <div>
        <h2>{user.name}</h2> 
        <p>{user.email}</p>
      </div>
    )
    if (!user && !error && !loading) return null
  }

  return (
    <div>
      <h2>User Profile</h2>
      <DataElement/>
    </div>
  );
}