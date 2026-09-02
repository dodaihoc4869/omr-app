// Gọi Apps Script Web App (doGet/doPost trong docs/apps-script-kiem-tra.gs).
// Dùng Content-Type: text/plain cho POST để tránh trình duyệt gửi preflight
// OPTIONS — Apps Script Web App không xử lý OPTIONS, preflight sẽ lỗi CORS
// nếu dùng application/json.
import type { PublicExamBank } from '../data/examContent'
import type { AnswerRecord, IntegrityLog } from './exam-db'

export interface SessionConfig {
  found: boolean
  maCa?: string
  lop?: string
  thoiGianPhut?: number
  bank?: PublicExamBank
}

async function postJson(scriptUrl: string, body: unknown): Promise<any> {
  const res = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  return res.json()
}

export async function publishSession(
  scriptUrl: string,
  maCa: string,
  lop: string,
  thoiGianPhut: number,
  bank: PublicExamBank,
): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'publish', maCa, lop, thoiGianPhut, bank })
  if (!result.ok) throw new Error(result.error || 'Mở ca kiểm tra thất bại')
}

export async function fetchSession(scriptUrl: string, maCa: string): Promise<SessionConfig> {
  const url = `${scriptUrl}?action=session&maCa=${encodeURIComponent(maCa)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  return res.json()
}

export async function submitAnswers(
  scriptUrl: string,
  maCa: string,
  sbd: string,
  maDe: string,
  dapAn: AnswerRecord,
  integrity: IntegrityLog,
): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'submit', maCa, sbd, maDe, dapAn, integrity })
  if (!result.ok) throw new Error(result.error || 'Nộp bài thất bại')
}

export interface SubmissionRow {
  sbd: string
  maDe: string
  thoiGianNop: string
  dapAn: AnswerRecord
  integrity?: IntegrityLog
}

export async function listSubmissions(scriptUrl: string, maCa: string): Promise<SubmissionRow[]> {
  const url = `${scriptUrl}?action=listSubmissions&maCa=${encodeURIComponent(maCa)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return data.rows || []
}
