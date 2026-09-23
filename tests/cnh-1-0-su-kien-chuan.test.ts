// @vitest-environment node
// P03 — SỰ KIỆN HỌC CHUẨN (04 §2/§3) trên D1 THẬT (`node:sqlite`, đúng schema + mọi migration) và
// Worker THẬT (`goiWorker`). Phần chứng minh ở đây gồm:
//   · attempt key + idempotency ngữ nghĩa (phần EVENT của T14 — phần tiền thuộc P07);
//   · `assistance`/`purpose`/raw data được LƯU (bảo toàn dữ liệu thô, không chứa đáp án đúng);
//   · T29: máy chủ cấp hỗ trợ ở game ⇒ em mở màn khác nộp đúng vẫn là `assisted`, KHÔNG thành bằng chứng độc lập;
//   · T47 (phần hồ sơ): kết quả ĐANG CHE không vào bằng chứng; sau CÔNG BỐ mới vào (không lộ đáp án qua hồ sơ);
//   · đường LÙI: D1 chưa áp migration cột chuẩn vẫn ghi được sổ (sự kiện không bị mất).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { ghiSuKien, xoaBietCotChuan, type SuKien } from '../server/src/su-kien-hoc'
import {
  bamSo, congBoSuKien, docAnhChup, docSuKienNL, dungLaiNangLuc, nangLucBat,
  xoaBietCotChuanNL, xoaDemNangLuc, KHOA_BAT_NANG_LUC,
} from '../server/src/nang-luc-d1'
import { dtoNangLuc } from '../server/src/ho-so-dto'
import { phatLaiNangLuc } from '../server/src/nang-luc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { daHocDang } from './_pham-vi-ca-nhan'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(T0)
  xoaBietCotChuan(); xoaBietCotChuanNL(); xoaDemNangLuc()
})
afterEach(() => vi.useRealTimers())

const NGAY = '2026-09-22'
const ev = (o: Partial<SuKien> & { qid: string }): SuKien => ({
  nguon: 'btvn', maNguon: 'BT1', sbd: 'S1', lan: 1, ketQua: 1, luc: `${NGAY}T03:00:00.000Z`, ...o,
})

/** Kho nhỏ có nhãn kỹ năng + mức; S1/S2 là hai em. */
function dungKho(soCau = 6) {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?, 'kho/DE1.json',0,'v1')").run(soCau)
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const themQ = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const sbd of ['S1', 'S2']) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,'ten','12','mk','x')").run(sbd)
  const cau = (qid: string, nhom: string, muc: string, kienThuc = ['SK1']) => ({
    qid, maDe: 'DE1', version: 'v1', group: nhom, phan: 'I', text: `Đề ${qid}`, choices: ['A. a', 'B. b', 'C. c', 'D. d'],
    ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: muc, sao: 1, kienThuc, correct: 'B', solution: 'LG', reviewed: true,
  })
  for (let i = 0; i < soCau; i++) {
    const q = cau(`Q${i}`, `cg-Q${i}`, 'hieu')
    themQ.run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q))
  }
  return { d, themQ, cau }
}

