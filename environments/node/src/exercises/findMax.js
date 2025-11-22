// Write your findMax function here
function findMax(numbers) {
  const maxNum = numbers.reduce((acc,num) => {
    if (acc === null) {
      return num
    }
    if (num > acc) return num
    return acc
  },null)
  return maxNum
}

module.exports = findMax;
