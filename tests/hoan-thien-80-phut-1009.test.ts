// HOÀN THIỆN GIÁO ÁN 80 PHÚT — bốn chốt thêm sau đợt build đầu.
//
// Thầy giao: "hoàn thiện và tự sửa theo hướng mượt mà nhất". Bốn thứ dưới đây là
// bốn chỗ giáo án còn xóc, mỗi chỗ một `describe`:
//
//  1. GIỜ CHẾT. Đặc tả tự đá nhau: mục 4.3 bảo "thời gian dư đổ vào câu ngoài
//     danh sách", mục 4.4 bảo "sao 0 ⇒ lane ≤ L1". Kết quả là thừa 250 giây mà
//     không mua nổi gì. Nay trần theo sao là MẶC ĐỊNH chứ không phải tường.
//  2. BA LỰA CHỌN THỪA GIỜ phải CHẠM ĐƯỢC, không phải chữ để thầy tự dò ô số.
//  3. ĐỔI EM cho ĐÚNG một dòng, phần còn lại đứng yên.
//  4. XẾP LẠI LẦN HAI trong cùng buổi không được gọi lại đúng em vừa lên bảng.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CAU_HINH_LEN_BANG_MAC_DINH, nganSachGiay } from '../src/lib/len-bang-cau-hinh'
import { dungDoKho, hopVoiEm, type BaiLamCoGiay, type VapCuaEm } from '../src/lib/do-kho-cau'
import { doiEmChoDong, laneChoPhep, xepGioLenBang, type EmLenBang } from '../src/lib/xep-gio-len-bang'
import type { CauChua } from '../src/lib/phan-cong'

const CH = CAU_HINH_LEN_BANG_MAC_DINH
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/GoiLenBangScreen.tsx'), 'utf8')

function cauMau(i: number, sao: 0 | 1 | 2, cd = 'Ester – lipid'): CauChua {
  return { id: `Q${String(i).padStart(2, '0')}`, phan: 'I', so: i, chuyenDe: cd, mucDo: 'hieu', tomTat: `câu ${i}`, viTri: i, sao, lyDoSao: sao ? 'câu nền' : '' }
}
const vapMau = (sbd: string, cd = 'Ester – lipid'): VapCuaEm => ({ sbd, idCau: 'NGOAI', chuyenDe: cd, mucDo: 'van_dung', nguyenNhan: 'hieu_nham', chon: 'C', cungChon: 9, soEmLam: 30 })
const emMau = (n: number, lenBang = 0): EmLenBang[] =>
  Array.from({ length: n }, (_, j) => ({ sbd: `S${String(j).padStart(2, '0')}`, hoTen: `Em ${j}`, coMat: true, soLanLenBang: lenBang }))

/** Đúng ca đã lộ ra mâu thuẫn: 27 câu sao 2 + 1 câu sao 0 CÓ dữ liệu. */
function caGioChet() {
  const cau = [...Array.from({ length: 27 }, (_, i) => cauMau(i + 1, 2)), cauMau(28, 0, 'Carbohydrate')]
  const bl: BaiLamCoGiay[] = Array.from({ length: 10 }, (_, k) => ({ sbd: `E${k}`, idCau: 'Q28', dung: k > 1, chon: 'A' }))
  return { doKho: dungDoKho(cau, bl, {}, CH), bl }
}

