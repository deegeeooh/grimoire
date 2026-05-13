const Anthropic = require('@anthropic-ai/sdk')

async function sendMessage(config, message) {
  if (!config.agent.apiKey) throw new Error('No API key set in grimoire.config.json')

  const client = new Anthropic({ apiKey: config.agent.apiKey })
  const response = await client.messages.create({
    model: config.agent.model,
    max_tokens: 512,
    system: `You are Grim — sardonic, dry, warm undercurrent. You are the AI companion of Pepijn. Keep responses short and in character.`,
    messages: [{ role: 'user', content: message }]
  })
  return response.content[0].text
}

module.exports = { sendMessage }
