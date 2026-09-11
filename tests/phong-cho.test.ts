// PHÒNG CHỜ — thầy chốt 07/09.
//
// "Khi học sinh bấm bắt đầu vào ca thi thì chưa hiện đề, nó ghi một cái màn
// hình trắng là đang chờ thầy bấm bắt đầu. Trong ca thi đó có nút bắt đầu thi,
// khi tôi bấm nút đó thì tất cả học sinh mới hiện đề của mình." — và "trong ca
// thi đó có cả nút bắt đầu và nút huỷ ca thi, nếu tôi bấm huỷ thì ca thi tự
// động xoá".
//
// Bốn thứ phải khoá:
//   1. Đang chờ thì máy chủ KHÔNG tạo lượt và KHÔNG gửi đề — nếu gửi thì đề đã
//      nằm trên máy em trước giờ thi, và đồng hồ đã chạy cho em vào sớm.
//   2. Em ĐÃ có lượt (vào rồi, thoát ra vào lại) thì không bị đẩy về phòng chờ.
//   3. Bấm bắt đầu lần hai giữ mốc lần đầu.
//   4. Ca cũ không có cột phòng chờ thì chạy y như trước.
import { describe, expect, it, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { batDauThi, trangThaiPhongCho, vaoThi } from '../src/lib/exam-api'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const MAN_EM = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')
const MAN_THAY = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
const MAN_MO = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamSetupScreen.tsx'), 'utf8')

afterEach(() => {
  vi.unstubAllGlobals()
})

function gia(tra: unknown) {
  const goi = vi.fn(async () => ({ ok: true, json: async () => tra }))
  vi.stubGlobal('fetch', goi)
  return goi
}

describe('máy chủ — cột và cổng', () => {
  it('cột mới nằm CUỐI CA_HEADERS, không chen vào giữa', () => {
    // Chen vào giữa là mọi ca cũ lệch cột: điểm thành tên, tên thành phạm vi.
    // 08/09 thêm `BoTheoEmJson` rồi `DeRieng` — vẫn nối vào CUỐI, sau
    // `BatDauThiLuc`, nên chỉ số các cột cũ không đổi.
    expect(GS).toMatch(/'GiuDeDoc', 'AnHanGiay', 'PhongCho', 'BatDauThiLuc', 'BoTheoEmJson', 'DeRieng'\]/)
    expect(GS).toContain("phongCho: String(v[25] || '') === 'co'")
    expect(GS).toContain("batDauThiLuc: v[26] ? String(v[26]) : ''")
    expect(GS).toContain("boTheoEmRef: v[27] ? String(v[27]) : ''")
  })

  it('ĐANG CHỜ thì không tạo lượt và không gửi đề', () => {
    const than = GS.slice(GS.indexOf("if (ca.phongCho && !ca.batDauThiLuc"), GS.indexOf('let lanThu = 1'))
    expect(than).toContain("cach: 'cho'")
    // Trả về TRƯỚC mọi dòng tạo lượt.
    expect(than).not.toContain('appendRow')
    expect(than).not.toContain('bank')
    expect(than).not.toContain('hetGioLuc')
  })

  it('em ĐÃ có lượt thì không bị đẩy về phòng chờ', () => {
    // Em vào rồi, thoát ra vào lại giữa giờ: bài đang chạy dở, đẩy về màn chờ
    // là mất bài.
    expect(GS).toContain('if (ca.phongCho && !ca.batDauThiLuc && !luot) {')
  })

  it('mở lại cùng mã ca thì BatDauThiLuc về rỗng', () => {
    // Ca mới là chờ mới. Kế thừa lần bấm trước là em vào phát nhận đề ngay.
    // Ô thứ 5 của dải (cột 27 = BatDauThiLuc) vẫn được ghi rỗng; dải nay dài
    // 7 ô vì cột 29 `DeRieng` cũng thuộc lần mở ca.
    expect(GS).toContain("sh.getRange(dong, 23, 1, 7).setValues([[lenBang, giuDeDoc, anHanGiay, phongCho, '', '', deRieng]])")
  })

  it('bấm bắt đầu lần hai giữ mốc lần đầu', () => {
    const than = GS.slice(GS.indexOf("if (action === 'batDauThi')"), GS.indexOf("if (action === 'tenTheoSbd')"))
    // Vẫn trả về NGAY khi đã bấm trước, giữ nguyên mốc giờ lần đầu; chỉ kèm
    // thêm hai cờ chẩn đoán để màn Ca thi biết ca đề riêng nào phát đề trước
    // khi có bản đồ.
    expect(than).toContain('if (caBD.batDauThiLuc) {')
    expect(than).toContain('return jsonResponse_({ ok: true, batDauLuc: caBD.batDauThiLuc, daBatTruoc: true, coBoTheoEm:')
    expect(than).toContain('kiemTraMaBiMat_(body)')
    expect(than).toContain('shBD.getRange(rowBD, 27).setValue(lucBD)')
  })

  it('lệnh hỏi trạng thái KHÔNG đòi mã bí mật và không trả gì ngoài ba cờ', () => {
    const than = GS.slice(GS.indexOf("if (action === 'trangThaiPhongCho')"), GS.indexOf("if (action === 'batDauThi')"))
    expect(than).not.toContain('kiemTraMaBiMat_')
    expect(than).not.toContain('bank')
    expect(than).not.toContain('keyBank')
    // Ca bị huỷ giữa lúc chờ phải nói thẳng.
    expect(than).toContain("lyDo: 'da_xoa'")
  })
})

