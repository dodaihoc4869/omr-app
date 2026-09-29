// LỘ ĐÁP ÁN CA KIỂM TRA QUA `cauKhacPhuc` / `deTheoDangBai` — BẢN CHẠY TRÊN RUNTIME D1 THẬT (workerd, `npm run test:d1`), 29/09.
// Bản đầy đủ (12 ca, D1 giả node:sqlite): tests/lo-dap-an-kho-ca-mo-2909.test.ts. Ở đây khẳng định lại lõi trên đúng runtime D1:
// câu SQL của `protectedQuestions` (đếm lượt, lọc ca) + chỉ mục `cau_hoi JOIN de_kho` chạy thật, ca đang mở ⇒ gói trả về không còn câu
// của ca (theo qid và theo nhóm nội dung), không có ca ⇒ như cũ. Cấu hình workerd KHÔNG có binding R2 ⇒ `DE` là Map trong bộ nhớ.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { cauKhacPhucGoi, deTheoDangBai } from '../server/src/goi-cu'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import type { Env } from '../server/src/kieu'

const DB = (env as unknown as Env).DB
const kho = new Map<string, string>()
const ENV = {
  ...(env as unknown as Env),
  DB,
  DE: {
    async get(k: string) { const v = kho.get(k); return v === undefined ? null : { body: new Response(v).body!, httpEtag: 'x' } },
    async put(k: string, v: string) { kho.set(k, v); return {} },
    async delete(k: string) { kho.delete(k) },
  },
} as unknown as Env

/** Nạp lược đồ TỪNG câu; bỏ qua lỗi "đã có" — tệp runtime khác trong cùng worker có thể đã nạp trước (storage dùng chung). */
async function napLuocDo(): Promise<void> {
  for (const sql of (env as unknown as { LUOC_DO_SQL: string[] }).LUOC_DO_SQL) {
    const cau = sql.replace(/\/\*[\s\S]*?\*\//g, '\n').split('\n').filter((l) => !/^\s*--/.test(l)).map((l) => l.replace(/\s--.*$/, '')).join('\n')
      .split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter((s) => /[A-Za-z]/.test(s))
    for (const c of cau) {
      try { await DB.prepare(c).run() } catch (e) { if (!/duplicate column|already exists/i.test(String(e))) throw e }
    }
  }
  for (const c of ['pham_vi', 'danh_sach_chon_json', 'mat_khau', 'de_rieng', 'pham_vi_hoi_lai']) {
    try { await DB.prepare(`ALTER TABLE ca ADD COLUMN ${c} TEXT`).run() } catch { /* đã có */ }
  }
}

const PA = { A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D' }
const cauI = (so: number, de: string, dapAn: string, o: Record<string, unknown> = {}) => ({
  phan: 'I', so, de, pa: PA, dap_an: dapAn, dang: { ma: 'RT.X', ten: 'Dạng RT' }, chuyen_de: 'RT-CD', muc_do: 'biet',
  loi_giai: { noi_dung: `Lời giải RT câu ${so}.`, trang_thai: 'khop' }, ...o,
})
const DE_THI = 'Câu RT đang nằm trong ca kiểm tra mở.'
const MA = 'RT-DE'
const MA_DB = 'DB-RT-1'

beforeAll(napLuocDo)
beforeEach(async () => {
  kho.clear()
  await DB.batch([
    DB.prepare("DELETE FROM ca WHERE ma_ca LIKE 'RT-%'"),
    DB.prepare("DELETE FROM cau_hoi WHERE ma_de = 'RT-DE'"),
    DB.prepare("DELETE FROM de_kho WHERE ma_de IN ('RT-DE','DB-RT-1')"),
  ])
  const nay = new Date().toISOString()
  await DB.batch([
    DB.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('RT-DE','RT-DE','12',2,'kho/RT-DE.json',0,?)").bind(nay),
    DB.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DB-RT-1','Dạng bài · 12 · Bài 1. RT · Dạng RT','12',2,'kho/DB-RT-1.json',0,?)").bind(nay),
    DB.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES('RT-DE-I-1','RT-DE','RT-CD','biet','I','12',1,'x')"),
    DB.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES('RT-DE-I-2','RT-DE','RT-CD','biet','I','12',1,'x')"),
  ])
  kho.set(`kho/${MA}.json`, JSON.stringify({ ma_de: MA, cau: [cauI(1, DE_THI, 'B'), cauI(2, 'Câu RT tự do.', 'D')] }))
  // Tờ dạng bài: câu thi chép sang, MẤT qid (thành DB-RT-1-I-1) — chỉ nhóm nội dung bắt được.
  kho.set(`kho/${MA_DB}.json`, JSON.stringify({ ma_de: MA_DB, cau: [cauI(1, DE_THI, 'B'), cauI(2, 'Câu RT dạng bài tự do.', 'C')] }))
  xoaDemCaBaoVe()
})

async function moCa(): Promise<void> {
  // Gói ca công khai đúng khuôn `mergeAndStrip` (không đáp án), id = qid kho.
  kho.set('de/RT-CA.json', JSON.stringify({ phanI: [{ id: 'RT-DE-I-1', text: DE_THI, choices: [PA.A, PA.B, PA.C, PA.D] }], phanII: [], phanIII: [] }))
  const t = Date.now()
  await DB.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc)
    VALUES('RT-CA','Ca RT','mo',?,?,45,'thi','khong','de/RT-CA.json',?)`)
    .bind(new Date(t - 600_000).toISOString(), new Date(t + 1_200_000).toISOString(), new Date(t).toISOString()).run()
  xoaDemCaBaoVe()
}

const deCuaGoi = (g: unknown): string[] => (((g as { cau?: { de: string }[] })?.cau) ?? []).map((c) => c.de)

describe('Runtime D1 (workerd): lệnh luyện công khai không trả câu của ca đang mở', () => {
  it('không có ca: cả hai lệnh trả câu kèm đáp án như cũ', async () => {
    const r = await cauKhacPhucGoi(ENV, { chuyenDe: ['RT-CD'], soCau: 20 }) as { thuTu: string[]; items: unknown[] }
    expect([...r.thuTu].sort()).toEqual(['RT-DE-I-1', 'RT-DE-I-2'])
    const r2 = await deTheoDangBai(ENV, { ma: MA_DB }) as { ok: boolean; de: unknown }
    expect(deCuaGoi(r2.de)).toContain(DE_THI)
  })

  it('ca đang mở, KHÔNG sbd: gỡ câu thi (qid ở cauKhacPhuc, nhóm nội dung ở deTheoDangBai), câu tự do vẫn có đáp án', async () => {
    await moCa()
    const r = await cauKhacPhucGoi(ENV, { chuyenDe: ['RT-CD'], soCau: 20 }) as { ok: boolean; thuTu: string[]; items: unknown[] }
    expect(r.ok).toBe(true)
    expect(r.thuTu).toEqual(['RT-DE-I-2'])
    expect(r.items.flatMap(deCuaGoi)).toEqual(['Câu RT tự do.'])
    expect(JSON.stringify(r)).not.toContain('Lời giải RT câu 1.')
    const r2 = await deTheoDangBai(ENV, { ma: MA_DB }) as { ok: boolean; de: { cau: { de: string; dap_an: string }[] } }
    expect(r2.ok).toBe(true)
    expect(deCuaGoi(r2.de)).toEqual(['Câu RT dạng bài tự do.'])
    expect(r2.de.cau[0]!.dap_an).toBe('C')
  })
})
