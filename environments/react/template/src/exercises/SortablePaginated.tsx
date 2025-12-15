import { useState } from "react";

type Product = {id:number,name:string,price:number,stock:number}
type ProductCols = keyof Product

const products:Product[] = [
  { id: 1, name: 'Laptop', price: 999, stock: 5 },
  { id: 2, name: 'Mouse', price: 25, stock: 50 },
  { id: 3, name: 'Keyboard', price: 75, stock: 30 },
  { id: 4, name: 'Monitor', price: 299, stock: 15 },
  { id: 5, name: 'Headphones', price: 89, stock: 25 },
  { id: 6, name: 'Webcam', price: 59, stock: 40 },
  { id: 7, name: 'Desk Lamp', price: 35, stock: 60 },
  { id: 8, name: 'USB Cable', price: 12, stock: 100 },
  { id: 9, name: 'Phone Stand', price: 18, stock: 45 },
  { id: 10, name: 'Backpack', price: 65, stock: 20 }
];

const ITEMS_PER_PAGE = 5

export default function SortablePaginated() {
  const [sortField,setSortField] = useState<ProductCols>('name')
  const [sortDirection,setSortDirection] = useState<'asc'|'desc'>('asc')
  const [currentPage,setCurrentPage] = useState(1)

  const sortedProducts = [...products].sort((a,b) => {
    const [first,second] = sortDirection === 'asc' ? [a,b] : [b,a]
    return sortField === 'name' ? first.name.localeCompare(second.name) : first[sortField] - second[sortField]
  })

  const totalPages = Math.ceil(sortedProducts.length/ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = sortedProducts.slice(startIndex,endIndex)
  const handleSort = (field:ProductCols) => {
    if (field === sortField) setSortDirection(prev => prev === 'asc' ? 'desc':'asc')
    else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  const arrow = sortDirection === 'asc' ? '↑':'↓'
  return (
    <div>
      <h2>Product Table</h2>
      <table>
        <thead>
          <tr>
            <th onClick={()=>handleSort('name')}>
              Name {sortField === 'name' && arrow}
            </th>
            <th onClick={()=>handleSort('price')}>
              Price {sortField === 'price' && arrow}
            </th>
            <th onClick={()=>handleSort('stock')}>
              Stock {sortField === 'stock' && arrow}
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedProducts.map(prod => (
            <tr key={prod.id}>
              <td>{prod.name}</td>
              <td>{prod.price}</td>
              <td>{prod.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button disabled={currentPage === 1} onClick={()=>setCurrentPage(prev=>prev-1)}>Previous</button>
        <p>Page {currentPage} of {totalPages}</p>
        <button disabled={currentPage === totalPages} onClick={()=>setCurrentPage(prev=>prev+1)}>Next</button>
      </div>
    </div>
  );
}