describe('máy khách — lệnh', () => {
  it('trangThaiPhongCho gửi đúng lệnh, không kèm mã bí mật', async () => {
    const goi = gia({ ok: true, phongCho: true, batDau: false, batDauLuc: '', trangThai: 'mo' })
    const tt = await trangThaiPhongCho('https://x', '371304')
    expect(JSON.parse((goi.mock.calls[0][1] as { body: string }).body)).toEqual({ action: 'trangThaiPhongCho', maCa: '371304' })
    expect(tt).toEqual({ phongCho: true, batDau: false, batDauLuc: '', trangThai: 'mo' })
  })

  it('ca bị huỷ giữa lúc chờ thì ném lỗi để màn chờ nói ra', async () => {
    gia({ ok: false, lyDo: 'da_xoa', error: 'Thầy đã huỷ ca kiểm tra này.' })
    await expect(trangThaiPhongCho('https://x', '371304')).rejects.toThrow(/đã huỷ/)
  })

  it('batDauThi đòi mã bí mật và cho biết đã bấm trước hay chưa', async () => {
    const goi = gia({ ok: true, batDauLuc: '2026-09-07T16:00:00.000Z', daBatTruoc: true })
    const kq = await batDauThi('https://x', 'MAT', '371304')
    expect(JSON.parse((goi.mock.calls[0][1] as { body: string }).body)).toEqual({ action: 'batDauThi', secret: 'MAT', maCa: '371304' })
    expect(kq.daBatTruoc).toBe(true)
  })

  it('vaoThi đọc được nhánh chờ', async () => {
    gia({ ok: true, cach: 'cho', lop: '12', thoiGianPhut: 45, congBo: 'khong', tenCa: 'L1' })
    const kq = await vaoThi('https://x', '371304', '12034', 'may-A', true)
    expect(kq.ok).toBe(true)
    if (kq.ok) expect(kq.cach).toBe('cho')
  })
})

