// @vitest-environment node
// Làm lại câu sai bằng BẢN KHÁC (thầy 05/10) — phần THUẦN: trần song sinh 4, bản xáo (hoán vị tất định, chấm quy về gốc, lời giải theo khoá),
// mapper sổ `tc`, công tắc. Không D1.
import { describe, expect, it } from 'vitest'
import { cacQidSongSinh, tachSongSinh, TRAN_SONG_SINH } from '../server/src/loi-hoc-luat'
import { locBoTro } from '../server/src/cau-bo-tro'
import { apHoanVi, apXaoTheoRef, chonVeGoc, doiLoiGiai, dungKhoi, hoanViXao, khoiCanCo, laCuaSoLoi, lanLamTuDongTc, loiGiaiXaoDuoc, rawLamLai, rawSo, xaoCau, xaoDuoc } from '../server/src/lam-lai-so'
import { hangTuHoSo, lanLamTuDong, type MetaCau } from '../server/src/srs2-d1'
import { hangTuTiLe } from '../server/src/srs2-loi'
import { grade, type PrivateQuestion } from '../src/game/than-thu-v2/core'

const cauI = (them: Partial<PrivateQuestion> = {}): PrivateQuestion => ({
  qid: 'Q', maDe: 'DH-DE1', version: 'v1', group: 'g', phan: 'I', text: 'Đề', choices: ['p', 'q', 'r', 's'], ideas: [], hinhAnh: [{ src: 'h', viTri: 'sau_pa_B' }],
  dang: 'D', tenDang: 'Dạng', mucDo: 'TH', sao: 1, kienThuc: [], correct: 'B', reviewed: true, solution: { chot: 'Cốt lõi', tung_pa: { A: { dung: false, vi_sao: 'a' }, B: { dung: true, vi_sao: 'b' }, C: { dung: false, vi_sao: 'c' }, D: { dung: false, vi_sao: 'd' } } }, ...them,
})
const cauII = (them: Partial<PrivateQuestion> = {}): PrivateQuestion => ({ ...cauI(), phan: 'II', choices: [], ideas: ['y1', 'y2', 'y3', 'y4'], hinhAnh: [{ src: 'h', viTri: 'sau_y_c' }], correct: 'DSSD', solution: { chot: 'Cốt lõi', tung_y: { a: { dung: true, vi_sao: 'a' }, b: { dung: false, vi_sao: 'b' }, c: { dung: false, vi_sao: 'c' }, d: { dung: true, vi_sao: 'd' } } }, ...them })

describe('bậc 1 — mục tiêu sáu song sinh', () => {
  it('TRAN_SONG_SINH = 6; qid ảo cũ đều tách được; danh sách đọc sổ phủ đủ 12 chỗ (máy soạn có thể nối sau bản hỏng)', () => {
    expect(TRAN_SONG_SINH).toBe(6)
    expect(cacQidSongSinh('Q1')).toEqual(['Q1', ...Array.from({ length: 12 }, (_, i) => i).map((i) => `Q1~ss${i}`)])
    expect(tachSongSinh('Q1~ss3#2')).toEqual({ goc: 'Q1', songSinh: 3 })
    expect(tachSongSinh('Q1~ss2')).toEqual({ goc: 'Q1', songSinh: 2 })
    expect(tachSongSinh('Q1')).toEqual({ goc: 'Q1', songSinh: null })
    expect(lanLamTuDong({ qid: 'Q1~ss3', ngay_vn: '2026-10-05', luc: 'x', ket_qua: 1 })).toMatchObject({ qid: 'Q1', songSinh: true, dung: true })
  })
  it('locBoTro giữ đủ sáu song sinh, giới hạn gói mới ở sáu bản', () => {
    const ss = (i: number) => ({ de: `Song sinh ${i}`, pa: { A: '1', B: '2', C: '3', D: '4' }, dap_an: 'B' })
    expect(locBoTro({ song_sinh: [ss(0), ss(1), ss(2), ss(3), ss(4), ss(5), ss(6)] }).songSinh.map((x) => x.de)).toEqual(['Song sinh 0', 'Song sinh 1', 'Song sinh 2', 'Song sinh 3', 'Song sinh 4', 'Song sinh 5'])
  })
})

