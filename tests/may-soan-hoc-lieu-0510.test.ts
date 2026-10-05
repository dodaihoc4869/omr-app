// @vitest-environment node
// HỌC LIỆU MÁY SOẠN 05/10 (thầy: "làm tất nhé, tôi ko duyệt gì cả, tôi chỉ chữa câu học sinh cần chữa thôi nhé").
//   A. Bộ kiểm thuần (server/src/may-soan-kiem.ts): 4 bản khác — trùng số liệu / trùng đề gốc / đáp số trùng / phép tính lệch ⇒ loại; ý Đ–S mới;
//      ghép HAI LƯỢT (lệch, "?", không chắc ⇒ bỏ); tự xử cờ đáp án (khớp ⇒ daChot, hồ sơ vẫn qua bộ kiểm; lệch ⇒ tuXu).
//   B. Máy chủ thật (SQLite): hàng soạn — câu em đã sai chưa có bản khác lên đầu, nhiều em sai trước (bỏ đọc lời giải / lướt / hỗ trợ / bị che /
//      ca chưa công bố); lưu/đọc `cau_y_ds` + nối bản khác vào `cau_bo_tro` (chỉ mục hai lượt khớp, giữ bản cũ, trần 4); cờ đáp án tự xử ⇒ diện nghi.
//   C. scripts/loi-giai/may-soan.mjs với `claude` GIẢ (tệp thực thi trong thư mục tạm): chế độ thử --thu (không nộp gì) và --mot-lan (nộp thật vào
//      máy chủ thật) — chứng minh luồng hai lượt độc lập chạy đúng mà không tốn API.
import { afterAll, describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import {
  CAN_RONG, cauGocTuKho, coTuXuNghi, dauSoLieu, ghepHaiLuot, khopMu, kiemBanKhac, kiemBoTro, kiemYMoi, nhanBanKhacNop, nhanYMoiNop,
  qidGocMaySoan, soTrongChu, thieuBanKhac, tinhCan, tuXuCoDapAn, uuTienEmSai, type CauGoc, type TraLoiMu,
} from '../server/src/may-soan-kiem'
import { docYDs } from '../server/src/cau-y-ds'
import { docCauEmSai, quyetDinhEmSai, type TinhTrangBoTro } from '../server/src/hoc-lieu-may-soan'
import { boTroTheoQid } from '../server/src/song-sinh-game'
import { songSinhDuDuLieu } from '../server/src/cau-bo-tro'
import { bamCau, cauTrongGoi, dauVao, kiemHoSo, laHoSoSach } from '../src/lib/loi-giai-kiem'
import { BO_CHIA_KHOA } from '../src/lib/loi-giai-bo'

const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const RA2 = path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra')
const TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'may-soan-hl-'))
afterAll(() => fs.rmSync(TAM, { recursive: true, force: true }))

const cauThat = (qid: string, so: number, them: Record<string, unknown> = {}) => ({ ...MAU[qid]!.cau, so, ...them })
const DE_A = '12-THU-A'
const QA = { tn: `${DE_A}-I-6`, ds: `${DE_A}-II-4`, tln: `${DE_A}-III-6` }
const TEP: Record<string, string> = { tn: '02-12-KT-C1-D4-I-6.json', ds: '04-12-KT-C1-D4-II-4.json', tln: '06-12-KT-C1-D2-III-6.json' }
const goiA = (themTln: Record<string, unknown> = {}) => ({ cau: [cauThat('12-KT-C1-D4-I-6', 6), cauThat('12-KT-C1-D4-II-4', 4), cauThat('12-KT-C1-D2-III-6', 6, themTln)] })

// ---------------------------------------------------------------- dữ liệu học liệu mẫu (đúng hoá học)

const so2 = (x: number) => x.toFixed(2).replace('.', ',')
/** Bản khác ĐỔI SỐ của câu hiệu suất isoamyl acetate (III-6): a mL acid, r mL alcohol, e mL ester — acid luôn là chất thiếu. */
function ssSo(a: number, r: number, e: number, chu = 'một học sinh') {
  const kq = Math.round(((e * 0.88) / 130 / ((a * 1.05) / 60)) * 100)
  return {
    kieu: 'so', cach: 'doi_so',
    de: `Để điều chế isoamyl acetate, ${chu} đun nóng ${so2(a)} mL acetic acid (D = 1,05 g/mL) với ${so2(r)} mL isoamyl alcohol (D = 0,81 g/mL), có H2SO4 đặc làm xúc tác, thu được ${so2(e)} mL isoamyl acetate (D = 0,88 g/mL). Tính hiệu suất của phản ứng (làm tròn đến hàng đơn vị).`,
    dap_an: String(kq),
    buoc: [`n(acetic acid) = ${so2(a)} × 1,05 / 60 mol; acid là chất thiếu.`, `n(isoamyl acetate) = ${so2(e)} × 0,88 / 130 mol.`, `Hiệu suất ≈ ${kq}%.`],
    chot: 'Đổi thể tích ra mol, tính hiệu suất theo chất thiếu.',
    phepTinh: [{ ten: 'Hiệu suất (%)', bieuThuc: `${e.toFixed(2)}*0.88/130/(${a.toFixed(2)}*1.05/60)*100`, ketQua: kq, lamTron: 0, laDapSo: true }],
  }
}
const SS_TLN = [ssSo(5, 10, 7), ssSo(6, 12, 8), ssSo(3, 6, 5), ssSo(4.5, 9, 6.5)] // 54 · 52 · 64 · 56
const BUOC_LT = ['Ester hoá là phản ứng thuận nghịch; nước làm cân bằng chuyển theo chiều nghịch.', 'Chọn nhóm có ít nước nhất và có chất hút nước.']
/** Bốn biến thể lí thuyết của câu ester hoá (I-6), đáp án đúng ở bốn chữ khác nhau. */
const SS_TN = [
  { kieu: 'ly_thuyet', cach: 'dao_chieu', de: 'Khi tổng hợp ethyl acetate trong phòng thí nghiệm, dùng nhóm hóa chất nào sau đây cho hiệu suất thấp nhất?',
    pa: { A: 'Acetic acid nguyên chất; ethanol nguyên chất; H2SO4 98%', B: 'Dung dịch CH3COOH 5%; cồn 90o; dung dịch HCl 36,5%', C: 'Acetic acid nguyên chất; cồn 96o; H2SO4 98%', D: 'Acetic acid nguyên chất; ethanol nguyên chất; dung dịch HCl 36,5%' },
    dap_an: 'B', buoc: BUOC_LT, chot: 'Càng nhiều nước, cân bằng càng lùi về chất đầu.' },
  { kieu: 'ly_thuyet', cach: 'doi_chat', de: 'Tổng hợp methyl acetate trong phòng thí nghiệm từ nhóm hóa chất nào sau đây đạt hiệu suất cao nhất?',
    pa: { A: 'Dung dịch CH3COOH 5%; methanol nguyên chất; H2SO4 98%', B: 'Acetic acid nguyên chất; dung dịch methanol 70%; H2SO4 98%', C: 'Acetic acid nguyên chất; methanol nguyên chất; H2SO4 98%', D: 'Acetic acid nguyên chất; methanol nguyên chất; dung dịch HCl 10%' },
    dap_an: 'C', buoc: BUOC_LT, chot: 'Chất đầu nguyên chất và acid đặc hút nước cho hiệu suất cao nhất.' },
  { kieu: 'ly_thuyet', cach: 'dung_sai', de: 'Phát biểu nào sau đây về điều chế ethyl acetate trong phòng thí nghiệm là sai?',
    pa: { A: 'H2SO4 đặc vừa làm xúc tác vừa hút nước.', B: 'Dùng acid và alcohol nguyên chất giúp tăng hiệu suất.', C: 'Đun nóng giúp phản ứng xảy ra nhanh hơn.', D: 'Thêm nước vào hỗn hợp giúp tăng hiệu suất ester hoá.' },
    dap_an: 'D', buoc: BUOC_LT, chot: 'Nước là sản phẩm, thêm nước làm cân bằng lùi.' },
  { kieu: 'ly_thuyet', cach: 'doi_nhieu', de: 'Tổng hợp ethyl acetate trong phòng thí nghiệm từ nhóm hóa chất nào sau đây đạt hiệu suất cao nhất?',
    pa: { A: 'Acetic acid nguyên chất; ethanol nguyên chất; H2SO4 98%', B: 'Giấm ăn; cồn 70o; H2SO4 98%', C: 'Acetic acid nguyên chất; cồn 70o; dung dịch HCl loãng', D: 'Dung dịch CH3COOH 10%; ethanol nguyên chất; H2SO4 loãng' },
    dap_an: 'A', buoc: BUOC_LT, chot: 'Chất đầu nguyên chất, H2SO4 đặc hút nước.' },
]
/** 12 ý Đúng–Sai mới cho câu tổng hợp + chiết isoamyl acetate (II-4): 6 Đúng, 6 Sai. */
const Y_DS = [
  { t: 'Isoamyl acetate có nhiệt độ sôi cao hơn isoamyl alcohol.', d: 'D', lyDo: 'Theo bảng: 142,0 °C so với 131,1 °C.' },
  { t: 'Trong phễu chiết, lớp isoamyl acetate nằm dưới lớp nước.', d: 'S', lyDo: 'Khối lượng riêng 0,88 g/mL nhỏ hơn nước nên lớp ester ở trên.' },
  { t: 'H2SO4 đặc vừa làm xúc tác vừa hút nước trong phản ứng ester hoá.', d: 'D', lyDo: 'H2SO4 đặc hút nước nên cân bằng chuyển theo chiều thuận.' },
  { t: 'Lắp ống sinh hàn khi đun giúp hơi các chất ngưng tụ và chảy trở lại bình phản ứng.', d: 'D', lyDo: 'Sinh hàn hồi lưu giữ các chất dễ bay hơi lại trong hệ.' },
  { t: 'Phản ứng giữa acetic acid và isoamyl alcohol là phản ứng một chiều.', d: 'S', lyDo: 'Ester hoá là phản ứng thuận nghịch.' },
  { t: 'Acetic acid còn dư tan nhiều vào lớp nước khi chiết.', d: 'D', lyDo: 'Acetic acid tan vô hạn trong nước.' },
  { t: 'Lớp ester tách ra sau khi chiết là isoamyl acetate tinh khiết.', d: 'S', lyDo: 'Lớp ester còn lẫn alcohol, acid và nước.' },
  { t: 'Có thể thay H2SO4 đặc bằng dung dịch NaOH để làm xúc tác cho phản ứng.', d: 'S', lyDo: 'NaOH trung hoà acid và thuỷ phân ester.' },
  { t: 'Isoamyl acetate là ester có mùi thơm của chuối chín.', d: 'D', lyDo: 'Isoamyl acetate là thành phần chính của dầu chuối.' },
  { t: 'Acetic acid có nhiệt độ sôi cao nhất trong ba chất ở bảng.', d: 'S', lyDo: 'Acetic acid sôi ở 117,9 °C, thấp nhất trong ba chất.' },
  { t: 'Isoamyl acetate có khối lượng riêng nhỏ hơn nước.', d: 'D', lyDo: 'Đề cho 0,88 g/mL, nhỏ hơn 1 g/mL của nước.' },
  { t: 'Isoamyl alcohol có nhiệt độ sôi thấp hơn acetic acid.', d: 'S', lyDo: 'Isoamyl alcohol sôi ở 131,1 °C, cao hơn 117,9 °C.' },
]

