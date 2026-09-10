// ĐÁNH DẤU CÂU HỎI LẠI NGAY TRONG MÀN LÀM BÀI + NÚT XEM LẠI CÂU SAI BUỔI TRƯỚC
//
// Thầy chốt 08/09, hai câu liền nhau:
//   1. "vẫn chưa có nút xem lại câu đã làm sai buổi trước"
//   2. "Khi mở chế độ này bạn rút 30% câu sai trước đó thì ở đề lần này bạn
//      phải đánh dấu trong phần làm bài thi những câu đã làm sai của ca trước
//      đó nhé."
//   3. "lấy 30% là lấy 30% câu sai của ca thi trước đó, ví dụ ca trước có 10
//      câu sai thì lấy 3 câu, lẻ thì làm tròn lên"
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cauLapCuaEm, dongGoiDeRieng, moGoiDeRieng } from '../src/lib/de-rieng-goi'
import { CAU_HINH_DE_RIENG_MAC_DINH, soCauLapCan } from '../src/lib/cau-hinh-de-rieng'
import { chonCauLapChoEm, demLanSai, dungDeRieng, type CaTruocDaCham } from '../src/lib/de-rieng'
import { PHAN_DE, type CauUngVien, type PhanDe, type YeuCauRut } from '../src/lib/rut-de'

const goc = join(__dirname, '..')
const doc = (p: string) => readFileSync(join(goc, p), 'utf8')
const THE_CAU = doc('src/components/TheCau.tsx')
const MAN_THI = doc('src/screens/ExamTakeScreen.tsx')
const MAN_CA = doc('src/screens/ExamMonitorScreen.tsx')
const GS = doc('docs/apps-script-kiem-tra.gs')

