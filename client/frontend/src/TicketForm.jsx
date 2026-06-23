import { useState } from 'react'

const initialForm = { title: '', message: '', category: '' }

export default function TicketForm({ onSubmit }) {
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (feedback.message) setFeedback({ type: '', message: '' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      setFeedback({ type: 'error', message: 'Title and message are required.' })
      return
    }

    setIsSubmitting(true)
    setFeedback({ type: '', message: '' })

    try {
      await onSubmit({
        title: form.title.trim(),
        message: form.message.trim(),
        category: form.category || null,
      })
      setForm(initialForm)
      setFeedback({ type: 'success', message: 'Ticket submitted successfully.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Ticket submission failed.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="card form-card">
      <div className="section-heading">
        <span className="step-number">01</span>
        <div>
          <h2>Submit a ticket</h2>
          <p>Tell the support team what happened.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={updateField}
          placeholder="e.g. Lab VM is not opening"
          maxLength="120"
          required
        />

        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          value={form.message}
          onChange={updateField}
          placeholder="Describe the issue and how it affects you..."
          rows="6"
          maxLength="1000"
          required
        />
        <span className="character-count">{form.message.length}/1000</span>

        <label htmlFor="category">Category <span>(optional)</span></label>
        <select id="category" name="category" value={form.category} onChange={updateField}>
          <option value="">Choose a category</option>
          <option value="lab">Lab</option>
          <option value="billing">Billing</option>
          <option value="technical">Technical</option>
          <option value="general">General</option>
        </select>

        {feedback.message && (
          <p className={`form-feedback ${feedback.type}`} role="status">{feedback.message}</p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Analyzing…' : 'Submit ticket'}
          {!isSubmitting && <span aria-hidden="true">→</span>}
        </button>
      </form>
    </section>
  )
}
