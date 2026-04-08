"use client";
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Mic, MicOff, Sparkles, Clock, Building2,
  Loader2, AlignLeft, CheckCircle2, LayoutDashboard,
  PenLine, Calendar, CalendarRange,
  Plus, Trash2, Link2, Target, FolderOpen, X, CalendarDays, FileText, Mail, Send,
  Save, Pencil, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/* ═══════════════════════ Types ═══════════════════════ */

interface ProjectEntry { id: string; name: string; hours: string; progress: string; memo: string; links: string; }
interface ClientTab { id: string; clientName: string; email: string; projects: ProjectEntry[]; }

interface ReportResult {
  client: string; total_hours: number;
  projects: { name: string; hours: number; progress: number; memo: string; links: string[]; formatted_report: string; }[];
}
interface AggregatedReport {
  total_duration_hours: number;
  client_summaries: { client_name: string; duration_hours: number; activities: string[]; links: string[]; summary: string; }[];
}

/* ═══════════════════ Helpers ═══════════════════ */

let _uid = 0;
const uid = () => `id_${++_uid}_${Date.now()}`;
const emptyProject = (): ProjectEntry => ({ id: uid(), name: '', hours: '', progress: '', memo: '', links: '' });
const emptyClientTab = (): ClientTab => ({ id: uid(), clientName: '', email: '', projects: [emptyProject()] });

/** 顧客名 → 表示用（"株式会社"除去 + "様"付与） */
const displayClient = (name: string) => {
  const stripped = name.replace(/^株式会社/, '').replace(/株式会社$/, '').trim();
  return stripped ? `${stripped}様` : name;
};

/* ── design.md準拠 Input ── */
const DInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props}
    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-shadow ${props.className || ''}`}
    style={{ borderColor: '#E0F2FE', backgroundColor: '#FFFFFF', ...props.style }}
    onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px #0EA5E9'; e.currentTarget.style.borderColor = '#0EA5E9'; props.onFocus?.(e); }}
    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E0F2FE'; props.onBlur?.(e); }}
  />
);
const DTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props}
    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-shadow resize-y ${props.className || ''}`}
    style={{ borderColor: '#E0F2FE', backgroundColor: '#FFFFFF', ...props.style }}
    onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px #0EA5E9'; e.currentTarget.style.borderColor = '#0EA5E9'; props.onFocus?.(e); }}
    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E0F2FE'; props.onBlur?.(e); }}
  />
);

