'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Check, ChevronLeft, ChevronRight, Crop, FileText, Loader2, RotateCw, Upload, X } from 'lucide-react'
import { LESSONS } from '@/lib/tutoring/curriculum'

async function api(path: string) {
  const response = await fetch(path)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return data
}

export function Worksheet({ sessionId, attachments, lesson, highlights, readOnly, onUpload }: {
  sessionId: string
  attachments: any[]
  lesson: keyof typeof LESSONS
  highlights: any[]
  readOnly: boolean
  onUpload: (file: File) => Promise<void>
}) {
  const [selected, setSelected] = useState('sample')
  const [image, setImage] = useState('')
  const [pdfPage, setPdfPage] = useState(1)
  const [draft, setDraft] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [rotation, setRotation] = useState(0)
  const [crop, setCrop] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const modal = useRef<HTMLDivElement>(null)
  const modalReturnFocus = useRef<HTMLElement | null>(null)
  const uploadBusy = useRef(false)
  const attachment = attachments.find(item => item.id === selected)
  const regions = highlights.filter(region => region.attachmentId === selected && region.page === (attachment?.mime === 'application/pdf' ? pdfPage : 1))

  useEffect(() => {
    if (attachments.length) setSelected(attachments[attachments.length - 1].id)
  }, [attachments.length])

  useEffect(() => { setPdfPage(1) }, [selected])

  useEffect(() => {
    if (!draft || draft.type === 'application/pdf') {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(draft)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [draft])

  useEffect(() => {
    if (!draft) return
    const previousFocus = modalReturnFocus.current || (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    const dialog = modal.current
    dialog?.querySelector<HTMLElement>('h2')?.focus()

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!uploadBusy.current) setDraft(null)
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      )).filter(element => element.getClientRects().length > 0)
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (!first) {
        event.preventDefault()
        dialog.querySelector<HTMLElement>('h2')?.focus()
      } else if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement as HTMLElement))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previousFocus?.focus()
    }
  }, [draft])

  useEffect(() => {
    let cancelled = false
    let task: any
    setError('')
    setImage('')
    setLoading(Boolean(attachment))
    if (!attachment) return

    void (async () => {
      try {
        const ticket = await api(`/api/tutoring/sessions/${sessionId}/attachments/${attachment.id}`)
        if (cancelled) return
        if (attachment.mime !== 'application/pdf') {
          setImage(ticket.url)
          return
        }
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/tutor-pdf.worker.mjs'
        const response = await fetch(ticket.url)
        if (!response.ok) throw new Error('Worksheet preview expired')
        const data = await response.arrayBuffer()
        if (cancelled) return
        task = pdfjs.getDocument({ data, enableXfa: false })
        const pdf = await task.promise
        const page = await pdf.getPage(pdfPage)
        if (cancelled) return
        const element = canvas.current!
        const viewport = page.getViewport({ scale: 1.25 })
        element.width = viewport.width
        element.height = viewport.height
        await page.render({ canvas: element, canvasContext: element.getContext('2d')!, viewport }).promise
        if (!cancelled) setLoading(false)
      } catch (failure: any) {
        if (!cancelled) {
          setError(failure.message)
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
      void task?.destroy()
    }
  }, [selected, pdfPage, sessionId, attachment?.id])

  function choose(file?: File) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Choose a file smaller than 10 MB')
      return
    }
    setDraft(file)
    setRotation(0)
    setCrop(false)
    setError('')
  }

  async function upload() {
    if (!draft || uploadBusy.current) return
    uploadBusy.current = true
    setBusy(true)
    setError('')
    try {
      let file = draft
      if (preview) {
        const img = new Image()
        img.src = preview
        await img.decode()
        const out = document.createElement('canvas')
        const rotated = rotation % 180 !== 0
        const width = rotated ? img.naturalHeight : img.naturalWidth
        const height = rotated ? img.naturalWidth : img.naturalHeight
        const full = document.createElement('canvas')
        full.width = width
        full.height = height
        const context = full.getContext('2d')!
        context.translate(width / 2, height / 2)
        context.rotate(rotation * Math.PI / 180)
        context.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
        const margin = crop ? .15 : 0
        out.width = width * (1 - margin * 2)
        out.height = height * (1 - margin * 2)
        out.getContext('2d')!.drawImage(full, width * margin, height * margin, out.width, out.height, 0, 0, out.width, out.height)
        const blob = await new Promise<Blob>((resolve, reject) => out.toBlob(value => value ? resolve(value) : reject(new Error('Could not prepare photo')), 'image/jpeg', .9))
        file = new File([blob], draft.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
      }
      await onUpload(file)
      setDraft(null)
    } catch (failure: any) {
      setError(failure.message)
    } finally {
      uploadBusy.current = false
      setBusy(false)
    }
  }

  return (
    <section className="tutor-worksheet">
      <div className="tutor-section-label"><span>Your worksheet</span><span>{attachments.length}/3</span></div>
      <div className="tutor-paper-tabs" role="group" aria-label="Choose a worksheet">
        <button type="button" aria-pressed={selected === 'sample'} className={selected === 'sample' ? 'active' : ''} onClick={() => setSelected('sample')}>Example</button>
        {attachments.map((item, index) => <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)} className={selected === item.id ? 'active' : ''}>Upload {index + 1}</button>)}
      </div>
      <div className="tutor-paper" aria-busy={loading}>
        <div className="tutor-paper-heading"><FileText size={18} aria-hidden="true"/><span>{selected === 'sample' ? 'Try this together' : attachment?.name}</span></div>
        {selected === 'sample' ? <>
          <h3>{LESSONS[lesson].short}</h3>
          {LESSONS[lesson].worksheet.map((text, index) => <p key={index}>{text}</p>)}
          <div className="tutor-paper-lines"/>
        </> : <>
          {loading && <p className="tutor-worksheet-loading" role="status"><Loader2 size={18} aria-hidden="true"/> Opening worksheet…</p>}
          <div className="tutor-paper-image">
            {attachment?.mime === 'application/pdf' ? <canvas ref={canvas} hidden={loading}/> : image ? <img src={image} alt="Uploaded worksheet" onLoad={() => setLoading(false)} onError={() => { setLoading(false); setError('Preview expired. Select Example, then this upload to refresh.') }}/> : null}
            {!loading && regions.map((region, index) => <span key={index} className="tutor-highlight" style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.width * 100}%`, height: `${region.height * 100}%` }}/>) }
          </div>
          {attachment?.pages > 1 && <div className="tutor-pagination">
            <button type="button" disabled={pdfPage <= 1 || loading} onClick={() => setPdfPage(page => page - 1)}><ChevronLeft size={17} aria-hidden="true"/> Previous</button>
            <span>{pdfPage} of {attachment.pages}</span>
            <button type="button" disabled={pdfPage >= attachment.pages || loading} onClick={() => setPdfPage(page => page + 1)}>Next <ChevronRight size={17} aria-hidden="true"/></button>
          </div>}
        </>}
      </div>
      {!readOnly && <>
        <div className="tutor-upload-actions">
          <button type="button" onClick={event => { modalReturnFocus.current = event.currentTarget; photoInput.current?.click() }}><Camera size={18} aria-hidden="true"/> Take a photo</button>
          <button type="button" onClick={event => { modalReturnFocus.current = event.currentTarget; fileInput.current?.click() }}><Upload size={18} aria-hidden="true"/> Upload work</button>
        </div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={event => { choose(event.target.files?.[0]); event.target.value = '' }}/>
        <input ref={photoInput} type="file" accept="image/*" capture="environment" hidden onChange={event => { choose(event.target.files?.[0]); event.target.value = '' }}/>
        <p className="tutor-file-help">Photos or PDFs · up to 10 MB each<br/>3 files and 5 PDF pages per lesson</p>
      </>}
      {error && !draft && <p className="tutor-error" role="alert">{error}</p>}
      {draft && <div className="tutor-modal-backdrop">
        <div ref={modal} className="tutor-upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title" aria-describedby="upload-description" aria-busy={busy}>
          <div className="tutor-upload-modal-header"><h2 id="upload-title" tabIndex={-1}>Focus on one question</h2><button type="button" aria-label="Close worksheet preview" disabled={busy} onClick={() => setDraft(null)}><X size={21} aria-hidden="true"/></button></div>
          <p id="upload-description">Check the image and cover any names or personal details before uploading.</p>
          {draft.type === 'application/pdf' ? <div className="tutor-pdf-placeholder"><FileText size={22} aria-hidden="true"/> PDF · {draft.name}<p>Up to 5 pages. The tutor will ask which question you want to work on.</p></div> : preview ? <div className="tutor-crop-preview"><img src={preview} alt="Worksheet to upload" style={{ transform: `rotate(${rotation}deg)` }}/>{crop && <div className="tutor-crop-guide"/>}</div> : <p className="tutor-worksheet-loading" role="status"><Loader2 size={18} aria-hidden="true"/> Opening photo…</p>}
          {preview && <div className="tutor-upload-actions">
            <button type="button" disabled={busy} onClick={() => setRotation(value => (value + 90) % 360)}><RotateCw size={18} aria-hidden="true"/> Rotate</button>
            <button type="button" disabled={busy} aria-pressed={crop} onClick={() => setCrop(!crop)}>{crop ? <Check size={18} aria-hidden="true"/> : <Crop size={18} aria-hidden="true"/>} Crop to centre</button>
          </div>}
          {error && <p className="tutor-error" role="alert">{error}</p>}
          <div className="tutor-upload-actions">
            <button type="button" disabled={busy} onClick={() => setDraft(null)}>Cancel</button>
            <button type="button" className="tutor-primary" disabled={busy || (draft.type !== 'application/pdf' && !preview)} onClick={() => void upload()}>{busy ? <Loader2 size={18} aria-hidden="true"/> : <Check size={18} aria-hidden="true"/>}{busy ? 'Preparing…' : 'Use this worksheet'}</button>
          </div>
          <span className="sr-only" role="status">{busy ? 'Preparing and uploading your worksheet. Please wait.' : ''}</span>
        </div>
      </div>}
    </section>
  )
}
