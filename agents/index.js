const claude = require('./claude')

async function sendMessage(config, message) {
  const { provider } = config.agent
  if (provider === 'anthropic') return claude.sendMessage(config, message)
  throw new Error(`Unknown provider: ${provider}`)
}

module.exports = { sendMessage }