describe('bậc 3 — bản xáo thuần', () => {
  it('hoán vị tất định theo muối; Phần I chữ cái đáp án đúng LUÔN đổi; Phần II thứ tự ý LUÔN đổi', () => {
    for (let i = 0; i < 300; i++) {
      const xt = hoanViXao(cauI(), `S1|2026-10-05|Q|${i}`)
      expect([...xt].sort()).toEqual([0, 1, 2, 3])
      expect(xt.indexOf(1)).not.toBe(1) // B (chỉ số 1) không còn ở vị trí B
      const xt2 = hoanViXao(cauII(), `S1|2026-10-05|Q2|${i}`)
      expect(xt2.some((v, p) => v !== p)).toBe(true)
    }
    expect(hoanViXao(cauI(), 'muối')).toEqual(hoanViXao(cauI(), 'muối'))
    expect(hoanViXao(cauI(), 'muối a')).not.toEqual(hoanViXao(cauI(), 'muối b'))
  })
  it('Phần II: MẪU Đ/S em có thể nhớ LUÔN đổi (mẫu không đồng nhất); mẫu ĐĐĐĐ/SSSS vẫn đổi thứ tự ý', () => {
    for (const mau of ['DSSD', 'DDSS', 'DSDS', 'DDDS', 'SSSD', 'SDDD']) {
      for (let i = 0; i < 300; i++) {
        const xt = hoanViXao(cauII({ correct: mau }), `S1|2026-10-05|Q|${mau}|${i}`)
        expect([...xt].sort()).toEqual([0, 1, 2, 3])
        expect(xt.map((k) => mau[k]).join(''), `${mau} #${i}`).not.toBe(mau)
      }
    }
    for (const mau of ['DDDD', 'SSSS']) for (let i = 0; i < 50; i++) expect(hoanViXao(cauII({ correct: mau }), `m${i}`).some((v, p) => v !== p)).toBe(true)
  })
  it('phương án / ý trỏ tới phương án / ý khác ⇒ không xáo; nhãn phản ứng (a) trong ý và câu chữ thường ⇒ vẫn xáo', () => {
    expect(xaoDuoc(cauI({ choices: ['p', 'q', 'Cả A và B', 's'] }))).toBe(false)
    expect(xaoDuoc(cauI({ choices: ['p', 'q', 'r', 'Tất cả các đáp án trên đều đúng'] }))).toBe(false)
    expect(xaoDuoc(cauI({ choices: ['p', 'q', 'r', 'Tất cả đều sai'] }))).toBe(false)
    expect(xaoDuoc(cauI({ choices: ['p', 'q', 'r', 'Không có phương án nào đúng'] }))).toBe(false)
    expect(xaoDuoc(cauI({ choices: ['CH3COOH', 'C2H5OH', 'Ca(OH)2', 'Tất cả các kim loại kiềm đều mềm'] }))).toBe(true)
    expect(xaoDuoc(cauII({ ideas: ['y1', 'y2', 'Cả hai ý a và b đều đúng', 'y4'] }))).toBe(false)
    expect(xaoDuoc(cauII({ ideas: ['y1', 'a) và b) đều đúng', 'y3', 'y4'] }))).toBe(false)
    expect(xaoDuoc(cauII({ ideas: ['Phản ứng (a) là phản ứng oxi hoá – khử.', 'Phản ứng (b) tạo khí.', 'y3', 'y4'] }))).toBe(true)
  })
  it('Phần I: phương án, ảnh kèm phương án, đáp án, lý do từng phương án đi theo; chấm bản xáo = chấm gốc sau khi quy về', () => {
    const goc = cauI()
    const r = xaoCau(goc, 'S1|2026-10-05|Q|0|0')!
    expect(r).not.toBeNull()
    const q = r.q, xt = r.xt
    expect(q.choices).toEqual(xt.map((i) => goc.choices[i]))
    const viTriQ = q.choices.indexOf('q') // phương án đúng gốc (B)
    expect(q.correct).toBe('ABCD'[viTriQ])
    expect(q.correct).not.toBe('B')
    expect(q.hinhAnh).toEqual([{ src: 'h', viTri: `sau_pa_${q.correct}` }])
    const lg = q.solution as { tung_pa: Record<string, { dung: boolean }> }
    expect(lg.tung_pa[q.correct]!.dung).toBe(true)
    expect(Object.keys(lg.tung_pa).sort()).toEqual(['A', 'B', 'C', 'D'])
    for (const chu of ['A', 'B', 'C', 'D']) expect(grade(q, chu)).toBe(grade(goc, chonVeGoc({ xt }, 'I', chu)))
    expect(chonVeGoc({ xt }, 'I', q.correct)).toBe('B')
    expect(apXaoTheoRef(goc, { xt })).toEqual(q) // phát lại / chấm: y hệt lúc phát
    expect(apXaoTheoRef(goc, {})).toBe(goc)
    expect(apHoanVi(goc, [0, 1, 1, 3])).toBe(goc) // hoán vị hỏng ⇒ nguyên câu
  })
  it('Phần II: ý, ảnh kèm ý, mẫu Đ/S, lý do từng ý đi theo; quy về gốc đúng', () => {
    const goc = cauII()
    const r = xaoCau(goc, 'S1|2026-10-05|Q2|0|0')!
    const q = r.q, xt = r.xt
    expect(q.ideas).toEqual(xt.map((i) => goc.ideas[i]))
    expect(q.correct).toBe(xt.map((i) => 'DSSD'[i]).join(''))
    expect(q.ideas).not.toEqual(goc.ideas)
    expect(chonVeGoc({ xt }, 'II', q.correct)).toBe('DSSD')
    const viTriY3 = q.ideas.indexOf('y3')
    expect(q.hinhAnh).toEqual([{ src: 'h', viTri: `sau_y_${'abcd'[viTriY3]}` }])
    const lg = q.solution as { tung_y: Record<string, { dung: boolean }> }
    for (let p = 0; p < 4; p++) expect(lg.tung_y['abcd'[p]!]!.dung).toBe(q.correct[p] === 'D')
    expect(grade(q, q.correct)).toBe(true)
    expect(grade(q, 'DSSD')).toBe(false)
  })
  it('lời giải nhắc thẳng chữ cái ⇒ không xáo (rơi xuống nguyên văn); Phần III không xáo; chuỗi JSON giữ kiểu chuỗi', () => {
    expect(loiGiaiXaoDuoc('Chọn B vì n = 0,1 mol.', 'I')).toBe(false)
    expect(loiGiaiXaoDuoc('Đáp án: C', 'I')).toBe(false)
    expect(loiGiaiXaoDuoc('A. sai vì…\nB. đúng', 'I')).toBe(false)
    expect(loiGiaiXaoDuoc({ chot: 'Bảo toàn khối lượng', tung_pa: { A: { vi_sao: 'Chọn A' } } }, 'I')).toBe(true) // khoá theo phương án được đổi tên nên không tính
    expect(loiGiaiXaoDuoc('n(Ag) = 2 n(glucose)', 'I')).toBe(true)
    expect(loiGiaiXaoDuoc({ chot: 'ý a đúng vì…' }, 'II')).toBe(false)
    expect(loiGiaiXaoDuoc({ chot: 'a) Đúng. b) Sai.' }, 'II')).toBe(false)
    expect(xaoDuoc(cauI({ solution: 'Chọn B' }))).toBe(false)
    expect(xaoCau(cauI({ phan: 'III', choices: [], correct: '4' }), 'x')).toBeNull()
    expect(xaoDuoc(cauI({ choices: ['p', 'q', 'r'] }))).toBe(false)
    const chuoi = doiLoiGiai(JSON.stringify({ chot: 'x', tungPa: { A: 1, B: 2 }, lyDo: [{ khoa: 'B', ly: 'đúng' }] }), 'I', (c) => (c === 'B' ? 'D' : c === 'A' ? 'C' : c))
    expect(typeof chuoi).toBe('string')
    expect(JSON.parse(chuoi as string)).toEqual({ chot: 'x', tungPa: { C: 1, D: 2 }, lyDo: [{ khoa: 'D', ly: 'đúng' }] })
    expect(doiLoiGiai('chữ thô', 'I', (c) => c)).toBe('chữ thô')
  })
})

