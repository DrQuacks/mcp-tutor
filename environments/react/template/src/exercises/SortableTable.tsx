/**
 * Sortable Product Table with Pagination
 * 
 * Build a sortable, paginated product table. Practice the interview pattern of implementing table sorting and pagination controls.
 * 
 * Requirements:
 * - Display products in a table with columns: Name, Category, Price, Rating
 * - Make all column headers clickable for sorting
 * - Show sort direction with arrows (↑ ↓) on the active column
 * - Clicking the same header toggles between ascending and descending
 * - Implement pagination showing 6 items per page
 * - Add Previous and Next buttons (disabled at boundaries)
 * - Show current page number and total pages
 * - Start with data sorted by Name in ascending order
 */
import { useState } from "react";
type Product = { id: number, name: string, category: string, price: number, rating: number }
const products:Product[] = [
  { id: 1, name: 'Wireless Mouse', category: 'Electronics', price: 29.99, rating: 4.5 },
  { id: 2, name: 'Coffee Mug', category: 'Kitchen', price: 12.99, rating: 4.2 },
  { id: 3, name: 'Notebook', category: 'Office', price: 8.99, rating: 4.0 },
  { id: 4, name: 'Desk Lamp', category: 'Furniture', price: 45.99, rating: 4.7 },
  { id: 5, name: 'Pen Set', category: 'Office', price: 15.99, rating: 4.3 },
  { id: 6, name: 'Water Bottle', category: 'Sports', price: 19.99, rating: 4.6 },
  { id: 7, name: 'Backpack', category: 'Travel', price: 59.99, rating: 4.8 },
  { id: 8, name: 'Phone Stand', category: 'Electronics', price: 14.99, rating: 4.1 },
  { id: 9, name: 'Plant Pot', category: 'Home', price: 22.99, rating: 4.4 },
  { id: 10, name: 'Yoga Mat', category: 'Sports', price: 34.99, rating: 4.5 },
  { id: 11, name: 'Headphones', category: 'Electronics', price: 89.99, rating: 4.9 },
  { id: 12, name: 'Calendar', category: 'Office', price: 11.99, rating: 3.9 },
  { id: 13, name: 'Storage Box', category: 'Home', price: 25.99, rating: 4.2 },
  { id: 14, name: 'USB Hub', category: 'Electronics', price: 32.99, rating: 4.4 },
  { id: 15, name: 'Throw Pillow', category: 'Home', price: 18.99, rating: 4.3 }
];
const MAX_ITEMS = 6
export default function SortableTable() {
  // Your code here
  const [activeColumn,setActiveColumn] = useState<keyof Product>("name")
  const [isAsc,setIsAsc] = useState(true)
  const [page,setPage] = useState(1)
  const totalPages = Math.ceil(products.length / MAX_ITEMS)
  const arrow = isAsc ? '↑' : '↓'
  const keys = Object.keys(products[0])
  const clickHandler = ((col:keyof Product) => {
    if (col === activeColumn) {
      setIsAsc(prev => !prev)
      return
    }
    setActiveColumn(col)
  })

  const sortedProducts = products.sort((a,b) => {
    const [first,second] = isAsc ? [a,b] : [b,a]
    if (activeColumn === "name" || activeColumn === "category") {
      return first[activeColumn].localeCompare(second[activeColumn])
    }
    return first[activeColumn] - second[activeColumn]
  })

  const paginatedProducts = sortedProducts.slice((page-1)*MAX_ITEMS,page*MAX_ITEMS)
  
  return (
    <div>
      <h2>Product Catalog</h2>
      <table>
        <thead>
          <tr>
            {keys.map(k => {
              if (k === 'id') return
              const text = k === activeColumn ? `${k} ${arrow}` : k
              return (
                <td key={k}><button key={k} onClick={()=>clickHandler(k as keyof Product)}>{text}</button></td>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {paginatedProducts.map(prod => (
            <tr key={prod.id}>
              {Object.keys(prod).map(col => {
                if (col === 'id') return
                return(
                  <td key={prod.id+" "+col}>{prod[col as keyof Product]}</td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button disabled={page === 1} onClick={()=>setPage(prev=>prev-1)}>Previous</button>
        <span> Page {page} of {totalPages} </span>
        <button disabled={page === totalPages} onClick={()=>setPage(prev=>prev+1)}>Next</button>
      </div>
    </div>
  );
}