describe('Sự kiện chuẩn: attempt key, assistance, dữ liệu thô (04 §2)', () => {
  it('GHI đủ `attempt_id`, `assistance`, `purpose`, `policy_version` và BẢO TOÀN raw data', async () => {
    const { d } = dungKho()
    const kq = await ghiSuKien(d.env, [ev({
      qid: 'Q0', attemptId: 'attempt-1', assistance: 'assisted', purpose: 'repair', giay: 42,
      raw: { chon: 'B', ghiChu: 'em làm lại' }, subitem: [{ id: 'y1', correct: true }],
    })])
    expect(kq).toMatchObject({ ok: true, soGui: 1 })
    const r = d.sql.prepare("SELECT attempt_id, assistance, purpose, policy_version, raw_json, subitem_json, received_at FROM su_kien_hoc WHERE qid = 'Q0'").get() as Record<string, unknown>
    expect(r.attempt_id).toBe('attempt-1')
    expect(r.assistance).toBe('assisted')
    expect(r.purpose).toBe('repair')
    expect(r.policy_version).toBe('CNH-1.0')
    expect(JSON.parse(String(r.raw_json))).toEqual({ chon: 'B', ghiChu: 'em làm lại' }) // dữ liệu THÔ, không phải kết luận
    expect(JSON.parse(String(r.subitem_json))).toEqual([{ id: 'y1', correct: true }])
    expect(Number(r.received_at)).toBe(Date.parse(`${NGAY}T03:00:00.000Z`))
  })

  it('CÙNG một lần làm (attempt) gửi lại nhiều lần ⇒ MỘT dòng sổ (idempotent theo khoá attempt)', async () => {
    const { d } = dungKho()
    await ghiSuKien(d.env, [ev({ qid: 'Q0', attemptId: 'a1' })])
    await ghiSuKien(d.env, [ev({ qid: 'Q0', attemptId: 'a1', raw: { lan: 2 } })])
    expect(Number((d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE qid = 'Q0'").get() as { n: number }).n)).toBe(1)
    // Lần ghi lại KHÔNG đổi kết quả đã chốt (không có chế độ cập nhật).
    expect(Number((d.sql.prepare("SELECT ket_qua FROM su_kien_hoc WHERE qid = 'Q0'").get() as { ket_qua: number }).ket_qua)).toBe(1)
  })

  it('`assisted` được LƯU (không bị bỏ như trước) và KHÔNG thành bằng chứng độc lập ở hồ sơ', async () => {
    const { d } = dungKho()
    await ghiSuKien(d.env, [
      ev({ qid: 'Q0', ketQua: 1, assistance: 'assisted', attemptId: 'a-gợi-ý' }),
      ev({ qid: 'Q1', ketQua: 1, attemptId: 'a-tự-làm' }),
    ])
    const doc = await docSuKienNL(d.env, 'S1')
    expect(doc.ds).toHaveLength(2)
    expect(doc.ds.map((x) => x.assistance).sort()).toEqual(['assisted', 'none'])
    const donVi = phatLaiNangLuc(doc.ds, { denNgay: NGAY }).get('S1')!.skills[0]!
    expect(donVi.evidenceRefs).toHaveLength(1) // chỉ câu TỰ LÀM
    expect(donVi.validatedLevel).toBeNull()
  })

  it('nhãn kỹ năng lấy từ KHO; câu KHO KHÔNG gắn nhãn bị BỎ và ĐẾM (không bịa kỹ năng)', async () => {
    const { d, themQ, cau } = dungKho()
    themQ.run('DE1', 'Q-TRONG', 'v1', 'cg-TRONG', 'D1', JSON.stringify(cau('Q-TRONG', 'cg-TRONG', 'hieu', [])))
    await ghiSuKien(d.env, [ev({ qid: 'Q0' }), ev({ qid: 'Q-TRONG' })])
    const doc = await docSuKienNL(d.env, 'S1')
    expect(doc.ds.map((x) => x.qid)).toEqual(['Q0'])
    expect(doc.thieuNhan).toBe(1)
    expect(doc.ds[0]!.skillIds).toEqual(['SK1'])
    expect(doc.ds[0]!.difficulty).toBe(1) // 'hieu' → 1
  })

  it('ĐƯỜNG LÙI: D1 chưa áp migration cột chuẩn vẫn GHI ĐƯỢC sổ (sự kiện không bị mất)', async () => {
    const { d } = dungKho()
    const cot = d.sql.prepare("SELECT name FROM pragma_table_info('su_kien_hoc')").all() as { name: string }[]
    expect(cot.map((x) => x.name)).toContain('attempt_id') // migration đã chạy trên D1 thật của test
    // Bỏ chỉ mục của migration trước (chỉ mục khoá cột thì SQLite không cho DROP COLUMN), rồi bỏ cột:
    // mô phỏng ĐÚNG một D1 CHƯA áp migration-2309-cnh1-su-kien-chuan.sql.
    d.sql.exec('DROP INDEX IF EXISTS idx_skh_sua_diem; DROP INDEX IF EXISTS idx_skh_tiep_nhan')
    for (const c of ['attempt_id', 'assistance', 'visibility', 'correction_of', 'policy_version', 'purpose', 'raw_json', 'subitem_json', 'received_at']) {
      d.sql.exec(`ALTER TABLE su_kien_hoc DROP COLUMN ${c}`)
    }
    xoaBietCotChuan(); xoaBietCotChuanNL()
    const kq = await ghiSuKien(d.env, [ev({ qid: 'Q0', attemptId: 'x', raw: { a: 1 } })])
    expect(kq).toMatchObject({ ok: true, soGui: 1 })
    expect(Number((d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE qid = 'Q0'").get() as { n: number }).n)).toBe(1)
    const doc = await docSuKienNL(d.env, 'S1') // đọc cũng lùi được, giá trị an toàn
    expect(doc.ds[0]!.assistance).toBe('none')
    expect(doc.ds[0]!.visibility).toBe('released')
  })
})

describe('T47 (phần hồ sơ) — kết quả ĐANG CHE không lộ, sau CÔNG BỐ mới vào bằng chứng', () => {
  it('embargoed ⇒ 0 bằng chứng và DTO không có eventRef; công bố ⇒ vào bằng chứng đúng ngày gốc', async () => {
    const { d } = dungKho()
    await ghiSuKien(d.env, [
      ev({ qid: 'Q0', nguon: 'thi', maNguon: 'CA1', visibility: 'embargoed', attemptId: 'a-ca' }),
      ev({ qid: 'Q1', nguon: 'thi', maNguon: 'CA1', visibility: 'embargoed', attemptId: 'a-ca' }),
    ])
    const truoc = dtoNangLuc(await dungLaiNangLuc(d.env, 'S1', { denNgay: NGAY, moc: new Date().toISOString() }))
    expect(truoc.skills[0]!.evidenceRefs).toEqual([])
    expect(truoc.skills[0]!.validatedLevel).toBeNull()
    expect(truoc.skills[0]!.nhanMuc).toMatch(/chưa đủ căn cứ/) // KHÔNG hiển thị null thành "không biết gì"

    const so = await congBoSuKien(d.env, 'thi', 'CA1')
    expect(so).toBe(2)
    const sau = dtoNangLuc(await dungLaiNangLuc(d.env, 'S1', { denNgay: NGAY, moc: new Date().toISOString() }))
    expect(sau.skills[0]!.evidenceRefs).toHaveLength(2)
    const goc = d.sql.prepare("SELECT ngay_vn FROM su_kien_hoc LIMIT 1").get() as { ngay_vn: string }
    expect(goc.ngay_vn).toBe(NGAY) // giữ NGÀY GỐC của lần nộp, không dồn sang hôm công bố
  })
})



describe('T29 — hỗ trợ QUA MÁY CHỦ ở game: em mở màn khác nộp đúng vẫn là `assisted`', () => {
  /** Phiên game đang mở với MỘT câu; `assisted` do máy chủ chốt theo yêu cầu hỗ trợ. */
  function dungPhien(d: D1That) {
    d.sql.prepare("INSERT INTO game_v2_profile(sbd,json,created_at) VALUES('S1',?,'x')").run(JSON.stringify({
      pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z',
    }))
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('S1-T29', 'S1', JSON.stringify({
      mode: 'adventure', created: T0, questions: [{ qid: 'Q0', maDe: 'DE1', version: 'v1', group: 'cg-Q0', novel: true }],
    }), new Date(T0).toISOString())
  }
  const batCo = (d: D1That, giaTri: string) =>
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x') ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri").run(KHOA_BAT_NANG_LUC, giaTri)

  it('cờ BẬT: nộp câu ĐÃ ĐƯỢC CẤP HỖ TRỢ ghi sổ `assisted` và KHÔNG thành bằng chứng độc lập', async () => {
    const { d } = dungKho()
    dungPhien(d)
    batCo(d, 'bat')
    xoaDemNangLuc()
    expect(await nangLucBat(d.env)).toBe(true)
    const r = await goiWorker(worker, d.env, '/game-v2/answer', {
      token: await gameToken(d.env, 'S1'), session: 'S1-T29', qid: 'Q0', answer: 'B', assisted: true,
    }) as Record<string, unknown>
    expect(r.ok).toBe(true)
    const hang = d.sql.prepare("SELECT attempt_id, assistance, ket_qua, purpose FROM su_kien_hoc WHERE sbd = 'S1'").all() as Record<string, unknown>[]
    expect(hang).toHaveLength(1)
    expect(hang[0]!.assistance).toBe('assisted') // bằng chứng HỖ TRỢ được giữ, không bị bỏ
    expect(hang[0]!.attempt_id).toBe('S1-T29|Q0') // attempt do máy chủ cấp
    expect(Number(hang[0]!.ket_qua)).toBe(1) // đúng, nhưng KHÔNG phải lần tự làm
    const doc = await docSuKienNL(d.env, 'S1')
    const skill = phatLaiNangLuc(doc.ds, { denNgay: NGAY }).get('S1')!.skills[0]!
    expect(doc.ds[0]!.assistance).toBe('assisted')
    expect(skill.evidenceRefs).toEqual([])
    expect(skill.validatedLevel).toBeNull()
    expect(skill.workingLevel).toBe(0) // không được nâng mức vì một lần có gợi ý
  })

  it('cờ TẮT (mặc định): giữ NGUYÊN hành vi cũ — lượt có hỗ trợ KHÔNG vào sổ', async () => {
    const { d } = dungKho()
    dungPhien(d)
    expect(await nangLucBat(d.env)).toBe(false)
    const r = await gameV2(d.env, 'answer', {
      token: await gameToken(d.env, 'S1'), session: 'S1-T29', qid: 'Q0', answer: 'B', assisted: true,
    }) as Record<string, unknown>
    expect(r.ok).toBe(true)
    expect(Number((d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd = 'S1'").get() as { n: number }).n)).toBe(0)
  })
})
describe('DTO chung + đường route thật của Worker', () => {
  it('`/ho-so/nang-luc`: một hình dữ liệu cho ba app, kèm MỘT chỗ nói lý do chưa xác nhận mức', async () => {
    const { d } = dungKho()
    await ghiSuKien(d.env, [ev({ qid: 'Q0' }), ev({ qid: 'Q1' }), ev({ qid: 'Q2' })])
    const r = await goiWorker(worker, d.env, '/ho-so/nang-luc', { sbd: 'S1' }, true) as any
    expect(r.ok).toBe(true)
    expect(r.bat).toBe(false) // cờ mặc định TẮT (đường học đang chạy không đổi)
    expect(r.hoSo.policyVersion).toBe('CNH-1.0')
    expect(r.hoSo.skills).toHaveLength(1)
    const s = r.hoSo.skills[0]
    expect(s).not.toHaveProperty('validatedLevelCuaThu') // KHÔNG có cấp thú trong DTO năng lực
    expect(s.nhanMuc).toMatch(/chưa đủ căn cứ/)
    expect(s.nhanTinCay).toMatch(/bằng chứng/)
    // Kho tổng hợp CHƯA gắn nhãn family ⇒ 0 family (KHÔNG bịa `family=qid`), nên thiếu cả 5;
    // và mới có 1 ngày. Đây là lý do thật để giáo viên biết cần gắn nhãn gì (P02 `baoThieuNhan`).
    expect(r.hoSo.lyDo[0]).toMatchObject({ skillId: 'SK1', lyDo: 'THIEU_FAMILY', thieuFamily: 5, thieuNgay: 1 })
    expect(JSON.stringify(r)).not.toMatch(/correct|dap_an/i) // DTO KHÔNG chứa đáp án
  })

  it('/ho-so/nang-luc thiếu sbd ⇒ từ chối rõ ràng (không dựng hồ sơ rỗng)', async () => {
    const { d } = dungKho()
    const r = await goiWorker(worker, d.env, '/ho-so/nang-luc', {}, true) as any
    expect(r).toMatchObject({ ok: false })
    expect(r.error).toMatch(/sbd/)
  })
})

