const fs = require('fs')
const OUT = 'C:\\Users\\Pepijn.Bakker\\AppData\\Local\\Temp\\grimoire-hook-debug.json'
let raw = ''
process.stdin.on('data', c => raw += c)
process.stdin.on('end', () => fs.appendFileSync(OUT, raw + '\n'))