describe('màn của em', () => {
  it('có pha chờ riêng, không mượn pha loading', () => {
    expect(MAN_EM).toContain("useState<'join' | 'loading' | 'cho' | 'exam' | 'submitted' | 'error'>('join')")
    expect(MAN_EM).toContain("if (phase === 'cho') {")
  })

  it('màn chờ nói đúng việc đang chờ ai và KHÔNG có nút nào để bấm', () => {
    const than = MAN_EM.slice(MAN_EM.indexOf("if (phase === 'cho') {"), MAN_EM.indexOf("if (phase === 'loading') {"))
    expect(than).toContain('Đang chờ Thầy bấm bắt đầu')
    expect(than).not.toContain('<NutChinh')
    expect(than).not.toContain('<button')
  })

  it('hỏi lại máy chủ mỗi ~3 giây (đã lệch pha), và dọn vòng lặp khi rời màn', () => {
    const dau = MAN_EM.indexOf("if (phase !== 'cho') return")
    expect(dau).toBeGreaterThan(0)
    const than = MAN_EM.slice(dau, MAN_EM.indexOf('}, [phase, scriptUrl, maCa])', dau))
    // Vòng hỏi phải đứng SAU `handleJoin` — đọc biến trước khi khai báo là lỗi
    // oxlint đã bật thành cổng riêng (`khong-dung-bien-truoc-khi-khai`).
    expect(dau).toBeGreaterThan(MAN_EM.indexOf('const handleJoin = async'))
    // ĐỔI 09/09, rà soát trước ca thi đông. Nhịp GỐC vẫn đúng 3 giây — chỉ
    // thêm lệch pha theo mili giây, tối đa +40% (`LECH_PHA`), nên ý định của
    // phép kiểm này giữ nguyên. Lý do: đo được `trangThaiPhongCho` mất 2,2–3,6
    // giây một lượt, tức LÂU HƠN nhịp; ba mươi máy cùng nhịp là ba mươi lượt
    // dồn vào một khoảnh khắc. Kèm chốt chống chồng lượt ở `dangHoi`.
    // Mốc neo đổi 11/09 — xem ghi chú trong `phong-cho-ca-dong-0909.test.ts`.
    expect(than).toContain('chuKyLechPhaMs(3000)')
    expect(than).toContain('let dangHoi = false')
    expect(than).toContain('clearInterval(dong)')
    // Thầy bấm bắt đầu thì đi lại ĐÚNG đường vaoThi — không có đường tắt nào
    // lấy đề mà bỏ qua việc tạo lượt và tính giờ.
    //
    // MỐC NEO ĐỔI 11/09: nhịp hỏi nay gọi `vaoSauBatDau`, và chính hàm ấy gọi
    // `handleJoin`. Ý ĐỊNH KHÔNG ĐỔI, nên kiểm CẢ HAI CHẶNG — mạnh hơn mốc cũ,
    // vì mốc cũ không chặn được ai chèn một đường tắt vào giữa.
    expect(than).toContain('void vaoSauBatDau()')
    const thanVao = MAN_EM.slice(MAN_EM.indexOf('const vaoSauBatDau = async ()'), MAN_EM.indexOf("if (phase !== 'cho') return"))
    expect(thanVao).toContain('await handleJoin()')
  })
})

describe('màn của thầy', () => {
  it('khối phòng chờ chỉ hiện khi ca đang chờ, và có ĐÚNG hai nút', () => {
    const than = MAN_THAY.slice(MAN_THAY.indexOf('{chiTiet.ca.phongCho && !chiTiet.ca.batDauThiLuc && ('), MAN_THAY.indexOf('{chiTiet.ca.phongCho && chiTiet.ca.batDauThiLuc && ('))
    expect(than).toContain('Bắt đầu thi')
    expect(than).toContain('Huỷ ca thi')
  })

  it('huỷ ca là XOÁ MỀM — bấm nhầm còn khôi phục được, và có bước hỏi lại', () => {
    const than = MAN_THAY.slice(MAN_THAY.indexOf('const huyCaCho'), MAN_THAY.indexOf('const daCham ='))
    expect(than).toContain('xoaCa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, chiTiet.ca.maCa)')
    expect(MAN_THAY).toContain('{hoiHuy && (')
    expect(MAN_THAY).toContain('khôi phục lại được')
  })

  it('đã bắt đầu rồi thì hiện giờ bắt đầu thay cho hai nút', () => {
    expect(MAN_THAY).toContain('Phòng chờ đã mở lúc')
  })
})

describe('màn Mở ca', () => {
  it('có công tắc Phòng chờ, mặc định TẮT', () => {
    expect(MAN_MO).toContain('const [phongCho, setPhongCho] = useState(false)')
    expect(MAN_MO).toContain('aria-label="Phòng chờ"')
    expect(MAN_MO).toContain('phongCho,')
  })

  it('dòng mô tả nói rõ cả hai trạng thái', () => {
    expect(MAN_MO).toMatch(/đứng ở màn chờ, chưa nhận đề và đồng hồ chưa chạy/)
    expect(MAN_MO).toMatch(/Em vào ca là nhận đề ngay/)
  })
})
