import { useCallback, useEffect, useState } from 'react'
import TicketForm from './TicketForm.jsx'
import TicketList from './TicketList.jsx'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export default function App() {
  const [tickets, setTickets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTickets = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/tickets`)
      if (!response.ok) throw new Error('Could not load ticket history.')
      const data = await response.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to the backend.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  async function createTicket(ticket) {
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.detail || 'Ticket submission failed.')
    }

    const savedTicket = await response.json()
    setTickets((currentTickets) => [
      savedTicket,
      ...currentTickets.filter((item) => item.id !== savedTicket.id),
    ])
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <span className="eyebrow">Support workspace</span>
          <h1>Ticket Analyzer</h1>
          <p>Submit a support request and see its sentiment analysis instantly.</p>
        </div>
        <div className="status-pill"><span aria-hidden="true" /> Demo API</div>
      </header>

      <section className="workspace" aria-label="Ticket analyzer workspace">
        <TicketForm onSubmit={createTicket} />
        <TicketList
          tickets={tickets}
          isLoading={isLoading}
          error={error}
          onRetry={loadTickets}
        />
      </section>
    </main>
  )
}
