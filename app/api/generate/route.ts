import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ━━━ 顧客別集計（フロントエンドでマージ済み → AIは総括のみ） ━━━
    if (body.type === 'aggregate_client') {
      const { clientName, duration_hours, reports } = body;

      const prompt = `
あなたは業務コンサルタントです。
以下は「${clientName}」に対する作業報告の一覧です（合計${duration_hours}時間）。

${reports.map((r: string, i: number) => `[${i + 1}] ${r}`).join('\n')}

上記をもとに、以下のJSON形式で集計してください。
JSONのみを出力し、マークダウンや他のテキストは一切含めないでください。

{
  "activities": ["主な作業内容1", "主な作業内容2", "主な作業内容3"],
  "summary": "この顧客に対する作業全体の総括（2〜3文でプロフェッショナルに）"
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ activities: reports.slice(0, 5), summary: `${clientName}に対して合計${duration_hours}時間の作業を実施しました。` });
      }
      const jsonStr = jsonMatch[1] ?? jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    }

    // ━━━ 旧式一括集計（後方互換） ━━━
    if (body.type === 'aggregate') {
      const { period, logs } = body;
      const periodLabel = period === 'week' ? '今週' : '今月';

      const prompt = `
あなたは業務コンサルタントです。以下は${periodLabel}の作業ログ一覧です。

${logs.map((log: any, i: number) => `[${i + 1}] 日付: ${log.date} / 顧客: ${log.client} / ${log.duration_hours}時間
内容: ${log.formatted_report}`).join('\n\n')}

重要: 同じ顧客名のログは必ず1つにまとめてください。時間は合算してください。
上記をもとに、以下のJSON形式で集計レポートを生成してください。
JSONのみを出力し、他のテキストやマークダウンは一切含めないでください。

{
  "total_duration_hours": 全顧客の合計作業時間（数値）,
  "client_summaries": [
    {
      "client_name": "顧客名",
      "duration_hours": その顧客の合計時間（数値）,
      "activities": ["主な作業内容1", "主な作業内容2"],
      "summary": "この顧客に対する作業の総括（2〜3文）"
    }
  ]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AIの応答からJSONを抽出できませんでした');
      }
      const jsonStr = jsonMatch[1] ?? jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    }

    // ━━━ 日報（プロジェクト単位） ━━━
    const { rawInput, duration, projectName, progress } = body;

    const prompt = `
あなたはプロフェッショナルな業務報告書を作成するアシスタントです。

以下の情報をもとに、簡潔で読みやすい業務報告文を生成してください。
箇条書きではなく、自然な文章で2〜3文程度にまとめてください。
マークダウン記法は使わず、プレーンテキストで出力してください。

プロジェクト名: ${projectName || '未指定'}
作業時間: ${duration}時間
進捗達成率: ${progress ? `${progress}%` : '未入力'}
作業メモ: ${rawInput}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ report: text });

  } catch (error: any) {
    console.error('AIエラー詳細:', error);
    return NextResponse.json({
      error: 'AI生成エラー',
      detail: error.message
    }, { status: 500 });
  }
}
