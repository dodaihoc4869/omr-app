// @vitest-environment node
// CNH-1.0 P06/RV07 phụ — `coverage` (§7.2) đếm được task BTVN/Mom trong plan HÔM NAY:
// việc `btvn_lo` mang `chiTiet.qid` = mã câu ĐÃ CHỐT của chặng (`btvn_em_cau`), việc `mom` mang `chiTiet.qid` = `mom_bai.qid_json`.
// Nhờ vậy `docCoverageTheoPlan` thấy câu đã xong/đang giữ chỗ trong plan và quy về KỸ NĂNG thật (không còn bỏ sót BTVN/Mom).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { docCoverageTheoPlan } from '../server/src/bo-chon-that'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { ghiSuKien, ngayVn } from '../server/src/su-kien-hoc'
import { taoD1That } from './_d1-that'

// NỢ TEST 13/10 — NGUYÊN NHÂN GỐC: `NOW` là đồng hồ THẬT, câu BTVN "đã có kết quả HÔM NAY" ghi lúc NOW − 1 giờ ⇒ chạy từ 00:00 tới 00:59 giờ VN thì lượt ấy
// rơi sang HÔM QUA (ngày VN) nên kế hoạch / coverage hôm nay không thấy ⇒ đỏ. Sửa: ĐỒNG HỒ CỐ ĐỊNH 12:00 thứ Tư 14/10 giờ VN (chỉ giả `Date`) và lượt
// "hôm nay" không lùi qua 00:00 giờ VN (đổi giờ cố định sang sát nửa đêm vẫn đúng).
const NOW = Date.parse('2026-10-14T05:00:00Z')
const DAU_HOM_NAY_VN = Date.parse(`${ngayVn(NOW)}T00:00:00+07:00`)
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())
const iso = (ms: number) => new Date(ms).toISOString()
const D = 24 * 3_600_000

/** Em S1: 1 BTVN cá nhân hoá ĐÃ CHỐT bộ (3 câu chặng 0) + 1 bài Mom chưa bắt đầu (2 câu). */
async function dung() {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Em S1','12','x')").run()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',3,'k',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (const i of [1, 2, 3]) {
    const qid = `DE1-I-${i}`
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
      .run('DE1', qid, 'v1', `g-${i}`, 'ES.A.X', JSON.stringify({ qid, maDe: 'DE1', phan: 'I', text: 'Đề', choices: ['A', 'B', 'C', 'D'], correct: 'A', sao: 1, mucDo: 'biet', kienThuc: ['K1'], reviewed: true }))
  }
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,ca_nhan,cap_nhat_luc) VALUES('BT1','CA0','DE1',3,?,?,0,1,'x')")
    .run(iso(NOW - D), iso(NOW + 3 * D))
  d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,thu_hoi,nop_luc,so_cau_em,chot_luc,lo_da_xong) VALUES('BT1|S1','BT1','S1',0,NULL,3,?,0)")
    .run(iso(NOW - 2 * D))
  for (const i of [1, 2, 3]) {
    d.sql.prepare("INSERT INTO btvn_em_cau(khoa,ma_btvn,sbd,qid,chang,nhan,thu_tu) VALUES(?,?,?,?,0,'loi',?)")
      .run(`BT1|S1|DE1-I-${i}`, 'BT1', 'S1', `DE1-I-${i}`, i)
  }
  d.sql.prepare("INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,started_at,submitted_at,qid_json) VALUES('S1','M1','Bài Mẹ giao',?,2,'k',NULL,NULL,?)")
    .run(iso(NOW - D), JSON.stringify(['DE1-I-2', 'DE1-I-3']))
  // Câu trong chặng BTVN đã có kết quả HÔM NAY ⇒ `coverage` phải đếm được qua kỹ năng K1.
  await ghiSuKien(d.env, [{ nguon: 'btvn' as const, maNguon: 'BT1', sbd: 'S1', qid: 'DE1-I-1', lan: 1, ketQua: 0 as const, luc: iso(Math.max(NOW - 3_600_000, DAU_HOM_NAY_VN)) }])
  return d
}

describe('P06/RV07 — qid cho BTVN/Mom để coverage (§7.2) đếm đủ', () => {
  it('việc btvn_lo và mom mang ĐÚNG mã câu thật (chặng đã chốt · qid_json của bài Mom)', async () => {
    const d = await dung()
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!
    const lo = kh.viec.find((v) => v.loai === 'btvn_lo')
    const mom = kh.viec.find((v) => v.loai === 'mom')
    expect(lo?.chiTiet.qid).toEqual(['DE1-I-1', 'DE1-I-2', 'DE1-I-3'])
    expect(mom?.chiTiet.qid).toEqual(['DE1-I-2', 'DE1-I-3'])
  })

  it('docCoverageTheoPlan đếm được kỹ năng K1 nhờ qid của BTVN (trước đây bỏ sót ⇒ 0)', async () => {
    const d = await dung()
    await lapVaLuuKeHoach(d.env, ['S1'], NOW) // ghi kế hoạch hôm nay (đường thật)
    const cov = await docCoverageTheoPlan(d.env, 'S1', ngayVn(NOW), NOW)
    expect(cov.get('K1') ?? 0).toBeGreaterThanOrEqual(1)
  })
})
