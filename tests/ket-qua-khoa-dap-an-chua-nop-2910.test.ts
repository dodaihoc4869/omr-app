// @vitest-environment node
// LỖ HỔNG ĐÁP ÁN TRƯỚC KHI NỘP (quét an ninh 29/10): lệnh `ketQua` (goi-cu.ts `ketQuaCuaEm`) chỉ hỏi «CA đã được công bố chưa» (`laSanSangCongBo`),
// KHÔNG hỏi «EM NÀY đã nộp chưa». Ca `cong_bo = 'ngay'` ⇒ luật luôn đúng ⇒ ai biết mã ca đều lấy được toàn bộ đáp án + lời giải (`key/<maCa>.json`) trước khi nộp.
// Luật dự án: «Đáp án không xuống máy học sinh trước khi nộp». Cùng luật với `phieuCuaEm` (`daNop && daCongBo`).
//
// LUẬT SAU KHI VÁ (`duocXemDapAn`, cong-bo-diem.ts): `keyBank` chỉ trả khi ca ĐÃ CÔNG BỐ và
//   · LƯỢT MỚI NHẤT của em (SBD trong thân yêu cầu) đã nộp (`da_nop` / `khoa` / có `nop_luc`) — thi lại đang làm dở ⇒ KHÔNG trả; HOẶC
//   · ca đã ĐÓNG (`trang_thai = 'dong'`: hết cửa vào, không ai còn thi).
// `sanSang` (đã công bố chưa, dùng chung với 2 đường SQL) GIỮ NGUYÊN — chỉ chặn đáp án.
//
// GHI CHÚ GIỚI HẠN (báo Boss): luồng thi KHÔNG có token em — `vaoThi`/`nop`/`phieuCuaEm`/`ketQua` đều nhận `sbd` TỰ KHAI trong thân yêu cầu. Cổng này nâng ngưỡng
// từ «biết mã ca» lên «biết mã ca + SBD một bạn ĐÃ nộp»; muốn chặn tận gốc cần biên nhận ký (HMAC `maCa|sbd|lan_thu`) trả ở `submit` — xem báo cáo.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { duocXemDapAn } from '../server/src/cong-bo-diem'
import { ketQuaCuaEm } from '../server/src/goi-cu'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const NOP = '2026-10-29T03:00:00.000Z'
const themCa = (d: D1That, ma: string, congBo: string | null, trangThai = 'mo') =>
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,?,'thi',?,'x')").run(ma, `Ca ${ma}`, trangThai, congBo)
/** Một lượt của em. `nop` mặc định: `dang_lam` chưa có nop_luc, còn lại có. */
const themLuot = (d: D1That, ma: string, sbd: string, tt = 'da_nop', lan = 1, nop?: string | null) =>
  d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,'x')")
    .run(`${ma}|${sbd}|${lan}`, ma, sbd, lan, NOP, nop === undefined ? (tt === 'dang_lam' || tt === 'duoc_duyet_lai' ? null : NOP) : nop, tt)
/** Tờ đáp án của ca mang dấu `LG-BI-MAT-<mã ca>` để soi rò rỉ. */
const banKey = (d: D1That, ma: string) =>
  d.objects.set(`key/${ma}.json`, { phanI: [{ id: `${ma}-I-1`, qid: `${ma}-I-1`, so: 1, phan: 'I', text: `Câu hỏi của ca ${ma}`, pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dapAn: 'B', dap_an: 'B', loiGiai: `LG-BI-MAT-${ma}` }] })
const RO = (r: unknown, ma: string) => JSON.stringify(r).includes(`LG-BI-MAT-${ma}`)

/** Ca `cong_bo` cho trước, tờ đáp án có sẵn trong R2. */
function dung(ma: string, congBo: string | null, trangThai = 'mo'): D1That {
  const d = taoD1That()
  themCa(d, ma, congBo, trangThai)
  banKey(d, ma)
  return d
}

describe('ca `ngay` · em CHƯA nộp ⇒ KHÔNG nhận đáp án (lỗ hổng gốc)', () => {
  it('không SBD (chỉ biết mã ca) ⇒ không keyBank', async () => {
    const d = dung('N1', 'ngay')
    themLuot(d, 'N1', 'S2') // một bạn đã nộp — vẫn không cho kẻ vô danh
    const r = await ketQuaCuaEm(d.env, { maCa: 'N1' })
    expect(r.ok).toBe(true)
    expect(r.keyBank).toBeNull()
    expect(RO(r, 'N1')).toBe(false)
  })
  it('SBD chưa từng vào thi ca này ⇒ không keyBank', async () => {
    const d = dung('N2', 'ngay')
    themLuot(d, 'N2', 'S2')
    const r = await ketQuaCuaEm(d.env, { maCa: 'N2', sbd: 'S9' })
    expect(r.keyBank).toBeNull()
    expect(RO(r, 'N2')).toBe(false)
  })
  it('em đang làm dở (`dang_lam`) ⇒ không keyBank', async () => {
    const d = dung('N3', 'ngay')
    themLuot(d, 'N3', 'S1', 'dang_lam')
    const r = await ketQuaCuaEm(d.env, { maCa: 'N3', sbd: 'S1' })
    expect(r.keyBank).toBeNull()
    expect(RO(r, 'N3')).toBe(false)
  })
  it('qua đường thật `/goi` {action:"ketQua"} cũng không lộ', async () => {
    const d = dung('N4', 'ngay')
    themLuot(d, 'N4', 'S1', 'dang_lam')
    const kq = await goiWorker(worker, d.env, '/goi', { action: 'ketQua', maCa: 'N4', sbd: 'S1' })
    expect(kq.ok).toBe(true)
    expect(kq.keyBank).toBeNull()
    expect(RO(kq, 'N4')).toBe(false)
  })
})

