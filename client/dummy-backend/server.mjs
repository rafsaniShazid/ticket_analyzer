import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.PORT || 8000)
const positiveWords = ['good', 'great', 'excellent', 'happy', 'thanks', 'thank', 'love', 'helpful', 'fixed']
const negativeWords = ['bad', 'issue', 'problem', 'error', 'broken', 'fail', 'failed', 'not', 'cannot', "can't", 'deadline']

const tickets = [
  {
    id: randomUUID(),
    title: 'Lab VM issue',
    message: 'My lab VM is not opening before the deadline.',
    category: 'lab',
    sentiment: 'NEGATIVE',
    confidence: 0.947,
    created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: randomUUID(),
    title: 'Quick support response',
    message: 'Thanks, the support response was very helpful.',
    category: 'general',
    sentiment: 'POSITIVE',
    confidence: 0.982,
    created_at: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
  },
]

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  })
  response.end(JSON.stringify(body))
}

async function readJson(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function analyzeSentiment(message) {
  const text = message.toLowerCase()
  const positiveScore = positiveWords.filter((word) => text.includes(word)).length
  const negativeScore = negativeWords.filter((word) => text.includes(word)).length
  const sentiment = negativeScore > positiveScore ? 'NEGATIVE' : 'POSITIVE'
  const distance = Math.abs(positiveScore - negativeScore)
  return { sentiment, confidence: Math.min(0.99, 0.72 + distance * 0.07) }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`)

  if (request.method === 'OPTIONS') return sendJson(response, 204, {})
  if (request.method === 'GET' && url.pathname === '/health') return sendJson(response, 200, { status: 'ok' })
  if (request.method === 'GET' && url.pathname === '/tickets') return sendJson(response, 200, tickets)

  if (request.method === 'POST' && url.pathname === '/tickets') {
    try {
      const body = await readJson(request)
      const title = String(body.title || '').trim()
      const message = String(body.message || '').trim()
      if (!title || !message) return sendJson(response, 400, { detail: 'Title and message are required.' })

      const analysis = analyzeSentiment(message)
      const ticket = {
        id: randomUUID(),
        title,
        message,
        category: body.category || null,
        ...analysis,
        created_at: new Date().toISOString(),
      }
      tickets.unshift(ticket)
      return sendJson(response, 201, ticket)
    } catch {
      return sendJson(response, 400, { detail: 'Request body must be valid JSON.' })
    }
  }

  return sendJson(response, 404, { detail: 'Not found' })
})

server.listen(PORT, () => {
  console.log(`Dummy Ticket Analyzer API running at http://localhost:${PORT}`)
})