describe('1 — GIỜ CHẾT: đổ nốt giờ thừa vào câu ngoài danh sách', () => {
  it('SỐ HỌC CỦA CHỖ XÓC vẫn nguyên: 27 câu bắt buộc, thừa 250 giây, rẻ nhất 270', () => {
    const { doKho } = caGioChet()
    expect(doKho.filter((d) => d.batBuoc).length).toBe(27)
    expect(nganSachGiay(CH) - (27 * CH.GIAY_LANE.L2 + CH.GIAY_LANE.L1)).toBe(250)
    expect(CH.GIAY_LANE.L3 - CH.GIAY_LANE.L2).toBe(270)
  })

  it('nay giờ thừa được tiêu: câu sao 0 lên "thầy chữa tại chỗ"', () => {
    const { doKho, bl } = caGioChet()
    const kq = xepGioLenBang(doKho, emMau(30), bl, new Map(), {})
    expect(kq.soCauNoiTran).toBe(1)
    expect(kq.dong.find((d) => d.cau.id === 'Q28')?.lane).toBe('L2')
    expect(kq.tongGiay).toBe(28 * CH.GIAY_LANE.L2) // 4 200, thay vì 4 070
    expect(kq.tongGiay).toBeLessThanOrEqual(nganSachGiay(CH))
    expect(kq.tongGiay).toBeGreaterThanOrEqual(nganSachGiay(CH) * 0.95)
  })

  it('NÓI RA đã nới, không lặng lẽ phá trần của chính mình', () => {
    const { doKho, bl } = caGioChet()
    const kq = xepGioLenBang(doKho, emMau(30), bl, new Map(), {})
    expect(kq.canhBao.join(' ')).toContain('Đã đổ giờ thừa vào 1 câu sao 0 ngoài danh sách bắt buộc')
  })

  it('NỚI CÓ KỶ LUẬT — không bao giờ nới lên L3', () => {
    // Gọi em lên bảng cho câu kho đã bảo "đọc đáp án là đủ" thì phí cả buổi lẫn
    // mặt em. Ca này thừa cực nhiều giờ mà câu sao 0 vẫn chỉ tới L2.
    const cau = Array.from({ length: 4 }, (_, i) => cauMau(i + 1, 0))
    const bl: BaiLamCoGiay[] = cau.flatMap((c) => Array.from({ length: 10 }, (_, k) => ({ sbd: `E${k}`, idCau: c.id, dung: k > 1, chon: 'A' })))
    const kq = xepGioLenBang(dungDoKho(cau, bl, {}, CH), emMau(30), bl, new Map(emMau(30).map((e) => [e.sbd, [vapMau(e.sbd)]])), {})
    expect(kq.dong.every((d) => d.lane !== 'L3')).toBe(true)
    expect(kq.soEmLenBang).toBe(0)
  })

  it('KHÔNG ĐỦ CĂN CỨ thì thừa mấy giờ cũng đứng nguyên L0', () => {
    // Không N1, không N2, sao 0 ⇒ không con số nào nói nó đáng chữa. Nới là đoán.
    const cau = Array.from({ length: 4 }, (_, i) => cauMau(i + 1, 0))
    const doKho = dungDoKho(cau, [], {}, CH)
    expect(laneChoPhep(doKho[0], new Set())).toEqual(['L0'])
    const kq = xepGioLenBang(doKho, emMau(30), [], new Map(), {})
    expect(kq.soCauNoiTran).toBe(0)
    expect(kq.dong.every((d) => d.lane === 'L0')).toBe(true)
  })

  // PHÁ MÃ: bỏ chốt `if (!conMuaDuocNuocNao(...))` bọc ngoài bước nới mà không
  // phép kiểm nào đỏ. Kiểm lại thay vì cho qua — nó THỪA THẬT, vì bước vá tham
  // đứng ngay trên đã tiêu bằng hết nước đi CÓ LỜI trong luật chặt rồi; tới lượt
  // bước nới thì "phương án cuối" đã là sự thật do thứ tự, không do chốt.
  // Giữ chốt lại làm lưới phòng thân, và khoá cái THẬT SỰ gánh việc: THỨ TỰ.
  it('THỨ TỰ mới là thứ gánh việc: luật chặt được phục vụ TRƯỚC, nới sau', () => {
    // Ngân sách chỉ đủ đúng MỘT nước nâng lên L2. Câu sao 1 (đi được trong luật
    // chặt) phải thắng câu sao 0 (chỉ đi được nhờ nới).
    const chNho = { ...CH, NGAN_SACH_PHUT: 11, HAO_PHI_MO_DAU_GIAY: 300, HAO_PHI_CHOT_CUOI_GIAY: 200 } // ngân sách chữa = 160 giây
    expect(nganSachGiay(chNho)).toBe(160)
    const cau = [cauMau(1, 1), cauMau(2, 0, 'Carbohydrate')]
    const bl: BaiLamCoGiay[] = cau.flatMap((c) => Array.from({ length: 10 }, (_, k) => ({ sbd: `E${k}`, idCau: c.id, dung: k > 2, chon: 'A' })))
    const kq = xepGioLenBang(dungDoKho(cau, bl, {}, chNho), emMau(30), bl, new Map(), { cauHinh: chNho })
    expect(kq.dong.find((d) => d.cau.id === 'Q01')?.lane).toBe('L2') // sao 1 được phục vụ
    expect(kq.dong.find((d) => d.cau.id === 'Q02')?.lane).toBe('L0') // sao 0 hết chỗ
    expect(kq.soCauNoiTran).toBe(0)
    expect(kq.tongGiay).toBeLessThanOrEqual(160)
  })

  it('còn mua được trong luật chặt thì KHÔNG nới — nới là phương án cuối', () => {
    const cau = [cauMau(1, 2), cauMau(2, 1), cauMau(3, 0)]
    const bl: BaiLamCoGiay[] = cau.flatMap((c) => Array.from({ length: 10 }, (_, k) => ({ sbd: `E${k}`, idCau: c.id, dung: k > 3, chon: 'A' })))
    const kq = xepGioLenBang(dungDoKho(cau, bl, {}, CH), emMau(30), bl, new Map(emMau(30).map((e) => [e.sbd, [vapMau(e.sbd)]])), {})
    // Câu sao 1 còn đường lên L2/L3 trong luật chặt nên thuật toán tiêu ở đó trước.
    expect(kq.soCauNoiTran).toBe(0)
  })
})