describe('ca `ngay` · em ĐÃ nộp ⇒ nhận đáp án như cũ', () => {
  it('lượt `da_nop` ⇒ có keyBank + sanSang', async () => {
    const d = dung('D1', 'ngay')
    themLuot(d, 'D1', 'S1')
    const r = await ketQuaCuaEm(d.env, { maCa: 'D1', sbd: 'S1' })
    expect(r.sanSang).toBe(true)
    expect(RO(r, 'D1')).toBe(true)
  })
  it('lượt `khoa` (thầy khoá bài) cũng tính là đã nộp', async () => {
    const d = dung('D2', 'ngay')
    themLuot(d, 'D2', 'S1', 'khoa', 1, NOP)
    expect(RO(await ketQuaCuaEm(d.env, { maCa: 'D2', sbd: 'S1' }), 'D2')).toBe(true)
  })
  it('SBD thừa dấu cách đầu / cuối vẫn khớp (cùng `trim` như mọi lệnh)', async () => {
    const d = dung('D3', 'ngay')
    themLuot(d, 'D3', 'S1')
    expect(RO(await ketQuaCuaEm(d.env, { maCa: 'D3', sbd: '  S1 ' }), 'D3')).toBe(true)
  })
  it('qua `/goi` đúng dáng KetQuaCongBo', async () => {
    const d = dung('D4', 'ngay')
    themLuot(d, 'D4', 'S1')
    const kq = await goiWorker(worker, d.env, '/goi', { action: 'ketQua', maCa: 'D4', sbd: 'S1' })
    expect(kq).toMatchObject({ ok: true, congBo: 'ngay', sanSang: true, daNop: 1, daVao: 1 })
    expect(kq.keyBank.phanI[0].loiGiai).toBe('LG-BI-MAT-D4')
  })
})

describe('THI LẠI: chỉ LƯỢT MỚI NHẤT mới tính', () => {
  it('lượt 1 đã nộp, lượt 2 đang làm ⇒ KHÔNG keyBank (bài thi lại chưa nộp)', async () => {
    const d = dung('L1', 'ngay')
    themLuot(d, 'L1', 'S1', 'da_nop', 1)
    themLuot(d, 'L1', 'S1', 'dang_lam', 2)
    const r = await ketQuaCuaEm(d.env, { maCa: 'L1', sbd: 'S1' })
    expect(r.keyBank).toBeNull()
    expect(RO(r, 'L1')).toBe(false)
  })
  it('thầy vừa duyệt thi lại (lượt 2 `duoc_duyet_lai`) ⇒ KHÔNG keyBank', async () => {
    const d = dung('L2', 'ngay')
    themLuot(d, 'L2', 'S1', 'da_nop', 1)
    themLuot(d, 'L2', 'S1', 'duoc_duyet_lai', 2)
    expect(RO(await ketQuaCuaEm(d.env, { maCa: 'L2', sbd: 'S1' }), 'L2')).toBe(false)
  })
  it('lượt 2 đã nộp ⇒ có keyBank', async () => {
    const d = dung('L3', 'ngay')
    themLuot(d, 'L3', 'S1', 'da_nop', 1)
    themLuot(d, 'L3', 'S1', 'da_nop', 2)
    expect(RO(await ketQuaCuaEm(d.env, { maCa: 'L3', sbd: 'S1' }), 'L3')).toBe(true)
  })
})

