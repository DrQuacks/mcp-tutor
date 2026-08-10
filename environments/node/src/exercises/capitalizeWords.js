// Write your capitalizeWords function here

function capitalizeWords(str) {
    const chars = str.split("")
    const caps = chars.map((char,index) => {
        if ((index === 0) || chars[index-1] === " ") {
            return char.toUpperCase()
        } else {
            return char.toLowerCase()
        }
    })
    return caps.join("")
}

module.exports = capitalizeWords;