describe('2 — BA LỰA CHỌN THỪA GIỜ phải CHẠM ĐƯỢC', () => {
  it('màn vẽ chúng bằng NÚT, không phải dòng chữ chết', () => {
    const khoi = MAN.slice(MAN.indexOf('kqXep?.thuaGio && ('), MAN.indexOf('kqXep?.canhBao.map'))
    expect(khoi).toContain('onClick={() => chamLuaChon(l.ma)}')
    expect(khoi).toContain('tap-target')
    expect(khoi).toContain('minHeight: 44')
    expect(MAN).toContain('Chạm một dòng là áp ngay và xếp lại. Không chạm thì không đổi gì.')
  })

  it('chạm xong là XẾP LẠI ngay, không bắt thầy bấm nút thứ hai', () => {
    const than = MAN.slice(MAN.indexOf('const chamLuaChon ='), MAN.indexOf('/** Đổi em cho ĐÚNG một dòng'))
    expect(than).toContain('setKqXep(')
    expect(than).toContain('xepGioLenBang(doKhoCau, emLenBang, baiLamGiay, vapCa.theoEm, {')
  })

  it('lựa chọn ① bỏ ĐÚNG số câu điểm thấp nhất và xếp được ngay', () => {
    const cau = Array.from({ length: 40 }, (_, i) => cauMau(i + 1, 2))
    const doKho = dungDoKho(cau, [], {}, CH)
    const truoc = xepGioLenBang(doKho, emMau(30), [], new Map(), {})
    expect(truoc.thuaGio).not.toBeNull()
    expect(truoc.dong).toEqual([])
    const canBo = Math.ceil((truoc.thuaGio!.giayCan - truoc.thuaGio!.giayCo) / CH.GIAY_LANE.L2)
    const bo = [...doKho].sort((a, b) => a.giaTri - b.giaTri).slice(0, canBo).map((d) => d.cau.id)
    const sau = xepGioLenBang(doKho, emMau(30), [], new Map(), { boBatBuoc: bo })
    expect(sau.dong.length).toBe(40)
    expect(sau.tongGiay).toBeLessThanOrEqual(nganSachGiay(CH))
  })

  it('lựa chọn ② hạ trần, ③ rút giờ mỗi em — cả hai đều đổi được kết quả thật', () => {
    const cau = Array.from({ length: 12 }, (_, i) => cauMau(i + 1, 2))
    const doKho = dungDoKho(cau, [], {}, CH)
    const em = emMau(30)
    const vap = new Map(em.map((e) => [e.sbd, [vapMau(e.sbd)]]))
    expect(xepGioLenBang(doKho, em, [], vap, { tranEm: 3 }).soEmLenBang).toBe(3)
    const rutGio = xepGioLenBang(doKho, em, [], vap, { giayMoiEm: 300 })
    expect(rutGio.dong.filter((d) => d.lane === 'L3').every((d) => d.giay === 300)).toBe(true)
  })
})

