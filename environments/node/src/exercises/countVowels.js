// Write your countVowels function here

function countVowels(str){
    const vowels = ['a','e','i','o','u']
    const vowelCount = str.toLowerCase().split("").reduce((acc,char) => {
        if (vowels.includes(char)) {
            return acc + 1
        }
        return acc
    },0)
    return vowelCount
}

module.exports = countVowels;
