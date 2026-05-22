import { useState, useCallback } from 'react';
import { Copy, CheckCircle2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { PhysicianNote } from '../engine/noteGenerator';

interface Props {
  note: PhysicianNote;
}

interface SectionProps {
  label: string;
  content: string;
  defaultOpen?: boolean;
}

function Section({ label, content, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800 hover:bg-slate-750 transition-colors text-left"
      >
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{label}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>
      {open && (
        <div className="px-4 py-3 bg-slate-900/60">
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      )}
    </div>
  );
}

export function NotePanel({ note }: Props) {
  const [copied, setCopied] = useState(false);

  const copyNote = useCallback(() => {
    navigator.clipboard.writeText(note.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [note.fullText]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Physician Note</span>
        </div>
        <button
          onClick={copyNote}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {copied
            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</>
            : <><Copy className="w-3.5 h-3.5" /> Copy Full Note</>}
        </button>
      </div>

      {/* Note sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <Section label="Chief Complaint" content={note.chiefComplaint} />
        <Section label="History of Present Illness" content={note.hpi} />
        <Section label="Review of Systems" content={note.reviewOfSystems} />
        <Section label="Assessment" content={note.assessment} />
        <Section label="Plan" content={note.plan} />

        {/* Paste instructions */}
        <div className="mt-3 bg-blue-950/40 border border-blue-800/40 rounded-lg px-4 py-3">
          <p className="text-xs text-blue-300 leading-relaxed">
            Click <strong>Copy Full Note</strong> above, then paste directly into your EMR note field with <strong>Ctrl + V</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