/** Câu gốc dựng từ KHO như máy chủ (qid / băm thật). */
async function gocKho(qidKho: string, so: number) {
  const c = cauTrongGoi(DE_A, { cau: [cauThat(qidKho, so)] })[0]!
  const bam = await bamCau(c)
  return { c, bam, goc: cauGocTuKho(c, bam)!, vao: dauVao(c, bam)! }
}
const kiem = (d: string) => ({ d2: d })

// ================================================================ A. bộ kiểm thuần

describe('A. bộ kiểm bản khác (song sinh đổi số / biến thể lí thuyết)', () => {
  it('4 bản đổi số hợp lệ, khác nhau ⇒ ĐẠT đủ 4; số liệu đọc bỏ chỉ số công thức', async () => {
    const { goc } = await gocKho('12-KT-C1-D2-III-6', 6)
    expect(goc).toMatchObject({ dang: 'tln', phan: 'III', dapAn: '58', kieu: 'bai_tap' })
    expect(soTrongChu('đun 4,00 mL CH3COOH (D = 1,05 g/mL) với (CH3)2CHCH2CH2OH, Fe^3+, SO4^{2-}, 90%')).toEqual([4, 1.05, 90])
    expect(SS_TLN.map((x) => x.dap_an)).toEqual(['54', '52', '64', '56'])
    const r = kiemBanKhac(goc, { ...CAN_RONG, banKhac: 4, kieuBan: 'so' }, SS_TLN)
    expect(r.loi).toEqual([])
    expect(r.hopLe).toHaveLength(4)
    expect(r.hopLe.every((x) => songSinhDuDuLieu('III', x))).toBe(true)
  })

  it('4 bản TRÙNG ⇒ loại: trùng số liệu với nhau / với đề gốc, đáp số trùng đáp số gốc, phép tính lệch, thiếu bản', async () => {
    const { goc } = await gocKho('12-KT-C1-D2-III-6', 6)
    const can = { ...CAN_RONG, banKhac: 4, kieuBan: 'so' as const }
    // Bản 2 chép số của bản 1 (chỉ đổi chữ) ⇒ trùng SỐ LIỆU; bản 4 trùng hẳn chữ bản 3.
    const trung = [SS_TLN[0], ssSo(5, 10, 7, 'một bạn'), SS_TLN[2], SS_TLN[2]]
    const r1 = kiemBanKhac(goc, can, trung)
    expect(r1.hopLe.map((x) => x.dap_an)).toEqual(['54', '64'])
    expect(r1.bo.map((b) => b.i)).toEqual([1, 3])
    expect(r1.loi.join('\n')).toMatch(/bản khác 2: trùng SỐ LIỆU/)
    expect(r1.loi.join('\n')).toMatch(/bản khác 4: trùng chữ/)
    // Cả 4 bản giữ nguyên số của đề gốc ⇒ không bản nào được giữ.
    const r2 = kiemBanKhac(goc, can, [ssSo(4, 8, 6), ssSo(4, 8, 6, 'một bạn'), ssSo(4, 8, 6, 'một em'), ssSo(4, 8, 6, 'một nhóm')])
    expect(r2.hopLe).toEqual([])
    expect(r2.bo).toHaveLength(4)
    // Đáp số trùng đáp số gốc (58) dù số liệu khác ⇒ loại (em nhớ được số).
    const ss58 = ssSo(6, 12, 9)
    expect(ss58.dap_an).toBe('58')
    expect(kiemBanKhac(goc, { ...can, banKhac: 1 }, [ss58]).loi.join()).toMatch(/đáp số 58 trùng đáp số gốc/)
    // Phép tính ghi sai kết quả ⇒ KHOÁ SỐ.
    const lech = { ...SS_TLN[0], phepTinh: [{ ...SS_TLN[0]!.phepTinh[0], ketQua: 60 }] }
    expect(kiemBanKhac(goc, { ...can, banKhac: 1 }, [lech]).loi.join()).toMatch(/KHOÁ SỐ/)
    // Thiếu bản so với yêu cầu ⇒ lượt soạn phải soạn đủ.
    expect(kiemBanKhac(goc, can, SS_TLN.slice(0, 3)).loi.join()).toMatch(/cần đúng 4 bản khác/)
  })

  it('Phần I đổi số: phương án đúng chứa kết quả tính, nhiễu không trùng; biến thể lí thuyết: chữ cái không cùng một chữ, không từ nội bộ / HTML', () => {
    const goc: CauGoc = { qid: 'Q', bam: 'b', dang: 'tn', phan: 'I', de: 'Đốt cháy hoàn toàn 0,1 mol CH4 cần bao nhiêu lít O2 (đktc)?', bang: null,
      pa: { A: '4,48 lít', B: '2,24 lít', C: '6,72 lít', D: '3,36 lít' }, y: [], dapAn: 'A', kieu: 'bai_tap' }
    const ban = { kieu: 'so', de: 'Đốt cháy hoàn toàn 0,15 mol CH4 cần bao nhiêu lít O2 (đktc)?', pa: { A: '3,36 lít', B: '6,72 lít', C: '4,48 lít', D: '8,96 lít' },
      dap_an: 'B', buoc: ['n(O2) = 2 × 0,15 = 0,3 mol.', 'V = 0,3 × 22,4 = 6,72 lít.'], chot: 'Số mol O2 gấp đôi số mol CH4.',
      phepTinh: [{ ten: 'V O2', bieuThuc: '0.15*2*22.4', ketQua: 6.72, lamTron: 2, laDapSo: true }] }
    const can1 = { ...CAN_RONG, banKhac: 1 }
    expect(kiemBanKhac(goc, can1, [ban]).loi).toEqual([])
    expect(kiemBanKhac(goc, can1, [{ ...ban, dap_an: 'C' }]).loi.join()).toMatch(/phương án đúng C không chứa kết quả tính 6.72/)
    expect(kiemBanKhac(goc, can1, [{ ...ban, pa: { ...ban.pa, D: '6,72 lít O2' } }]).loi.join()).toMatch(/phương án nhiễu D trùng kết quả tính/)
    // Biến thể lí thuyết của câu ester hoá.
    const gocLt: CauGoc = { qid: 'Q', bam: 'b', dang: 'tn', phan: 'I', de: 'Tổng hợp ethyl acetate trong phòng thí nghiệm từ nhóm hóa chất nào sau đây sẽ đạt hiệu quả cao nhất?', bang: null,
      pa: { A: 'Acetic acid nguyên chất; ethanol nguyên chất, dung dịch H2SO4 98%', B: 'b', C: 'c', D: 'd' }, y: [], dapAn: 'A', kieu: 'ly_thuyet' }
    const can4 = { ...CAN_RONG, banKhac: 4, kieuBan: 'ly_thuyet' as const }
    expect(kiemBanKhac(gocLt, can4, SS_TN).loi).toEqual([])
    const cungChu = SS_TN.map((x) => ({ ...x, dap_an: 'A', pa: { ...x.pa, A: x.pa[x.dap_an as 'A'], [x.dap_an]: x.pa.A } }))
    expect(kiemBanKhac(gocLt, can4, cungChu).loi.join()).toMatch(/đều là A — xếp đáp án đúng ở các chữ khác nhau/)
    expect(kiemBanKhac(gocLt, can4, [{ ...SS_TN[0], de: 'Biến thể của câu gốc: dùng nhóm hóa chất nào cho hiệu suất thấp nhất?' }, ...SS_TN.slice(1)]).loi.join()).toMatch(/từ nội bộ/)
    expect(kiemBanKhac(gocLt, can4, [{ ...SS_TN[0], de: '<b>Khi</b> tổng hợp ethyl acetate, nhóm nào cho hiệu suất thấp nhất?' }, ...SS_TN.slice(1)]).loi.join()).toMatch(/thẻ HTML/)
  })
})

