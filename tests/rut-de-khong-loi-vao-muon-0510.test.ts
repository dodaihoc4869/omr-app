// @vitest-environment node
// Ca "Không rút câu sai" (pham_vi_hoi_lai = 'khong', thầy 05/10): em vào muộn cũng KHÔNG nhận ô chữa lỗi — giống em vào đúng giờ.
import { describe, expect, it } from 'vitest'
import { lapBoChoEmVaoMuon } from '../server/src/rut-de-v2'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

const KEY = {
  phanI: Array.from({ length: 12 }, (_, i) => ({ id: `K${i}`, text: `Câu K${i} tính m`, choices: ['1', '2', '3', '4'], correct: 'B', mucDo: 'hieu', kieu: 'bai_tap' })), // bài tập: câu gốc quay lại được ngay
  phanII: [],
  phanIII: [],
}

async function dung(phamVi: string | null) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.prepare(
    `INSERT INTO ca (ma_ca, ten_ca, trang_thai, thoi_gian_phut, loai, cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, cap_nhat_luc, lop, de_rieng, len_bang, pham_vi_hoi_lai)
     VALUES ('C1','Ca','mo',45,'thi','khong',3,30,'de/C1.json',?,'x','12A',1,0,?)`,
  ).run(JSON.stringify({ I: 4, II: 0, III: 0 }), phamVi)
  await env.DE!.put('key/C1.json', JSON.stringify(KEY))
  // S1 từng làm SAI K0, K1 (sau 29/09) ⇒ hồ sơ có lỗi đến hạn
  // Câu kho mang mã tờ khối 12 (DH-12-…) = khối lớp 12A của em: luật khối thầy 05/10 ("chặn chuẩn 100% không được rút nhầm kho khác khối") chặn câu KHÔNG RÕ khối ở ô chữa lỗi tự bổ sung.
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12A','x')")
  for (const c of KEY.phanI)
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
      .run('DH-12-DE9', c.id, 'v1', `g-${c.id}`, 'D1', JSON.stringify({ qid: c.id, maDe: 'DH-12-DE9', version: 'v1', group: `g-${c.id}`, phan: 'I', text: c.text, choices: c.choices, hinhAnh: [], dang: 'D1', tenDang: 'D', mucDo: 'TH', correct: 'B', reviewed: true, solution: {} }))
  for (const q of ['K0', 'K1'])
    d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,0,?,?)')
      .run(`k-${q}`, 'S1', q, 'game', 'M', '2026-10-01T03:00:00.000Z', '2026-10-01')
  return env
}

describe('lapBoChoEmVaoMuon — ca "khong"', () => {
  it('đối chứng: ca thường ⇒ em vào muộn CÓ ô chữa lỗi (K0/K1)', async () => {
    const env = await dung(null)
    const r = await lapBoChoEmVaoMuon(env, 'C1', 'S1', JSON.stringify({ I: 4, II: 0, III: 0 }), Date.parse('2026-10-05T02:00:00Z'))
    expect(((r!.lap as Record<string, string[]>).S1 ?? []).length).toBeGreaterThan(0)
  })
  it('ca "khong" ⇒ lap rỗng (không ô chữa lỗi); bộ vẫn đủ 4 câu', async () => {
    const env = await dung('khong')
    const r = await lapBoChoEmVaoMuon(env, 'C1', 'S1', JSON.stringify({ I: 4, II: 0, III: 0 }), Date.parse('2026-10-05T02:00:00Z'))
    expect((r!.bo as Record<string, string[]>).S1).toHaveLength(4)
    expect((r!.lap as Record<string, string[]>).S1 ?? []).toEqual([])
  })
})
