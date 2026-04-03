"use client";
import { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Sparkles, FileJson, Clock, Building2, 
  Loader2, AlignLeft, CheckCircle2, LayoutDashboard, 
  PenLine, Calendar, CalendarRange, BarChart3 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportResult {
  client: string;
  duration_hours: number;
  formatted_report: string;
}

interface LogEntry {
  id: number;
  date: string;
  client: string;
  duration_hours: number;
  formatted_report: string;
}

interface AggregatedReport {
  total_duration_hours: number;
  client_summaries: {
    client_name: string;
    duration_hours: number;
    activities: string[];
    summary: string;
  }[];
}

const MOCK_LOGS: LogEntry[] = [
  { id: 1, date: '2026-04-01', client: '株式会社A', duration_hours: 2.0, formatted_report: 'ログイン機能の不具合修正を実施。API仕様変更に伴う連携部分の改修を行いました。' },
  { id: 2, date: '2026-04-02', client: '株式会社B', duration_hours: 1.5, formatted_report: 'トップページのスライダー画像において、スマートフォン閲覧時の表示崩れを修正いたしました。' },
  { id: 3, date: '2026-04-03', client: '株式会社A', duration_hours: 1.0, formatted_report: 'パスワードリセット機能の単体テストを実施し、正常動作を確認しました。' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'input' | 'dashboard'>('input');

  // Input Tab State
  const [client, setClient] = useState('');
  const [duration, setDuration] = useState('');
  const [memo, setMemo] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<ReportResult | null>(null);
  
  // Dashboard Tab State
  const [isGeneratingAggregate, setIsGeneratingAggregate] = useState(false);
  const [aggregatedReport, setAggregatedReport] = useState<AggregatedReport | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'ja-JP';

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setMemo((prev) => prev + (prev ? '\n' : '') + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === 'no-speech') {
            console.warn('音声が検出されませんでした。');
          } else {
            console.error('Speech recognition error', event.error);
          }
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('お使いのブラウザは音声入力に対応していません。');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleGenerate = async () => {
    if (!client || !duration || !memo) return;

    setIsGenerating(true);
    
    // AI処理をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1800));

    const formattedClient = client.includes('社') || client.includes('株式会社') 
      ? client 
      : `株式会社${client}`;
      
    let formattedMemo = memo
      .replace(/言われて直した/g, 'ご指摘を受け、修正対応を実施いたしました。')
      .replace(/直ってる/g, '現在は正常に動作しております。')
      .replace(/だった/g, 'でございました。')
      .replace(/ミス/g, '不備');
      
    if (!formattedMemo.endsWith('。')) {
      formattedMemo += '。対応完了しております。';
    }

    const result: ReportResult = {
      client: formattedClient,
      duration_hours: Number(duration),
      formatted_report: formattedMemo
    };

    setGeneratedReport(result);
    setIsGenerating(false);
  };

  const handleGenerateAggregate = async (type: 'week' | 'month') => {
    setIsGeneratingAggregate(true);
    
    // AI処理をシミュレート
    await new Promise(resolve => setTimeout(resolve, 2500));

    // モックデータに基づいた集計レポートの生成シミュレーション
    setAggregatedReport({
      total_duration_hours: 4.5,
      client_summaries: [
        {
          client_name: "株式会社A",
          duration_hours: 3.0,
          activities: [
            "ログイン機能の不具合修正およびAPI連携部分の改修",
            "パスワードリセット機能の単体テスト実施"
          ],
          summary: "ログイン機能の不具合修正およびAPI連携の改修、ならびにパスワードリセット機能の単体テストを実施いたしました。すべての作業において正常な動作を確認しており、システムの安定稼働に貢献しております。"
        },
        {
          client_name: "株式会社B",
          duration_hours: 1.5,
          activities: [
            "トップページスライダー画像のスマートフォン表示崩れ修正"
          ],
          summary: "トップページのスライダー画像における、スマートフォン閲覧時の表示崩れを修正いたしました。モバイル端末での視認性を改善し、ユーザー体験の向上に努めております。"
        }
      ]
    });
    
    setIsGeneratingAggregate(false);
  };

  const isFormValid = client.trim() !== '' && duration.trim() !== '' && memo.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header & Tabs */}
        <header className="text-center space-y-6">
          <div>
            <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Work Log Assistant</h1>
            <p className="text-slate-500 mt-2">日々の作業記録と、プロフェッショナルな報告書の自動生成</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center">
            <div className="bg-white p-1.5 rounded-full shadow-sm border border-slate-200 inline-flex relative">
              <button
                onClick={() => setActiveTab('input')}
                className={`relative flex items-center px-6 py-2.5 rounded-full text-sm font-medium transition-colors z-10 ${
                  activeTab === 'input' ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <PenLine className="w-4 h-4 mr-2" />
                日報入力
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`relative flex items-center px-6 py-2.5 rounded-full text-sm font-medium transition-colors z-10 ${
                  activeTab === 'dashboard' ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                レポート確認
              </button>
              
              {/* Active Tab Background Pill */}
              <div 
                className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-indigo-50 rounded-full transition-transform duration-300 ease-out"
                style={{ 
                  transform: activeTab === 'input' ? 'translateX(0)' : 'translateX(100%)',
                  left: '6px'
                }}
              />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 max-w-3xl mx-auto"
            >
              {/* Main Form Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Input */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-slate-700">
                        <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                        顧客名
                      </label>
                      <input
                        type="text"
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        placeholder="例: A社"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors outline-none"
                      />
                    </div>

                    {/* Duration Input */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-slate-700">
                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                        作業時間（h）
                      </label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="例: 1.5"
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors outline-none"
                      />
                    </div>
                  </div>

                  {/* Memo Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center text-sm font-medium text-slate-700">
                        <AlignLeft className="w-4 h-4 mr-2 text-slate-400" />
                        ラフな作業メモ
                      </label>
                      
                      {/* Voice Input Button */}
                      <button
                        onClick={toggleRecording}
                        className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          isRecording 
                            ? 'bg-rose-100 text-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.3)] animate-pulse' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-4 h-4 mr-2" />
                            録音停止
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-2" />
                            音声で入力
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="例: トップページのスライダー画像がスマホで崩れるって言われて直した。CSSのメディアクエリの記述ミスだった。今は直ってる。"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors outline-none min-h-[160px] resize-y"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!isFormValid || isGenerating}
                    className={`w-full flex items-center justify-center py-4 rounded-xl text-white font-medium text-lg transition-all duration-200 ${
                      !isFormValid 
                        ? 'bg-slate-300 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        AIがレポートを生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        AIでレポートを生成
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview Area */}
              <AnimatePresence>
                {generatedReport && !isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden"
                  >
                    <div className="bg-emerald-50/50 border-b border-emerald-100 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center text-emerald-700 font-medium">
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        レポートが生成されました
                      </div>
                      <div className="flex items-center text-sm text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                        <FileJson className="w-4 h-4 mr-1.5" />
                        JSON Ready
                      </div>
                    </div>
                    
                    <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Human Readable Preview */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Preview</h3>
                        <div className="space-y-4">
                          <div>
                            <span className="text-xs text-slate-500 block mb-1">顧客名</span>
                            <div className="font-medium text-slate-900">{generatedReport.client}</div>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 block mb-1">作業時間</span>
                            <div className="font-medium text-slate-900">{generatedReport.duration_hours} h</div>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 block mb-1">報告テキスト</span>
                            <div className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                              {generatedReport.formatted_report}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* JSON Output */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">JSON Output</h3>
                        <div className="relative group h-full">
                          <pre className="bg-slate-900 text-emerald-400 p-6 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed shadow-inner h-full">
                            <code>{JSON.stringify(generatedReport, null, 2)}</code>
                          </pre>
                          <button 
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(generatedReport, null, 2))}
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Copy JSON
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Dashboard Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleGenerateAggregate('week')}
                  disabled={isGeneratingAggregate}
                  className="flex items-center justify-center py-5 px-6 rounded-3xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all shadow-sm group"
                >
                  {isGeneratingAggregate ? (
                    <Loader2 className="w-6 h-6 mr-3 animate-spin text-indigo-500" />
                  ) : (
                    <Calendar className="w-6 h-6 mr-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  )}
                  今週のレポートを生成
                </button>
                <button
                  onClick={() => handleGenerateAggregate('month')}
                  disabled={isGeneratingAggregate}
                  className="flex items-center justify-center py-5 px-6 rounded-3xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all shadow-sm group"
                >
                  {isGeneratingAggregate ? (
                    <Loader2 className="w-6 h-6 mr-3 animate-spin text-indigo-500" />
                  ) : (
                    <CalendarRange className="w-6 h-6 mr-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  )}
                  今月のレポートを生成
                </button>
              </div>

              {/* Aggregated Report Preview */}
              <AnimatePresence>
                {aggregatedReport && !isGeneratingAggregate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden"
                  >
                    <div className="bg-emerald-50/50 border-b border-emerald-100 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center text-emerald-700 font-medium">
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        集計レポートが生成されました
                      </div>
                      <div className="flex items-center text-sm text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                        <FileJson className="w-4 h-4 mr-1.5" />
                        JSON Ready
                      </div>
                    </div>
                    
                    <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Human Readable Preview */}
                      <div className="space-y-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Preview</h3>
                        
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <span className="text-xs text-slate-500 block mb-1">総作業時間</span>
                          <div className="text-2xl font-bold text-indigo-600">{aggregatedReport.total_duration_hours} h</div>
                        </div>

                        <div className="space-y-4">
                          <span className="text-xs text-slate-500 block mb-2">顧客別サマリー</span>
                          {aggregatedReport.client_summaries.map((summary, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="font-bold text-slate-800">{summary.client_name}</div>
                                <div className="text-sm font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                                  {summary.duration_hours} h
                                </div>
                              </div>
                              <div className="space-y-2">
                                <span className="text-xs text-slate-500">主な作業:</span>
                                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                  {summary.activities.map((act, i) => (
                                    <li key={i}>{act}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="pt-2">
                                <span className="text-xs text-slate-500 block mb-1">総括:</span>
                                <p className="text-sm text-slate-600 leading-relaxed">{summary.summary}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* JSON Output */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">JSON Output</h3>
                        <div className="relative group h-full">
                          <pre className="bg-slate-900 text-emerald-400 p-6 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed shadow-inner h-full">
                            <code>{JSON.stringify(aggregatedReport, null, 2)}</code>
                          </pre>
                          <button 
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(aggregatedReport, null, 2))}
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Copy JSON
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mock Logs List */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
                    蓄積されたログ (モックデータ)
                  </h2>
                  <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    {MOCK_LOGS.length} 件の記録
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {MOCK_LOGS.map(log => (
                    <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
                            {log.date}
                          </span>
                          <span className="font-bold text-slate-800">{log.client}</span>
                        </div>
                        <div className="flex items-center text-slate-600 text-sm font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg w-fit">
                          <Clock className="w-4 h-4 mr-1.5" />
                          {log.duration_hours} h
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{log.formatted_report}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