describe('A. bộ kiểm ý Đúng–Sai mới + hai lượt + tự xử cờ', () => {
  it('ý mới: 8–12 ý, cân Đ/S, không trùng ý gốc, lí do 1 dòng', async () => {
    const { goc } = await gocKho('12-KT-C1-D4-II-4', 4)
    const can = { ...CAN_RONG, yDs: 12 }
    expect(kiemYMoi(goc, can, Y_DS).loi).toEqual([])
    expect(kiemYMoi(goc, can, Y_DS.slice(0, 7)).loi.join()).toMatch(/cần 8–12 ý mới, nộp 7/)
    const lech = Y_DS.map((y) => ({ ...y, d: 'D' }))
    expect(kiemYMoi(goc, can, lech).loi.join()).toMatch(/cần ít nhất 3 ý Đúng và 3 ý Sai/)
    const r = kiemYMoi(goc, can, [{ t: goc.y[0]!.t, d: 'D', lyDo: 'chép ý gốc' }, { ...Y_DS[0], lyDo: 'dòng 1\ndòng 2' }, { ...Y_DS[1], d: 'X' }, ...Y_DS.slice(2)])
    // 13 ý cho câu cần 12 ⇒ ý thứ 13 thừa.
    expect(r.bo.map((b) => b.i)).toEqual([0, 1, 2, 12])
    expect(r.loi.join('\n')).toMatch(/trùng ý gốc/)
    expect(r.loi.join('\n')).toMatch(/lyDo chỉ được 1 dòng/)
    expect(r.loi.join('\n')).toMatch(/d phải là "D"/)
  })

  it('ý Đ–S LỆCH giữa hai lượt ⇒ loại; "?" / không chắc / thiếu trả lời ⇒ loại; khớp ⇒ giữ kèm bằng chứng', async () => {
    const { goc } = await gocKho('12-KT-C1-D4-II-4', 4)
    const tra: TraLoiMu[] = [
      ...Y_DS.map((y, i) => ({ id: `y${i + 1}`, d: y.d === 'D' ? 'Đúng' : 'Sai', chac: true })),
    ]
    tra[2] = { id: 'y3', d: 'S', chac: true } // lệch (ý 3 là Đúng)
    tra[4] = { id: 'y5', d: '?', lyDo: 'phụ thuộc quy ước', chac: false }
    tra[6] = { id: 'y7', d: 'S', chac: false } // đúng giá trị nhưng không chắc
    tra.pop() // ý 12 không có trả lời
    const g = ghepHaiLuot(goc, { songSinh: [], yMoi: Y_DS as never }, tra)
    expect(g.yMoi).toHaveLength(8)
    expect(g.boY.map((b) => b.i)).toEqual([2, 4, 6, 11])
    expect(g.boY[0]!.lyDo).toBe('lượt kiểm mù ra S ≠ D')
    expect(g.boY[1]!.lyDo).toMatch(/mơ hồ/)
    expect(g.boY[3]!.lyDo).toMatch(/không trả lời/)
    expect(g.yMoi[0]).toMatchObject({ t: Y_DS[0]!.t, d: 'D', kiem: { d2: 'D' } })
    // Máy chủ đòi bằng chứng: không có kiem / kiem lệch ⇒ không lưu.
    const n = nhanYMoiNop(goc, [{ ...Y_DS[0] }, { ...Y_DS[1], kiem: kiem('D') }, { ...Y_DS[2], kiem: kiem('D') }], { banKhac: [], yDs: [] })
    expect(n.giu.map((x) => x.i)).toEqual([2])
    expect(n.bo.map((b) => b.i)).toEqual([0, 1])
    // Bản khác: tương tự — lượt kiểm mù ra số khác ⇒ bỏ; sai số làm tròn của đáp án đề xuất được chấp nhận.
    expect(khopMu('tln', '54', { d: '54,15' })).toBe(true)
    expect(khopMu('tln', '3,36', { d: '3,4' })).toBe(false)
    expect(khopMu('ds', 'DSSD', { d: 'Đ S S Đ' }, true)).toBe(true)
    const { goc: gocTln } = await gocKho('12-KT-C1-D2-III-6', 6)
    const gs = ghepHaiLuot(gocTln, { songSinh: SS_TLN as never, yMoi: [] }, [{ id: 'ss1', d: '54' }, { id: 'ss2', d: '52' }, { id: 'ss3', d: '64' }, { id: 'ss4', d: '57' }])
    expect(gs.songSinh.map((x) => x.dap_an)).toEqual(['54', '52', '64'])
    expect(gs.boSongSinh).toEqual([{ i: 3, lyDo: 'lượt kiểm mù ra 57 ≠ 56' }])
    const nb = nhanBanKhacNop(gocTln, [{ ...SS_TLN[0], kiem: kiem('54') }, { ...SS_TLN[1] }, { ...SS_TLN[2], kiem: kiem('99') }], { banKhac: [], yDs: [] })
    expect(nb.giu.map((x) => x.i)).toEqual([0])
    expect(nb.bo.map((b) => b.i)).toEqual([1, 2])
  })

  it('tự xử cờ đáp án: giải lại khớp đáp án kho ⇒ cờ sang daChot, hồ sơ SẠCH và vẫn qua bộ kiểm; lệch / mơ hồ / không có ⇒ tuXu', async () => {
    const { goc, vao, bam } = await gocKho('12-KT-C1-D4-II-4', 4)
    const { canThayChot: _c, de: _de, ...mau } = JSON.parse(fs.readFileSync(path.join(RA2, TEP.ds!), 'utf8'))
    void _c; void _de
    const hoSo = { ...mau, qid: goc.qid, bam, co: [{ loai: 'dapAn', ghi: 'Ý b nghi đáp án', chot: 'Đáp án đúng là DDSD' }] }
    const bo = BO_CHIA_KHOA[vao.bo]!
    expect(kiemHoSo(vao, hoSo, bo).loi).toEqual([])
    const khop = tuXuCoDapAn(hoSo, goc, { id: 'goc', d: 'Đ S S Đ', chac: true })
    expect(khop.ketQua).toBe('khop')
    expect(khop.hoSo.co).toEqual([])
    expect((khop.hoSo.daChot as { chot: string }[]).at(-1)!.chot).toMatch(/^Giữ đáp án kho: lượt giải lại độc lập.*phiên chốt trước đó nghi: Đáp án đúng là DDSD/)
    expect(kiemHoSo(vao, khop.hoSo, bo).loi).toEqual([])
    expect(laHoSoSach(khop.hoSo)).toBe(true)
    const lech = tuXuCoDapAn(hoSo, goc, { id: 'goc', d: 'DDSD', chac: true })
    expect(lech.ketQua).toBe('lech')
    expect(lech.hoSo.co).toEqual([{ loai: 'dapAn', ghi: 'Ý b nghi đáp án', chot: 'Đáp án đúng là DDSD', tuXu: { ketQua: 'lech', giaiLai: 'DDSD' } }])
    expect(coTuXuNghi(lech.hoSo.co)).toBe(true)
    expect(kiemHoSo(vao, lech.hoSo, bo).loi).toEqual([])
    expect(tuXuCoDapAn(hoSo, goc, { id: 'goc', d: '?', chac: false }).ketQua).toBe('khong_chac')
    expect(tuXuCoDapAn(hoSo, goc, undefined).ketQua).toBe('khong_co')
    expect(tuXuCoDapAn({ ...hoSo, co: [] }, goc, undefined).ketQua).toBe('khong_can')
  })

  it('việc giao + bậc ưu tiên câu em đã sai (thuần)', () => {
    expect(tinhCan({ dang: 'tln', kieuKho: 'bai_tap', hoSo: true, soBanDung: 1, soY: 0 })).toEqual({ hoSo: true, banKhac: 3, kieuBan: 'so', yDs: 0 })
    expect(tinhCan({ dang: 'ds', hoSo: false, soBanDung: 0, soY: 5 })).toEqual({ hoSo: false, banKhac: 0, kieuBan: 'tu_chon', yDs: 7 })
    expect(tinhCan({ dang: 'tn', kieuKho: 'ly_thuyet', hoSo: true, soBanDung: 0, soY: 0, nghi: true })).toMatchObject({ banKhac: 0, yDs: 0 })
    expect([thieuBanKhac('tn', 0, 0), thieuBanKhac('tln', 2, 0), thieuBanKhac('tln', 4, 0), thieuBanKhac('ds', 0, 3), thieuBanKhac('ds', 0, 8)]).toEqual(['han', 'mot_phan', null, 'mot_phan', null])
    expect(uuTienEmSai(3, 'han')).toBeGreaterThan(uuTienEmSai(9, 'mot_phan'))
    expect(uuTienEmSai(1, 'mot_phan')).toBeGreaterThan(5000 + 3000 + 1000 + 200)
    expect(['Q-I-1#2', 'Q-I-1~ss3', 'Q-I-1~2'].map(qidGocMaySoan)).toEqual(['Q-I-1', 'Q-I-1', 'Q-I-1'])
    expect(dauSoLieu('4,00 mL và 8 mL', [['a', '1,05']])).toBe('1.05|4|8')
    const tt = (soBanDung: number, nghi = false): TinhTrangBoTro => ({ soBanDung, banKhac: [], soY: 0, yChu: [], nghi })
    const m = (bam: string, soEm: number) => ({ bam, qid: bam, maDe: '12-X', dang: 'tln', lop: '12', bo: 'ESTER', soEm })
    const hd = quyetDinhEmSai([m('a', 3), m('b', 1), m('c', 2), m('d', 5), m('e', 1), m('f', 1)],
      new Map([['a', tt(0)], ['b', tt(0)], ['c', tt(4)], ['d', tt(0, true)], ['e', tt(0)], ['f', tt(2)]]),
      new Map([['b', 'cho'], ['e', 'dang']]), new Map([['c', 'cho'], ['f', 'truot']]), new Set(['ESTER']))
    expect(hd).toEqual([
      { loai: 'mo_hoc_lieu', muc: m('a', 3), thieu: 'han', uuTien: uuTienEmSai(3, 'han') },
      { loai: 'nang_ho_so', bam: 'b', uuTien: uuTienEmSai(1, 'han') },
      { loai: 'dong_hoc_lieu', bam: 'c' },
    ])
  })
})

