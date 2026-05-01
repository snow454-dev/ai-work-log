import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. daily_logs の全カラム確認（最初の3件）
  const { data: raw, error: rawErr } = await supabase
    .from('daily_logs')
    .select('*')
    .limit(3);
  results.raw_sample = raw;
  results.raw_error = rawErr;

  // 2. clients join あり
  const { data: withClient, error: clientErr } = await supabase
    .from('daily_logs')
    .select('id, date, client_id, duration_hours, created_at, clients(name)')
    .limit(3);
  results.with_client = withClient;
  results.client_error = clientErr;

  // 3. 2026-04 のデータのみ
  const { data: aprilData, error: aprilErr } = await supabase
    .from('daily_logs')
    .select('id, date, client_id, duration_hours, created_at, clients(name)')
    .gte('date', '2026-04-01')
    .lte('date', '2026-04-30');
  results.april_data = aprilData;
  results.april_error = aprilErr;

  // 4. clients テーブル確認
  const { data: clients, error: clientsErr } = await supabase
    .from('clients')
    .select('*')
    .limit(5);
  results.clients = clients;
  results.clients_error = clientsErr;

  // 5. saved_reports の monthly 確認
  const { data: monthly, error: monthlyErr } = await supabase
    .from('saved_reports')
    .select('id, type, date, created_at')
    .eq('type', 'monthly');
  results.saved_monthly = monthly;
  results.saved_monthly_error = monthlyErr;

  return NextResponse.json(results, { status: 200 });
}
