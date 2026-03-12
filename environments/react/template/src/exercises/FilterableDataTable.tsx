import { useState } from 'react';

type SortDirection = 'up' | 'down' | 'neither'
type Columns = 'name' | 'email' |'role'

// Local, static data for this exercise
const INITIAL_USERS = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Editor' },
  { id: 3, name: 'Carol Lee', email: 'carol@example.com', role: 'Viewer' },
  { id: 4, name: 'David Kim', email: 'david@example.com', role: 'Editor' },
  { id: 5, name: 'Eva Brown', email: 'eva@example.com', role: 'Viewer' },
];


  const ArrowButton = ({clickHandler,sortDirection}:{clickHandler: () => void,sortDirection:SortDirection}) => {
    const arrow = sortDirection === "up" ? '↑' : sortDirection === "down" ? '↓' : '-'
    return (<button onClick={clickHandler}>{arrow}</button>)
  }

  const Header = ({title,clickHandler,sortDirection,sortColumn}:{title:Columns,clickHandler: (column: Columns) => void,sortDirection:SortDirection,sortColumn:Columns}) => {
    const actualDirection = title === sortColumn ? sortDirection : 'neither'
    return (
        <th>{title.toUpperCase()} {<ArrowButton clickHandler={() => clickHandler(title)} sortDirection={actualDirection} />}</th>
    )
  }

export default function FilterableDataTable() {
    const [userText,setUserText] = useState("")
    const [sortDirection,setSortDirection] = useState<SortDirection>("up")
    const [sortColumn,setSortColumn] = useState<Columns>("name")
  // You'll implement state, filtering, and sorting here based on the exercise description.
  const derivedList = INITIAL_USERS.filter(row => {
    const trimmedText = userText.trim().toLocaleLowerCase()
    return (row.name.toLocaleLowerCase().includes(trimmedText) || row.email.toLocaleLowerCase().includes(trimmedText))
  }).sort((a,b) => {
    if (sortDirection === "up") {
        return a[sortColumn].localeCompare(b[sortColumn])
    } else if (sortDirection === "down") {
        return b[sortColumn].localeCompare(a[sortColumn])
    } else return 0
  })

  const clickHandler = (column:Columns) => {
    console.log('clicked',column)
    if (sortColumn === column) {
        setSortDirection(prev => prev === "up" ? "down" : prev === "down" ? "neither" : "up")
    } else {
        setSortDirection("up")
        setSortColumn(column)
    }
  }

  return (
    <div>
      <h2>User Directory</h2>
      {/* TODO: filter input */}
      <input placeholder='Filter' value={userText} onChange={(e) => setUserText(e.currentTarget.value)}/>
      {/* TODO: table with sortable headers and filtered rows */}
      <table>
        <thead>
            <tr>
                <Header title='name' clickHandler={clickHandler} sortColumn={sortColumn} sortDirection={sortDirection} />
                <Header title='email' clickHandler={clickHandler} sortColumn={sortColumn} sortDirection={sortDirection} />
                <Header title='role' clickHandler={clickHandler} sortColumn={sortColumn} sortDirection={sortDirection} />
            </tr>
        </thead>
        <tbody>
            {derivedList.map(row => {
                return (
                    <tr>
                        <td>{row.name}</td>
                        <td>{row.email}</td>
                        <td>{row.role}</td>
                    </tr>
                )
            })}
        </tbody>
      </table>
    </div>
  );
}