// --- Kho giả lập nhỏ, đủ để rút 6 câu ---------------------------------------
function cau(phan: PhanDe, i: number): CauUngVien {
  return {
    phan,
    id: `${phan}-${i}`,
    maDe: 'de1',
    soGoc: i,
    chuyenDe: 'Ester – lipid',
    mucDo: 'hieu',
    dang: 'chua_ro',
    text: `Câu ${phan}-${i}`,
    coHinh: false,
    canXem: false,
    sao: 0,
    lyDoSao: '',
  }
}
const UV: Record<PhanDe, CauUngVien[]> = {
  I: Array.from({ length: 40 }, (_, k) => cau('I', k)),
  II: Array.from({ length: 20 }, (_, k) => cau('II', k)),
  III: Array.from({ length: 20 }, (_, k) => cau('III', k)),
}
const YC: YeuCauRut = { soCau: { I: 8, II: 2, III: 2 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 99 }

describe('30% là 30% SỐ CÂU SAI CỦA CA TRƯỚC', () => {
  it('đúng ví dụ thầy đưa: ca trước sai 10 câu ⇒ lần này gặp lại 3 câu', () => {
    const sai10 = Array.from({ length: 10 }, (_, k) => `I-${k}`)
    const ca: CaTruocDaCham = {
      maCa: 'ca-truoc',
      daLamCua: { '12121212': [...sai10, 'I-30', 'I-31'] },
      saiCua: { '12121212': sai10 },
    }
    const ra = dungDeRieng({ uv: UV, yc: YC, dsSbd: ['12121212'], dsCa: [ca] })
    expect(ra.saiCaTruocCua['12121212']).toBe(10)
    expect(ra.canCua['12121212']).toBe(3)
    expect(ra.soLapCua['12121212']).toBe(3)
    expect(ra.lapTheoEm['12121212']).toHaveLength(3)
    // Ba câu đó đều là câu em ĐÃ SAI, không phải câu bốc thêm.
    for (const q of ra.lapTheoEm['12121212']) expect(sai10).toContain(q)
    // Và đề vẫn đúng 12 câu, không phồng lên vì có câu lặp.
    expect(ra.boTheoEm['12121212']).toHaveLength(12)
  })

  it('LẺ THÌ LÀM TRÒN LÊN, không làm tròn thường', () => {
    // 0,3 × 4 = 1,2 → 2. Làm tròn thường ra 1, tức là hụt một câu.
    expect(soCauLapCan(4)).toBe(2)
    // 0,3 × 8 = 2,4 → 3.
    expect(soCauLapCan(8)).toBe(3)
    // 0,3 × 10 = 3 chẵn → 3.
    expect(soCauLapCan(10)).toBe(3)
    // Sai 1 câu vẫn hỏi lại đúng câu đó.
    expect(soCauLapCan(1)).toBe(1)
    expect(soCauLapCan(0)).toBe(0)
  })

  it('KHÔNG lấy 30% độ dài đề nữa — em sai ít thì đề toàn câu mới, không đòi cho đủ tỉ lệ', () => {
    const ca: CaTruocDaCham = {
      maCa: 'ca-truoc',
      daLamCua: { '12121212': ['I-0', 'I-1', 'I-2'] },
      saiCua: { '12121212': ['I-0'] },
    }
    const ra = dungDeRieng({ uv: UV, yc: YC, dsSbd: ['12121212'], dsCa: [ca] })
    // Đề 12 câu: luật cũ đòi 4 câu lặp mà em chỉ sai 1. Luật mới đòi đúng 1.
    expect(ra.canCua['12121212']).toBe(1)
    expect(ra.soLapCua['12121212']).toBe(1)
    expect(ra.thieuLap).toHaveLength(0)
  })
})

describe('gói hai bản đồ trong một ô', () => {
  it('đóng rồi mở lại ra đúng hai bản đồ', () => {
    const goi = dongGoiDeRieng({ '10001': ['q1', 'q2'] }, { '10001': ['q1'] })
    expect(moGoiDeRieng(goi)).toEqual({ bo: { '10001': ['q1', 'q2'] }, lap: { '10001': ['q1'] }, dem: {}, bb: null })
  })

  it('MÁY CHỦ CHƯA CẬP NHẬT VẪN CHẠY ĐÚNG — hai bản đồ gửi ở HAI trường riêng', () => {
    // Máy chủ bản cũ ghi thẳng `body.boTheoEm` xuống ô. Trộn `lap` vào đó là
    // máy chủ cũ ghi xuống thứ nó không hiểu ⇒ em nhận đề cắt theo luật hash,
    // lệch hẳn bảng chấm của thầy mà không có dấu hiệu gì.
    const api = doc('src/lib/exam-api.ts')
    expect(api).toContain("postJson(scriptUrl, { action: 'batDauThi', secret, maCa, boTheoEm, lapTheoEm, demSaiTheoEm, bienBan })")
    // Việc gói lại là việc của MÁY CHỦ, làm sau khi đã nhận đủ hai trường.
    expect(GS).toContain("lap: body.lapTheoEm && typeof body.lapTheoEm === 'object' ? body.lapTheoEm : {},")
  })

  it('DẠNG CŨ VẪN ĐỌC ĐƯỢC — ca mở trước hôm nay không phải chạy lại', () => {
    // Ô cũ cất thẳng `{sbd: [...]}`. Đọc nhầm nó thành rỗng là mọi ca cũ chấm
    // lại ra bộ câu của người khác.
    expect(moGoiDeRieng({ '10001': ['q1', 'q2'] })).toEqual({ bo: { '10001': ['q1', 'q2'] }, lap: {}, dem: {}, bb: null })
  })

  it('rác thì ra rỗng, không nổ', () => {
    expect(moGoiDeRieng(null)).toEqual({ bo: {}, lap: {}, dem: {}, bb: null })
    expect(moGoiDeRieng('chuỗi')).toEqual({ bo: {}, lap: {}, dem: {}, bb: null })
    expect(moGoiDeRieng([1, 2])).toEqual({ bo: {}, lap: {}, dem: {}, bb: null })
    expect(cauLapCuaEm(undefined)).toEqual([])
    expect(cauLapCuaEm(['  q1 ', '', 'q2'])).toEqual(['q1', 'q2'])
  })
})

describe('máy chủ chỉ trả câu lặp CỦA CHÍNH EM', () => {
  it('vaoThi trả `cauLap` lấy từ hàm đọc theo SBD, không trả cả bản đồ lớp', () => {
    expect(GS).toContain('const cauLapOut = cauLapCuaEm_(ca.boTheoEmRef, sbd)')
    expect(GS).toContain('function cauLapCuaEm_(ref, sbd)')
    // Bản đồ lớp CHỈ đi kèm lệnh đã đòi mã bí mật (`chiTietCa`), không đi kèm
    // lệnh công khai của máy em.
    expect(GS).toContain('goiDeRieng: goiDeRieng')
    const khoiVaoThi = GS.slice(GS.indexOf("if (action === 'vaoThi')"), GS.indexOf("if (action === 'duyetThiLai'"))
    expect(khoiVaoThi).not.toContain('goiDeRieng')
  })

  it('đọc được cả ô dạng cũ lẫn ô dạng mới', () => {
    expect(GS).toContain('function doiGoiDeRieng_(v)')
    expect(GS).toContain('return { bo: v, lap: {} }')
  })
})

describe('thẻ câu đánh dấu câu em đã sai buổi trước', () => {
  it('có dải nhắc, đặt TRƯỚC đề bài chứ không phải sau', () => {
    expect(THE_CAU).toContain('Câu em đã sai buổi trước')
    const dau = THE_CAU.indexOf('{props.cauHoiLai && <DaiHoiLai')
    const de = THE_CAU.indexOf('{thanCauImg ? (')
    expect(dau).toBeGreaterThan(0)
    expect(dau).toBeLessThan(de)
  })

  it('CẤM BỊA SỐ LẦN — chưa biết là lần mấy thì không in số', () => {
    expect(THE_CAU).toContain('const co = Number.isFinite(n) && n > 0')
    expect(THE_CAU).toContain("co ? `Câu em đã sai buổi trước (${n} lần) — đọc kỹ lại từ đầu` : 'Câu em đã sai buổi trước — đọc kỹ lại từ đầu'")
  })

  it('KHÔNG EMOJI trong dải nhắc', () => {
    const dai = THE_CAU.slice(THE_CAU.indexOf('function DaiHoiLai'), THE_CAU.indexOf('function LoiGiai'))
    expect(/\p{Extended_Pictographic}/u.test(dai)).toBe(false)
  })

  it('màn làm bài truyền dấu cho CẢ BA PHẦN, tra bằng Set', () => {
    expect(MAN_THI).toContain('const boHoiLai = new Set(attempt.cauLap ?? [])')
    expect(MAN_THI.match(/cauHoiLai=\{nhanHoiLai\(item\.qid\)\}/g) ?? []).toHaveLength(3)
  })

  it('dấu SỐNG QUA LẦN VÀO LẠI — cất cùng lượt, không mất khi em rớt mạng', () => {
    expect(MAN_THI).toContain('const cauLap = (kq.cauLap && kq.cauLap.length > 0 ? kq.cauLap : existing?.cauLap) ?? []')
    expect(doc('src/lib/exam-db.ts')).toContain('cauLap?: string[]')
  })

  it('CA THƯỜNG KHÔNG HIỆN GÌ — mảng rỗng thì không thẻ nào mọc dải', () => {
    // `nhanHoiLai` trả undefined khi qid không nằm trong bộ, và `cauHoiLai`
    // undefined thì `DaiHoiLai` không dựng.
    expect(MAN_THI).toContain('const nhanHoiLai = (qid: string) => (boHoiLai.has(qid) ? {} : undefined)')
    expect(THE_CAU).toContain('{props.cauHoiLai && <DaiHoiLai')
  })
})

describe('màn ca thi luôn trả lời được "câu em sai buổi trước"', () => {
  it('biên bản lúc rút được CẤT LẠI, không chỉ chạy qua một toast', () => {
    expect(MAN_CA).toContain('lucRut: new Date().toISOString()')
    expect(MAN_CA).toContain('caDaQuet: ra.caDaQuet')
    expect(MAN_CA).toContain('boQua: ra.boQua')
    expect(doc('src/lib/exam-db.ts')).toContain('export interface BienBanDeRieng')
  })

  it('bảng biên bản in ĐỦ mẫu số, chỉ tiêu, kết quả và lý do của từng em', () => {
    const bang = MAN_CA.slice(MAN_CA.indexOf('export function BangBienBanLap'), MAN_CA.indexOf('/** Nhãn trạng thái cho 1 em'))
    // MÃ CA CHỈ IN KHI CÓ THẬT. Biên bản cất trước 08/09 không có `tuCaCua`;
    // in dấu gạch ở đó là nói dối rằng máy đã tra và không thấy (xem
    // va-bien-ban-cu.ts). Nay hỏi `maCaLay` rồi mới in.
    expect(bang).toContain('maCaLay(bb, sbd)')
    expect(bang).not.toContain("bb.tuCaCua?.[sbd] || '—'")
    expect(bang).toContain('· sai {sai} câu · cần {can} · rút được {duoc}')
    expect(bang).toContain('CHU_LY_DO_THIEU')
    expect(bang).toContain('Ca không đọc được')
  })

  it('máy chủ trả bản đồ để máy thứ hai vẫn đếm được', () => {
    expect(doc('src/lib/exam-api.ts')).toContain('lapTheoEm: goiDR.lap,')
    expect(MAN_CA).toContain('chiTiet.lapTheoEm?.[sbd]?.length')
  })
})

describe('phiếu khắc phục trong báo cáo nộp được', () => {
  it('khối bài luyện dựng phiếu KÈM thanh nộp', () => {
    const khoi = doc('src/components/KhoiBaiLuyen.tsx')
    // ĐỔI 08/09 TỐI: có `nop` thì vẫn dựng phiếu nộp được như cũ, nhưng bản của
    // EM mà KHÔNG nộp được thì dựng phiếu CHỈ ĐỀ, không tụt về bản đầy đủ có
    // đáp án (thầy báo: "rút câu luyện của học sinh bị lỗi lời giải").
    // CẬP NHẬT 09/09: thêm `loiNhac` — lý do chỉ đọc phải đi THEO phiếu, vì
    // phiếu hiện trong lớp phủ toàn màn hình, mọi chữ ngoài lớp phủ đều bị che.
    expect(khoi).toContain('chiDeChoEm ? { anGiai: true, loiNhac: nhacDayDu } : { nop }')
    expect(khoi).toContain('const chiDeChoEm = laCuaEm && !nop')
    // Mã lấy từ link đã cất, KHÔNG tự sinh — trang này không có mã bí mật.
    expect(khoi).toContain('docLinkPhieu(link.slice(link.indexOf')
    // Thiếu bất kỳ mảnh nào thì phiếu vẫn mở, chỉ không có nút nộp.
    expect(khoi).toContain('const nop = maPhieu && du.sbd && urlNop ? { ma: maPhieu, sbd: du.sbd, url: urlNop } : null')
  })

  it('máy chủ chấm ĐÚNG NHỮNG CÂU EM GỬI LÊN, không chấm cả gói 40 câu', () => {
    // Phụ huynh kéo thanh còn 10 câu thì báo "đúng 7/10", không phải "7/40".
    expect(GS).toContain('if (soGui === 0 || soGui > TOI_DA_CAU_NOPKP) return jsonResponse_(LOI_NOP)')
    expect(GS).toContain('if (!qid || !dsGui[qid]) continue')
    expect(GS).toContain('if (soCham === 0) return jsonResponse_(LOI_NOP)')
  })
})

describe('không rò dữ liệu học sinh', () => {
  it('bản đồ câu sai của cả lớp KHÔNG đi xuống máy em', () => {
    // `vaoThi` là lệnh công khai (máy em không bao giờ có mã bí mật). Nó chỉ
    // được trả mảng qid của chính em đang thi.
    const khoi = GS.slice(GS.indexOf("if (action === 'vaoThi')"), GS.indexOf("if (action === 'duyetThiLai'"))
    expect(khoi).toContain('cauLapCuaEm_(ca.boTheoEmRef, sbd)')
    expect(khoi).not.toContain('docJsonLon_(ca.boTheoEmRef)')
  })

  it('PHAN_DE vẫn đủ ba phần — bộ câu lặp không làm lệch cấu trúc đề', () => {
    expect(PHAN_DE).toEqual(['I', 'II', 'III'])
  })
})

describe('CHẾ ĐỘ ĐỀ RIÊNG SỐNG Ở MÁY CHỦ, không nằm lại máy mở ca', () => {
  // Lỗi thật ở ca 933467 (08/09): cờ chế độ chỉ nằm trong IndexedDB của máy mở
  // ca. Bấm Bắt đầu ở máy khác ⇒ không rút bộ câu, không gửi bản đồ; em nhận
  // đề cắt theo luật hash còn máy thầy chấm theo bản đồ. Điểm sai, màn hình im.
  it('máy chủ có cột DeRieng và publish ghi vào đó', () => {
    expect(GS).toContain("'BoTheoEmJson', 'DeRieng']")
    expect(GS).toContain("const deRieng = body.deRieng === true ? (body.phamViHoiLai === 'ba_ca' ? 'co3' : 'co') : ''")
    expect(GS).toContain("sh.getRange(dong, 23, 1, 7).setValues([[lenBang, giuDeDoc, anHanGiay, phongCho, '', '', deRieng]])")
    expect(GS).toContain("deRieng: String(v[28] || '').indexOf('co') === 0,")
  })

  it('SHEET CŨ TỰ NỚI CỘT — thêm cột mới không làm nổ ca đang chờ', () => {
    expect(GS).toContain('if (thieu > 0) sh.insertColumnsAfter(sh.getMaxColumns(), thieu)')
  })

  it('màn mở ca gửi cờ lên máy chủ, màn ca thi đọc cờ từ máy chủ', () => {
    expect(doc('src/screens/ExamSetupScreen.tsx')).toContain('deRieng: deRiengBat,')
    expect(doc('src/lib/exam-api.ts')).toContain('deRieng: moc.deRieng === true,')
    expect(MAN_CA).toContain("const drMayChu = (ct.ca as { deRieng?: boolean }).deRieng === true")
    expect(MAN_CA).toContain('setCaCanDeRieng(drMayChu || (await docCheDoDeRieng(ma.trim()).catch(() => false)))')
  })

  it('KHÔNG GHI ĐÈ BẢN ĐỒ khi ca đã phát đề, nhưng phải HÉT LÊN', () => {
    // Ghi bản đồ sau khi em đã cầm đề là bảng chấm khác tờ đề em làm.
    expect(GS).toContain('coBoTheoEm: !!caBD.boTheoEmRef, canBoTheoEm: !!(body.boTheoEm')
    expect(doc('src/lib/exam-api.ts')).toContain('thieuBoTheoEm: r.daBatTruoc === true && r.canBoTheoEm === true && r.coBoTheoEm === false,')
    expect(MAN_CA).toContain('Ca này đã phát đề TRƯỚC khi có bộ câu riêng — điểm chấm sẽ sai. Huỷ ca và mở lại.')
  })
})

describe('MÁY NÀO CŨNG ĐƯỢC — biên bản và số lần sai sống ở máy chủ', () => {
  // Thầy chốt 08/09: "bạn phải cho máy nào cũng được và đồng bộ cho tất cả các
  // máy bấm". Ảnh chụp màn Ca thi trên điện thoại hiện đúng dòng "Máy này không
  // giữ biên bản lúc rút đề" — tức bản đồ ở máy khác, màn này mù.
  it('gói đề riêng chở CẢ số lần sai lẫn biên bản', () => {
    const goi = dongGoiDeRieng({ '10001': ['q1', 'q2'] }, { '10001': ['q1'] }, { '10001': { q1: 2 } }, { canCua: { '10001': 1 } })
    const mo = moGoiDeRieng(goi)
    expect(mo.dem).toEqual({ '10001': { q1: 2 } })
    expect(mo.bb).toEqual({ canCua: { '10001': 1 } })
    // Dạng cũ vẫn mở được, hai trường mới rỗng chứ không nổ.
    expect(moGoiDeRieng({ '10001': ['q1'] })).toEqual({ bo: { '10001': ['q1'] }, lap: {}, dem: {}, bb: null })
  })

  it('số lần sai bỏ giá trị rác, không đẩy số bịa vào nhãn', () => {
    const mo = moGoiDeRieng({ bo: {}, lap: {}, dem: { '10001': { q1: 'ba', q2: 0, q3: -1, q4: 2 } } })
    expect(mo.dem).toEqual({ '10001': { q4: 2 } })
  })

  it('máy chủ cất hai trường mới cùng ô, máy thầy đọc lại từ đó', () => {
    expect(GS).toContain("dem: body.demSaiTheoEm && typeof body.demSaiTheoEm === 'object' ? body.demSaiTheoEm : {},")
    expect(GS).toContain("bb: body.bienBan && typeof body.bienBan === 'object' ? body.bienBan : null,")
    const api = doc('src/lib/exam-api.ts')
    expect(api).toContain('demSaiTheoEm: goiDR.dem,')
    expect(api).toContain('bienBanDeRieng: goiDR.bb,')
  })

  it('màn Ca thi lấy số lần sai và biên bản từ máy chủ khi máy này không có', () => {
    expect(MAN_CA).toContain('chiTiet.demSaiTheoEm?.[sbd] ??')
    expect(MAN_CA).toContain('deRiengCa?.bienBan ?? (chiTiet?.bienBanDeRieng as BienBanDeRieng | undefined) ?? null')
  })
})

describe('NÚT ĐỒNG BỘ LẠI PHIẾU MỌI CA — bấm được từ mọi máy', () => {
  const NUT = doc('src/components/NutDongBoMoiCa.tsx')

  it('là NÚT trong app, không phải lệnh gõ tay qua cầu nối', () => {
    expect(doc('src/screens/LichSuCaScreen.tsx')).toContain('<NutDongBoMoiCa />')
    expect(NUT).toContain('loadTeacherSecret')
  })

  it('tải kho TRƯỚC rồi mới dựng phiếu, và chạy TUẦN TỰ', () => {
    // Dựng phiếu bằng kho cũ là chép lại đúng cái sai cũ.
    expect(NUT.indexOf('dongBoNganHang(url, mat, true)')).toBeLessThan(NUT.indexOf('taoPhieuCaCa('))
    // Vòng for tuần tự, không Promise.all — song song là ăn hạn mức Apps Script.
    expect(NUT).toContain('for (let i = 0; i < ds.length; i++)')
    expect(NUT).not.toContain('Promise.all')
  })

  it('BỎ QUA ca đã xoá, và HỎI LẠI trước khi chạy', () => {
    expect(NUT).toContain("filter((c) => c.trangThai !== 'da_xoa')")
    expect(NUT).toContain('Chạy ngay')
    expect(NUT).toContain('đừng chạy khi đang có ca thi mở')
  })

  it('CA LỖI PHẢI LIỆT KÊ RA, không gộp thành một con số', () => {
    expect(NUT).toContain(".filter((c) => c.loi !== '')")
    expect(NUT).toContain('{c.loi}')
  })

  it('nói rõ mã phiếu cũ giữ nguyên — link đã gửi phụ huynh vẫn sống', () => {
    expect(NUT).toContain('Mã phiếu cũ giữ nguyên')
  })
})

describe('phiếu khắc phục KHÔNG nộp được thì phải NÓI VÌ SAO', () => {
  const KHOI = doc('src/components/KhoiBaiLuyen.tsx')

  // CẬP NHẬT 09/09: lý do nay tính vào một biến rồi dùng HAI nơi — đặt cờ cho
  // dòng trên trang app (giữ nguyên) VÀ nhét vào chính phiếu. Ý định không đổi:
  // vẫn đúng ba lý do, mỗi lý do chỉ đúng một việc cần làm.
  it('có ba lý do, mỗi lý do một câu chỉ đúng việc cần làm', () => {
    expect(KHOI).toContain("const lyDoKhongNop = nop ? '' : !maPhieu ? 'thieu_ma' : !du.sbd ? 'thieu_sbd' : 'thieu_link'")
    expect(KHOI).toContain('setKhongNop(lyDoKhongNop)')
    expect(KHOI).toContain('Đồng bộ lại phiếu mọi ca')
  })

  it('chỉ hiện khi phiếu ĐÃ dựng — không doạ người dùng trước khi họ bấm', () => {
    expect(KHOI).toContain("{khongNop !== '' && html !== '' && (")
  })
})

describe('CÂU EM TỪNG SAI PHẢI VÀO ĐỀ, dù thầy chọn chuyên đề nào', () => {
  // Thầy chốt 08/09, sau khi biên bản chỉ đúng thủ phạm ("cần 3 · rút được 1 —
  // câu em từng sai không nằm trong kho ca này"):
  // "bất kể là tôi chọn chuyên đề gì thi mà ca trước sai 9 câu phải rút đúng 3
  //  câu đó ra vào đề mới nhé."
  const NGUON = doc('src/lib/de-rieng-nguon.ts')

  it('tìm câu thiếu trong CẢ KHO rồi NỐI vào ca, xong mới rút', () => {
    expect(NGUON).toContain('const thieuQid = [...canQid].filter((q) => !coSan.has(q))')
    expect(NGUON).toContain('loadExamSources()')
    expect(NGUON).toContain('await noiKhoCa(url, mat, maCa, mergeAndStrip([them]), { phanI: them.phanI, phanII: them.phanII, phanIII: them.phanIII })')
    // Nối XONG mới dựng ứng viên, nếu không thì câu vừa nối không vào đề được.
    expect(NGUON.indexOf('await noiKhoCa(')).toBeLessThan(NGUON.indexOf('const uv = dungUngVien(bankDung)'))
  })

  it('MÁY CHỦ TRƯỚC, MÁY THẦY SAU — ghi máy thầy mà máy chủ hỏng là em nhận đề thiếu', () => {
    expect(NGUON.indexOf('await noiKhoCa(')).toBeLessThan(NGUON.indexOf('await saveSessionTeacherBank(maCa, bankDung)'))
  })

  it('CHỈ NỐI THÊM, không thay câu nào — đề mới vẫn đúng chuyên đề thầy chọn', () => {
    expect(GS).toContain("if (!id || daCo[id]) continue")
    expect(GS).toContain("cu.push(moi[k])")
    // Nối cả bản gửi máy em (cột 5) lẫn bản có đáp án (cột 7): thiếu một trong
    // hai là em thấy câu mà máy không chấm được, hoặc ngược lại.
    expect(GS).toContain("shNK.getRange(rowNK, 5).setValue(luuJsonLon_('ca_' + body.maCa + '_bank'")
    expect(GS).toContain("shNK.getRange(rowNK, 7).setValue(luuJsonLon_('ca_' + body.maCa + '_key'")
  })

  it('CHẶN nối kho sau khi ca đã phát đề — em đang cầm kho đó rồi', () => {
    expect(GS).toContain("if (caNK.batDauThiLuc) return jsonResponse_({ ok: false, error: 'Ca đã phát đề — không nối thêm câu được nữa' })")
  })

  it('BÁO CHO THẦY BIẾT đã kéo bao nhiêu câu, không làm lén', () => {
    expect(MAN_CA).toContain('Đã kéo ${ra.cauNoiThem.soCau} câu em từng sai từ kho vào đề ca này.')
  })
})

describe('HAI NÚT PHẠM VI + BẢN ĐỒ SAI DỰNG SẴN', () => {
  // Thầy chốt 08/09:
  //  · "khi bấm mở ca thi 30% thì hãy cho tôi 2 nút lựa chọn, nút lấy 30% câu
  //     sai của ca thi gần nhất, nút lấy 30% của 3 ca thi ngẫu nhiên trước đó"
  //  · "Ca thi nào cũng phải dựng sẵn bản đồ sai từng câu, để những ca thi sau
  //     tôi chọn rút 30% câu sai ca trước thì sẵn có bản đồ để tính sai lần mấy"
  const KHOI = doc('src/components/KhoiRutDe.tsx')

  it('màn Mở ca có ĐÚNG hai nút, mặc định là ca gần nhất', () => {
    expect(KHOI).toContain("(['gan_nhat', 'ba_ca'] as const).map")
    expect(KHOI).toContain('TEN_PHAM_VI_HOI_LAI[v]')
    expect(doc('src/lib/cau-hinh-de-rieng.ts')).toContain("PHAM_VI_HOI_LAI: 'gan_nhat',")
  })

  it('phạm vi đi LÊN MÁY CHỦ cùng cờ chế độ, không nằm lại máy mở ca', () => {
    expect(doc('src/screens/ExamSetupScreen.tsx')).toContain("phamViHoiLai: boRut?.phamViHoiLai ?? 'gan_nhat',")
    expect(GS).toContain("phamViHoiLai: String(v[28] || '') === 'co3' ? 'ba_ca' : 'gan_nhat',")
    expect(MAN_CA).toContain("PHAM_VI_HOI_LAI: pv")
  })

  it('chế độ 3 ca GỘP câu sai, câu sai nhiều ca đứng trước', () => {
    const ca = (ma: string, sai: string[]): CaTruocDaCham => ({ maCa: ma, daLamCua: { '10001': ['I-0', 'I-1', 'I-2', 'I-3', 'I-4'] }, saiCua: { '10001': sai } })
    const ds = [ca('c3', ['I-0', 'I-1']), ca('c2', ['I-1', 'I-2'])]
    const ch = { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'ba_ca' as const }
    const lap = chonCauLapChoEm('10001', ds, 20, demLanSai(ds), ch)
    // Gộp 4 lượt sai còn 3 câu khác nhau ⇒ cần ceil(0,3 × 3) = 1.
    expect(lap.soSaiCaTruoc).toBe(3)
    expect(lap.can).toBe(1)
    // I-1 sai ở cả hai ca nên phải đứng đầu, được chọn trước I-0.
    expect(lap.qids).toEqual(['I-1'])
    expect(lap.tuCa).toBe('c3 + c2')
  })

  it('gộp 3 ca vẫn TÔN TRỌNG TRẦN LẶP — sai 3 lần rồi thì dạy lại, không hỏi lại', () => {
    const ca = (ma: string, sai: string[]): CaTruocDaCham => ({ maCa: ma, daLamCua: { '10001': ['I-0', 'I-1', 'I-2', 'I-3', 'I-4'] }, saiCua: { '10001': sai } })
    const ds = [ca('c3', ['I-0', 'I-1']), ca('c2', ['I-1', 'I-2']), ca('c1', ['I-1', 'I-3'])]
    const ch = { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'ba_ca' as const }
    const lap = chonCauLapChoEm('10001', ds, 20, demLanSai(ds), ch)
    // I-1 sai đủ 3 lần = chạm trần ⇒ ra `canDayLai`, KHÔNG vào đề nữa.
    expect(lap.canDayLai).toContain('I-1')
    expect(lap.qids).not.toContain('I-1')
  })

  it('chế độ ca gần nhất KHÔNG gộp — chỉ đúng ca em vừa nộp', () => {
    const ca = (ma: string, sai: string[]): CaTruocDaCham => ({ maCa: ma, daLamCua: { '10001': ['I-0', 'I-1', 'I-2', 'I-3'] }, saiCua: { '10001': sai } })
    const ds = [ca('c3', ['I-0', 'I-1']), ca('c2', ['I-2', 'I-3'])]
    const lap = chonCauLapChoEm('10001', ds, 20, demLanSai(ds), CAU_HINH_DE_RIENG_MAC_DINH)
    expect(lap.soSaiCaTruoc).toBe(2)
    expect(lap.tuCa).toBe('c3')
  })

  it('máy chủ dựng sẵn bản đồ sai NGAY LÚC CHẤM, một dòng mỗi (ca, em)', () => {
    expect(GS).toContain("const SHEET_BANDO = 'BanDoSai'")
    expect(GS).toContain("const BANDO_HEADERS = ['MaCa', 'SBD', 'LanThu', 'QidSaiJson', 'QidLamJson', 'GhiLuc']")
    expect(GS).toContain('ghiBanDoSai_(banDoMoi)')
    // ĐÈ dòng cũ chứ không nối: em thi lại thì bản đồ phải là lượt mới nhất.
    expect(GS).toContain('if (row) sh.getRange(row, 1, 1, BANDO_HEADERS.length).setValues([dong])')
  })

  it('ghi bản đồ hỏng KHÔNG được làm hỏng việc ghi điểm', () => {
    const than = GS.slice(GS.indexOf('function ghiBanDoSai_'), GS.indexOf('function docBanDoSai_'))
    expect(than).toContain('try {')
    expect(than).toContain('} catch (err) {}')
  })

  it('dựng đề HỎI MÁY CHỦ TRƯỚC, chấm lại tại máy chỉ là đường lui', () => {
    const NGUON = doc('src/lib/de-rieng-nguon.ts')
    expect(NGUON).toContain('banDo = await banDoSaiCa(url, mat, ung.map((c) => c.maCa))')
    expect(NGUON).toContain('if (bd && Object.keys(bd.lam).length > 0)')
    // Đường lui vẫn còn: ca chấm trước khi có tính năng này không có bản đồ.
    expect(NGUON).toContain('dsCa.push(await docCaTruoc(url, mat, c.maCa, ch))')
  })
})

describe('KHỐI ĐỎ DỰNG LẠI ĐƯỢC TRÊN MỌI MÁY', () => {
  // Thầy chốt 08/09: "đồng bộ phần màu đỏ đấy vào tất cả các thiết bị".
  //
  // Bản đồ câu lặp + số lần sai được ghi lên máy chủ lúc bấm Bắt đầu, nhưng chỉ
  // từ bản 08/09 và chỉ khi CHÍNH máy bấm Bắt đầu chạy bản đó. Ca cũ hơn thì ô
  // rỗng, và mọi máy khác nhìn vào đều thấy trống.
  const NGUON = doc('src/lib/de-rieng-nguon.ts')

  it('dựng lại từ HAI thứ máy chủ luôn có: bộ câu của ca + bản đồ sai ca trước', () => {
    expect(NGUON).toContain('export async function dungLapTuMayChu(')
    expect(NGUON).toContain('const { dsCa } = await docCacCaTruoc(url, mat, [maCa], ch)')
    expect(NGUON).toContain('const lap = (boTheoEm[sbd] ?? []).filter((q) => (cua[q] ?? 0) > 0)')
  })

  it('KHÔNG cần kho đề hay IndexedDB của máy nào', () => {
    const than = NGUON.slice(NGUON.indexOf('export async function dungLapTuMayChu'))
    expect(than).not.toContain('loadSessionTeacherBank')
    expect(than).not.toContain('loadExamSources')
  })

  it('màn Ca thi CHỈ dựng lại khi THIẾU — có sẵn thì không tốn thêm lệnh', () => {
    expect(MAN_CA).toContain('if (daCoLap && daCoDem) return')
    expect(MAN_CA).toContain('dungLapTuMayChu(url, mat, chiTiet.ca.maCa, bo)')
  })

  it('bản dựng lại có ĐỦ số lần sai, nhãn "sai lần thứ N" vẫn đúng', () => {
    expect(MAN_CA).toContain('lapDungLai?.demSai?.[sbd] ??')
    // Và đứng SAU hai nguồn chính: bản máy này và bản máy chủ chở sẵn.
    expect(MAN_CA.indexOf('chiTiet.demSaiTheoEm?.[sbd] ??')).toBeLessThan(MAN_CA.indexOf('lapDungLai?.demSai?.[sbd] ??'))
  })

  it('nút vẫn mọc khi chỉ có bản dựng lại', () => {
    expect(MAN_CA).toContain('Object.keys(lapDungLai?.lapTheoEm ?? {}).length > 0')
  })

  it('dựng lại hỏng thì im lặng, không làm vỡ màn ca', () => {
    const than = MAN_CA.slice(MAN_CA.indexOf('dungLapTuMayChu(url, mat'), MAN_CA.indexOf('// Gom theo SBD'))
    expect(than).toContain('.catch(() => {})')
  })
})
