import { useQuery } from "@tanstack/react-query";

const fetchUser = async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/users/1')
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

export default function ReactQueryDemo() {
  const {data,isLoading,isError,error,refetch} = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser
  })
  return (
    <div>
      <h2>User Data with React Query</h2>
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error: {error.message}</div>}
      {data && <div>{data.name}</div>}
      <button onClick={()=>refetch()}>Refetch User</button>
    </div>
  );
}