describe('sổ — raw của lượt làm lại và mapper `tc`', () => {
  it('rawLamLai: tc / xt (đáp án quy về gốc) / nv; rawSo rỗng ⇒ không có khoá raw (dòng sổ y hệt hôm nay)', () => {
    expect(rawSo(rawLamLai(undefined, 'I'))).toEqual({})
    expect(rawSo(rawLamLai(undefined, 'I', 'B'))).toEqual({ raw: { chon: 'B' } })
    expect(rawSo(rawLamLai({ tc: 'Q1' }, 'I', 'C'), { ms: 1 })).toEqual({ raw: { chon: 'C', tc: 'Q1', ms: 1 } })
    expect(rawLamLai({ xt: [1, 0, 3, 2] }, 'I', 'A')).toEqual({ chon: 'B', xt: 1 })
    expect(rawLamLai({ xt: [1, 0, 3, 2] }, 'II', 'DSDS')).toEqual({ chon: 'SDSD', xt: 1 })
    expect(rawLamLai({ nv: 1 }, 'III', '4')).toEqual({ chon: '4', nv: 1 })
  })
  it('lanLamTuDongTc: dòng câu anh em ⇒ lần làm SONG SINH của câu gốc; dòng thường / song sinh ⇒ như cũ; cả hai khi cả hai qid được hỏi', () => {
    const tap = new Set(['Q1', 'A1'])
    const dong = (x: Record<string, unknown>) => lanLamTuDongTc(x, lanLamTuDong, tap)
    expect(dong({ qid: 'A1', tc: 'Q1', ngay_vn: '2026-10-05', luc: 'x', ket_qua: 1 })).toEqual([
      { qid: 'A1', ngay: '2026-10-05', luc: 'x', dung: true, coGoiY: false },
      { qid: 'Q1', ngay: '2026-10-05', luc: 'x', dung: true, coGoiY: false, songSinh: true, cauAnhEm: 'A1' },
    ])
    expect(dong({ qid: 'A9', tc: 'Q1', ngay_vn: 'n', luc: 'x', ket_qua: 0 })).toEqual([{ qid: 'Q1', ngay: 'n', luc: 'x', dung: false, coGoiY: false, songSinh: true, cauAnhEm: 'A9' }])
    expect(dong({ qid: 'Q1~ss2', ngay_vn: 'n', luc: 'x', ket_qua: 1 })).toEqual([{ qid: 'Q1', ngay: 'n', luc: 'x', dung: true, coGoiY: false, songSinh: true }])
    expect(dong({ qid: 'Q1', tc: null, ngay_vn: 'n', luc: 'x', ket_qua: 1 })).toEqual([{ qid: 'Q1', ngay: 'n', luc: 'x', dung: true, coGoiY: false }])
    expect(dong({ qid: 'Z', tc: 'Z', ngay_vn: 'n', luc: 'x', ket_qua: 1 })).toEqual([])
  })
  it('hạng theo dạng KHÔNG đếm đôi một lượt câu anh em (câu anh em cũng thuộc chiến dịch); câu anh em ngoài chiến dịch ⇒ lượt quy về vẫn đếm', () => {
    const meta = new Map(['Q1', 'A1', 'X1'].map((q) => [q, { dang: 'D' }])) as unknown as Map<string, MetaCau>
    const lan = [
      { qid: 'X1', ngay: '2026-10-05', luc: '2026-10-05T01:00:00.000Z', dung: true, coGoiY: false },
      { qid: 'A1', ngay: '2026-10-05', luc: '2026-10-05T02:00:00.000Z', dung: false, coGoiY: false },
      { qid: 'Q1', ngay: '2026-10-05', luc: '2026-10-05T02:00:00.000Z', dung: false, coGoiY: false, songSinh: true as const, cauAnhEm: 'A1' },
    ]
    expect(hangTuTiLe(1 / 2)).not.toBe(hangTuTiLe(1 / 3)) // đếm đôi thì hạng đổi — phép thử có nghĩa
    expect(hangTuHoSo([], lan, meta, ['Q1', 'A1', 'X1']).hangTheoDang.D).toBe(hangTuTiLe(1 / 2))
    expect(hangTuHoSo([], lan.filter((x) => x.qid !== 'A1'), meta, ['Q1', 'X1']).hangTheoDang.D).toBe(hangTuTiLe(1 / 2))
  })
})

