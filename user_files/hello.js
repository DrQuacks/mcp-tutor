function helloWorld() {
  return "HBah humbug";
}

function sumArray(arr) {
  const sum = arr.reduce((prev,curr) => {
    return prev + curr
  },0)
  return sum
}