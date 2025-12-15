/**
 * Support Ticket Filter
 * 
 * Build a filterable support ticket list with search, priority filter, and statistics. Practice the interview pattern of building interactive list UIs.
 * 
 * Requirements:
 * - Display a list of support tickets with title, priority (high/medium/low), and status (open/closed)
 * - Add a search input that filters tickets by title (case-insensitive)
 * - Add filter buttons for priority: All, High, Medium, Low
 * - Show a count: 'Showing X of Y tickets'
 * - Show additional stat: 'Z open tickets' (count of open tickets in filtered results)
 * - Use controlled components for all inputs
 * - Each ticket in the list should show: title, priority, and status
 */
import { useState } from "react";
const tickets = [
  { id: 1, title: 'Login page not loading', priority: 'high', status: 'open' },
  { id: 2, title: 'Add dark mode option', priority: 'low', status: 'closed' },
  { id: 3, title: 'Payment gateway timeout', priority: 'high', status: 'open' },
  { id: 4, title: 'Update user profile page', priority: 'medium', status: 'open' },
  { id: 5, title: 'Fix mobile menu', priority: 'medium', status: 'closed' },
  { id: 6, title: 'Database connection error', priority: 'high', status: 'open' },
  { id: 7, title: 'Add export feature', priority: 'low', status: 'open' },
  { id: 8, title: 'Improve search speed', priority: 'medium', status: 'closed' }
];

const filters = ['all','high','medium','low']

export default function TicketFilter() {
  // Your code here
  const [searchText,setSearchText] = useState("")
  const [activeFilter,setActiveFilter] = useState("all")
  const filteredTickets = tickets.filter(tick => {
    const isSearch = tick.title.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
    const isFilter = activeFilter.toLowerCase() === "all" || tick.priority.toLowerCase() === activeFilter.toLowerCase()
    return (isSearch && isFilter)
  })
  const totalNumber = tickets.length
  const filteredNumber = filteredTickets.length
  const openTickets = filteredTickets.filter(fil => fil.status === 'open').length

  return (
    <div>
      <h2>Support Tickets</h2>
      <ul>
        {filteredTickets.map(tick => (
          <li key={tick.id}>Title: {tick.title}, Priority: {tick.priority}, Status: {tick.status}</li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="Search"
        value={searchText}
        onChange={(e)=>setSearchText(e.currentTarget.value)}
      />
      <div>
        {filters.map((fil,i) => (
          <button key={i} onClick={()=>setActiveFilter(fil)}>{fil}</button>
        ))}
      </div>
      <p>Showing {filteredNumber} of {totalNumber} tickets</p>
      <p>{openTickets} open tickets</p>
    </div>
  );
}