describe('các chế độ công bố khác GIỮ NGUYÊN', () => {
  it('`khong` ⇒ không keyBank dù em đã nộp', async () => {
    const d = dung('K1', 'khong')
    themLuot(d, 'K1', 'S1')
    const r = await ketQuaCuaEm(d.env, { maCa: 'K1', sbd: 'S1' })
    expect(r.sanSang).toBe(false)
    expect(r.keyBank).toBeNull()
  })
  it('`khong` mà ca đã đóng ⇒ vẫn không (thầy chưa cho xem)', async () => {
    const d = dung('K2', 'khong', 'dong')
    themLuot(d, 'K2', 'S1')
    expect(RO(await ketQuaCuaEm(d.env, { maCa: 'K2', sbd: 'S1' }), 'K2')).toBe(false)
  })
  it('`ca_lop_xong` · cả lớp đã nộp · em đã nộp ⇒ có keyBank', async () => {
    const d = dung('C1', 'ca_lop_xong')
    themLuot(d, 'C1', 'S1')
    themLuot(d, 'C1', 'S2')
    const r = await ketQuaCuaEm(d.env, { maCa: 'C1', sbd: 'S1' })
    expect(r.sanSang).toBe(true)
    expect(RO(r, 'C1')).toBe(true)
  })
  it('`ca_lop_xong` · còn người làm dở ⇒ chưa sẵn sàng, không keyBank (kể cả em đã nộp)', async () => {
    const d = dung('C2', 'ca_lop_xong')
    themLuot(d, 'C2', 'S1')
    themLuot(d, 'C2', 'S2', 'dang_lam')
    const r = await ketQuaCuaEm(d.env, { maCa: 'C2', sbd: 'S1' })
    expect(r.sanSang).toBe(false)
    expect(r.keyBank).toBeNull()
  })
  it('`ca_lop_xong` · cả lớp đã nộp NHƯNG ca còn MỞ · SBD chưa vào thi (đang chực vào) ⇒ KHÔNG keyBank', async () => {
    const d = dung('C3', 'ca_lop_xong')
    themLuot(d, 'C3', 'S1')
    themLuot(d, 'C3', 'S2')
    const r = await ketQuaCuaEm(d.env, { maCa: 'C3', sbd: 'S9' })
    expect(r.sanSang).toBe(true) // luật công bố của CA không đổi…
    expect(r.keyBank).toBeNull() // …nhưng đáp án không xuống máy em chưa nộp
  })
  it('ca ĐÃ ĐÓNG (`ca_lop_xong`, còn người chưa nộp) ⇒ có keyBank như luật gốc', async () => {
    const d = dung('X1', 'ca_lop_xong', 'dong')
    themLuot(d, 'X1', 'S1')
    themLuot(d, 'X1', 'S2', 'dang_lam')
    expect(RO(await ketQuaCuaEm(d.env, { maCa: 'X1', sbd: 'S1' }), 'X1')).toBe(true)
  })
  it('ca `ngay` ĐÃ ĐÓNG ⇒ có keyBank (em vắng cũng xem được đáp án sau khi hết cửa vào)', async () => {
    const d = dung('X2', 'ngay', 'dong')
    expect(RO(await ketQuaCuaEm(d.env, { maCa: 'X2', sbd: 'S9' }), 'X2')).toBe(true)
  })
})

describe('LUẬT TỐC ĐỘ (thầy 13/10): vá không làm `ketQua` chậm hơn — cả lớp hỏi lệnh này mỗi 4–15 giây', () => {
  it('hai lượt đọc D1 (ca + đếm kèm lượt của em) bay CÙNG LÚC = 1 đợt chờ (trước: 2 đợt nối tiếp); không thêm câu truy vấn', async () => {
    const d = dung('P1', 'ngay')
    themLuot(d, 'P1', 'S1')
    const goc = d.env.DB
    let dangChay = 0
    let toiDa = 0
    let soCau = 0
    const boc = (st: ReturnType<typeof goc.prepare>): ReturnType<typeof goc.prepare> =>
      ({
        bind: (...a: unknown[]) => boc(st.bind(...a)),
        first: async (...a: unknown[]) => {
          soCau++
          dangChay++
          toiDa = Math.max(toiDa, dangChay)
          await new Promise((ok) => setTimeout(ok, 5)) // giữ lượt đọc «đang bay» đủ lâu để lượt thứ hai kịp xuất phát nếu mã chạy song song
          try { return await (st.first as (...x: unknown[]) => Promise<unknown>)(...a) } finally { dangChay-- }
        },
        all: (...a: unknown[]) => (st.all as (...x: unknown[]) => Promise<unknown>)(...a),
        run: (...a: unknown[]) => (st.run as (...x: unknown[]) => Promise<unknown>)(...a),
      }) as unknown as ReturnType<typeof goc.prepare>
    const env = { ...d.env, DB: { ...goc, prepare: (q: string) => boc(goc.prepare(q)) } } as typeof d.env
    const r = await ketQuaCuaEm(env, { maCa: 'P1', sbd: 'S1' })
    expect(RO(r, 'P1')).toBe(true) // vẫn trả đáp án cho em đã nộp
    expect(toiDa).toBeGreaterThanOrEqual(2) // song song
    expect(soCau).toBeLessThanOrEqual(3) // ca + đếm (+ EXP của em); KHÔNG có câu thứ tư cho «lượt của em»
  })
})

describe('bảng luật thuần `duocXemDapAn`', () => {
  const BANG: [boolean, string, boolean, boolean][] = [
    // sanSang, trangThaiCa, emDaNop, được xem đáp án?
    [false, 'mo', true, false], [false, 'dong', true, false], // ca chưa công bố ⇒ không bao giờ
    [true, 'mo', false, false], // công bố nhưng em chưa nộp
    [true, 'mo', true, true], // em đã nộp
    [true, 'dong', false, true], // ca đã đóng
    [true, 'dong', true, true],
  ]
  for (const [san, tt, nop, kq] of BANG) it(`sanSang=${san} ca=${tt} emDaNop=${nop} ⇒ ${kq}`, () => expect(duocXemDapAn(san, tt, nop)).toBe(kq))
})