/* ═══════════════════ useClientTabs Hook ═══════════════════ */
function useClientTabs() {
  const [tabs, setTabs] = useState<ClientTab[]>([emptyClientTab()]);
  const [activeIdx, setActiveIdx] = useState(0);

  const add = () => { setTabs(prev => [...prev, emptyClientTab()]); setActiveIdx(tabs.length); };
  const remove = (idx: number) => {
    if (tabs.length <= 1 || idx === 0) return;
    setTabs(prev => prev.filter((_, i) => i !== idx));
    setActiveIdx(prev => Math.min(prev, tabs.length - 2));
  };
  const updateName = (idx: number, name: string) => {
    setTabs(prev => prev.map((t, i) => i === idx ? { ...t, clientName: name } : t));
  };
  const updateEmail = (idx: number, email: string) => {
    setTabs(prev => prev.map((t, i) => i === idx ? { ...t, email } : t));
  };
  const addProject = (tabIdx: number) => {
    setTabs(prev => prev.map((t, i) => i === tabIdx ? { ...t, projects: [...t.projects, emptyProject()] } : t));
  };
  const removeProject = (tabIdx: number, projId: string) => {
    setTabs(prev => prev.map((t, i) => {
      if (i !== tabIdx || t.projects.length <= 1) return t;
      return { ...t, projects: t.projects.filter(p => p.id !== projId) };
    }));
  };
  const updateProject = (tabIdx: number, projId: string, field: keyof ProjectEntry, value: string) => {
    setTabs(prev => prev.map((t, i) =>
      i === tabIdx ? { ...t, projects: t.projects.map(p => p.id === projId ? { ...p, [field]: value } : p) } : t
    ));
  };
  const isValid = tabs.some(t => t.clientName.trim() !== '' && t.projects.some(p => p.name.trim() && p.hours.trim() && p.memo.trim()));

  return { tabs, activeIdx, setActiveIdx, add, remove, updateName, updateEmail, addProject, removeProject, updateProject, isValid, setTabs };
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function App() {
  const [mainTab, setMainTab] = useState<'daily' | 'weekly' | 'monthly' | 'dashboard'>('daily');

  /* ── 3つの入力モード、それぞれ独立した顧客タブ ── */
  const daily = useClientTabs();
  const weekly = useClientTabs();
  const monthly = useClientTabs();

  /* ── 日報・週報・月報の期間 ── */
  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weeklyStart, setWeeklyStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().split('T')[0];
  });
  const [monthlyMonth, setMonthlyMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  });

  /* ── 保存済みレポート一覧 ── */
  interface SavedReport { id: string; type: 'daily' | 'weekly' | 'monthly'; date: string; report: ReportResult; savedAt: string; }
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [dashboardLogTab, setDashboardLogTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // localStorage から読み込み
  useEffect(() => {
    try {
      const saved = window.localStorage?.getItem('wl_saved_reports');
      if (saved) setSavedReports(JSON.parse(saved));
    } catch {}
  }, []);

  const persistReports = (reports: SavedReport[]) => {
    setSavedReports(reports);
    try { window.localStorage?.setItem('wl_saved_reports', JSON.stringify(reports)); } catch {}
  };

  const saveReport = (type: 'daily' | 'weekly' | 'monthly', date: string, report: ReportResult) => {
    const entry: SavedReport = { id: uid(), type, date, report, savedAt: new Date().toISOString() };
    persistReports([entry, ...savedReports]);
  };

  const deleteReport = (id: string) => {
    if (!confirm('この記録を削除しますか？')) return;
    persistReports(savedReports.filter(r => r.id !== id));
  };

  const updateSavedReport = (id: string, updated: ReportResult) => {
    persistReports(savedReports.map(r => r.id === id ? { ...r, report: updated } : r));
    setEditingReportId(null);
  };

  /* ── Shared state ── */
  const [isRecording, setIsRecording] = useState(false);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<ReportResult[]>([]);

  /* ── Dashboard ── */
  const [isGeneratingAggregate, setIsGeneratingAggregate] = useState(false);
  const [aggregatedReport, setAggregatedReport] = useState<AggregatedReport | null>(null);

  /* ── メールアドレス履歴（顧客名 → email） ── */
  const [emailHistory, setEmailHistory] = useState<Record<string, string>>({});
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});

  // 起動時にlocalStorageから読み込み
  useEffect(() => {
    try {
      const saved = window.localStorage?.getItem('wl_email_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setEmailHistory(parsed);
        setEmailInputs(parsed);
      }
    } catch {}
  }, []);

  const saveEmailForClient = (clientName: string, email: string) => {
    const next = { ...emailHistory, [clientName]: email };
    setEmailHistory(next);
    setEmailInputs(prev => ({ ...prev, [clientName]: email }));
    try { window.localStorage?.setItem('wl_email_history', JSON.stringify(next)); } catch {}
  };

  /** メール送信（mailto:で開く） */
  const handleSendEmail = (report: ReportResult) => {
    const email = emailInputs[report.client] || '';
    if (!email.trim()) { alert('メールアドレスを入力してください。'); return; }

    // アドレスを保存
    saveEmailForClient(report.client, email);

    const dispName = displayClient(report.client);
    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    const subject = `業務報告書 - ${dispName} (${today})`;
    const body = [
      `${dispName}`,
      ``,
      `いつもお世話になっております。`,
      `下記の通り、業務報告をいたします。`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `報告日: ${today}`,
      `合計作業時間: ${report.total_hours} h`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      ...report.projects.flatMap(p => [
        `【${p.name}】`,
        `  作業時間: ${p.hours}h ／ 達成率: ${p.progress}%`,
        `  ${p.formatted_report}`,
        ...(p.links.length > 0 ? [`  参考: ${p.links.join(', ')}`] : []),
        ``,
      ]),
      `何かご不明な点がございましたらお気軽にご連絡ください。`,
      `よろしくお願いいたします。`,
    ].join('\n');

    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setSendingEmailFor(null);
  };

  const recognitionRef = useRef<any>(null);
  const activeRecIdRef = useRef<string | null>(null);
  useEffect(() => { activeRecIdRef.current = activeRecordingId; }, [activeRecordingId]);

  /* ── Speech Recognition ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'ja-JP';
    rec.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (!final) return;
      const rid = activeRecIdRef.current;
      if (!rid) return;
      const updater = (tabs: ClientTab[]) => tabs.map(tab => ({
        ...tab, projects: tab.projects.map(p => p.id === rid ? { ...p, memo: p.memo + (p.memo ? '\n' : '') + final } : p),
      }));
      daily.setTabs(prev => updater(prev));
      weekly.setTabs(prev => updater(prev));
      monthly.setTabs(prev => updater(prev));
    };
    rec.onerror = () => { setIsRecording(false); setActiveRecordingId(null); };
    rec.onend = () => { setIsRecording(false); setActiveRecordingId(null); };
    recognitionRef.current = rec;
  }, []);

  const toggleRecording = (projectId: string) => {
    if (!recognitionRef.current) { alert('お使いのブラウザは音声入力に対応していません。'); return; }
    if (isRecording && activeRecordingId === projectId) {
      recognitionRef.current.stop(); setIsRecording(false); setActiveRecordingId(null);
    } else {
      if (isRecording) recognitionRef.current.stop();
      setActiveRecordingId(projectId);
      try { recognitionRef.current.start(); setIsRecording(true); } catch (e) { console.error(e); }
    }
  };

  /* ── Generate helper ── */
  const generateForClient = async (clientName: string, projects: ProjectEntry[]): Promise<ReportResult | null> => {
    const valid = projects.filter(p => p.name.trim() && p.hours.trim() && p.memo.trim());
    if (!clientName.trim() || valid.length === 0) return null;
    const formatted = clientName.includes('社') || clientName.includes('株式会社') ? clientName : `株式会社${clientName}`;
    const projectResults = await Promise.all(valid.map(async (proj) => {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput: proj.memo, duration: proj.hours, projectName: proj.name, progress: proj.progress }),
      });
      if (!res.ok) throw new Error('AI生成エラー');
      const data = await res.json();
      return { name: proj.name, hours: Number(proj.hours), progress: Number(proj.progress) || 0, memo: proj.memo, links: proj.links.split('\n').map(l => l.trim()).filter(Boolean), formatted_report: data.report };
    }));
    let { data: cd, error: ce } = await supabase.from('clients').select('id').eq('name', formatted).single();
    if (ce && ce.code !== 'PGRST116') throw ce;
    let clientId;
    if (cd) { clientId = cd.id; } else {
      const { data: nc, error: ne } = await supabase.from('clients').insert([{ name: formatted }]).select('id').single();
      if (ne) throw ne; clientId = nc.id;
    }
    for (const proj of projectResults) {
      await supabase.from('daily_logs').insert([{ client_id: clientId, duration_hours: proj.hours, raw_input: proj.memo, formatted_report: proj.formatted_report }]);
    }
    return { client: formatted, total_hours: projectResults.reduce((s, p) => s + p.hours, 0), projects: projectResults };
  };

  const handleGenerate = async (clientTabsData: ClientTab[]) => {
    setIsGenerating(true); setGeneratedReports([]);
    try {
      const results: ReportResult[] = [];
      for (const tab of clientTabsData) {
        const r = await generateForClient(tab.clientName, tab.projects);
        if (r) {
          results.push(r);
          // メールアドレスを保存
          if (tab.email.trim()) {
            saveEmailForClient(r.client, tab.email.trim());
          }
        }
      }
      if (results.length === 0) { alert('入力が不足しています。'); return; }
      setGeneratedReports(results);
    } catch (e) { console.error(e); alert('レポートの生成または保存に失敗しました。'); }
    finally { setIsGenerating(false); }
  };

  /* ── Aggregate ── */
  const handleGenerateAggregate = async (period: 'week' | 'month') => {
    setIsGeneratingAggregate(true); setAggregatedReport(null);
    try {
      const now = new Date(); const start = new Date();
      if (period === 'week') start.setDate(now.getDate() - 7); else start.setMonth(now.getMonth() - 1);
      const { data: logs, error } = await supabase.from('daily_logs')
        .select('duration_hours, raw_input, formatted_report, created_at, clients(name)')
        .gte('created_at', start.toISOString().split('T')[0]).order('created_at', { ascending: true });
      if (error) throw error;
      if (!logs || logs.length === 0) { alert(`${period === 'week' ? '今週' : '今月'}のログがありません。`); return; }

      // ── フロントエンド側で顧客別にマージ ──
      const clientMap: Record<string, { duration_hours: number; reports: string[]; links: string[] }> = {};
      logs.forEach(l => {
        const cname = (l.clients as any)?.name ?? '不明';
        if (!clientMap[cname]) clientMap[cname] = { duration_hours: 0, reports: [], links: [] };
        clientMap[cname].duration_hours += Number(l.duration_hours) || 0;
        if (l.formatted_report) clientMap[cname].reports.push(l.formatted_report);
      });

      // savedReportsからリンク情報を収集
      const startStr = start.toISOString().split('T')[0];
      const relevantSaved = savedReports.filter(sr => sr.date >= startStr);
      relevantSaved.forEach(sr => {
        const cname = sr.report.client;
        if (!clientMap[cname]) clientMap[cname] = { duration_hours: 0, reports: [], links: [] };
        sr.report.projects.forEach(p => {
          p.links.forEach(l => { if (!clientMap[cname].links.includes(l)) clientMap[cname].links.push(l); });
        });
      });

      // ── 顧客ごとにAIで総括を生成 ──
      const clientEntries = Object.entries(clientMap);
      const totalHours = clientEntries.reduce((s, [, v]) => s + v.duration_hours, 0);

      const summaries = await Promise.all(clientEntries.map(async ([clientName, data]) => {
        try {
          const res = await fetch('/api/generate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'aggregate_client',
              clientName,
              duration_hours: Math.round(data.duration_hours * 10) / 10,
              reports: data.reports,
            }),
          });
          if (!res.ok) throw new Error('AI error');
          const aiData = await res.json();
          return {
            client_name: clientName,
            duration_hours: Math.round(data.duration_hours * 10) / 10,
            activities: aiData.activities || data.reports.slice(0, 5),
            summary: aiData.summary || '作業を実施しました。',
            links: data.links,
          };
        } catch {
          return {
            client_name: clientName,
            duration_hours: Math.round(data.duration_hours * 10) / 10,
            activities: data.reports.slice(0, 5),
            summary: `${clientName}に対して合計${Math.round(data.duration_hours * 10) / 10}時間の作業を実施しました。`,
            links: data.links,
          };
        }
      }));

      setAggregatedReport({
        total_duration_hours: Math.round(totalHours * 10) / 10,
        client_summaries: summaries,
      });
    } catch (e) { console.error(e); alert('集計レポートの生成に失敗しました。'); }
    finally { setIsGeneratingAggregate(false); }
  };

  /* ═══════════════════ Shared UI Blocks ═══════════════════ */

  const renderProjectCard = (
    proj: ProjectEntry, idx: number,
    onUpdate: (field: keyof ProjectEntry, val: string) => void,
    onRemove: () => void, canRemove: boolean,
  ) => (
    <div key={proj.id} className="rounded-xl border p-5 space-y-4" style={{ borderColor: '#E0F2FE', backgroundColor: '#F8FDFF' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Project {idx + 1}</span>
        {canRemove && <button onClick={onRemove} className="text-[#94A3B8] hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px_110px] gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#64748B]">プロジェクト名</label>
          <DInput type="text" value={proj.name} onChange={(e) => onUpdate('name', e.target.value)} placeholder="例: Webリニューアル" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#64748B] flex items-center"><Clock className="w-3 h-3 mr-1" />時間 (h)</label>
          <DInput type="number" value={proj.hours} onChange={(e) => onUpdate('hours', e.target.value)} placeholder="1.5" min="0" step="0.1" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#64748B] flex items-center"><Target className="w-3 h-3 mr-1" />達成率 (%)</label>
          <DInput type="number" value={proj.progress} onChange={(e) => onUpdate('progress', e.target.value)} placeholder="70" min="0" max="100" />
        </div>
      </div>
      {proj.progress && Number(proj.progress) > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-[#64748B]">
            <span>進捗</span><span className="font-semibold" style={{ color: '#0EA5E9' }}>{proj.progress}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: '#E0F2FE' }}>
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(Number(proj.progress), 100)}%`, backgroundColor: Number(proj.progress) >= 100 ? '#16A34A' : '#0EA5E9' }} />
          </div>
        </div>
      )}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[#64748B] flex items-center"><Link2 className="w-3 h-3 mr-1" />参考URL・資料リンク</label>
        <DTextarea value={proj.links} onChange={(e) => onUpdate('links', e.target.value)} placeholder={"https://example.com/doc\nhttps://docs.google.com/..."} rows={2} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#64748B] flex items-center"><AlignLeft className="w-3 h-3 mr-1" />作業メモ</label>
          <button onClick={() => toggleRecording(proj.id)} className="flex items-center px-3 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor: isRecording && activeRecordingId === proj.id ? '#FEE2E2' : '#F0F9FF', color: isRecording && activeRecordingId === proj.id ? '#DC2626' : '#64748B' }}>
            {isRecording && activeRecordingId === proj.id ? <><MicOff className="w-3 h-3 mr-1" />停止</> : <><Mic className="w-3 h-3 mr-1" />音声入力</>}
          </button>
        </div>
        <DTextarea value={proj.memo} onChange={(e) => onUpdate('memo', e.target.value)} placeholder="例: CSSのメディアクエリの記述ミスを修正。スマホ表示崩れ解消。" rows={3} />
      </div>
    </div>
  );

  /** 顧客タブ付き入力フォーム（日報・週報・月報で共通） */
  const renderClientTabForm = (
    ct: ReturnType<typeof useClientTabs>,
    periodHeader: React.ReactNode | null,
    buttonLabel: string,
    buttonIcon: React.ReactNode,
    onSubmit: () => void,
    valid: boolean,
  ) => (
    <div className="rounded-xl p-6 md:p-8" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

      {/* 期間入力（週報・月報のみ） */}
      {periodHeader && <div className="mb-6">{periodHeader}</div>}

      {/* Client tab bar */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
        {ct.tabs.map((tab, idx) => (
          <div key={tab.id}
            className="flex items-center shrink-0 rounded-lg border text-sm font-semibold transition-colors cursor-pointer"
            style={{
              borderColor: ct.activeIdx === idx ? '#0EA5E9' : '#E0F2FE',
              backgroundColor: ct.activeIdx === idx ? '#F0F9FF' : '#FFFFFF',
              color: ct.activeIdx === idx ? '#0EA5E9' : '#64748B',
            }}
            onClick={() => ct.setActiveIdx(idx)}>
            <span className="px-3 py-2 flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              {tab.clientName || `顧客 ${idx + 1}`}
            </span>
            {idx > 0 && (
              <button onClick={(e) => { e.stopPropagation(); ct.remove(idx); }}
                className="pr-2.5 pl-0 py-2 hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        <button onClick={ct.add}
          className="flex items-center shrink-0 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors hover:bg-[#FFFDF7]"
          style={{ borderColor: '#E0F2FE', color: '#64748B', borderStyle: 'dashed' }}>
          <Plus className="w-3.5 h-3.5 mr-1" />顧客を追加
        </button>
      </div>

      {/* Active client form */}
      {ct.tabs[ct.activeIdx] && (() => {
        const tab = ct.tabs[ct.activeIdx];
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-[#334155]">
                  <Building2 className="w-4 h-4 mr-2 text-[#64748B]" />顧客名
                </label>
                <DInput type="text" value={tab.clientName} onChange={(e) => ct.updateName(ct.activeIdx, e.target.value)} placeholder="例: A社" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-[#334155]">
                  <Mail className="w-4 h-4 mr-2 text-[#64748B]" />メールアドレス
                </label>
                <DInput type="email" value={tab.email} onChange={(e) => ct.updateEmail(ct.activeIdx, e.target.value)}
                  placeholder={emailHistory[tab.clientName] || 'example@company.co.jp'}
                />
                {emailHistory[tab.clientName] && !tab.email && (
                  <button onClick={() => ct.updateEmail(ct.activeIdx, emailHistory[tab.clientName])}
                    className="text-xs text-[#0EA5E9] mt-0.5">前回のアドレスを使う: {emailHistory[tab.clientName]}</button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm font-semibold text-[#334155]">
                <FolderOpen className="w-4 h-4 mr-2 text-[#64748B]" />プロジェクト
              </label>
              <button onClick={() => ct.addProject(ct.activeIdx)}
                className="flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ color: '#0EA5E9', backgroundColor: '#F0F9FF' }}>
                <Plus className="w-3.5 h-3.5 mr-1" />追加
              </button>
            </div>
            <div className="space-y-4">
              {tab.projects.map((proj, pIdx) =>
                renderProjectCard(proj, pIdx,
                  (field, val) => ct.updateProject(ct.activeIdx, proj.id, field, val),
                  () => ct.removeProject(ct.activeIdx, proj.id),
                  tab.projects.length > 1)
              )}
            </div>
          </div>
        );
      })()}

      {/* Submit */}
      <button onClick={onSubmit} disabled={!valid || isGenerating}
        className="w-full flex items-center justify-center py-3.5 rounded-lg text-white font-semibold text-sm mt-6 transition-all"
        style={{ backgroundColor: !valid ? '#CBD5E1' : '#0EA5E9', cursor: !valid ? 'not-allowed' : 'pointer' }}
        onMouseEnter={(e) => { if (valid) e.currentTarget.style.backgroundColor = '#0284C7'; }}
        onMouseLeave={(e) => { if (valid) e.currentTarget.style.backgroundColor = '#0EA5E9'; }}>
        {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AIがレポートを生成中...</> : <>{buttonIcon}{buttonLabel}</>}
      </button>
    </div>
  );

  /* ── PDF生成 ── */
  const handleDownloadPdf = (report: ReportResult) => {
    const dispName = displayClient(report.client);
    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    const projectRows = report.projects.map(p => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E0F2FE;font-size:13px;">${p.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E0F2FE;font-size:13px;text-align:center;">${p.hours}h</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E0F2FE;font-size:13px;text-align:center;">${p.progress}%</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E0F2FE;font-size:13px;line-height:1.6;">${p.formatted_report}</td>
      </tr>
      ${p.links.length > 0 ? `<tr><td colspan="4" style="padding:6px 12px 10px;border-bottom:1px solid #E0F2FE;font-size:11px;color:#64748B;">参考: ${p.links.map(l => `<a href="${l}" style="color:#0EA5E9;">${l}</a>`).join(', ')}</td></tr>` : ''}
    `).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>業務報告書 - ${dispName}</title>
    <style>@page{size:A4;margin:20mm;}body{font-family:"Hiragino Kaku Gothic ProN","Meiryo",sans-serif;color:#1E293B;line-height:1.6;margin:0;padding:0;}
    .header{text-align:center;border-bottom:3px solid #0EA5E9;padding-bottom:16px;margin-bottom:24px;}
    .header h1{font-size:20px;color:#0F172A;margin:0 0 4px;}
    .meta{display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px;color:#64748B;}
    table{width:100%;border-collapse:collapse;margin-top:12px;}
    th{background:#F0F9FF;padding:10px 12px;text-align:left;font-size:12px;color:#64748B;font-weight:600;border-bottom:2px solid #E0F2FE;}
    .summary{margin-top:20px;padding:14px;background:#FFFDF7;border-radius:8px;border:1px solid #E0F2FE;}
    .summary span{font-size:12px;color:#64748B;}.summary strong{font-size:22px;color:#0EA5E9;}
    </style></head><body>
    <div class="header"><h1>業務報告書</h1><p style="color:#64748B;font-size:13px;margin:0;">AI Work Log Assistant</p></div>
    <div class="meta"><div><strong>宛先:</strong> ${dispName}</div><div><strong>報告日:</strong> ${today}</div></div>
    <div class="summary"><span>合計作業時間</span><br/><strong>${report.total_hours} h</strong></div>
    <table><thead><tr><th>プロジェクト</th><th style="text-align:center;width:70px;">時間</th><th style="text-align:center;width:70px;">達成率</th><th>報告内容</th></tr></thead><tbody>${projectRows}</tbody></table>
    </body></html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('ポップアップがブロックされました。許可してください。'); return; }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  };

  const renderReportResult = (report: ReportResult, key: number, onSave?: () => void) => {
    const dispName = displayClient(report.client);
    const currentEmail = emailInputs[report.client] || emailHistory[report.client] || '';
    const isEmailOpen = sendingEmailFor === report.client;

    return (
    <motion.div key={key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b flex-wrap gap-2" style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}>
        <div className="flex items-center font-semibold text-sm" style={{ color: '#0C4A6E' }}>
          <CheckCircle2 className="w-5 h-5 mr-2" />{dispName} — レポート生成完了
        </div>
        <div className="flex items-center gap-2">
          {onSave && (
            <button onClick={onSave}
              className="flex items-center text-xs font-semibold px-4 py-2 rounded-lg transition-all"
              style={{ backgroundColor: '#16A34A', color: '#FFFFFF' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}>
              <Save className="w-3.5 h-3.5 mr-1.5" />記録
            </button>
          )}
          <button onClick={() => setSendingEmailFor(isEmailOpen ? null : report.client)}
            className="flex items-center text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ backgroundColor: isEmailOpen ? '#0284C7' : '#FFFFFF', color: isEmailOpen ? '#FFFFFF' : '#0EA5E9', border: '1px solid #0EA5E9' }}>
            <Mail className="w-3.5 h-3.5 mr-1.5" />メール
          </button>
          <button onClick={() => handleDownloadPdf(report)}
            className="flex items-center text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ backgroundColor: '#0EA5E9', color: '#FFFFFF' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0284C7'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0EA5E9'}>
            <FileText className="w-3.5 h-3.5 mr-1.5" />PDF
          </button>
        </div>
      </div>

      {/* Email panel */}
      <AnimatePresence>
        {isEmailOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-3 flex-wrap" style={{ backgroundColor: '#FFFDF7', borderColor: '#E0F2FE' }}>
              <Mail className="w-4 h-4 shrink-0" style={{ color: '#64748B' }} />
              <div className="flex-1 min-w-[200px]">
                <DInput type="email" value={currentEmail}
                  onChange={(e) => setEmailInputs(prev => ({ ...prev, [report.client]: e.target.value }))}
                  placeholder="example@company.co.jp"
                />
              </div>
              {emailHistory[report.client] && emailHistory[report.client] !== currentEmail && (
                <button onClick={() => setEmailInputs(prev => ({ ...prev, [report.client]: emailHistory[report.client] }))}
                  className="text-xs text-[#64748B] underline shrink-0">前回: {emailHistory[report.client]}</button>
              )}
              <button onClick={() => handleSendEmail(report)}
                className="flex items-center text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shrink-0"
                style={{ backgroundColor: '#0EA5E9', color: '#FFFFFF' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0284C7'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0EA5E9'}>
                <Send className="w-3.5 h-3.5 mr-1.5" />送信
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Content */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Summary bar */}
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-xs text-[#64748B]">宛先</span>
            <div className="font-semibold text-[#0F172A]">{dispName}</div>
          </div>
          <div className="h-8 w-px" style={{ backgroundColor: '#E0F2FE' }} />
          <div>
            <span className="text-xs text-[#64748B]">合計作業時間</span>
            <div className="font-semibold text-lg" style={{ color: '#0EA5E9' }}>{report.total_hours} h</div>
          </div>
          <div className="h-8 w-px" style={{ backgroundColor: '#E0F2FE' }} />
          <div>
            <span className="text-xs text-[#64748B]">プロジェクト数</span>
            <div className="font-semibold text-[#0F172A]">{report.projects.length} 件</div>
          </div>
        </div>

        {/* Project cards */}
        {report.projects.map((proj, i) => (
          <div key={i} className="rounded-xl border p-5 space-y-3" style={{ borderColor: '#E0F2FE' }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0F172A]">{proj.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: '#F0F9FF', color: '#0EA5E9' }}>
                  <Clock className="w-3 h-3 inline mr-1" />{proj.hours}h
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md"
                  style={{ backgroundColor: proj.progress >= 100 ? '#F0F9FF' : '#F0F9FF', color: proj.progress >= 100 ? '#16A34A' : '#0EA5E9' }}>
                  <Target className="w-3 h-3 inline mr-1" />{proj.progress}%
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: '#E0F2FE' }}>
              <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(proj.progress, 100)}%`, backgroundColor: proj.progress >= 100 ? '#16A34A' : '#0EA5E9' }} />
            </div>
            <p className="text-sm text-[#475569] leading-relaxed">{proj.formatted_report}</p>
            {proj.links.length > 0 && (
              <div className="flex items-start gap-2 pt-1">
                <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#64748B' }} />
                <div className="space-y-0.5">
                  {proj.links.map((link, li) => (
                    <a key={li} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs truncate" style={{ color: '#0EA5E9' }}>{link}</a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
    );
  };

  /** タイプ別の記録済みレポート一覧（日報・週報・月報タブ内に表示） */
  const renderSavedList = (type: 'daily' | 'weekly' | 'monthly') => {
    const items = savedReports.filter(r => r.type === type);
    const typeLabel = type === 'daily' ? '日報' : type === 'weekly' ? '週報' : '月報';
    if (items.length === 0) return null;
    return (
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#F0F9FF', backgroundColor: '#F8FDFF' }}>
          <h2 className="text-sm font-semibold text-[#0F172A] flex items-center">
            <History className="w-4 h-4 mr-2" style={{ color: '#0EA5E9' }} />過去の{typeLabel}
          </h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-md border" style={{ borderColor: '#E0F2FE', color: '#64748B' }}>{items.length} 件</span>
        </div>
        <div>
          {items.map((sr, idx) => {
            const dispName = displayClient(sr.report.client);
            const isEditing = editingReportId === sr.id;
            return (
              <div key={sr.id} style={{ borderBottom: idx < items.length - 1 ? '1px solid #F0F9FF' : 'none' }}>
                <div className="p-5 transition-colors hover:bg-[#FFFDF7]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold" style={{ backgroundColor: '#F0F9FF', color: '#64748B' }}>{sr.date}</span>
                      <span className="font-semibold text-sm text-[#0F172A]">{dispName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: '#F0F9FF', color: '#0EA5E9' }}>
                        <Clock className="w-3 h-3 inline mr-1" />{sr.report.total_hours}h
                      </span>
                      <button onClick={() => setEditingReportId(isEditing ? null : sr.id)} className="p-1.5 rounded-md transition-colors" style={{ color: '#64748B' }} title="編集">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteReport(sr.id)} className="p-1.5 rounded-md transition-colors hover:text-red-500" style={{ color: '#94A3B8' }} title="削除">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {sr.report.projects.map((p, pi) => (
                    <div key={pi} className="mb-2">
                      {isEditing ? (
                        <div className="space-y-2 rounded-lg border p-3 mb-2" style={{ borderColor: '#E0F2FE' }}>
                          <div className="grid grid-cols-[1fr_80px_80px] gap-2">
                            <DInput value={p.name} onChange={(e) => { const updated = { ...sr.report, projects: sr.report.projects.map((pp, ppi) => ppi === pi ? { ...pp, name: e.target.value } : pp) }; setSavedReports(prev => prev.map(r => r.id === sr.id ? { ...r, report: updated } : r)); }} placeholder="プロジェクト名" />
                            <DInput type="number" value={String(p.hours)} onChange={(e) => { const updated = { ...sr.report, projects: sr.report.projects.map((pp, ppi) => ppi === pi ? { ...pp, hours: Number(e.target.value) } : pp), total_hours: sr.report.projects.reduce((s, pp, ppi) => s + (ppi === pi ? Number(e.target.value) : pp.hours), 0) }; setSavedReports(prev => prev.map(r => r.id === sr.id ? { ...r, report: updated } : r)); }} placeholder="h" />
                            <DInput type="number" value={String(p.progress)} onChange={(e) => { const updated = { ...sr.report, projects: sr.report.projects.map((pp, ppi) => ppi === pi ? { ...pp, progress: Number(e.target.value) } : pp) }; setSavedReports(prev => prev.map(r => r.id === sr.id ? { ...r, report: updated } : r)); }} placeholder="%" />
                          </div>
                          <DTextarea value={p.formatted_report} onChange={(e) => { const updated = { ...sr.report, projects: sr.report.projects.map((pp, ppi) => ppi === pi ? { ...pp, formatted_report: e.target.value } : pp) }; setSavedReports(prev => prev.map(r => r.id === sr.id ? { ...r, report: updated } : r)); }} rows={2} />
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-semibold text-[#334155] shrink-0">{p.name}</span>
                          <p className="text-sm text-[#475569] leading-relaxed line-clamp-2">{p.formatted_report}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <div className="flex justify-end mt-2">
                      <button onClick={() => { const sr2 = savedReports.find(r => r.id === sr.id); if (sr2) updateSavedReport(sr.id, sr2.report); }}
                        className="flex items-center text-xs font-semibold px-4 py-2 rounded-lg" style={{ backgroundColor: '#0EA5E9', color: '#FFFFFF' }}>
                        <Save className="w-3.5 h-3.5 mr-1.5" />保存
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ═══════════════════ Render ═══════════════════ */
  return (
    <div className="min-h-screen font-[Inter,system-ui,sans-serif] text-[#1E293B] leading-[1.6]" style={{ backgroundColor: '#FFFDF7' }}>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8">

        {/* Header */}
        <header className="text-center space-y-6">
          <div>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ backgroundColor: '#F0F9FF', color: '#0EA5E9' }}>
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">AI Work Log Assistant</h1>
            <p className="text-[#64748B] mt-2 text-sm">日々の作業記録と、プロフェッショナルな報告書の自動生成</p>
          </div>

          {/* Main Tabs */}
          <div className="flex justify-center">
            <div className="p-1 rounded-lg inline-flex border flex-wrap gap-0.5" style={{ backgroundColor: '#FFFFFF', borderColor: '#E0F2FE' }}>
              {([
                { key: 'daily' as const, label: '日報', icon: <PenLine className="w-4 h-4 mr-1.5" /> },
                { key: 'weekly' as const, label: '週報', icon: <Calendar className="w-4 h-4 mr-1.5" /> },
                { key: 'monthly' as const, label: '月報', icon: <CalendarDays className="w-4 h-4 mr-1.5" /> },
                { key: 'dashboard' as const, label: 'レポート確認', icon: <LayoutDashboard className="w-4 h-4 mr-1.5" /> },
              ]).map(t => (
                <button key={t.key} onClick={() => { setMainTab(t.key); setGeneratedReports([]); }}
                  className="flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                  style={{ backgroundColor: mainTab === t.key ? '#0EA5E9' : 'transparent', color: mainTab === t.key ? '#FFFFFF' : '#64748B' }}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* ━━━ 日報 ━━━ */}
          {mainTab === 'daily' && (
            <motion.div key="daily" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}
              className="space-y-6 max-w-3xl mx-auto">
              {renderClientTabForm(daily,
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-[#334155]">
                    <CalendarDays className="w-4 h-4 mr-2 text-[#64748B]" />対象日
                  </label>
                  <DInput type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} />
                </div>,
                '全顧客分の日報を一括生成', <Sparkles className="w-4 h-4 mr-2" />,
                () => handleGenerate(daily.tabs), daily.isValid)}
              <AnimatePresence>
                {generatedReports.length > 0 && !isGenerating && <div className="space-y-6">{generatedReports.map((r, i) => renderReportResult(r, i, () => { saveReport('daily', dailyDate, r); alert('記録しました'); }))}</div>}
              </AnimatePresence>
              {renderSavedList('daily')}
            </motion.div>
          )}

          {/* ━━━ 週報 ━━━ */}
          {mainTab === 'weekly' && (
            <motion.div key="weekly" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}
              className="space-y-6 max-w-3xl mx-auto">
              {renderClientTabForm(weekly,
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-[#334155]">
                    <Calendar className="w-4 h-4 mr-2 text-[#64748B]" />対象週（開始日）
                  </label>
                  <DInput type="date" value={weeklyStart} onChange={(e) => setWeeklyStart(e.target.value)} />
                </div>,
                '全顧客分の週報を一括生成', <Sparkles className="w-4 h-4 mr-2" />,
                () => handleGenerate(weekly.tabs), weekly.isValid)}
              <AnimatePresence>
                {generatedReports.length > 0 && !isGenerating && <div className="space-y-6">{generatedReports.map((r, i) => renderReportResult(r, i, () => { saveReport('weekly', weeklyStart, r); alert('記録しました'); }))}</div>}
              </AnimatePresence>
              {renderSavedList('weekly')}
            </motion.div>
          )}

          {/* ━━━ 月報 ━━━ */}
          {mainTab === 'monthly' && (
            <motion.div key="monthly" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}
              className="space-y-6 max-w-3xl mx-auto">
              {renderClientTabForm(monthly,
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-[#334155]">
                    <CalendarDays className="w-4 h-4 mr-2 text-[#64748B]" />対象月
                  </label>
                  <DInput type="month" value={monthlyMonth} onChange={(e) => setMonthlyMonth(e.target.value)} />
                </div>,
                '全顧客分の月報を一括生成', <FileText className="w-4 h-4 mr-2" />,
                () => handleGenerate(monthly.tabs), monthly.isValid)}
              <AnimatePresence>
                {generatedReports.length > 0 && !isGenerating && <div className="space-y-6">{generatedReports.map((r, i) => renderReportResult(r, i, () => { saveReport('monthly', monthlyMonth, r); alert('記録しました'); }))}</div>}
              </AnimatePresence>
              {renderSavedList('monthly')}
            </motion.div>
          )}

          {/* ━━━ レポート確認 ━━━ */}
          {mainTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}
              className="space-y-6">

              {/* 集計ボタン */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { period: 'week' as const, label: '今週のレポートを生成', Icon: Calendar },
                  { period: 'month' as const, label: '今月のレポートを生成', Icon: CalendarRange },
                ]).map(({ period, label, Icon }) => (
                  <button key={period} onClick={() => handleGenerateAggregate(period)} disabled={isGeneratingAggregate}
                    className="flex items-center justify-center py-4 px-6 rounded-xl border font-semibold text-sm transition-all"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E0F2FE', color: '#334155', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F9FF'; e.currentTarget.style.borderColor = '#0EA5E9'; e.currentTarget.style.color = '#0EA5E9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E0F2FE'; e.currentTarget.style.color = '#334155'; }}>
                    {isGeneratingAggregate ? <Loader2 className="w-5 h-5 mr-2 animate-spin" style={{ color: '#0EA5E9' }} /> : <Icon className="w-5 h-5 mr-2" style={{ color: '#64748B' }} />}
                    {label}
                  </button>
                ))}
              </div>

              {/* 集計結果 */}
              <AnimatePresence>
                {aggregatedReport && !isGeneratingAggregate && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, y: -16 }}
                    className="space-y-6">
                    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <div className="px-6 py-4 flex items-center border-b" style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}>
                        <CheckCircle2 className="w-5 h-5 mr-2" style={{ color: '#0C4A6E' }} />
                        <span className="font-semibold text-sm" style={{ color: '#0C4A6E' }}>集計レポートが生成されました</span>
                      </div>
                      <div className="p-6 flex items-center gap-6 flex-wrap">
                        <div>
                          <span className="text-xs text-[#64748B]">総作業時間</span>
                          <div className="text-2xl font-semibold" style={{ color: '#0EA5E9' }}>{aggregatedReport.total_duration_hours} h</div>
                        </div>
                        <div className="h-8 w-px" style={{ backgroundColor: '#E0F2FE' }} />
                        <div>
                          <span className="text-xs text-[#64748B]">顧客数</span>
                          <div className="text-2xl font-semibold text-[#0F172A]">{aggregatedReport.client_summaries.length} 社</div>
                        </div>
                      </div>
                    </div>
                    {aggregatedReport.client_summaries.map((s, idx) => {
                      const dispName = displayClient(s.client_name);
                      const isEmailOpen = sendingEmailFor === `agg_${s.client_name}`;
                      const handleClientPdf = () => {
                        const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
                        const actList = s.activities.map(a => `<li style="margin-bottom:4px;">${a}</li>`).join('');
                        const linkList = (s.links || []).length > 0 ? `<div style="margin-top:12px;font-size:12px;color:#64748B;"><strong>参考リンク:</strong><br/>${(s.links || []).map(l => `<a href="${l}" style="color:#0EA5E9;">${l}</a>`).join('<br/>')}</div>` : '';
                        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>集計報告書 - ${dispName}</title>
                        <style>@page{size:A4;margin:20mm;}body{font-family:"Hiragino Kaku Gothic ProN","Meiryo",sans-serif;color:#1E293B;line-height:1.6;margin:0;padding:0;}
                        .header{text-align:center;border-bottom:3px solid #0EA5E9;padding-bottom:16px;margin-bottom:24px;}.header h1{font-size:20px;color:#0F172A;margin:0 0 4px;}
                        .meta{display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px;color:#64748B;}
                        .summary{margin:20px 0;padding:14px;background:#F0F9FF;border-radius:8px;border:1px solid #E0F2FE;}
                        .summary span{font-size:12px;color:#64748B;}.summary strong{font-size:22px;color:#0EA5E9;}
                        ul{padding-left:20px;}</style></head><body>
                        <div class="header"><h1>集計報告書</h1></div>
                        <div class="meta"><div><strong>宛先:</strong> ${dispName}</div><div><strong>報告日:</strong> ${today}</div></div>
                        <div class="summary"><span>作業時間合計</span><br/><strong>${s.duration_hours} h</strong></div>
                        <h3 style="font-size:14px;margin-top:24px;">主な作業内容</h3><ul>${actList}</ul>
                        <h3 style="font-size:14px;margin-top:20px;">総括</h3><p style="font-size:13px;">${s.summary}</p>
                        ${linkList}</body></html>`;
                        const w = window.open('', '_blank');
                        if (!w) { alert('ポップアップを許可してください。'); return; }
                        w.document.write(html); w.document.close(); w.onload = () => w.print();
                      };
                      const handleClientEmail = () => {
                        const email = emailInputs[s.client_name] || '';
                        if (!email.trim()) { alert('メールアドレスを入力してください。'); return; }
                        saveEmailForClient(s.client_name, email);
                        const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
                        const subject = `集計報告書 - ${dispName} (${today})`;
                        const body = [`${dispName}`, ``, `いつもお世話になっております。`, `下記の通り、集計報告をいたします。`, ``,
                          `━━━━━━━━━━━━━━━━━━━━`, `報告日: ${today}`, `作業時間合計: ${s.duration_hours} h`, `━━━━━━━━━━━━━━━━━━━━`, ``,
                          `【主な作業内容】`, ...s.activities.map(a => `・${a}`), ``, `【総括】`, s.summary, ``,
                          ...((s.links || []).length > 0 ? [`【参考リンク】`, ...(s.links || []).map(l => `・${l}`), ``] : []),
                          `よろしくお願いいたします。`].join('\n');
                        window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                        setSendingEmailFor(null);
                      };
                      return (
                        <div key={idx} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                          <div className="px-6 py-4 flex items-center justify-between border-b flex-wrap gap-2" style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-[#0F172A]">{dispName}</span>
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: '#E0F2FE', color: '#0EA5E9' }}>
                                <Clock className="w-3 h-3 inline mr-1" />{s.duration_hours} h
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setSendingEmailFor(isEmailOpen ? null : `agg_${s.client_name}`)}
                                className="flex items-center text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                                style={{ backgroundColor: isEmailOpen ? '#0284C7' : '#FFFFFF', color: isEmailOpen ? '#FFFFFF' : '#0EA5E9', border: '1px solid #0EA5E9' }}>
                                <Mail className="w-3.5 h-3.5 mr-1" />メール
                              </button>
                              <button onClick={handleClientPdf}
                                className="flex items-center text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                                style={{ backgroundColor: '#0EA5E9', color: '#FFFFFF' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0284C7'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0EA5E9'}>
                                <FileText className="w-3.5 h-3.5 mr-1" />PDF
                              </button>
                            </div>
                          </div>
                          <AnimatePresence>
                            {isEmailOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="px-6 py-4 border-b flex items-center gap-3 flex-wrap" style={{ backgroundColor: '#FFFDF7', borderColor: '#E0F2FE' }}>
                                  <Mail className="w-4 h-4 shrink-0" style={{ color: '#64748B' }} />
                                  <div className="flex-1 min-w-[200px]">
                                    <DInput type="email" value={emailInputs[s.client_name] || ''} onChange={(e) => setEmailInputs(prev => ({ ...prev, [s.client_name]: e.target.value }))} placeholder="example@company.co.jp" />
                                  </div>
                                  {emailHistory[s.client_name] && (
                                    <button onClick={() => setEmailInputs(prev => ({ ...prev, [s.client_name]: emailHistory[s.client_name] }))} className="text-xs shrink-0" style={{ color: '#0EA5E9' }}>前回: {emailHistory[s.client_name]}</button>
                                  )}
                                  <button onClick={handleClientEmail} className="flex items-center text-xs font-semibold px-4 py-2.5 rounded-lg shrink-0" style={{ backgroundColor: '#0EA5E9', color: '#FFFFFF' }}>
                                    <Send className="w-3.5 h-3.5 mr-1.5" />送信
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="p-6 space-y-4">
                            <div><span className="text-xs text-[#64748B]">主な作業:</span>
                              <ul className="list-disc list-inside text-sm text-[#475569] mt-1 space-y-0.5">{s.activities.map((a, i) => <li key={i}>{a}</li>)}</ul>
                            </div>
                            <div><span className="text-xs text-[#64748B]">総括:</span>
                              <p className="text-sm text-[#475569] mt-1 leading-relaxed">{s.summary}</p>
                            </div>
                            {(s.links || []).length > 0 && (
                              <div className="flex items-start gap-2 pt-1">
                                <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#64748B' }} />
                                <div className="space-y-0.5">
                                  {(s.links || []).map((link, li) => (
                                    <a key={li} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs truncate" style={{ color: '#0EA5E9' }}>{link}</a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ━━━ 記録済みログ（日報/週報/月報サブタブ） ━━━ */}
              {(() => {
                const logTypes = [
                  { key: 'daily' as const, label: '日報', icon: <PenLine className="w-3.5 h-3.5 mr-1" /> },
                  { key: 'weekly' as const, label: '週報', icon: <Calendar className="w-3.5 h-3.5 mr-1" /> },
                  { key: 'monthly' as const, label: '月報', icon: <CalendarDays className="w-3.5 h-3.5 mr-1" /> },
                ];
                const [dashLogTab, setDashLogTab] = [dashboardLogTab, setDashboardLogTab];
                const filtered = savedReports.filter(r => r.type === dashLogTab);

                return (
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    {/* サブタブ */}
                    <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3" style={{ borderColor: '#F0F9FF', backgroundColor: '#F8FDFF' }}>
                      <h2 className="text-sm font-semibold text-[#0F172A] flex items-center">
                        <History className="w-4 h-4 mr-2" style={{ color: '#0EA5E9' }} />記録済みログ
                      </h2>
                      <div className="flex items-center gap-1 p-0.5 rounded-lg border" style={{ borderColor: '#E0F2FE' }}>
                        {logTypes.map(t => (
                          <button key={t.key} onClick={() => setDashLogTab(t.key)}
                            className="flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                            style={{ backgroundColor: dashLogTab === t.key ? '#0EA5E9' : 'transparent', color: dashLogTab === t.key ? '#FFFFFF' : '#64748B' }}>
                            {t.icon}{t.label}
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
                              style={{ backgroundColor: dashLogTab === t.key ? 'rgba(255,255,255,0.25)' : '#F0F9FF', color: dashLogTab === t.key ? '#FFFFFF' : '#94A3B8' }}>
                              {savedReports.filter(r => r.type === t.key).length}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {filtered.length === 0 ? (
                      <div className="p-8 text-center text-sm text-[#94A3B8]">
                        {dashLogTab === 'daily' ? '日報' : dashLogTab === 'weekly' ? '週報' : '月報'}の記録はまだありません。
                      </div>
                    ) : (
                      <div>
                        {filtered.map((sr, idx) => {
                          const dispName = displayClient(sr.report.client);
                          const isEditing = editingReportId === sr.id;
                          const isExpanded = expandedReportId === sr.id;
                          const srEmailOpen = sendingEmailFor === `saved_${sr.id}`;

                          return (
                            <div key={sr.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F0F9FF' : 'none' }}>
                              <div className="p-5">
                                {/* Header row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2 flex-wrap cursor-pointer" onClick={() => setExpandedReportId(isExpanded ? null : sr.id)}>
                                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold" style={{ backgroundColor: '#F0F9FF', color: '#64748B' }}>{sr.date}</span>
                                    <span className="font-semibold text-sm text-[#0F172A]">{dispName}</span>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: '#F0F9FF', color: '#0EA5E9' }}>
                                      {sr.report.total_hours}h / {sr.report.projects.length}件
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button onClick={() => setSendingEmailFor(srEmailOpen ? null : `saved_${sr.id}`)}
                                      className="flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-md transition-all"
                                      style={{ backgroundColor: srEmailOpen ? '#0284C7' : '#FFFFFF', color: srEmailOpen ? '#FFFFFF' : '#0EA5E9', border: '1px solid #0EA5E9' }}>
                                      <Mail className="w-3 h-3 mr-1" />メール
                                    </button>
                                    <button onClick={() => handleDownloadPdf(sr.report)}
                                      className="flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-md"
                                      style={{ backgroundColor: '#0EA5E9', color: '#FFFFFF' }}>
                                      <FileText className="w-3 h-3 mr-1" />PDF
                                    </button>
                                    <button onClick={() => setEditingReportId(isEditing ? null : sr.id)} className="p-1.5 rounded-md" style={{ color: '#64748B' }} title="編集">
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => deleteReport(sr.id)} className="p-1.5 rounded-md hover:text-red-500" style={{ color: '#94A3B8' }} title="削除">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Email panel */}
                                <AnimatePresence>
                                  {srEmailOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                      <div className="mt-3 p-3 rounded-lg border flex items-center gap-3 flex-wrap" style={{ borderColor: '#E0F2FE', backgroundColor: '#FFFDF7' }}>
                                        <div className="flex-1 min-w-[180px]">
                                          <DInput type="email" value={emailInputs[sr.report.client] || ''} onChange={(e) => setEmailInputs(prev => ({ ...prev, [sr.report.client]: e.target.value }))} placeholder="example@company.co.jp" />
                                        </div>
                                        {emailHistory[sr.report.client] && (
                                          <button onClick={() => setEmailInputs(prev => ({ ...prev, [sr.report.client]: emailHistory[sr.report.client] }))} className="text-xs shrink-0" style={{ color: '#0EA5E9' }}>前回のアドレス</button>
                                        )}
                                        <button onClick={() => handleSendEmail(sr.report)} className="flex items-center text-xs font-semibold px-3 py-2 rounded-lg shrink-0" style={{ backgroundColor: '#0EA5E9', color: '#FFFFFF' }}>
                                          <Send className="w-3 h-3 mr-1" />送信
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Expanded details */}
                                <AnimatePresence>
                                  {(isExpanded || isEditing) && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                      <div className="mt-3 space-y-3">
                                        {sr.report.projects.map((p, pi) => (
                                          <div key={pi}>
                                            {isEditing ? (
                                              <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: '#E0F2FE' }}>
                                                <div className="grid grid-cols-[1fr_80px_80px] gap-2">
                                                  <DInput value={p.name} onChange={(e) => { const updated = { ...sr.report, projects: sr.report.projects.map((pp, ppi) => ppi === pi ? { ...pp, name: e.target.value } : pp) }; setSavedReports(prev => prev.map(r => r.id === sr.id ? { ...r, report: updated } : r)); }} placeholder="プロジェクト名" />
                                                  <DInput type="number" value={String(p.hours)} onChange={(e) => { const hrs = Number(e.target.value); const updated = { ...sr.report, projects: sr.report.projects.map((pp, ppi) => ppi === pi ? { ...pp, hours: hrs } : pp), total_hours: sr.report.projects.reduce((s, pp, ppi) => s + (ppi === pi ? hrs : pp.hours), 0) }; setSavedReports(prev => prev.map(r => r.id === sr.id ? { ...r, report: updated } : r)); }} placeholder="h" />
                                                  <DInput type="number" value={String(p.progress)} onChange={(e) => { const updated = { ...sr.report, projects: sr.report.projects.map((pp, ppi) => ppi === pi ? { ...pp, progress: Number(e.target.value) } : pp) }; setSavedReports(prev => prev.map(r => r.id === sr.id ? { ...r, report: updated } : r)); }} placeholder="%" />
                                                </div>
                                                <DTextarea value={p.formatted_report} onChange={(e) => { const updated = { ...sr.report, projects: sr.report.projects.map((pp, ppi) => ppi === pi ? { ...pp, formatted_report: e.target.value } : pp) }; setSavedReports(prev => prev.map(r => r.id === sr.id ? { ...r, report: updated } : r)); }} rows={2} />
                                              </div>
                                            ) : (
                                              <div className="rounded-lg border p-4 space-y-2" style={{ borderColor: '#E0F2FE' }}>
                                                <div className="flex items-center justify-between">
                                                  <span className="font-semibold text-sm text-[#0F172A]">{p.name}</span>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: '#F0F9FF', color: '#0EA5E9' }}>{p.hours}h</span>
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: '#F0F9FF', color: p.progress >= 100 ? '#16A34A' : '#0EA5E9' }}>{p.progress}%</span>
                                                  </div>
                                                </div>
                                                <div className="h-1.5 rounded-full" style={{ backgroundColor: '#E0F2FE' }}>
                                                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(p.progress, 100)}%`, backgroundColor: p.progress >= 100 ? '#16A34A' : '#0EA5E9' }} />
                                                </div>
                                                <p className="text-sm text-[#475569] leading-relaxed">{p.formatted_report}</p>
                                                {p.links.length > 0 && (
                                                  <div className="flex items-start gap-2 pt-1">
                                                    <Link2 className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#64748B' }} />
                                                    <div className="space-y-0.5">
                                                      {p.links.map((link, li) => (
                                                        <a key={li} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs truncate" style={{ color: '#0EA5E9' }}>{link}</a>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                        {isEditing && (
                                          <div className="flex justify-end">
                                            <button onClick={() => { const sr2 = savedReports.find(r => r.id === sr.id); if (sr2) updateSavedReport(sr.id, sr2.report); }}
                                              className="flex items-center text-xs font-semibold px-4 py-2 rounded-lg" style={{ backgroundColor: '#0EA5E9', color: '#FFFFFF' }}>
                                              <Save className="w-3.5 h-3.5 mr-1.5" />保存
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
