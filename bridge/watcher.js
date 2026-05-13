const fs = require('fs')

function startWatcher(filePath, onChange) {
  let lastContent = ''

  const read = () => {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      if (content !== lastContent) {
        lastContent = content
        onChange(JSON.parse(content))
      }
    } catch (_) {}
  }

  read()
  // fs.watchFile is polling-based — more reliable than fs.watch on Windows
  fs.watchFile(filePath, { interval: 150 }, read)
}

module.exports = { startWatcher }
