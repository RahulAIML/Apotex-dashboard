import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles, X, Send, Paperclip, Trash2, ChevronDown } from 'lucide-react'
import { useDashboardData } from '../../hooks/useDashboardData'
import { useAppStore } from '../../store'
import { buildAssistantPrompt } from '../../lib/assistantPrompt'
import { cn } from '../../lib/cn'

const GEMINI_KEY   = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=`

interface Message {
  role: 'user' | 'assistant'
  content: string
  imageBase64?: string
  imageMime?: string
  pending?: boolean
}

/** Minimal markdown renderer — bold, bullets, line breaks */
function MdText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        const isBullet = /^[\-•*]\s/.test(line.trim())
        const raw      = isBullet ? line.trim().slice(2) : line
        const parts    = raw.split(/(\*\*[^*]+\*\*)/).map((seg, j) =>
          seg.startsWith('**') && seg.endsWith('**')
            ? <strong key={j} className="font-semibold">{seg.slice(2, -2)}</strong>
            : seg
        )
        if (!raw && !isBullet) return <div key={i} className="h-1" />
        return isBullet
          ? <div key={i} className="flex gap-2"><span className="text-accent shrink-0 mt-px">•</span><span>{parts}</span></div>
          : <p key={i}>{parts}</p>
      })}
    </div>
  )
}

const SUGGESTIONS = {
  es: [
    '¿Quién necesita coaching urgente?',
    '¿Cuál actividad tiene el menor puntaje?',
    '¿Quiénes son los top performers?',
    '¿Cuál es nuestra tasa de aprobación?',
  ],
  en: [
    'Who needs urgent coaching?',
    'Which activity has the lowest score?',
    'Who are the top performers?',
    'What is our overall pass rate?',
  ],
}

export function AssistantWidget() {
  const { language } = useAppStore()
  const es = language === 'es'
  const location = useLocation()
  const { kpis, actStats, userStats, sims } = useDashboardData()

  const [open,      setOpen]      = useState(false)
  const [messages,  setMessages]  = useState<Message[]>([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [imageB64,  setImageB64]  = useState<string | null>(null)
  const [imageMime, setImageMime] = useState<string>('image/jpeg')

  const listRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const systemPrompt = useCallback(() =>
    buildAssistantPrompt({
      language,
      currentPage: location.pathname,
      kpis:      kpis ?? null,
      actStats:  actStats ?? [],
      userStats: userStats ?? [],
      sims:      sims ?? [],
    }),
    [language, location.pathname, kpis, actStats, userStats, sims]
  )

  async function send(text: string, img?: { b64: string; mime: string }) {
    if (!text.trim() && !img) return
    if (!GEMINI_KEY) {
      const errMsg = es
        ? 'Configura VITE_GEMINI_API_KEY en el archivo .env para activar el asistente.'
        : 'Set VITE_GEMINI_API_KEY in your .env file to enable the assistant.'
      setMessages(prev => [...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: errMsg },
      ])
      return
    }

    setLoading(true)
    const userMsg: Message = { role: 'user', content: text.trim(), imageBase64: img?.b64, imageMime: img?.mime }
    const pending:  Message = { role: 'assistant', content: '', pending: true }
    setMessages(prev => [...prev, userMsg, pending])
    setInput('')
    setImageB64(null)

    // Build Gemini conversation format from history + new message
    type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } }
    type GeminiMsg  = { role: 'user' | 'model'; parts: GeminiPart[] }

    const history: GeminiMsg[] = [...messages, userMsg].map(m => {
      const parts: GeminiPart[] = []
      if (m.imageBase64 && m.imageMime) {
        parts.push({ inlineData: { mimeType: m.imageMime, data: m.imageBase64 } })
      }
      if (m.content) parts.push({ text: m.content })
      return { role: m.role === 'assistant' ? 'model' : 'user', parts }
    })

    try {
      const res = await fetch(GEMINI_URL + GEMINI_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt() }] },
          contents: history,
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } })) as { error?: { message: string } }
        throw new Error(err.error?.message ?? `HTTP ${res.status}`)
      }

      const data = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        ?? (es ? 'Sin respuesta.' : 'No response.')
      setMessages(prev => prev.map(m => m.pending ? { ...m, content: reply, pending: false } : m))
    } catch (err) {
      const errMsg = es
        ? `Error: ${(err as Error).message}`
        : `Error: ${(err as Error).message}`
      setMessages(prev => prev.map(m => m.pending ? { ...m, content: errMsg, pending: false } : m))
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input, imageB64 ? { b64: imageB64, mime: imageMime } : undefined)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const raw = ev.target?.result as string
      setImageB64(raw.split(',')[1])
      setImageMime(file.type || 'image/jpeg')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const suggestions = es ? SUGGESTIONS.es : SUGGESTIONS.en

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title={es ? 'Asistente de Analytics' : 'Analytics Assistant'}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent shadow-lg shadow-accent/30 flex items-center justify-center hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-4 right-4 z-50 flex flex-col rounded-2xl overflow-hidden bg-card border border-line/60 shadow-[0_8px_48px_rgba(0,0,0,0.55),0_0_0_0.5px_rgba(255,255,255,0.08)]"
          style={{ width: 'min(380px, calc(100vw - 2rem))', height: 'min(620px, calc(100vh - 5rem))' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0b1735] border-b border-white/[0.08] shrink-0">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">
                {es ? 'Asistente de Analytics' : 'Analytics Assistant'}
              </p>
              <p className="text-[11px] text-[#7a9cc0] leading-tight">
                Gemini · {es ? 'Datos en tiempo real' : 'Live data'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title={es ? 'Limpiar' : 'Clear'}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.07] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                title={es ? 'Cerrar' : 'Close'}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.07] transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message list */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-3 h-full">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-accent" />
                  </div>
                  <div className="bg-surface border border-line/40 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed">
                    {es
                      ? `Hola 👋 Soy tu asistente de analytics con acceso a los datos en tiempo real de Apotex — **${kpis?.totalSimulations ?? 0} simulaciones**, **${kpis?.activeAdvisors ?? 0} asesores activos**. ¿En qué puedo ayudarte?`
                      : `Hi 👋 I'm your analytics assistant with live access to Apotex data — **${kpis?.totalSimulations ?? 0} simulations**, **${kpis?.activeAdvisors ?? 0} active advisors**. How can I help?`}
                  </div>
                </div>
                <div className="space-y-2 mt-1">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider px-1">
                    {es ? 'Preguntas frecuentes' : 'Suggested questions'}
                  </p>
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full text-left text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg border border-line/30 hover:border-accent/40 hover:bg-accent/5 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={cn('flex items-start gap-2', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  {m.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-accent" />
                    </div>
                  )}
                  <div className={cn(
                    'max-w-[84%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed',
                    m.role === 'user'
                      ? 'bg-accent text-white rounded-tr-sm'
                      : 'bg-surface border border-line/40 text-slate-300 rounded-tl-sm',
                  )}>
                    {m.imageBase64 && (
                      <img
                        src={`data:${m.imageMime};base64,${m.imageBase64}`}
                        alt="attached"
                        className="rounded-lg mb-2 max-w-full max-h-40 object-cover"
                      />
                    )}
                    {m.pending
                      ? <span className="text-slate-500 animate-pulse">{es ? 'Pensando…' : 'Thinking…'}</span>
                      : <MdText text={m.content} />}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Image preview */}
          {imageB64 && (
            <div className="px-4 py-2 border-t border-line/20 shrink-0">
              <div className="relative inline-block">
                <img
                  src={`data:${imageMime};base64,${imageB64}`}
                  alt="preview"
                  className="h-14 rounded-lg border border-line/40 object-cover"
                />
                <button
                  onClick={() => setImageB64(null)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-danger flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Input row */}
          <div className="px-3 py-3 border-t border-line/30 bg-surface/50 shrink-0 flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              title={es ? 'Adjuntar imagen' : 'Attach image'}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors shrink-0 self-end mb-0.5"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={es ? 'Pregunta algo sobre los datos…' : 'Ask something about the data…'}
              disabled={loading}
              rows={1}
              className="flex-1 bg-card border border-line/50 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-accent/40 resize-none leading-relaxed disabled:opacity-50 transition-colors"
              style={{ maxHeight: '100px', overflowY: 'auto' }}
            />
            <button
              onClick={() => send(input, imageB64 ? { b64: imageB64, mime: imageMime } : undefined)}
              disabled={loading || (!input.trim() && !imageB64)}
              title={es ? 'Enviar' : 'Send'}
              className="p-2 rounded-xl bg-accent hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 self-end"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
