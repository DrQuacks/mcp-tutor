// Write your sumArray function here
function sumArray(arr){
    return (arr.reduce((prev,num) => {
        return prev+num
    },0))
}

module.exports = sumArray;