// ================================================================ B. máy chủ thật

const thay = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b, true)
const em = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b)
const bamCua = (d: D1That, qid: string) => (d.sql.prepare('SELECT bam FROM loi_giai_cau WHERE qid=?').get(qid) as { bam: string }).bam
function hoSoTu(tep: string, qid: string, bam: string, co: unknown[] = []) {
  const { canThayChot: _c, de: _de, ...r } = JSON.parse(fs.readFileSync(path.join(RA2, tep), 'utf8'))
  void _c; void _de
  return { ...r, qid, bam, co }
}
let khoaSk = 0
function suKien(d: D1That, sbd: string, qid: string, o: { ketQua?: number | null; nguon?: string; maNguon?: string; purpose?: string; assistance?: string; visibility?: string } = {}) {
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, luc, ngay_vn, assistance, visibility, purpose) VALUES (?,?,?,?,?,1,?,?,?,?,?,?)`)
    .run(`sk${++khoaSk}`, sbd, qid, o.nguon ?? 'game', o.maNguon ?? 'g', o.ketQua === undefined ? 0 : o.ketQua, '2026-10-02T03:00:00.000Z', '2026-10-02',
      o.assistance ?? null, o.visibility ?? null, o.purpose ?? null)
}

describe('B. hàng soạn: câu em đã sai chưa có bản khác lên đầu', () => {
  it('nhiều em sai trước; đã có hồ sơ ⇒ việc chỉ học liệu; bỏ đọc lời giải / lướt / hỗ trợ / bị che / ca chưa công bố; rồi mới thứ tự cũ', async () => {
    const d = taoD1That()
    await thay(d, '/kho/day', { maDe: DE_A, lop: '12', de: goiA(), cau: [] })
    // III-6 đã có hồ sơ (máy duyệt) ⇒ việc hồ sơ 'xong'.
    expect(await thay(d, '/kho/loi-giai/nop', { qid: QA.tln, bam: bamCua(d, QA.tln), hoSo: hoSoTu(TEP.tln!, QA.tln, bamCua(d, QA.tln)) })).toMatchObject({ ok: true, daDuyet: true })
    // I-6 có ưu tiên cũ rất cao (đề sắp giao) nhưng KHÔNG em nào sai thật.
    d.sql.prepare('UPDATE loi_giai_viec SET uu_tien = 9000 WHERE qid = ?').run(QA.tn)
    // III-6: 3 em sai (một em sai ở bản song sinh ~ss0, một em sai 2 lần); II-4: 1 em sai.
    suKien(d, 'E1', QA.tln); suKien(d, 'E1', QA.tln); suKien(d, 'E2', QA.tln); suKien(d, 'E3', `${QA.tln}~ss0`)
    suKien(d, 'E4', QA.ds)
    // Nhiễu ở I-6: đọc lời giải, lướt, có hỗ trợ, bị che, ca chưa công bố, làm đúng.
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,cap_nhat_luc) VALUES('CA-MO','Ca mở','mo','thi','12','thu_cong','x')").run()
    suKien(d, 'E5', QA.tn, { purpose: 'xem_loi_giai' }); suKien(d, 'E6', QA.tn, { purpose: 'luot' }); suKien(d, 'E7', QA.tn, { assistance: 'assisted' })
    suKien(d, 'E8', QA.tn, { visibility: 'embargoed' }); suKien(d, 'E9', QA.tn, { nguon: 'thi', maNguon: 'CA-MO' }); suKien(d, 'E10', QA.tn, { ketQua: 1 })
    const emSai = await docCauEmSai(d.env)
    expect(new Map([...emSai].map(([q, s]) => [q, s.size]))).toEqual(new Map([[QA.tln, 3], [QA.ds, 1]]))

    const l1 = await thay(d, '/kho/loi-giai/viec', { so: 1, lop: '12' })
    expect(l1.viec).toHaveLength(1)
    expect(l1.viec[0]).toMatchObject({ qid: QA.tln, can: { hoSo: false, banKhac: 4, kieuBan: 'so', yDs: 0 }, kieuKho: 'bai_tap', phan: 'III', daCo: { banKhac: [], yDs: [] } })
    expect(l1.viec[0].deTho).toContain('4,00 mL acetic acid')
    expect(d.sql.prepare('SELECT so_em_sai, thieu, uu_tien, trang_thai FROM may_soan_viec WHERE qid = ?').get(QA.tln))
      .toEqual({ so_em_sai: 3, thieu: 'han', uu_tien: uuTienEmSai(3, 'han'), trang_thai: 'dang' })
    expect((d.sql.prepare('SELECT uu_tien FROM loi_giai_viec WHERE qid = ?').get(QA.ds) as { uu_tien: number }).uu_tien).toBe(uuTienEmSai(1, 'han'))
    expect((d.sql.prepare('SELECT uu_tien FROM loi_giai_viec WHERE qid = ?').get(QA.tn) as { uu_tien: number }).uu_tien).toBe(9000)

    const l2 = await thay(d, '/kho/loi-giai/viec', { so: 1, lop: '12' })
    expect(l2.viec[0]).toMatchObject({ qid: QA.ds, can: { hoSo: true, banKhac: 0, yDs: 12 } })
    const l3 = await thay(d, '/kho/loi-giai/viec', { so: 1, lop: '12' })
    expect(l3.viec[0]).toMatchObject({ qid: QA.tn, can: { hoSo: true, banKhac: 4, kieuBan: 'ly_thuyet', yDs: 0 } })
    expect(await thay(d, '/kho/loi-giai/viec', { so: 1, lop: '12' })).toMatchObject({ ok: true, het: true })
    // `boTro: false` ⇒ y như trước: không đụng hàng học liệu, việc không xin học liệu.
    const cu = await thay(d, '/kho/loi-giai/viec', { so: 5, boTro: false, lamMoi: true })
    expect(cu).toMatchObject({ het: true })

    // Danh sách cho thầy / điều phối, lọc theo luật khối chung.
    const h = await thay(d, '/kho/may-soan/hang-em-sai', {})
    expect((h.hocLieu as { qid: string }[]).map((x) => x.qid)).toEqual([QA.tln])
    expect((h.hoSo as { qid: string }[]).map((x) => x.qid)).toEqual([QA.ds])
    expect(await thay(d, '/kho/may-soan/hang-em-sai', { lop: '11' })).toMatchObject({ hocLieu: [], hoSo: [] })
    expect(await em(d, '/kho/may-soan/hang-em-sai', {})).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
  })
})

describe('B. việc "chỉ học liệu" đã đủ lúc nhận', () => {
  it('đã đủ 4 bản khác ⇒ đóng việc ngay lúc nhận, phát việc kế (không trả lô rỗng)', async () => {
    const d = taoD1That()
    await thay(d, '/kho/day', { maDe: DE_A, lop: '12', de: goiA(), cau: [] })
    const bam = bamCua(d, QA.tln)
    d.sql.prepare("UPDATE loi_giai_viec SET trang_thai = 'xong' WHERE qid IN (?, ?)").run(QA.tln, QA.ds)
    d.sql.prepare("INSERT INTO cau_bo_tro (bam, qid_mau, song_sinh_json, cau_kiem_json, nhan_nen_json, buoc_json, cap_nhat_luc) VALUES (?, ?, ?, '[]', '[]', '[]', 'x')")
      .run(bam, QA.tln, JSON.stringify(SS_TLN))
    d.sql.prepare("INSERT INTO may_soan_viec (bam, qid, ma_de, dang, lop, bo, so_em_sai, thieu, uu_tien, trang_thai, so_lan, tao_luc, cap_nhat_luc) VALUES (?, ?, ?, 'tln', '12', 'ESTER', 2, 'han', 200020, 'cho', 0, 'x', 'x')")
      .run(bam, QA.tln, DE_A)
    const l = await thay(d, '/kho/loi-giai/viec', { so: 1, lop: '12' })
    expect(l.viec).toEqual([expect.objectContaining({ qid: QA.tn, can: expect.objectContaining({ hoSo: true }) })])
    expect(d.sql.prepare('SELECT trang_thai, loi FROM may_soan_viec WHERE bam = ?').get(bam)).toMatchObject({ trang_thai: 'xong', loi: 'đã đủ học liệu lúc nhận' })
  })
})

describe('B. nộp học liệu: chỉ mục hai lượt khớp; bản khác nối cau_bo_tro; ý vào cau_y_ds', () => {
  const ssKho = { de: 'Đun nóng 4,50 mL acetic acid (D = 1,05 g/mL) với 9,00 mL isoamyl alcohol (D = 0,81 g/mL), thu được 5,00 mL isoamyl acetate (D = 0,88 g/mL). Tính hiệu suất (làm tròn đến hàng đơn vị).', dap_an: '43', buoc: ['H = 43%'] }

  it('bản khác: giữ bản kho ở vị trí cũ, thêm tới đủ 4 bản dùng được, mỗi bản mang khối/mã tờ câu gốc; game đọc được 4 bản', async () => {
    const d = taoD1That()
    await thay(d, '/kho/day', { maDe: DE_A, lop: '12', de: goiA({ song_sinh: [ssKho] }), cau: [] })
    const bam = bamCua(d, QA.tln)
    const r = await thay(d, '/kho/may-soan/nop-bo-tro', {
      qid: QA.tln, bam,
      songSinh: [{ ...SS_TLN[0], kiem: kiem('54') }, { ...SS_TLN[1], kiem: kiem('52') }, { ...SS_TLN[2], kiem: kiem('64') }, { ...SS_TLN[3], kiem: kiem('56') },
        { ...ssSo(7, 14, 9), kiem: kiem('99') }, { ...ssSo(2, 4, 3) }],
    })
    expect(r).toMatchObject({ ok: true, banKhac: { giu: 3, tong: 4 } })
    const bo = r.banKhac.bo as { i: number; lyDo: string }[]
    expect(bo.map((b) => b.i)).toEqual([3, 4, 5])
    expect(bo[0]!.lyDo).toMatch(/đã đủ 4 bản dùng được/)
    expect(bo[1]!.lyDo).toMatch(/chưa qua hai lượt khớp/)
    expect(bo[2]!.lyDo).toMatch(/chưa qua hai lượt khớp/)
    const ss = JSON.parse((d.sql.prepare('SELECT song_sinh_json FROM cau_bo_tro WHERE bam = ?').get(bam) as { song_sinh_json: string }).song_sinh_json)
    expect(ss).toHaveLength(4)
    expect(ss[0]).toEqual(ssKho)
    expect(ss.slice(1).map((x: { dap_an: string }) => x.dap_an)).toEqual(['54', '52', '64'])
    expect(ss[1]).toMatchObject({ kieu: 'so', nguon: 'may_soan_2_luot', qid_mau: QA.tln, ma_de: DE_A, lop: '12', kiem: { d2: '54' } })
    const doc = (await boTroTheoQid(d.env, [QA.tln])).get(QA.tln)!
    expect(doc.songSinh.filter((x) => songSinhDuDuLieu('III', x))).toHaveLength(4)
    // Đủ 4 ⇒ lần nộp sau không thêm gì; băm lệch ⇒ từ chối; không mã bí mật ⇒ chặn.
    expect(await thay(d, '/kho/may-soan/nop-bo-tro', { qid: QA.tln, bam, songSinh: [{ ...ssSo(7, 14, 10), kiem: kiem(ssSo(7, 14, 10).dap_an) }] })).toMatchObject({ banKhac: { giu: 0, tong: 4 } })
    expect(await thay(d, '/kho/may-soan/nop-bo-tro', { qid: QA.tln, bam: 'ffff', songSinh: [] })).toMatchObject({ ok: false, loi: ['KHOÁ VÂN TAY'] })
    expect(await em(d, '/kho/may-soan/nop-bo-tro', { qid: QA.tln, bam })).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
  })

  it('ý Đ–S: chỉ lưu ý hai lượt khớp, không trùng ý gốc; chỉ thêm; docYDs đọc đúng khối, bỏ câu nghi đáp án', async () => {
    const d = taoD1That()
    await thay(d, '/kho/day', { maDe: DE_A, lop: '12', de: goiA(), cau: [] })
    const bam = bamCua(d, QA.ds)
    const yGoc = cauTrongGoi(DE_A, { cau: [cauThat('12-KT-C1-D4-II-4', 4)] })[0]!.y!.a!
    const nop = [...Y_DS.slice(0, 8).map((y) => ({ ...y, kiem: kiem(y.d) })), { ...Y_DS[8], kiem: kiem('S') }, { t: yGoc, d: 'D', lyDo: 'chép ý gốc', kiem: kiem('D') }]
    const r = await thay(d, '/kho/may-soan/nop-y-ds', { qid: QA.ds, bam, yMoi: nop })
    expect(r).toMatchObject({ ok: true, yDs: { giu: 8, tong: 8 } })
    expect((r.yDs.bo as { i: number }[]).map((b) => b.i)).toEqual([8, 9])
    expect(d.dem('cau_y_ds', `bam='${bam}' AND qid_mau='${QA.ds}' AND ma_de='${DE_A}' AND lop='12' AND nguon='may_soan_2_luot'`)).toBe(8)
    const doc = (await docYDs(d.env, [bam])).get(bam)!
    expect(doc.map((y) => y.stt)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(doc[1]).toMatchObject({ t: Y_DS[1]!.t, d: 'S', lyDo: Y_DS[1]!.lyDo, qid: QA.ds, maDe: DE_A, lop: '12' })
    expect((await docYDs(d.env, [bam], { lop: '11' })).size).toBe(0)
    expect((await docYDs(d.env, [bam], { khoiEm: 11 })).size).toBe(0)
    expect((await docYDs(d.env, [bam], { khoiEm: 12 })).get(bam)).toHaveLength(8)
    // Nộp lại cùng ý ⇒ không thêm dòng (chỉ thêm, không ghi đè); qua đường gộp nop-bo-tro cũng vậy.
    expect(await thay(d, '/kho/may-soan/nop-bo-tro', { qid: QA.ds, bam, yMoi: nop.slice(0, 8) })).toMatchObject({ ok: true, yDs: { giu: 0, tong: 8 } })
    expect(d.dem('cau_y_ds')).toBe(8)
    // Câu vào diện nghi đáp án ⇒ kênh tự động không dùng (docYDs bỏ), trừ khi gọi rõ boNghi: false.
    d.sql.prepare("INSERT INTO cau_nghi_dap_an (qid, so_lan, so_sai, ty_le_sai, trang_thai, luc) VALUES (?, 0, 0, 0, 'nghi', 'x')").run(QA.ds)
    expect((await docYDs(d.env, [bam])).size).toBe(0)
    expect((await docYDs(d.env, [bam], { boNghi: false })).get(bam)).toHaveLength(8)
  })

  it('hồ sơ lời giải KHÔNG mang học liệu (đáp án bản khác không theo hồ sơ xuống máy em)', async () => {
    const d = taoD1That()
    await thay(d, '/kho/day', { maDe: DE_A, lop: '12', de: goiA(), cau: [] })
    const bam = bamCua(d, QA.tln)
    const r = await thay(d, '/kho/loi-giai/nop', { qid: QA.tln, bam, hoSo: { ...hoSoTu(TEP.tln!, QA.tln, bam), songSinh: SS_TLN, yMoi: Y_DS } })
    expect(r).toMatchObject({ ok: true, daDuyet: true })
    const luu = JSON.parse(d.objects.get(`giai/${bam}.json`) as string)
    expect(luu.songSinh).toBeUndefined()
    expect(luu.yMoi).toBeUndefined()
    expect(luu.khuon).toBe('1.2')
  })
})

describe('B. cờ đáp án TỰ XỬ — không chờ thầy duyệt', () => {
  it('giải lại độc lập vẫn lệch ⇒ hồ sơ ẩn, câu + bản cùng nội dung vào cau_nghi_dap_an, tách khỏi danh sách báo thầy; quyết định cũ giữ nguyên', async () => {
    const d = taoD1That()
    await thay(d, '/kho/day', { maDe: DE_A, lop: '12', de: goiA(), cau: [] })
    await thay(d, '/kho/day', { maDe: '12-THU-B', lop: '12', de: { cau: [cauThat('12-KT-C1-D2-III-6', 2)] }, cau: [] })
    const qidChep = '12-THU-B-III-2'
    const bam = bamCua(d, QA.tln)
    expect(bamCua(d, qidChep)).toBe(bam)
    // Một bản chép đã được chốt "đúng đáp án" trước đây ⇒ không bị ghi đè.
    d.sql.prepare("INSERT INTO cau_nghi_dap_an (qid, so_lan, so_sai, ty_le_sai, trang_thai, ghi_chu, luc) VALUES (?, 6, 4, 0.66, 'dung_dap_an', 'đã chốt', 'x')").run(qidChep)
    const co = [{ loai: 'dapAn', ghi: 'Kho ghi 58, tính lại ra 60', chot: 'Đáp án đúng là 60', tuXu: { ketQua: 'lech', giaiLai: '60' } }]
    const r = await thay(d, '/kho/loi-giai/nop', { qid: QA.tln, bam, hoSo: hoSoTu(TEP.tln!, QA.tln, bam, co) })
    expect(r).toMatchObject({ ok: true, daDuyet: false, nghiDapAn: true, soCauNghi: 1 })
    expect(d.sql.prepare('SELECT trang_thai, so_co_dap_an FROM loi_giai WHERE bam = ?').get(bam)).toEqual({ trang_thai: 'cho_duyet', so_co_dap_an: 1 })
    const nghi = d.sql.prepare('SELECT trang_thai, ghi_chu FROM cau_nghi_dap_an WHERE qid = ?').get(QA.tln) as { trang_thai: string; ghi_chu: string }
    expect(nghi.trang_thai).toBe('nghi')
    expect(nghi.ghi_chu).toMatch(/^máy soạn tự xử \d{4}-\d\d-\d\d: giải lại độc lập ra 60 · đáp án kho 58/)
    expect(d.sql.prepare('SELECT trang_thai, ghi_chu FROM cau_nghi_dap_an WHERE qid = ?').get(qidChep)).toEqual({ trang_thai: 'dung_dap_an', ghi_chu: 'đã chốt' })
    // Danh sách sửa kho: hai bản cùng nội dung (cùng hồ sơ) cùng nằm ở `nghiTuXu`, không ở hai danh sách báo thầy.
    const ds = await thay(d, '/gv/loi-giai/sua-kho', {})
    expect(ds).toMatchObject({ dapAnSai: [], chuaChot: [] })
    expect((ds.nghiTuXu as { qid: string; ketQua: string; giaiLai: string }[]).map((x) => [x.qid, x.ketQua, x.giaiLai]).sort())
      .toEqual([[QA.tln, 'lech', '60'], [qidChep, 'lech', '60']].sort())
    expect((await thay(d, '/ca/cau-nghi-dap-an', {})).qid).toContain(QA.tln)
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('E1','Em E1','12','mk','x')").run()
    expect(await em(d, '/hs/hoi-thay', { token: await gameToken(d.env, 'E1'), qid: QA.tln, nguon: 'game' })).toMatchObject({ ok: true, coLoiGiai: false })
    // Câu nghi đáp án không vào hàng học liệu dù nhiều em sai.
    suKien(d, 'E1', QA.tln); suKien(d, 'E2', QA.tln)
    expect(await thay(d, '/kho/may-soan/hang-em-sai', { lamMoi: true })).toMatchObject({ hocLieu: [] })
  })
})

// ================================================================ C. may-soan.mjs với claude GIẢ

it('bộ kiểm đóng gói (kiem.bundle.mjs) khớp nguồn — sửa may-soan-kiem / loi-giai-kiem phải chạy node scripts/loi-giai/dung-kiem.mjs', async () => {
  const { dungKiem, RA_KIEM } = (await import('../scripts/loi-giai/dung-kiem.mjs')) as { dungKiem: () => Promise<string>; RA_KIEM: string }
  expect(fs.readFileSync(RA_KIEM, 'utf8') === (await dungKiem()), 'kiem.bundle.mjs cũ — chạy: node scripts/loi-giai/dung-kiem.mjs').toBe(true)
}, 60_000)

function dungMayChu(d: D1That) {
  const sv = http.createServer(async (req, res) => {
    let body = ''
    for await (const c of req) body += c
    const r = await worker.fetch(new Request(`https://test${req.url}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': String(req.headers['x-ma-bi-mat'] ?? '') }, body }), d.env)
    res.writeHead(r.status, { 'content-type': 'application/json' })
    res.end(await r.text())
  })
  return new Promise<{ url: string; dong: () => void }>((ok) => sv.listen(0, '127.0.0.1', () => {
    const a = sv.address() as { port: number }
    ok({ url: `http://127.0.0.1:${a.port}`, dong: () => sv.close() })
  }))
}