describe('cửa sổ lỗi + luật khối của câu anh em (thuần)', () => {
  it('laCuaSoLoi: lỗi mở / chờ kiểm / kiểm duy trì ⇒ bản khác; đã qua hết mốc duy trì / không lỗi ⇒ không', () => {
    expect(['mo', 'cho_kiem', 'dong'].map((t) => laCuaSoLoi(t as 'mo'))).toEqual([true, true, true])
    expect(['duy_tri', 'khong_loi', undefined, null].map((t) => laCuaSoLoi(t as 'mo'))).toEqual([false, false, false, false])
  })
  it('dungKhoi: mọi nguồn khối đọc ra (mã tờ, qid, lớp của tờ) phải BẰNG khối cần, ít nhất một nguồn; khoiCanCo: khối em, không rõ ⇒ khối câu gốc', () => {
    expect(dungKhoi({ maDe: 'DH-11-B1', qid: 'Q' }, null, 11)).toBe(true)
    expect(dungKhoi({ maDe: 'DH-11-B1', qid: 'Q' }, '11', 11)).toBe(true)
    expect(dungKhoi({ maDe: 'DH-10-B1', qid: 'Q' }, null, 11)).toBe(false) // khối thấp hơn (luật cũ cho qua) ⇒ chặn
    expect(dungKhoi({ maDe: 'DH-12-B1', qid: 'Q' }, null, 11)).toBe(false)
    expect(dungKhoi({ maDe: 'DH-B9', qid: 'Q' }, null, 11)).toBe(false) // không rõ khối ⇒ chặn
    expect(dungKhoi({ maDe: 'DH-B9', qid: 'Q' }, '11A1', 11)).toBe(true) // tờ đặt tên lạ nhưng cột lớp ghi rõ
    expect(dungKhoi({ maDe: 'DH-11-B1', qid: 'Q' }, '10', 11)).toBe(false) // mâu thuẫn ⇒ chặn
    expect(dungKhoi({ maDe: 'DH-11-B1', qid: 'DH-12-C1-I-3' }, null, 11)).toBe(false)
    expect(khoiCanCo(11, { maDe: 'DH-10-B1' })).toBe(11)
    expect(khoiCanCo(null, { maDe: 'DH-10-B1' })).toBe(10)
    expect(khoiCanCo(null, { maDe: 'DH-B9', qid: 'X' })).toBeNull()
  })
})
