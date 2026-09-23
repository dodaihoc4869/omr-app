// @vitest-environment node
// RV07 mục 7 (02 §7.1) — HAI DANH SÁCH TỰ ĐỘNG CỦA KẾ HOẠCH NGÀY đi qua CHÍNH bộ chọn chung khi cờ BẬT.
// Cờ `cau_hinh.ngan_sach_luot` TẮT (mặc định) ⇒ hành vi cũ nguyên vẹn; BẬT ⇒ câu bị CHẶN CỨNG bị loại khỏi việc ôn
// (kế hoạch NGẮN hơn, không lấp chỗ bằng câu không hợp lệ), câu BẢO VỆ vẫn bị loại như trước.
import { describe, expect, it } from 'vitest'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { layCauChoEm } from '../server/src/cau-theo-qid'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { POLICY_VERSION } from '../server/src/nang-luc'
import { taoD1That, type D1That } from './_d1-that'

const NOW = Date.now()
const iso = (ms: number) => new Date(ms).toISOString()
const NGAY = new Date(NOW + 7 * 3_600_000).toISOString().slice(0, 10) // ngày VN (UTC+7)
const D = 24 * 3_600_000

/**
 * Kho 2 câu (mức Biết `DE1-I-1` dạng ES.A.X + mức Vận dụng `DE1-I-2` dạng ES.B.Y) cùng kỹ năng K1; em S1 SAI CẢ HAI
 * 5 ngày trước ⇒ cả hai vào hàng ôn tới hạn hôm nay (hồ sơ dựng lại TỪ SỔ SỰ KIỆN, đúng đường thật).
 * `nhanFamily: false` = kho CHƯA gán nhãn family (đúng trạng thái kho thật hiện nay) ⇒ §4.2.6: một lượt chỉ 1 câu
 * "chưa gán family"; đây là hệ quả DỮ LIỆU, không phải luật mới (có nhãn thì lượt giữ đủ số câu hợp lệ).
 */
async function dung(o: { mucDangLuyen?: number; bat?: boolean; nhanFamily?: boolean } = {}): Promise<D1That> {
  const d = taoD1That()
  const nhan = o.nhanFamily ?? true
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Em S1','12','x')").run()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',2,'k',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const qs: [string, string, string, string][] = [
    ['DE1-I-1', 'biet', 'ES.A.X', 'fam-A'], ['DE1-I-2', 'van_dung', 'ES.B.Y', 'fam-B'],
  ]
  for (const [qid, mucDo, maDang, fam] of qs) {
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
      .run('DE1', qid, 'v1', `g-${qid}`, maDang, JSON.stringify({ qid, maDe: 'DE1', phan: 'I', text: 'Đề', choices: ['A', 'B', 'C', 'D'], correct: 'A', sao: 1, dang: { ma: maDang }, mucDo, kienThuc: ['K1'], ...(nhan ? { family: fam } : {}) }))
  }
  d.sql.prepare(
    'INSERT OR REPLACE INTO skill_snapshot(sbd,skill_id,policy_version,working_level,validated_level,confidence,family_count,day_count,last_validated_at,can_kiem_lai,episode_state,episode_json,recent5_json,evidence_json,nhat_ky_json,cursor_received_at,cursor_event_id,revision,cap_nhat_luc)'
    + ' VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
  ).run('S1', 'K1', POLICY_VERSION, o.mucDangLuyen ?? 0, o.mucDangLuyen ?? 0, 1, 0, 0, null, 0, null, 'null', '[]', '[]', '[]', 0, '', 1, 'x')
  if (o.bat) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('ngan_sach_luot','bat','x') ON CONFLICT(khoa) DO UPDATE SET gia_tri='bat'").run()
  await ghiSuKien(d.env, qs.map(([qid], i) => ({ nguon: 'game' as const, maNguon: 'G0', sbd: 'S1', qid, lan: i + 1, ketQua: 0 as const, luc: iso(NOW - 5 * D) })))
  return d
}
const onLaiQid = (kh: { viec: { loai: string; chiTiet: Record<string, unknown> }[] }): string[] => {
  const v = kh.viec.find((x) => x.loai === 'on_lai')
  return v ? ((v.chiTiet.qid as string[]) ?? []) : []
}

