function sumArray(arr:number[]):number{
    return (arr.reduce((prev,num) => {
        return prev+num
    },0))
}