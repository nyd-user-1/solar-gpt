'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sun, ArrowUp, Map, X, MapPin, Square, Mic, Check } from 'lucide-react'
import { SolarAddressDrawer } from '@/components/SolarAddressDrawer'
import { SolarPlusMenu } from '@/components/SolarPlusMenu'
import { MarkdownContent } from '@/components/MarkdownContent'
import type { SolarInsight } from '@/lib/solar-types'
import { STATE_ABBRS } from '@/lib/us-states'

/* ------------------------------------------------------------------ */
/*  Model definitions                                                  */
/* ------------------------------------------------------------------ */

type ModelProvider = 'openai' | 'anthropic' | 'google' | 'xai'
type ModelOption = { id: string; label: string; provider: ModelProvider }

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o',                          label: 'GPT-4o',           provider: 'openai'    },
  { id: 'gpt-4o-mini',                     label: 'GPT-4o Mini',      provider: 'openai'    },
  { id: 'gpt-4-turbo',                     label: 'GPT-4 Turbo',      provider: 'openai'    },
  { id: 'claude-sonnet-4-6',               label: 'Claude Sonnet',    provider: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001',       label: 'Claude Haiku',     provider: 'anthropic' },
  { id: 'google/gemini-2.5-flash',         label: 'Gemini 2.5 Flash', provider: 'google'    },
  { id: 'xai/grok-4.1-fast-non-reasoning', label: 'Grok Fast',        provider: 'xai'       },
]

