// @vitest-environment node
// OMNI 3 (05/10) — móc của điều phối trong `dayDeKho` (server/src/index.ts): đẩy tờ lên kho ⇒ ghi THƯ MỤC MỤC ĐÍCH của tờ (DẠY HỌC / TU LUYỆN)
// suy từ `nhom` của gói (kho-thu-muc.ts `ghiThuMucKhiDayDe`). Khoá: tờ trong thư mục lớn "DẠY HỌC" ⇒ DAY_HOC; thư mục khác ⇒ TU_LUYEN;
// đẩy CHỈ MỤC không kèm gói ⇒ KHÔNG đổi dòng cũ (không lật tờ DẠY HỌC thành TU LUYỆN); mã khoá là mã GỐC (bỏ -TN/-DS/-TLN); nạp đề vẫn ok.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const TN = { phan: 'I', so: 1, de: 'Chất nào sau đây là ester?', pa: { A: 'CH₃COOH', B: 'CH₃COOCH₃', C: 'C₂H₅OH', D: 'HCHO' }, dap_an: 'B' }
const napDe = (d: D1That, maDe: string, de: unknown) => goiWorker(worker, d.env, '/kho/day', { maDe, lop: '12', ...(de ? { de } : {}), cau: [] }, true)
const thuMuc = (d: D1That) =>
  Object.fromEntries(
    (d.sql.prepare("SELECT ma_de, thu_muc FROM de_kho_thu_muc ORDER BY ma_de").all() as { ma_de: string; thu_muc: string }[]).map((x) => [x.ma_de, x.thu_muc]),
  )

describe('dayDeKho ⇒ thư mục mục đích của tờ (OMNI 3)', () => {
  it('thư mục DẠY HỌC ⇒ DAY_HOC; thư mục khác ⇒ TU_LUYEN; khoá theo mã gốc; nạp đề vẫn ok', async () => {
    const d = taoD1That()
    const a = await napDe(d, '12-B6-TN', { nhom: '12 · DẠY HỌC/C2 - Carbohydrate', cau: [TN] })
    expect(a.ok).toBe(true)
    const b = await napDe(d, '12-ON1-TN', { nhom: '12 · ÔN TẬP/Đề tổng hợp', cau: [TN] })
    expect(b.ok).toBe(true)
    expect(thuMuc(d)).toEqual({ '12-B6': 'DAY_HOC', '12-ON1': 'TU_LUYEN' })
  })

  it('đẩy chỉ mục KHÔNG kèm gói ⇒ dòng cũ giữ nguyên (không lật DẠY HỌC thành TU LUYỆN)', async () => {
    const d = taoD1That()
    await napDe(d, '12-B7-TN', { nhom: '12 · DẠY HỌC/C2 - Carbohydrate', cau: [TN] })
    const r = await napDe(d, '12-B7-TN', null)
    expect(r.ok).toBe(true)
    expect(thuMuc(d)).toEqual({ '12-B7': 'DAY_HOC' })
  })

  it('tờ chuyển thư mục (thầy kéo sang ÔN TẬP rồi đẩy lại) ⇒ dòng đổi theo', async () => {
    const d = taoD1That()
    await napDe(d, '12-B8-TN', { nhom: '12 · DẠY HỌC/C2 - Carbohydrate', cau: [TN] })
    await napDe(d, '12-B8-TN', { nhom: '12 · ÔN TẬP/C2', cau: [TN] })
    expect(thuMuc(d)).toEqual({ '12-B8': 'TU_LUYEN' })
  })
})
