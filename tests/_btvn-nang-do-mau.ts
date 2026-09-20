// Dữ liệu mẫu + hàm gọi dùng chung cho tests/btvn-nang-do-*-2109.test.ts (BTVN "nâng đỡ", máy chủ).
import { vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

export const BAY_GIO = new Date('2026-09-22T03:00:00.000Z') // 10:00 giờ VN, thứ Ba
export const HAN = '2026-09-29T03:00:00.000Z' // 7 ngày sau
export const NGAY_MAI_0H_VN = '2026-09-22T17:00:00.000Z'

/** Tờ kho 24 câu: I 1–16 (dạng DA-1 câu 1–8, DA-2 câu 9–16), II 1–4 (DA-3), III 1–4 (DA-4). Mức độ xoay biet/hieu/van_dung, sao xoay 0/1/2. */
export function toKho() {
  const muc = ['biet', 'hieu', 'van_dung']
  const cau: Record<string, unknown>[] = []
  for (let i = 1; i <= 16; i++) cau.push({ phan: 'I', so: i, de: `Câu I.${i}`, pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'A', chuyen_de: i <= 8 ? 'Este' : 'Amin', muc_do: muc[(i - 1) % 3], dang: { ma: i <= 8 ? 'DA-1' : 'DA-2', ten: i <= 8 ? 'Thuỷ phân este' : 'Bậc amin' }, can_chua: { sao: (i - 1) % 3, dk: [], ly_do: 'BI-MAT-LY-DO', bay: null }, loi_giai: { chot: `LG-BI-MAT-${i}` }, kienThuc: ['BI-MAT-KT'] })
  for (let i = 1; i <= 4; i++) cau.push({ phan: 'II', so: i, de: `Câu II.${i}`, y: { a: 'a', b: 'b', c: 'c', d: 'd' }, dap_an: 'DSDS', chuyen_de: 'Lipid', muc_do: muc[i % 3], dang: { ma: 'DA-3', ten: 'Chất béo' }, loi_giai: { chot: `LG-BI-MAT-II-${i}` } })
  for (let i = 1; i <= 4; i++) cau.push({ phan: 'III', so: i, de: `Câu III.${i}`, dap_an: '0.39', chuyen_de: 'Polime', muc_do: muc[i % 3], dang: { ma: 'DA-4', ten: 'Điều chế' }, loi_giai: { chot: `LG-BI-MAT-III-${i}` }, hinh: [{ tep: 'x.png', vi_tri: 'sau_loi_giai', du_lieu: 'BI-MAT-ANH' }, { tep: 'y.png', vi_tri: 'trong_de' }] })
  return { ma_de: 'DE1', cau }
}
export const DAP_AN_DUNG = (qid: string) => (/-II-/.test(qid) ? 'DSDS' : /-III-/.test(qid) ? '0.39' : 'A')
export const TAT_CA_QID = [...Array.from({ length: 16 }, (_, i) => `DE1-I-${i + 1}`), ...Array.from({ length: 4 }, (_, i) => `DE1-II-${i + 1}`), ...Array.from({ length: 4 }, (_, i) => `DE1-III-${i + 1}`)]

/** `cau[]` dựng ĐÚNG quy ước qid `<mã tờ>-<phần>-<số>` như máy thầy phải gửi. */
export function cauThay() {
  return toKho().cau.map((c) => ({
    qid: `DE1-${c.phan}-${c.so}`, dang: (c.dang as { ma: string }).ma, chuyenDe: String(c.chuyen_de), mucDo: ['biet', 'hieu', 'van_dung'].indexOf(String(c.muc_do)), sao: (c.can_chua as { sao: number } | undefined)?.sao ?? 0, phan: c.phan,
  }))
}

export function dung(soEm = 1): D1That {
  const d = taoD1That()
  d.objects.set('kho/DE1.json', toKho())
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Tờ 1',24,0,'x')").run()
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cap_nhat_luc) VALUES('CA1','Ca 1','dong','x')").run()
  for (let i = 1; i <= soEm; i++) {
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,ho_ten) VALUES(?,?,?,?,?,?,?,?)").run(`CA1|S${i}|1`, 'CA1', `S${i}`, 1, 'x', 'da_nop', 'x', `Em ${i}`)
  }
  return d
}
export async function giao(d: D1That, them: Record<string, unknown> = {}) {
  return goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: HAN, caNhan: true, cau: cauThay(), ghim: [], hatGiong: 'hg-1', ...them }, true)
}
export const maBtvn = (d: D1That) => (d.sql.prepare('SELECT ma_btvn FROM btvn LIMIT 1').get() as { ma_btvn: string }).ma_btvn
export const mo = (d: D1That, sbd = 'S1') => goiWorker(worker, d.env, '/btvn/cua-em', { maCa: 'CA1', sbd })
export const nopChang = (d: D1That, chiSo: number, dapAn?: Record<string, string>, sbd = 'S1') => goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: maBtvn(d), sbd, chiSo, ...(dapAn ? { dapAn } : {}) })
export const boCuaEm = (d: D1That, sbd = 'S1') => (d.sql.prepare('SELECT qid, chang, nhan FROM btvn_em_cau WHERE sbd = ? ORDER BY chang, thu_tu').all(sbd) as { qid: string; chang: number; nhan: string }[])

export const gio = (t: Date | string) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(t)) }