/**
 * `claude` GIẢ cho ba loại phiên (nhận diện qua lời nhắc): SOẠN (hồ sơ mẫu + học liệu theo vao.can, cờ đáp án cho II-4 và III-6, tự chạy kiem.mjs),
 * CHỐT (giữ cờ, ghi "đáp án kho sai"), KIỂM MÙ (giải theo bảng đáp án thật, cố ý lệch vài mục; ghi lại thư mục làm việc + báo nếu đầu vào lộ đáp án).
 */
function dungClaudeGia() {
  const bin = path.join(TAM, 'bin')
  fs.mkdirSync(bin, { recursive: true })
  const D = {
    map: { 'I-6': TEP.tn, 'II-4': TEP.ds, 'III-6': TEP.tln }, ra2: RA2,
    boTro: { 'I-6': { songSinh: SS_TN }, 'III-6': { songSinh: SS_TLN }, 'II-4': { yMoi: Y_DS } },
    coDapAn: { 'II-4': 'Ý b nghi đáp án', 'III-6': 'Kho ghi 58, tính lại ra 60' },
    chot: { 'II-4': 'Đáp án đúng là DDSD', 'III-6': 'Đáp án đúng là 60' },
    // Lượt kiểm mù: đáp án thật, cố ý lệch — I-6 ss2 (thật C), III-6 ss4 (thật 56), II-4 y3 lệch / y5 "?" / y7 không chắc; câu gốc II-4 khớp kho, III-6 lệch.
    mu: {
      'I-6': { ss1: 'B', ss2: 'A', ss3: 'D', ss4: 'A' },
      'III-6': { ss1: '54', ss2: '52', ss3: '64', ss4: '57', goc: '60' },
      'II-4': { ...Object.fromEntries(Y_DS.map((y, i) => [`y${i + 1}`, y.d])), y3: 'S', y5: { d: '?', lyDo: 'mơ hồ', chac: false }, y7: { d: 'S', chac: false }, goc: 'DSSD' },
    },
  }
  fs.writeFileSync(path.join(bin, 'claude'), `#!/usr/bin/env node
const fs = require('fs'), path = require('path')
const D = ${JSON.stringify(D)}
const nhac = fs.readFileSync(0, 'utf8')
const khoaCua = (ten) => Object.keys(D.map).find((k) => ten.replace(/\\.json$/, '').endsWith('-' + k))
const xong = (kq) => { process.stdout.write(JSON.stringify({ result: kq, usage: { input_tokens: 5, output_tokens: 2 } })); process.exit(0) }
if (nhac.includes('goi-kiem-mu.md')) {
  fs.writeFileSync('ra/_cwd.txt', process.cwd())
  for (const f of fs.readdirSync('vao').filter((x) => x.endsWith('.json'))) {
    const tho = fs.readFileSync('vao/' + f, 'utf8')
    if (/"(dap_an|dapAn|lyDo|phepTinh|buoc|chot|d|kiem|mc)"\\s*:/.test(tho)) fs.writeFileSync('ra/_LO_DAP_AN.txt', f)
    if (!nhac.includes(f)) fs.writeFileSync('ra/_THIEU_TEN.txt', f) // phiên kiểm mù không có Glob: lời nhắc phải nêu tên tệp
    const v = JSON.parse(tho), bang = D.mu[khoaCua(f)]
    const tra = v.muc.map((m) => { const x = bang[m.id]; return x === undefined ? null : typeof x === 'object' ? { id: m.id, ...x } : { id: m.id, d: x, lyDo: 'giải lại', chac: true } }).filter(Boolean)
    fs.writeFileSync('ra/' + f, JSON.stringify({ tra }))
  }
  xong('kiểm mù')
}
if (nhac.includes('goi-chot.md')) {
  for (const f of fs.readFileSync('chot.txt', 'utf8').split(String.fromCharCode(10)).filter(Boolean)) {
    const h = JSON.parse(fs.readFileSync('ra/' + f, 'utf8'))
    h.co = h.co.map((c) => (c.loai === 'dapAn' ? { ...c, chot: D.chot[khoaCua(f)] } : c))
    fs.writeFileSync('ra/' + f, JSON.stringify(h))
  }
  xong('chốt')
}
for (const f of fs.readdirSync('vao').filter((x) => x.endsWith('.json'))) {
  const v = JSON.parse(fs.readFileSync('vao/' + f, 'utf8')), k = khoaCua(f)
  if (v.can.hoSo !== false) {
    const { canThayChot, de, so, nguon, chuong, ...r } = JSON.parse(fs.readFileSync(path.join(D.ra2, D.map[k]), 'utf8'))
    r.y = (r.y || []).map(({ t, ...y }) => y)
    if (r.mc) r.mc = { d: r.mc.d }
    fs.writeFileSync('ra/' + f, JSON.stringify({ ...r, qid: v.qid, bam: v.bam, co: D.coDapAn[k] ? [{ loai: 'dapAn', ghi: D.coDapAn[k] }] : [] }))
  }
  if (v.can.banKhac > 0 || v.can.yDs > 0) fs.writeFileSync('bo-tro/' + f, JSON.stringify({ qid: v.qid, bam: v.bam, ...D.boTro[k] }))
}
fs.writeFileSync('kiem-log.txt', require('child_process').execFileSync(process.execPath, ['kiem.mjs'], { encoding: 'utf8' }))
xong('soạn')
`)
  fs.chmodSync(path.join(bin, 'claude'), 0o755)
  return bin
}

