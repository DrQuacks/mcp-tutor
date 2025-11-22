/**
 * Filter Even Numbers
 * 
 * Write a function that takes an array of numbers and returns a new array containing only the even numbers from the original array. Even numbers are integers that are divisible by 2 (like 2, 4, 6, 8, etc.). Your function should preserve the order of the even numbers as they appeared in the input array.
 * 
 * Requirements:
 * - Create a function named `filterEvens` that takes an array of numbers as a parameter
 * - Return a new array containing only the even numbers
 * - Preserve the order of the even numbers from the original array
 * - Return an empty array if there are no even numbers
 */

export function filterEvens(numbers: number[]): number[] {
  // Your code here
  const evens = numbers.filter(num => num%2 === 0)
  return evens
}