const OPENAI_ICON = (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>)
const ANTHROPIC_ICON = (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.304 3.541H13.86L7.432 20.46h3.047l1.374-3.768h5.656l1.374 3.768h3.048L17.304 3.54zM12.79 13.695l1.941-5.31 1.94 5.31h-3.88zM6.696 3.541H3.25L9.678 20.46h3.047L6.696 3.54z"/></svg>)
const GEMINI_ICON = (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="#4285F4"><path d="M12 1.5C12 1.5 8.5 8.5 1.5 12C8.5 15.5 12 22.5 12 22.5C12 22.5 15.5 15.5 22.5 12C15.5 8.5 12 1.5 12 1.5Z"/></svg>)
const GROK_ICON = (<svg className="h-4 w-4" viewBox="0 0 2000 1920" fill="currentColor"><path d="M1997.505,5.546c-1.276,1.84-2.543,3.686-3.831,5.517c-44.395,63.091-89.508,125.693-132.964,189.424c-35.057,51.414-65.323,105.683-89.053,163.428c-34.447,83.828-47.232,171.046-42.05,261.249c3.355,58.404,12.861,115.859,25.887,172.786c16.297,71.216,24.256,143.247,20.188,216.29c-10.123,181.765-76.927,339.812-201.209,472.789c-107.86,115.406-239.56,189.915-394.446,221.624c-157.969,32.34-310.586,13.132-457.667-52.146c-43.51-19.311-84.795-42.677-124.218-69.344c-1.094-.74-2.147-1.54-3.745-2.692c1.543-.883,2.689-1.656,3.927-2.231c72.526-33.658,145.071-67.276,217.555-101.023c3.285-1.53,5.91-1.054,8.984.124c74.663,28.608,151.849,42.899,231.896,39.624c123.328-5.045,232.105-47.967,325.71-128.201c99.013-84.869,160.993-191.673,184.036-320.194c18.823-104.981,7.281-207.124-32.8-305.964c-13.942-34.381-52.565-47.733-86.226-30.057c-4.108,2.157-7.994,4.818-11.734,7.582c-216.828,160.265-433.63,320.565-650.436,480.86c-1.834,1.356-3.69,2.684-5.536,4.025c-.344-.374-.689-.747-1.033-1.121C1184.605,820.085,1590.468,412.274,1996.331,4.463C1996.722,4.824,1997.114,5.185,1997.505,5.546z"/><path d="M635.931,1353.173C425.433,1541.452,215.15,1729.537,4.867,1917.623c-.275-.19-.551-.38-.826-.57c1.039-1.478,2.041-2.984,3.123-4.431c29.898-39.969,63.26-76.964,97.26-113.421c40.804-43.752,82.042-87.114,122.109-131.532c35.108-38.921,66.724-80.614,91.953-126.809c19.879-36.398,34.424-74.673,40.535-115.893c7.782-52.496,1.059-103.422-17.762-152.706c-13.437-35.185-26.864-70.312-36.291-106.847c-21.394-82.908-28.324-166.979-21.201-252.304c19.974-239.28,151.763-453.739,355.913-578.35c90.292-55.114,188.023-89.471,292.95-102.908c130.165-16.669,256.024-.09,377.981,48.558c52.942,21.118,102.709,47.566,149.092,80.552c1.22.868,2.42,1.767,3.601,2.688c.244.19.36.544.758,1.179c-1.649.801-3.241,1.608-4.86,2.357c-71.815,33.205-143.623,66.428-215.499,99.5c-2.256,1.038-5.598,1.456-7.816.587c-152.615-59.802-303.123-52.584-449.63,18.494c-142.377,69.074-234.294,183.195-283.161,332.63c-22.431,68.594-30.403,139.234-23.761,211.172c11.547,125.044,63.341,231.057,152.534,319.089c1.067,1.053,2.142,2.099,3.193,3.168C635.287,1352.055,635.421,1352.372,635.931,1353.173z"/></svg>)

function modelIcon(p: ModelProvider) {
  if (p === 'anthropic') return ANTHROPIC_ICON
  if (p === 'google') return GEMINI_ICON
  if (p === 'xai') return GROK_ICON
  return OPENAI_ICON
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StateChip = { name: string; slug: string; flag_url: string | null; untapped: string; grade: string }
type CountyChip = { name: string; state: string; slug: string; seal_url: string | null }
type Message = { id: string; role: 'user' | 'assistant'; content: string }
type Suggestion = { place_id: string; description: string }
type SelectedAddress = { description: string; lat: number; lng: number }
type SearchHit = { name: string; state?: string; slug: string; flag_url?: string | null }
type InlineSuggestions = { states: SearchHit[]; counties: SearchHit[]; cities: SearchHit[] }

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NewChatClient({ stateChips, countyChips }: { stateChips: StateChip[]; countyChips: CountyChip[] }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState('gpt-4o')
  const [selectedStateName, setSelectedStateName] = useState<string | null>(null)
  const [inlineSuggestions, setInlineSuggestions] = useState<InlineSuggestions | null>(null)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [modelMenuAbove, setModelMenuAbove] = useState(true)

  // Address + Solar
  const [addressMode, setAddressMode] = useState(false)
  const [addressInput, setAddressInput] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null)
  const [solarInsight, setSolarInsight] = useState<SolarInsight | null>(null)
  const [solarLoading, setSolarLoading] = useState(false)
  const [solarError, setSolarError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const modelRef = useRef<HTMLDivElement>(null)
  const modelBtnRef = useRef<HTMLButtonElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // ── Voice recording ──
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'transcribing'>('idle')
  const [toast, setToast] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopAndTranscribeRef = useRef<() => void>(() => {})

  // ── Waveform visualization ──
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const waveDataRef = useRef<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const selectedModel = MODEL_OPTIONS.find(m => m.id === selectedModelId) ?? MODEL_OPTIONS[0]

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelMenuOpen(false)
    }
    if (modelMenuOpen) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [modelMenuOpen])

  // Geolocation for address bias
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {}
      )
    }
  }, [])

  // Auto-dismiss voice toasts
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  // Stop mic/recorder on unmount (discard partial recordings)
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current)
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      audioCtxRef.current?.close().catch(() => {})
    }
  }, [])

  // Focus textarea when entering address mode
  useEffect(() => {
    if (addressMode) setTimeout(() => textareaRef.current?.focus(), 50)
  }, [addressMode])

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    autoResize()
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (value.trim().length < 2) { setInlineSuggestions(null); return }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`)
        const data = await res.json()
        const hasResults = data.states?.length || data.counties?.length || data.cities?.length
        setInlineSuggestions(hasResults ? data : null)
      } catch { setInlineSuggestions(null) }
    }, 300)
  }

  const fetchSuggestions = useCallback((value: string, loc?: { lat: number; lng: number } | null) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        let url = `/api/places?input=${encodeURIComponent(value)}`
        if (loc) url += `&lat=${loc.lat}&lng=${loc.lng}`
        const res = await fetch(url)
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
      } catch { setSuggestions([]) }
    }, 300)
  }, [])

  const submitWithAddress = useCallback(async (text: string, addr: SelectedAddress, insight: SolarInsight | null) => {
    if (!text.trim() || loading || streaming) return
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        messages: [{ role: 'user', content: text }],
        model: selectedModelId,
        address: addr.description,
      }
      if (insight) body.solarInsight = insight
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok || !res.body) { setLoading(false); return }
      const assistantId = crypto.randomUUID()
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])
      setLoading(false); setStreaming(true)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m))
      }
    } catch { /* silent */ } finally { setLoading(false); setStreaming(false) }
  }, [loading, streaming, selectedModelId])

  const selectAddress = useCallback(async (s: Suggestion) => {
    setAddressMode(false)
    setAddressInput('')
    setSuggestions([])
    setSolarInsight(null)
    setSolarError(null)
    try {
      const geoRes = await fetch(`/api/places/geocode?place_id=${s.place_id}`)
      const geo = await geoRes.json()
      if (!geo.lat || !geo.lng) throw new Error('Geocode failed')
      const addr: SelectedAddress = { description: s.description, lat: geo.lat, lng: geo.lng }
      setSelectedAddress(addr)
      setDrawerOpen(true)
      setSolarLoading(true)
      // Fetch solar data before submitting so the AI gets real property-specific data
      const solarRes = await fetch(`/api/solar?lat=${geo.lat}&lng=${geo.lng}`)
      const solarData = await solarRes.json()
      let insight: SolarInsight | null = null
      if (!solarRes.ok || solarData.error) {
        setSolarError(solarData.error ?? 'Solar API not available for this address')
      } else {
        insight = solarData as SolarInsight
        setSolarInsight(insight)
      }
      setSolarLoading(false)
      // Submit chat now with full solar insight injected into system prompt
      submitWithAddress(`Tell me about the solar potential for this property: ${s.description}`, addr, insight)
    } catch {
      setSolarError('Could not fetch solar data')
      setSolarLoading(false)
    }
  }, [submitWithAddress])

  const clearAddress = useCallback(() => {
    setSelectedAddress(null); setSolarInsight(null); setSolarError(null); setDrawerOpen(false)
  }, [])

  const submit = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading || streaming) return
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const allMessages = [...messages, userMsg]
    setMessages(allMessages)
    setInput('')
    setSelectedStateName(null)
    setInlineSuggestions(null)
    setModelMenuOpen(false)
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.focus() }
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        model: selectedModelId,
      }
      if (selectedAddress) {
        body.address = selectedAddress.description
        if (solarInsight) body.solarInsight = solarInsight
      }
      const controller = new AbortController()
      abortControllerRef.current = controller
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Something went wrong. Please try again.' }])
        setLoading(false); return
      }
      const assistantId = crypto.randomUUID()
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])
      setLoading(false); setStreaming(true)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m))
      }
      if (selectedAddress) setDrawerOpen(true)
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Connection error. Please check your network and try again.' }])
    } finally { setLoading(false); setStreaming(false) }
  }

  const stopStream = () => {
    abortControllerRef.current?.abort()
    setStreaming(false)
    setLoading(false)
  }

  // Spacebar stops streaming when not focused in an input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!streaming) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') { e.preventDefault(); stopStream() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming])

  const stopWaveform = () => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null; analyserRef.current = null
    waveDataRef.current = []
  }

  const startWaveformFromStream = (stream: MediaStream) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = new (window.AudioContext ?? (window as any).webkitAudioContext)()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      ctx.createMediaStreamSource(stream).connect(analyser)
      const draw = () => {
        animFrameRef.current = requestAnimationFrame(draw)
        const canvas = canvasRef.current
        if (!canvas) return
        const c = canvas.getContext('2d')
        if (!c) return
        const a = analyserRef.current
        if (!a) return
        const buf = new Uint8Array(a.frequencyBinCount)
        a.getByteTimeDomainData(buf)
        let sum = 0
        for (const v of buf) sum += (v - 128) ** 2
        const rms = Math.min(1, Math.sqrt(sum / buf.length) / 48)
        waveDataRef.current = [...waveDataRef.current.slice(-150), rms]
        const W = canvas.clientWidth, H = canvas.clientHeight
        if (canvas.width !== W * 2 || canvas.height !== H * 2) { canvas.width = W * 2; canvas.height = H * 2; c.scale(2, 2) }
        c.clearRect(0, 0, W, H)
        const barW = 2, gap = 2, total = barW + gap
        const bars = waveDataRef.current.slice(-Math.floor(W / total))
        bars.forEach((v, i) => {
          const h = Math.max(2, v * H * 0.85)
          c.fillStyle = 'rgba(120,120,120,0.85)'
          c.fillRect(i * total, H / 2 - h / 2, barW, h)
        })
      }
      draw()
    } catch { /* ignore */ }
  }

  const cancelRecording = () => {
    if (recordingTimerRef.current) { clearTimeout(recordingTimerRef.current); recordingTimerRef.current = null }
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    stopWaveform()
    setRecordingState('idle')
  }

  const stopAndTranscribe = async () => {
    if (recordingTimerRef.current) { clearTimeout(recordingTimerRef.current); recordingTimerRef.current = null }
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    // Collect final chunk then build blob
    const chunks = await new Promise<Blob[]>(resolve => {
      const acc: Blob[] = [...audioChunksRef.current]
      recorder.addEventListener('dataavailable', (e) => { if (e.data.size > 0) acc.push(e.data) }, { once: true })
      recorder.addEventListener('stop', () => resolve(acc), { once: true })
      recorder.stop()
    })

    mediaRecorderRef.current = null
    audioChunksRef.current = []
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    stopWaveform()

    if (chunks.length === 0) {
      setToast("Couldn't hear anything — try again?")
      setRecordingState('idle')
      return
    }

    const mimeType = chunks[0].type || 'audio/webm'
    const blob = new Blob(chunks, { type: mimeType })
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'

    setRecordingState('transcribing')
    try {
      const form = new FormData()
      form.append('file', blob, `recording.${ext}`)
      const res = await fetch('/api/transcribe', { method: 'POST', body: form })
      if (!res.ok) { setToast('Transcription failed — please try again.'); setRecordingState('idle'); return }
      const data = await res.json()
      const text: string = (data.text ?? '').trim()
      if (!text) { setToast("Couldn't hear anything — try again?"); setRecordingState('idle'); return }
      setRecordingState('idle')
      submit(text)
    } catch {
      setToast('Transcription failed — please try again.')
      setRecordingState('idle')
    }
  }

  // Keep a stable ref so the 60s auto-stop timer always calls the latest version
  stopAndTranscribeRef.current = stopAndTranscribe

  const toggleMic = async () => {
    if (recordingState === 'recording') { cancelRecording(); return }
    if (recordingState === 'transcribing') return

    if (typeof MediaRecorder === 'undefined') {
      setToast('Voice input is not supported in this browser.')
      return
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4'
      : ''

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      startWaveformFromStream(stream)

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.start(250)
      setRecordingState('recording')

      // Auto-stop at 60 seconds
      recordingTimerRef.current = setTimeout(() => {
        setToast('Recording limit reached (60s) — transcribing now…')
        stopAndTranscribeRef.current()
      }, 60_000)
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name
      if (name === 'NotAllowedError') {
        setToast('Mic permission denied. Enable it in your browser settings to use voice input.')
      } else if (name === 'NotFoundError') {
        setToast('No microphone detected.')
      } else {
        setToast('Could not access microphone.')
      }
    }
  }

  const isEmpty = messages.length === 0

  const exitAddressMode = () => { setAddressMode(false); setAddressInput(''); setSuggestions([]) }

  const dismissSuggestions = () => setInlineSuggestions(null)

  /* ---- Unified chat / address input ---- */
  const chatInputBox = (
    <div className="relative">
      {/* Address suggestions (address mode) */}
      {addressMode && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-20 max-h-[320px] overflow-y-auto no-scrollbar">
          {suggestions.map(s => (
            <button key={s.place_id} onClick={() => { selectAddress(s); exitAddressMode() }}
              className="flex w-full items-start gap-3 px-4 py-3 text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors text-left border-b border-[var(--border)] last:border-0">
              <MapPin className="h-4 w-4 text-solar shrink-0 mt-0.5" />
              <span>{s.description}</span>
            </button>
          ))}
        </div>
      )}
      {/* Inline location suggestions (chat mode) */}
      {!addressMode && inlineSuggestions && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-20 max-h-[320px] overflow-y-auto no-scrollbar">
          {inlineSuggestions.states?.map((s, i) => (
            <button key={`state-${s.slug}`}
              onClick={() => { setSelectedStateName(s.name); setInput(''); dismissSuggestions() }}
              className={`flex w-full items-center gap-3 px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
              {s.flag_url
                ? <img src={`${s.flag_url}?width=80`} alt="" className="h-5 w-8 object-cover rounded-sm shrink-0 border border-[var(--border)]" />
                : <Map className="h-5 w-5 text-solar shrink-0" />}
              <span className="flex-1 text-left text-sm font-semibold text-[var(--txt)]">{s.name}</span>
              <span className="text-xs text-[var(--muted)]">State</span>
            </button>
          ))}
          {inlineSuggestions.counties?.map((c, i) => {
            const abbr = STATE_ABBRS[c.state ?? ''] ?? c.state
            const isFirst = i === 0 && !inlineSuggestions.states?.length
            return (
              <button key={`county-${c.slug}-${c.state}`}
                onClick={() => { setInput(`Analyze the solar opportunity in ${c.name}, ${abbr}`); dismissSuggestions(); textareaRef.current?.focus() }}
                className={`flex w-full items-center gap-3 px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors ${!isFirst ? 'border-t border-[var(--border)]' : ''}`}>
                <MapPin className="h-4 w-4 text-solar shrink-0" />
                <span className="flex-1 text-left text-sm font-semibold text-[var(--txt)]">{c.name}, {abbr}</span>
                <span className="text-xs text-[var(--muted)]">County</span>
              </button>
            )
          })}
          {inlineSuggestions.cities?.map((c, i) => {
            const abbr = STATE_ABBRS[c.state ?? ''] ?? c.state
            const isFirst = i === 0 && !inlineSuggestions.states?.length && !inlineSuggestions.counties?.length
            return (
              <button key={`city-${c.slug}-${c.state}`}
                onClick={() => { setInput(`What is the solar energy potential in ${c.name}, ${abbr}?`); dismissSuggestions(); textareaRef.current?.focus() }}
                className={`flex w-full items-center gap-3 px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors ${!isFirst ? 'border-t border-[var(--border)]' : ''}`}>
                <Sun className="h-4 w-4 text-solar shrink-0" />
                <span className="flex-1 text-left text-sm font-semibold text-[var(--txt)]">{c.name}, {abbr}</span>
                <span className="text-xs text-[var(--muted)]">City</span>
              </button>
            )
          })}
        </div>
      )}
      <div className={`flex flex-col rounded-[28px] border-2 ${addressMode ? 'border-solar' : recordingState !== 'idle' ? 'border-blue-500' : 'border-[var(--border)]'} bg-[var(--surface)] px-4 pt-3 pb-3 shadow-sm transition-all gap-1`}>

        {selectedAddress && (
          <div className="flex items-center gap-2 pb-2.5 mb-1 border-b border-[var(--border)]">
            <MapPin className="h-3.5 w-3.5 text-solar shrink-0" />
            <span className="text-xs text-solar truncate flex-1 font-medium">{selectedAddress.description}</span>
            <button onClick={clearAddress} className="text-[var(--muted)] hover:text-solar transition-colors shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {selectedStateName ? (
          <div
            className="w-full py-1 text-[17px] leading-relaxed cursor-text"
            onClick={() => {
              setInput(`What is the solar energy potential in ${selectedStateName}?`)
              setSelectedStateName(null)
              setTimeout(() => textareaRef.current?.focus(), 0)
            }}
          >
            <span className="text-[var(--txt)]">What is the solar energy potential in </span>
            <span className="text-solar font-semibold">{selectedStateName}</span>
            <span className="text-[var(--txt)]">?</span>
          </div>
        ) : recordingState === 'recording' ? (
          <div className="flex items-center min-h-[40px] py-1">
            <canvas ref={canvasRef} className="flex-1" style={{ height: '32px' }} />
          </div>
        ) : (
          <div className="flex items-start">
            <textarea ref={textareaRef} rows={1}
              value={addressMode ? addressInput : input}
              onChange={e => {
                if (addressMode) {
                  setAddressInput(e.target.value)
                  fetchSuggestions(e.target.value, userLocation)
                } else {
                  handleInputChange(e.target.value)
                }
              }}
              onKeyDown={e => {
                if (addressMode) {
                  if (e.key === 'Escape') { e.preventDefault(); exitAddressMode() }
                  if (e.key === 'Enter' && suggestions.length > 0) { e.preventDefault(); selectAddress(suggestions[0]); exitAddressMode() }
                } else {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input) }
                  if (e.key === 'Escape') { setModelMenuOpen(false); dismissSuggestions() }
                }
              }}
              placeholder={addressMode ? 'Enter an address…' : selectedAddress ? 'Ask about this property…' : 'Ask about solar potential…'}
              className="flex-1 resize-none bg-transparent py-1 text-[17px] text-[var(--txt)] placeholder:text-[var(--muted2)] outline-none leading-relaxed"
              style={{ minHeight: '40px' }} />
          </div>
        )}

        <div className="flex items-center pt-1">
          <SolarPlusMenu
            stateChips={stateChips}
            countyChips={countyChips}
            onSelect={(text) => { setInput(text); textareaRef.current?.focus() }}
            modelOptions={MODEL_OPTIONS.map(m => ({ id: m.id, label: m.label, icon: modelIcon(m.provider) }))}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
          />

          <button
            onClick={() => addressMode ? exitAddressMode() : setAddressMode(true)}
            className={`ml-2 shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              addressMode || selectedAddress ? 'text-solar bg-solar/10' : 'text-[var(--muted)] hover:bg-[rgba(0,0,0,0.07)] hover:text-[var(--txt)]'
            }`}
            title={addressMode ? 'Exit address mode' : 'Look up an address'}>
            <MapPin className="h-4 w-4" />
          </button>
          <button
            onClick={toggleMic}
            disabled={recordingState === 'transcribing'}
            className={`ml-2 shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
              recordingState === 'recording' ? 'text-red-500 bg-red-50 animate-pulse'
              : recordingState === 'transcribing' ? 'text-blue-500 bg-blue-50'
              : 'text-[var(--muted)] hover:bg-[rgba(0,0,0,0.07)] hover:text-[var(--txt)]'
            }`}
            title={recordingState === 'recording' ? 'Cancel recording' : recordingState === 'transcribing' ? 'Transcribing…' : 'Voice input'}
          >
            {recordingState === 'transcribing' ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
          {recordingState === 'recording' && (
            <button
              onClick={stopAndTranscribe}
              className="ml-2 shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors"
              title="Done — transcribe"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1" />
          {streaming ? (
            <button type="button"
              onClick={stopStream}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Stop (Space)">
              <Square className="h-4 w-4 fill-white" />
            </button>
          ) : (
            <button type="button"
              onClick={() => submit(selectedStateName ? `What is the solar energy potential in ${selectedStateName}?` : input)}
              disabled={(!input.trim() && !selectedStateName) || loading}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] disabled:opacity-25 hover:opacity-80 transition-opacity">
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {toast && (
        <p className="text-center text-[11px] text-[var(--muted)] mt-2 animate-in fade-in">{toast}</p>
      )}
      <p className="text-center text-[10px] text-[var(--muted2)] mt-2">
        AI-powered solar intelligence · Data from Google Sunroof &amp; NREL Cambium · Design &amp; Development by NYSgpt
      </p>
    </div>
  )

  const inputBox = chatInputBox

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
              <div className="w-full max-w-[773px] flex flex-col gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 text-solar">
                    <Sun className="h-[38px] w-[38px] [&_circle]:fill-solar/20" />
                    <h1 className="text-3xl font-bold text-[var(--txt)]">SolarGPT</h1>
                  </div>
                </div>
                {inputBox}
                <div className="max-w-[744px] mx-auto w-full">
                  <p className="text-base font-semibold text-[var(--txt)] mb-6">Explore</p>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
                    {stateChips.map(s => (
                      <button key={s.slug} type="button"
                        onClick={() => { setSelectedStateName(s.name); setInput('') }}
                        className="group shrink-0 w-[176px] h-[97px] rounded-2xl overflow-hidden relative hover:opacity-90 transition-opacity snap-start">
                        {s.flag_url
                          ? <img src={`${s.flag_url}?width=400`} alt={s.name} className="absolute inset-0 w-full h-full object-cover" />
                          : <div className="absolute inset-0 bg-solar/10 flex items-center justify-center"><Map className="h-8 w-8 text-solar" /></div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute bottom-2 left-3">
                          <p className="text-sm font-bold text-white">{s.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-4 py-6 max-w-[773px] mx-auto w-full">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-solar mt-0.5">
                      <Sun className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  {msg.role === 'user' ? (
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed bg-[var(--txt)] text-[var(--bg)]">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0 text-[17px] pt-0.5">
                      {msg.content ? (
                        <MarkdownContent content={msg.content} />
                      ) : (
                        <div className="flex gap-1 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:300ms]" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-solar">
                    <Sun className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-[var(--inp-bg)] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {!isEmpty && (
          <div className="shrink-0 px-4 pb-4 pt-2">
            <div className="mx-auto max-w-[773px]">{inputBox}</div>
          </div>
        )}
      </div>

      <SolarAddressDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        address={selectedAddress?.description ?? ''}
        lat={selectedAddress?.lat}
        lng={selectedAddress?.lng}
        insight={solarInsight}
        loading={solarLoading}
        error={solarError}
      />
    </>
  )
}