function chayMaySoan(url: string, bin: string, lam: string, them: string[]) {
  return new Promise<{ ma: number | null; ra: string }>((ok) => {
    const p = spawn(process.execPath, [path.join(GOC, 'scripts/loi-giai/may-soan.mjs'), ...them], {
      cwd: GOC, env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, OMR_MAY_CHU: url, OMR_MA_BI_MAT: 'bi-mat-thu', OMR_THU_MUC_LAM: lam },
    })
    let ra = ''
    p.stdout.on('data', (x) => { ra += x })
    p.stderr.on('data', (x) => { ra += x })
    p.on('close', (ma) => ok({ ma, ra }))
  })
}
/** Thư mục lô duy nhất của một lần chạy. */
function thuMucLo(lam: string) {
  const ngay = path.join(lam, new Date().toISOString().slice(0, 10))
  const ds = fs.readdirSync(ngay).filter((x) => fs.statSync(path.join(ngay, x)).isDirectory())
  expect(ds).toHaveLength(1)
  return path.join(ngay, ds[0]!)
}
/** Lượt kiểm mù chạy ở thư mục TẠM ngoài thư mục lô, đầu vào không lộ đáp án, thư mục tạm đã xoá. */
function kiemDocLap(lo: string) {
  const cwd = fs.readFileSync(path.join(lo, 'kiem-mu/ra/_cwd.txt'), 'utf8')
  expect(cwd.startsWith(fs.realpathSync(os.tmpdir())) || cwd.startsWith(os.tmpdir())).toBe(true)
  expect(cwd.includes(lo)).toBe(false)
  expect(fs.existsSync(cwd)).toBe(false)
  expect(fs.existsSync(path.join(lo, 'kiem-mu/ra/_LO_DAP_AN.txt'))).toBe(false)
  expect(fs.existsSync(path.join(lo, 'kiem-mu/ra/_THIEU_TEN.txt'))).toBe(false)
  expect(fs.readdirSync(path.join(lo, 'kiem-mu/vao')).filter((f) => f.endsWith('.json'))).toHaveLength(3)
  expect(fs.readFileSync(path.join(lo, 'kiem-log.txt'), 'utf8')).toMatch(/Học liệu thêm đạt: 3\/3[\s\S]*TỔNG: 3\/3 đạt/)
}