describe('RV07-7 — kế hoạch ngày dùng chung bộ chọn §7.1', () => {
  it('cờ TẮT (mặc định): hành vi cũ — việc ôn vẫn có CẢ hai câu (không đổi luật)', async () => {
    const d = await dung()
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!
    expect(onLaiQid(kh).sort()).toEqual(['DE1-I-1', 'DE1-I-2'])
  })

  it('cờ BẬT: câu VƯỢT TRẦN ĐỘ KHÓ bị LOẠI khỏi việc ôn (kế hoạch ngắn hơn, không lấp chỗ)', async () => {
    const d = await dung({ bat: true, mucDangLuyen: 0 })
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!
    expect(onLaiQid(kh)).toEqual(['DE1-I-1'])
  })

  it('cờ BẬT + em đã luyện tới mức Vận dụng (2) ⇒ CẢ HAI câu hợp lệ, giữ nguyên số câu', async () => {
    const d = await dung({ bat: true, mucDangLuyen: 2 })
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!
    expect(onLaiQid(kh).sort()).toEqual(['DE1-I-1', 'DE1-I-2'])
  })

  it('cờ BẬT + kho CHƯA gán nhãn family (§4.2.6): lượt ôn còn 1 câu — hệ quả dữ liệu, KHÔNG nới luật để lấp chỗ', async () => {
    const d = await dung({ bat: true, mucDangLuyen: 2, nhanFamily: false })
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!
    expect(onLaiQid(kh)).toHaveLength(1)
  })

  it('cờ BẬT: câu BẢO VỆ (đề đang che) vẫn bị loại như trước (giữ cửa bảo vệ)', async () => {
    const d = await dung({ bat: true, mucDangLuyen: 2 })
    // Ca thi đang MỞ che `DE1-I-2` (theo qid + content_group) ⇒ `tapQidPhucVu` loại câu đó TRƯỚC bộ chọn.
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,bank_r2,loai,lop,thoi_gian_phut,cap_nhat_luc) VALUES('CA1','Ca 1','mo','ca_lop_xong','de/CA1.json','thi','12',45,'x')").run()
    d.objects.set('de/CA1.json', { phanI: [{ id: 'DE1-I-2', group: 'g-DE1-I-2', text: 'Đề bảo vệ', choices: ['A', 'B', 'C', 'D'], correct: 'A', dang: { ma: 'ES.B.Y' }, mucDo: 'van_dung', kienThuc: ['K1'] }] })
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!
    expect(onLaiQid(kh)).toEqual(['DE1-I-1'])
  })
})

// ĐƯỜNG ÔN (`/hs/cau-theo-qid`): máy em xin đúng qid việc ôn đã giao; cờ BẬT ⇒ câu xin còn phải qua §7.1.
describe('RV07-7 — đường ôn dùng chung bộ chọn §7.1', () => {
  it('cờ TẮT (mặc định): vẫn trả CẢ hai câu em đã gặp (không đổi hành vi)', async () => {
    const d = await dung()
    const kq = await layCauChoEm(d.env, 'S1', ['DE1-I-1', 'DE1-I-2'])
    expect(kq.cau.map((c) => c.qid)).toEqual(['DE1-I-1', 'DE1-I-2'])
  })

  it('cờ BẬT: câu VƯỢT TRẦN ĐỘ KHÓ không được phát cho em (không nới vì "đã giao trong việc")', async () => {
    const d = await dung({ bat: true, mucDangLuyen: 0 })
    const kq = await layCauChoEm(d.env, 'S1', ['DE1-I-1', 'DE1-I-2'])
    expect(kq.cau.map((c) => c.qid)).toEqual(['DE1-I-1'])
    expect(kq.khongCo).toContain('DE1-I-2')
  })

  it('cờ BẬT + em đã luyện tới mức Vận dụng (2) + kho có nhãn family ⇒ trả đủ hai câu', async () => {
    const d = await dung({ bat: true, mucDangLuyen: 2 })
    const kq = await layCauChoEm(d.env, 'S1', ['DE1-I-1', 'DE1-I-2'])
    expect(kq.cau.map((c) => c.qid).sort()).toEqual(['DE1-I-1', 'DE1-I-2'])
  })

  it('cờ BẬT: câu BẢO VỆ vẫn bị loại TRƯỚC bộ chọn (cửa bảo vệ không bị thay thế)', async () => {
    const d = await dung({ bat: true, mucDangLuyen: 2 })
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,bank_r2,loai,lop,thoi_gian_phut,cap_nhat_luc) VALUES('CA1','Ca 1','mo','ca_lop_xong','de/CA1.json','thi','12',45,'x')").run()
    d.objects.set('de/CA1.json', { phanI: [{ id: 'DE1-I-2', group: 'g-DE1-I-2', text: 'Đề bảo vệ', choices: ['A', 'B', 'C', 'D'], correct: 'A', dang: { ma: 'ES.B.Y' }, mucDo: 'van_dung', kienThuc: ['K1'] }] })
    const kq = await layCauChoEm(d.env, 'S1', ['DE1-I-1', 'DE1-I-2'])
    expect(kq.cau.map((c) => c.qid)).toEqual(['DE1-I-1'])
  })
})