describe('3 — ĐỔI EM: đúng một dòng đổi, phần còn lại đứng yên', () => {
  const cau = Array.from({ length: 12 }, (_, i) => cauMau(i + 1, 2))
  const doKho = dungDoKho(cau, [], {}, CH)
  const em = emMau(30)
  const vap = new Map(em.map((e) => [e.sbd, [vapMau(e.sbd)]]))
  const goc = xepGioLenBang(doKho, em, [], vap, {})
  const dongL3 = goc.dong.filter((d) => d.lane === 'L3')

  it('có sẵn dòng L3 để mà đổi', () => {
    expect(dongL3.length).toBe(CH.SO_EM_LEN_BANG_TOI_DA)
  })

  it('đổi một dòng thì CHỈ dòng ấy đổi em', () => {
    const id = dongL3[0].cau.id
    const moi = doiEmChoDong(goc, id, doKho, em, vap)
    const cu = new Map(goc.dong.map((d) => [d.cau.id, `${d.lane}:${d.em?.sbd ?? '-'}`]))
    const doi = moi.dong.filter((d) => cu.get(d.cau.id) !== `${d.lane}:${d.em?.sbd ?? '-'}`)
    expect(doi.map((d) => d.cau.id)).toEqual([id])
    expect(moi.dong.find((d) => d.cau.id === id)?.em?.sbd).not.toBe(goc.dong.find((d) => d.cau.id === id)?.em?.sbd)
  })

  it('KHÔNG lấy em đang đứng ở dòng khác — luật 1-1 phải còn', () => {
    let kq = goc
    for (const d of dongL3) kq = doiEmChoDong(kq, d.cau.id, doKho, em, vap)
    const l3 = kq.dong.filter((d) => d.lane === 'L3')
    expect(new Set(l3.map((d) => d.em?.sbd)).size).toBe(l3.length)
  })

  it('giờ không đổi — cùng lane L3 nên ngân sách khỏi tính lại', () => {
    const moi = doiEmChoDong(goc, dongL3[0].cau.id, doKho, em, vap)
    expect(moi.tongGiay).toBe(goc.tongGiay)
    expect(moi.soEmLenBang).toBe(goc.soEmLenBang)
  })

  it('bấm mãi thì XOAY VÒNG hết em rảnh rồi quay lại, không kẹt ở em thứ hai', () => {
    const id = dongL3[0].cau.id
    const thay = new Set<string>()
    let kq = goc
    for (let i = 0; i < 12; i++) {
      kq = doiEmChoDong(kq, id, doKho, em, vap)
      thay.add(kq.dong.find((d) => d.cau.id === id)?.em?.sbd ?? '')
    }
    expect(thay.size).toBeGreaterThan(2)
  })

  it('hết em rảnh thì trả nguyên kết quả cũ, KHÔNG ném lỗi giữa lúc đứng lớp', () => {
    const itEm = emMau(CH.SO_EM_LEN_BANG_TOI_DA)
    const vapIt = new Map(itEm.map((e) => [e.sbd, [vapMau(e.sbd)]]))
    const k = xepGioLenBang(doKho, itEm, [], vapIt, {})
    const id = k.dong.filter((d) => d.lane === 'L3')[0].cau.id
    expect(doiEmChoDong(k, id, doKho, itEm, vapIt)).toBe(k)
  })

  it('dòng không phải L3 thì không có gì để đổi', () => {
    const idL2 = goc.dong.find((d) => d.lane !== 'L3')?.cau.id
    if (idL2) expect(doiEmChoDong(goc, idL2, doKho, em, vap)).toBe(goc)
    expect(doiEmChoDong(goc, 'KHONG-CO', doKho, em, vap)).toBe(goc)
  })

  it('màn có nút đổi em cho từng dòng, và nói rõ em vấp câu nào', () => {
    expect(MAN).toContain('onClick={() => doiEm(d.cau.id)}')
    expect(MAN).toContain('Đổi em này')
    expect(MAN).toContain('chưa vấp câu nào cùng chuyên đề')
  })
})

