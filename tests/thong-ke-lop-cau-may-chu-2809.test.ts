// @vitest-environment node
// HOÀN THIỆN BẢN VẼ LÊN BẢNG 28/09 — `/gv/thong-ke-lop-cau` (server/src/thong-ke-lop-cau.ts): dải phím T ở MỌI buổi chữa.
// Khoá: CHỈ ĐỌC; trả CHỈ SỐ GỘP theo câu (không sbd, không tên); lần MỚI NHẤT mỗi (em, câu); chỉ em trong danh sách gửi lên;
// đáp án chọn từ raw_json hoặc chi_tiet_cau (ca); câu không em nào làm ⇒ vắng.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvThongKeLopCau } from '../server/src/thong-ke-lop-cau'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-28T12:00:00Z')
const luc = (h: number) => new Date(T0 - h * 3600e3).toISOString()

describe('/gv/thong-ke-lop-cau', () => {
  it('số gộp theo câu, lần mới nhất mỗi em, không lộ sbd/tên; em ngoài danh sách không tính; câu chưa ai làm ⇒ vắng', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    await ghiSuKien(env, [
      { nguon: 'game', maNguon: 'P1', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 0, luc: luc(5), raw: { chon: 'A' } },
      { nguon: 'game', maNguon: 'P2', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 1, luc: luc(2), raw: { chon: 'B' } }, // mới nhất của S1
      { nguon: 'game', maNguon: 'P3', sbd: 'S2', qid: 'Q1', lan: 1, ketQua: 0, luc: luc(3), raw: { chon: 'C' } },
      { nguon: 'thi', maNguon: 'CA1', sbd: 'S3', qid: 'Q1', lan: 1, ketQua: 0, luc: luc(4) },
      { nguon: 'game', maNguon: 'P4', sbd: 'NGOAI', qid: 'Q1', lan: 1, ketQua: 1, luc: luc(1), raw: { chon: 'B' } },
    ])
    d.sql.exec(`INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dap_an_chon,dung_sai,cap_nhat_luc) VALUES('k','CA1','S3',1,'I',3,'Q1','C',0,'x')`)
    const r = (await gvThongKeLopCau(env, { sbd: ['S1', 'S2', 'S3'], qid: ['Q1', 'Q9'] })) as { ok: boolean; cau: Record<string, unknown> }
    expect(r.ok).toBe(true)
    expect(r.cau).toEqual({ Q1: { bai: 3, dung: 1, coChon: 3, chon: { B: 1, C: 2 }, chonSai: { C: 2 } } })
    const chu = JSON.stringify(r)
    for (const lo of ['S1', 'S2', 'S3', 'NGOAI']) expect(chu).not.toContain(lo)
  })
  it('thiếu danh sách em / câu ⇒ rỗng, không đọc sổ', async () => {
    const d = taoD1That()
    expect(await gvThongKeLopCau(d.env as unknown as Env, { sbd: [], qid: ['Q1'] })).toEqual({ ok: true, cau: {} })
    expect(await gvThongKeLopCau(d.env as unknown as Env, { sbd: 'S1', qid: 'Q1' })).toEqual({ ok: true, cau: {} })
  })
})
