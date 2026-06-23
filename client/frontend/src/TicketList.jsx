function formatConfidence(confidence) {
  const value = Number(confidence)
  return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '—'
}

function formatDate(date) {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(parsed)
}

export default function TicketList({ tickets, isLoading, error, onRetry }) {
  return (
    <section className="card list-card">
      <div className="section-heading list-heading">
        <span className="step-number">02</span>
        <div>
          <h2>Ticket history</h2>
          <p>{tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} recorded</p>
        </div>
      </div>

      {isLoading && <div className="state-message">Loading ticket history…</div>}

      {!isLoading && error && (
        <div className="state-message error-state" role="alert">
          <p>{error}</p>
          <button className="secondary-button" type="button" onClick={onRetry}>Try again</button>
        </div>
      )}

      {!isLoading && !error && tickets.length === 0 && (
        <div className="state-message">
          <strong>No tickets yet</strong>
          <p>Your first analyzed ticket will appear here.</p>
        </div>
      )}

      {!isLoading && !error && tickets.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Sentiment</th>
                <th>Confidence</th>
                <th>Created time</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const sentiment = String(ticket.sentiment || 'UNKNOWN').toUpperCase()
                return (
                  <tr key={ticket.id}>
                    <td data-label="Title"><strong>{ticket.title}</strong></td>
                    <td data-label="Sentiment">
                      <span className={`sentiment ${sentiment.toLowerCase()}`}>{sentiment}</span>
                    </td>
                    <td data-label="Confidence">{formatConfidence(ticket.confidence)}</td>
                    <td data-label="Created time">{formatDate(ticket.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