describe('4 — XẾP LẠI LẦN HAI trong buổi: em vừa lên bảng phải tụt hạng', () => {
  it('`moi(e)` giảm theo số lần đã lên bảng', () => {
    const c = cauMau(1, 2)
    const v = [vapMau('S00')]
    expect(hopVoiEm(c, v, 0, CH).moi).toBe(1)
    expect(hopVoiEm(c, v, 1, CH).moi).toBe(0.5)
    expect(hopVoiEm(c, v, 2, CH).moi).toBeCloseTo(1 / 3, 10)
  })

  it('cùng chỗ vấp, em ĐÃ lên bảng xếp sau em chưa lên', () => {
    const cau = [cauMau(1, 2)]
    const doKho = dungDoKho(cau, [], {}, CH)
    const em: EmLenBang[] = [
      { sbd: 'S00', hoTen: 'Đã lên', coMat: true, soLanLenBang: 2 },
      { sbd: 'S01', hoTen: 'Chưa lên', coMat: true, soLanLenBang: 0 },
    ]
    const vap = new Map(em.map((e) => [e.sbd, [vapMau(e.sbd)]]))
    const kq = xepGioLenBang(doKho, em, [], vap, {})
    expect(kq.dong[0].lane).toBe('L3')
    expect(kq.dong[0].em?.sbd).toBe('S01')
  })

  it('màn ĐẾM THẬT số lần trong buổi, không cắm cứng 0', () => {
    expect(MAN).toContain('soLanLenBang: (daGoiCau[e.sbd] ?? []).length')
    expect(MAN).toContain('[dsEmCa, daGoiCau]')
  })

  it('và vẫn khai thật là máy chủ chưa giữ lịch sử 30 ngày', () => {
    expect(MAN).toContain('chuaCoLichSuLenBang: true')
    expect(MAN).toContain('danh sách đỏ, nên tôi không tự làm')
  })
})

describe('IN / LƯU PDF — đặc tả mục 6.7', () => {
  it('màn có nút in, khổ A4 dọc, và không nhét thư viện PDF vào bundle', () => {
    const than = MAN.slice(MAN.indexOf('const inGiaoAn ='), MAN.indexOf('const copyGiaoAn ='))
    expect(than).toContain('size:A4 portrait')
    expect(than).toContain('w.print()')
    expect(MAN).toContain('In / lưu PDF')
    // Cửa sổ in bị chặn thì BÁO, không im lặng không có gì xảy ra.
    expect(than).toContain('Trình duyệt chặn cửa sổ in')
  })

  it('nội dung in được THOÁT, không nhét thẳng chuỗi vào HTML', () => {
    const than = MAN.slice(MAN.indexOf('const inGiaoAn ='), MAN.indexOf('const copyGiaoAn ='))
    expect(than).toContain("replace(/[&<>]/g")
    expect(than).toContain('${thoat(chuGiaoAn)}')
  })
})
