'use client'

import { useState, useEffect } from 'react'

type WebhookEvent = {
  id: string
  source: string
  eventId: string
  redacted: boolean
  createdAt: string
  payload: any
  userInfo?: {
    id: string
    email: string
  } | null
}



export default function AdminWebhooksPage() {
  const [allEvents, setAllEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [ensuring, setEnsuring] = useState(false)
  const [ensureResult, setEnsureResult] = useState<any | null>(null)
  
  const itemsPerPage = 10
  const totalPages = Math.ceil(allEvents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEvents = allEvents.slice(startIndex, endIndex)

  const fetchEvents = () => {
    setLoading(true)
    fetch('/api/admin/webhooks')
      .then(res => res.json())
      .then(data => {
        setAllEvents(data.events || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  if (loading) {
    return <div className="text-center py-12 text-muted">Loading webhook events...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Webhook Events</h1>
  <p className="text-muted">Webhook event history</p>
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary btn-sm" onClick={fetchEvents}>Refresh</button>
        </div>
        
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-6">
          <p className="text-sm text-muted mb-1">Total Events</p>
          <p className="text-3xl font-bold">{allEvents.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted mb-1">Current Page</p>
          <p className="text-3xl font-bold">{currentPage} / {totalPages}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted mb-1">Redacted (Current Page)</p>
          <p className="text-3xl font-bold">{currentEvents.filter(e => e.redacted).length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {currentEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`card p-4 cursor-pointer transition-colors ${
                selectedEvent?.id === event.id ? 'border-primary' : 'hover:border-border/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{event.payload?.type || event.source}</p>
                  {event.userInfo && (
                    <p className="text-xs text-muted">{event.userInfo.email}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${event.redacted ? 'bg-success/20 text-success' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {event.redacted ? 'Redacted' : 'Raw'}
                </span>
              </div>
              <p className="text-xs text-muted">
                {new Date(event.createdAt).toLocaleString('ro-RO')}
              </p>
            </div>
          ))}
        </div>

        <div className="card p-6 sticky top-6 h-fit">
          {selectedEvent ? (
            <div>
              <h3 className="font-semibold mb-4">Event Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted mb-1">Type</p>
                  <p className="font-mono text-xs bg-surface/2 border border-border/10 p-2 rounded">{selectedEvent.payload?.type || selectedEvent.source}</p>
                </div>
                {selectedEvent.userInfo && (
                  <div>
                    <p className="text-muted mb-1">User</p>
                    <p className="text-sm">{selectedEvent.userInfo.email}</p>
                    <p className="text-xs text-muted font-mono">{selectedEvent.userInfo.id}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted mb-1">Redacted</p>
                  <p>{selectedEvent.redacted ? <><i className="fa-duotone fa-circle-check text-success"></i> Yes</> : <><i className="fa-duotone fa-circle-exclamation text-warning"></i> No</>}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Timestamp</p>
                  <p>{new Date(selectedEvent.createdAt).toLocaleString('ro-RO')}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Payload (Redacted)</p>
                  <pre className="text-xs bg-surface/2 border border-border/10 p-3 rounded overflow-auto max-h-96 font-mono">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted">
              Select an event to view details
            </div>
          )}
        </div>
      </div>

      {allEvents.length === 0 && !loading && (
        <div className="card p-12 text-center">
          <p className="text-muted">No webhook events yet</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-duotone fa-chevron-left mr-2"></i>
            Previous
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`btn-sm px-3 py-1 ${
                    pageNum === currentPage 
                      ? 'bg-primary text-primary-foreground' 
                      : 'btn-secondary'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <i className="fa-duotone fa-chevron-right ml-2"></i>
          </button>
        </div>
      )}
    </div>
  )
}