describe('C. may-soan.mjs + claude giả: luồng hai lượt độc lập', () => {
  it('chế độ thử --thu: soạn → chốt → kiểm mù → chỉ giữ mục khớp, tự xử cờ; KHÔNG nộp gì', async () => {
    const d = taoD1That()
    const { url, dong } = await dungMayChu(d)
    try {
      await thay(d, '/kho/day', { maDe: '12-THU-MS', lop: '12', de: goiA(), cau: [] })
      const lam = path.join(TAM, 'lam-thu')
      const kq = await chayMaySoan(url, dungClaudeGia(), lam, ['--thu'])
      expect(kq.ma, kq.ra).toBe(0)
      expect(kq.ra).toContain('chốt 2 hồ sơ có cờ đáp án')
      // 4 bản khác (I-6) + 4 bản khác và câu gốc (III-6) + 12 ý mới và câu gốc (II-4).
      expect(kq.ra).toContain('lượt kiểm mù 3 câu · 22 mục')
      expect(kq.ra).toContain('xong lô — đạt 3, trượt 0, thiếu 0 · bản khác giữ 6/8 · ý Đ–S giữ 9/12 · cờ đáp án tự xử: khớp 1, nghi 1')
      const lo = thuMucLo(lam)
      kiemDocLap(lo)
      const tk = JSON.parse(fs.readFileSync(path.join(lo, 'tong-ket.json'), 'utf8'))
      const theo = Object.fromEntries((tk.cau as { qid: string }[]).map((c) => [c.qid.replace('12-THU-MS-', ''), c]))
      expect(theo['I-6']).toMatchObject({ hoSo: 'dat', tuXu: 'khong_can', banKhac: { deXuat: 4, quaBoKiem: 4, khopHaiLuot: 3, boHaiLuot: [{ i: 1, lyDo: 'lượt kiểm mù ra A ≠ C' }] } })
      expect(theo['III-6']).toMatchObject({ hoSo: 'dat', tuXu: 'lech', banKhac: { khopHaiLuot: 3 } })
      expect(theo['II-4']).toMatchObject({ hoSo: 'dat', tuXu: 'khop', yDs: { deXuat: 12, quaBoKiem: 12, khopHaiLuot: 9 } })
      expect(tk.thu).toBe(true)
      // Không nộp gì: không hồ sơ, không học liệu.
      expect([d.dem('loi_giai'), d.dem('cau_y_ds'), d.dem('cau_bo_tro')]).toEqual([0, 0, 0])
    } finally {
      dong()
    }
  }, 90_000)

  it('--mot-lan: nộp thật — chỉ mục khớp được lưu; cờ khớp ⇒ máy duyệt, cờ lệch ⇒ diện nghi; không việc nào chờ thầy', async () => {
    const d = taoD1That()
    const { url, dong } = await dungMayChu(d)
    try {
      await thay(d, '/kho/day', { maDe: '12-THU-MS', lop: '12', de: goiA(), cau: [] })
      const lam = path.join(TAM, 'lam-that')
      const kq = await chayMaySoan(url, dungClaudeGia(), lam, ['--mot-lan', '--luong', '1', '--so', '3'])
      expect(kq.ma, kq.ra).toBe(0)
      expect(kq.ra).toContain('Kết thúc: đạt 3 · trượt 0 · thiếu 0 · bản khác giữ 6/8 · ý Đ–S giữ 9/12 · cờ đáp án tự xử: khớp 1, nghi 1')
      kiemDocLap(thuMucLo(lam))
      const q = (s: string) => `12-THU-MS-${s}`
      const tt = (s: string) => d.sql.prepare('SELECT trang_thai, so_co_dap_an FROM loi_giai WHERE bam = ?').get(bamCua(d, q(s)))
      expect([tt('I-6'), tt('II-4'), tt('III-6')]).toEqual([
        { trang_thai: 'da_duyet', so_co_dap_an: 0 }, { trang_thai: 'da_duyet', so_co_dap_an: 0 }, { trang_thai: 'cho_duyet', so_co_dap_an: 1 },
      ])
      const hoSoDs = JSON.parse(d.objects.get(`giai/${bamCua(d, q('II-4'))}.json`) as string)
      expect(hoSoDs.daChot.at(-1).chot).toMatch(/^Giữ đáp án kho: lượt giải lại độc lập/)
      expect((d.sql.prepare('SELECT trang_thai, ghi_chu FROM cau_nghi_dap_an WHERE qid = ?').get(q('III-6')) as { ghi_chu: string }).ghi_chu).toMatch(/giải lại độc lập ra 60 · đáp án kho 58/)
      expect(await thay(d, '/gv/loi-giai/sua-kho', {})).toMatchObject({ dapAnSai: [], chuaChot: [], nghiTuXu: [expect.objectContaining({ qid: q('III-6') })] })
      const ss = (s: string) => JSON.parse((d.sql.prepare('SELECT song_sinh_json FROM cau_bo_tro WHERE bam = ?').get(bamCua(d, q(s))) as { song_sinh_json: string }).song_sinh_json) as { dap_an: string; ma_de: string }[]
      expect(ss('I-6').map((x) => x.dap_an)).toEqual(['B', 'D', 'A'])
      expect(ss('III-6').map((x) => x.dap_an)).toEqual(['54', '52', '64'])
      expect(ss('I-6').every((x) => x.ma_de === '12-THU-MS')).toBe(true)
      const y = (await docYDs(d.env, [bamCua(d, q('II-4'))], { boNghi: false })).get(bamCua(d, q('II-4')))!
      expect(y.map((x) => x.t)).toEqual(Y_DS.filter((_, i) => ![2, 4, 6].includes(i)).map((x) => x.t))
      expect(d.dem('loi_giai_viec', "trang_thai='xong'")).toBe(3)
    } finally {
      dong()
    }
  }, 90_000)
})
