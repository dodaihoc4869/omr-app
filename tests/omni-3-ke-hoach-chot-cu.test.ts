// OMNI 3 · làn A2 — CHỐT HÀNH VI CŨ của `lapKeHoachNgay` (đặc tả DAC-TA-BUILD-OMNI-3-0510.md mục 4.9 + cổng GĐ A (4)).
// 30 kịch bản TẤT ĐỊNH (PRNG mulberry32, không Math.random) khác nhau về số câu mới / nợ / củng cố / duy trì / cắt tỉa, D, rải đều bật/tắt,
// hạng theo dạng, Huyết Chiến, nhịp riêng (tiLeNo), kênh riêng (onVaoDao), lập lại giữa ngày (daLamHomNay, moiDaLamHomNay).
// Giá trị kỳ vọng = JSON đầu ra của `lapKeHoachNgay` TRƯỚC khi mở rộng OMNI 3 (sinh ngày 05/10 trên commit f189d2b, chưa sửa srs2-loi.ts).
// Mở rộng OMNI (chienDich, trongSoCau, dangVung, onBaiCu, cheDoCho…) mà KHÔNG truyền trường mới ⇒ phải ra Y HỆT từng ký tự.
// KHÔNG sinh lại bảng kỳ vọng sau khi sửa lõi — đỏ ở đây nghĩa là hành vi cũ đã đổi.
import { describe, expect, it } from 'vitest'
import { lapKeHoachNgay, phatLaiCau, type CauSrs, type HangEm, type LanLam, type Phan, type TrangThaiCau, type TuyChonKeHoach } from '../server/src/srs2-loi'

// ---- BỘ SINH KỊCH BẢN TẤT ĐỊNH (chép nguyên vào tests/omni-3-ke-hoach-chot-cu.test.ts) ----
/** PRNG tất định (mulberry32) — không Math.random. */
function prng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const HOM_NAY = '2026-10-05'
const cong = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const MUC: readonly (string | null)[] = ['NB', 'TH', 'VD', 'VDC', 'Nhận biết', 'Thông hiểu', 'Vận dụng', null, 'lạ']
const PHAN: readonly Phan[] = ['I', 'I', 'I', 'II', 'III']
const HANG: readonly HangEm[] = ['L1', 'L2', 'L3', 'L4']

interface KichBan {
  ten: string
  seed: number
  /** D (≥ 1) của chiến dịch; null ⇒ không chiến dịch; 'qua' ⇒ hạn đã qua 2 ngày. */
  D: number | null | 'qua'
  moi?: number
  /** Nợ tới lịch (sai hôm qua hoặc sớm hơn), thuộc chiến dịch. */
  noCd?: number
  /** Nợ cũ ngoài chiến dịch (nguồn no_cu), tới lịch. */
  noCu?: number
  /** Nợ chưa tới lịch (sai hôm nay). */
  noChuaLich?: number
  /** Đúng một lần (cc = 1), có câu tới lịch có câu chưa. */
  dungMot?: number
  /** Câu chiến dịch đã thành thạo (củng cố / ôn chốt). */
  thanhThao?: number
  /** Ôn duy trì (nguồn duy_tri), phần lớn tới lịch. */
  duyTri?: number
  catTia?: number
  /** Tỉ lệ câu 2 sao. */
  sao?: number
  /** Có mốc "Thầy đã chữa" hôm qua cho một phần câu nợ. */
  chua?: boolean
  tranNgay?: number
  tranHuyet?: number
  raiDeu?: boolean
  hang?: 'tron' | 'L4' | 'L3' | 'L1' | 'chung'
  tiLeNo?: number
  onVaoDao?: boolean
  daLam?: number
  moiDaLam?: number
  /** Ghi `nguon: 'chien_dich'` tường minh cho mọi câu chiến dịch (mặc định: xen kẽ có/không ghi). */
  nguonRo?: boolean
}

function dungKichBan(kb: KichBan): { cau: CauSrs[]; tt: Map<string, TrangThaiCau>; tc: TuyChonKeHoach; daLam: number } {
  const r = prng(kb.seed)
  const chon = <T,>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!
  const han = kb.D === null ? null : kb.D === 'qua' ? cong(HOM_NAY, -2) : cong(HOM_NAY, kb.D - 1)
  const hanCu = cong(HOM_NAY, -20)
  const cau: CauSrs[] = []
  const tt = new Map<string, TrangThaiCau>()
  let dem = 0
  const lan = (qid: string, ngay: string, dung: boolean, coGoiY = false): LanLam => ({ qid, ngay, luc: `${ngay}T0${dem++ % 10}:00:00Z`, dung, coGoiY })
  const them = (tien: string, i: number, nguon: CauSrs['nguon'] | 'cd', lich: (q: string) => LanLam[], hanCau: string | null, moc: string[] = []) => {
    const qid = `${tien}${i}`
    const c: CauSrs = { qid, phan: chon(PHAN), mucDo: chon(MUC), dang: `D${Math.floor(r() * 5)}` }
    if (nguon === 'cd') { if (kb.nguonRo || r() < 0.5) c.nguon = 'chien_dich' } else if (nguon) c.nguon = nguon
    if (r() < (kb.sao ?? 0.1)) c.sao = 2
    cau.push(c)
    tt.set(qid, phatLaiCau(qid, lich(qid), hanCau, moc, { sao: c.sao ?? 0, phan: c.phan, mucDo: c.mucDo }))
  }
  for (let i = 0; i < (kb.moi ?? 0); i++) them('m', i, 'cd', () => [], han)
  for (let i = 0; i < (kb.noCd ?? 0); i++) {
    const nSai = 1 + Math.floor(r() * 3), lui = nSai + Math.floor(r() * 3)
    const moc = kb.chua && i % 3 === 0 ? [`${cong(HOM_NAY, -1)}T05:00:00Z`] : []
    them('n', i, 'cd', (q) => Array.from({ length: nSai }, (_, k) => lan(q, cong(HOM_NAY, -lui + k), r() < 0.25 && k < nSai - 1)).concat([lan(q, cong(HOM_NAY, -1), false)]), han, moc)
  }
  for (let i = 0; i < (kb.noCu ?? 0); i++) {
    const lui = 2 + Math.floor(r() * 6)
    them('c', i, 'no_cu', (q) => [lan(q, cong(HOM_NAY, -lui - 1), r() < 0.5), lan(q, cong(HOM_NAY, -lui), false)], r() < 0.5 ? hanCu : null)
  }
  for (let i = 0; i < (kb.noChuaLich ?? 0); i++) them('h', i, 'cd', (q) => [lan(q, HOM_NAY, false)], han)
  for (let i = 0; i < (kb.dungMot ?? 0); i++) {
    const lui = 1 + Math.floor(r() * 5)
    them('d', i, 'cd', (q) => [lan(q, cong(HOM_NAY, -lui), true, r() < 0.2)], han)
  }
  for (let i = 0; i < (kb.thanhThao ?? 0); i++) {
    const lui = 6 + Math.floor(r() * 6)
    them('t', i, 'cd', (q) => [lan(q, cong(HOM_NAY, -lui - 2), true), lan(q, cong(HOM_NAY, -lui), true)], han)
  }
  for (let i = 0; i < (kb.duyTri ?? 0); i++) {
    const lui = 25 + Math.floor(r() * 30)
    them('u', i, 'duy_tri', (q) => [lan(q, cong(HOM_NAY, -lui - 3), true), lan(q, cong(HOM_NAY, -lui), true)], hanCu)
  }
  for (let i = 0; i < (kb.catTia ?? 0); i++) them('x', i, r() < 0.5 ? 'cd' : 'no_cu', (q) => [0, 1, 2, 3].map((k) => lan(q, cong(HOM_NAY, -6 + k), false)), han)
  // Trộn thứ tự đầu vào (tất định) — kế hoạch không được phụ thuộc thứ tự cau ngoài luật băm.
  for (let i = cau.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cau[i], cau[j]] = [cau[j]!, cau[i]!] }
  const tc: TuyChonKeHoach = { homNay: HOM_NAY, hanNop: han }
  if (kb.tranNgay != null) tc.tranNgay = kb.tranNgay
  if (kb.tranHuyet != null) tc.tranHuyetChien = kb.tranHuyet
  if (kb.raiDeu != null) tc.raiDeu = kb.raiDeu
  if (kb.tiLeNo != null) tc.tiLeNo = kb.tiLeNo
  if (kb.onVaoDao) tc.onVaoDao = true
  if (kb.moiDaLam != null) tc.moiDaLamHomNay = kb.moiDaLam
  if (kb.hang) {
    const dang = ['D0', 'D1', 'D2', 'D3', 'D4']
    if (kb.hang === 'chung') tc.hangChung = chon(HANG)
    else {
      tc.hangTheoDang = Object.fromEntries(dang.map((d) => [d, kb.hang === 'tron' ? chon(HANG) : kb.hang as HangEm]))
      tc.hangChung = kb.hang === 'tron' ? chon(HANG) : kb.hang as HangEm
    }
  }
  return { cau, tt, tc, daLam: kb.daLam ?? 0 }
}

const KICH_BAN: KichBan[] = [
  { ten: '01 chỉ câu mới D7 rải đều tắt', seed: 101, D: 7, moi: 60 },
  { ten: '02 chỉ câu mới D7 rải đều bật thể lực 49', seed: 102, D: 7, moi: 120, tranNgay: 49, raiDeu: true },
  { ten: '03 mới + nợ nhiều D5 rải đều bật', seed: 103, D: 5, moi: 30, noCd: 30, noCu: 6, tranNgay: 40, raiDeu: true },
  { ten: '04 mới + nợ nhiều D5 rải đều tắt', seed: 104, D: 5, moi: 30, noCd: 30, noCu: 6, tranNgay: 40, raiDeu: false },
  { ten: '05 ngày ôn D3 còn câu mới', seed: 105, D: 3, moi: 12, noCd: 18, dungMot: 10, thanhThao: 8, raiDeu: true },
  { ten: '06 hạn hôm nay D1', seed: 106, D: 1, moi: 5, noCd: 12, noChuaLich: 4, dungMot: 6, thanhThao: 6, raiDeu: true },
  { ten: '07 không chiến dịch: nợ cũ + duy trì', seed: 107, D: null, noCu: 25, duyTri: 20, tranNgay: 30 },
  { ten: '08 hạn đã qua', seed: 108, D: 'qua', moi: 10, noCd: 10, duyTri: 5, tranNgay: 40, raiDeu: true },
  { ten: '09 Huyết Chiến trần 80', seed: 109, D: 4, moi: 70, noCd: 40, dungMot: 20, tranNgay: 40, tranHuyet: 80, raiDeu: true },
  { ten: '10 Huyết Chiến bị tắt (trần = thể lực)', seed: 110, D: 4, moi: 70, noCd: 40, tranNgay: 40, tranHuyet: 40, raiDeu: false },
  { ten: '11 hạng trộn L1–L4', seed: 111, D: 8, moi: 90, noCd: 8, tranNgay: 40, raiDeu: true, hang: 'tron' },
  { ten: '12 hạng L4 toàn bộ', seed: 112, D: 6, moi: 60, tranNgay: 36, raiDeu: true, hang: 'L4' },
  { ten: '13 hạng L3 bậc thang', seed: 113, D: 9, moi: 100, noCd: 5, tranNgay: 40, raiDeu: false, hang: 'L3' },
  { ten: '14 nhịp riêng tiLeNo 0,8', seed: 114, D: 7, moi: 40, noCd: 35, noCu: 10, tranNgay: 40, raiDeu: true, tiLeNo: 0.8 },
  { ten: '15 kênh riêng onVaoDao', seed: 115, D: 6, moi: 20, noCd: 15, noCu: 5, thanhThao: 6, duyTri: 6, tranNgay: 40, raiDeu: true, onVaoDao: true },
  { ten: '16 lập lại giữa ngày (đã làm 10, mới đã làm 5)', seed: 116, D: 6, moi: 50, noCd: 12, tranNgay: 40, raiDeu: true, daLam: 10, moiDaLam: 5 },
  { ten: '17 duy trì vượt 20 %', seed: 117, D: 7, moi: 4, noCd: 2, duyTri: 40, tranNgay: 40, raiDeu: true },
  { ten: '18 củng cố câu đã thành thạo', seed: 118, D: 12, moi: 15, thanhThao: 25, dungMot: 12, tranNgay: 40, raiDeu: true },
  { ten: '19 cắt tỉa', seed: 119, D: 6, moi: 10, noCd: 10, catTia: 7, tranNgay: 30, raiDeu: true },
  { ten: '20 câu 2 sao ưu tiên nợ', seed: 120, D: 6, moi: 10, noCd: 30, noCu: 10, sao: 0.4, chua: true, tranNgay: 30, raiDeu: true },
  { ten: '21 rỗng', seed: 121, D: 5 },
  { ten: '22 chỉ cắt tỉa', seed: 122, D: null, catTia: 6 },
  { ten: '23 lớn: 150 mới + 60 nợ D10 hạng trộn', seed: 123, D: 10, moi: 150, noCd: 45, noCu: 15, dungMot: 20, thanhThao: 10, duyTri: 15, tranNgay: 45, tranHuyet: 90, raiDeu: true, hang: 'tron', tiLeNo: 0.6 },
  { ten: '24 chỉ hạng chung (đan xen theo sức)', seed: 124, D: 6, moi: 25, noCd: 20, tranNgay: 40, raiDeu: true, hang: 'chung' },
  { ten: '25 thể lực nhỏ 12', seed: 125, D: 5, moi: 20, noCd: 10, duyTri: 5, tranNgay: 12, raiDeu: true },
  { ten: '26 trộn tất cả + onVaoDao + Huyết Chiến', seed: 126, D: 3, moi: 40, noCd: 40, noCu: 20, thanhThao: 10, duyTri: 10, catTia: 3, tranNgay: 40, tranHuyet: 80, raiDeu: false, onVaoDao: true, hang: 'tron' },
  { ten: '27 nợ có "Thầy đã chữa"', seed: 127, D: null, noCu: 8, noCd: 12, chua: true, tranNgay: 40 },
  { ten: '28 vắng thể lực (mặc định 40/80)', seed: 128, D: 4, moi: 80, noCd: 30, dungMot: 30 },
  { ten: '29 hạng L1 dễ trước + nguồn ghi rõ', seed: 129, D: 7, moi: 45, noCd: 10, tranNgay: 40, raiDeu: true, hang: 'L1', nguonRo: true },
  { ten: '30 lập lại giữa ngày rải đều tắt', seed: 130, D: 8, moi: 30, noCd: 25, dungMot: 8, tranNgay: 40, raiDeu: false, daLam: 25, moiDaLam: 12 },
]

/** Đầu ra của một kịch bản, dạng chuỗi JSON (đúng thứ tự khoá của KeHoachNgay). */
function chayKichBan(kb: KichBan): string {
  const { cau, tt, tc, daLam } = dungKichBan(kb)
  return JSON.stringify(lapKeHoachNgay(cau, tt, tc, daLam))
}
// ---- HẾT BỘ SINH ----

/** JSON đầu ra của lapKeHoachNgay CŨ (trước OMNI 3) cho từng kịch bản. */
const KY_VONG: Record<string, string> = {
  '01 chỉ câu mới D7 rải đều tắt': '{"dao":["m24","m41","m1","m49","m32","m58","m21","m44","m50","m7","m30","m14","m5","m8","m53","m47","m20","m3","m13","m33","m0","m39","m51","m12","m25","m15","m27","m19","m40","m38","m52","m26","m10","m34","m45","m35","m4","m18","m55","m17"],"doan":[],"huyetChien":false,"khoiLuong":120,"sucChua":280,"D":7,"tran":40,"catTia":[],"raiDeu":false}',
  '02 chỉ câu mới D7 rải đều bật thể lực 49': '{"dao":["m83","m12","m102","m40","m41","m113","m18","m0","m117","m112","m79","m82","m44","m65","m53","m51","m24","m74","m14","m96","m25","m27","m47","m92","m35","m37","m6","m98","m7","m73"],"doan":[],"huyetChien":false,"khoiLuong":240,"sucChua":343,"D":7,"tran":49,"catTia":[],"raiDeu":true}',
  '03 mới + nợ nhiều D5 rải đều bật': '{"dao":["m29","n9","m6","n11","m12","m20","m2","n10","m1","n3","m17","m11","n22","m24","n1","m13","m4","c2","m5","m8","m27","m9"],"doan":["n14","n24","n7","c5","n5","n20","c3","n15","n18","n2","n4","n13","n27","c0","n17","n16","n6","n12"],"huyetChien":false,"khoiLuong":124,"sucChua":200,"D":5,"tran":40,"catTia":["n8","n29","n25","n26"],"raiDeu":true}',
  '04 mới + nợ nhiều D5 rải đều tắt': '{"dao":["n22","m20","m13","m24","m23","n29","m4","m21","m9","m6","m22","n14","m10","m15","m19","c0","m26","m25","m7","m29","c2","m17","m8","m27","m2"],"doan":["n11","n20","n3","n10","n25","n6","n2","n24","n16","n26","c5","n13","n12","n28","n17"],"huyetChien":false,"khoiLuong":120,"sucChua":200,"D":5,"tran":40,"catTia":["n21","n1","n27","n15","n8","n23"],"raiDeu":false}',
  '05 ngày ôn D3 còn câu mới': '{"dao":["m7","n13","m2","m4","m10","n6","m9","m5","m0","m11","t0","m8","m6","m3","m1"],"doan":["n14","n4","d9","t3","n5","n12","n3","n0","t4","n16","n10","d0","n7","n11","n8","d2","d5"],"huyetChien":false,"khoiLuong":58,"sucChua":120,"D":3,"tran":40,"catTia":["n15","n9","n1","n2","n17"],"raiDeu":true}',
  '06 hạn hôm nay D1': '{"dao":["m3","n3","m4","n11","m0","n2","m2","h0","m1"],"doan":["n10","h3","n7","d3","n5","n1","h2","n0","t5","d1","d0","n4","h1","n6","t0"],"huyetChien":true,"khoiLuong":41,"sucChua":40,"D":1,"tran":80,"catTia":["n9","n8"],"raiDeu":true}',
  '07 không chiến dịch: nợ cũ + duy trì': '{"dao":["c8","c0"],"doan":["c14","c24","c23","c2","c4","c16","u16","c9","c7","c15","u5","c6","c1","c21","u4","c10","c22","c3","c18","c20","u19","c17","c13","c5","u2","c11","c12","c19"],"huyetChien":false,"khoiLuong":0,"sucChua":30,"D":1,"tran":30,"catTia":[],"raiDeu":false}',
  '08 hạn đã qua': '{"dao":[],"doan":["n3","n9","u0","n7","u1","n8","n6","u2","n0","u3","n1"],"huyetChien":false,"khoiLuong":0,"sucChua":40,"D":1,"tran":40,"catTia":["n4","n5","n2"],"raiDeu":true}',
  '09 Huyết Chiến trần 80': '{"dao":["n18","m12","m48","m17","m56","m49","n10","m55","m44","m2","m13","m35","m1","n7","m20","m39","m67","m50","m47","n15","m36","m7","m18","m27","m66","n33","m40","m52","m38","m34","n6","m41","m14","m51","m69","m4","n22","m29","m24","m53","m37","m9","m26","m54","m25","m15","m60"],"doan":["n1","n38","n28","d3","n19","n26","n32","n36","n20","n13","n31","n9","n17","n3","n37","n39","n25","n35","n2","n24","d15","n8","n5","n16","d17","n23","n14","d9","n4","n27","n0","d0","n29"],"huyetChien":true,"khoiLuong":222,"sucChua":160,"D":4,"tran":80,"catTia":["n34","n11","n21","n30","n12"],"raiDeu":true}',
  '10 Huyết Chiến bị tắt (trần = thể lực)': '{"dao":["m54","n10","m50","m33","m11","m10","m27","n12","m31","m56","m20","m62","m5","n29","m35","m67","m52","m48","n36","m13","m24","m7","m29","m37"],"doan":["n3","n2","n33","n23","n35","n37","n27","n13","n28","n18","n8","n7","n24","n21","n11","n32"],"huyetChien":true,"khoiLuong":198,"sucChua":160,"D":4,"tran":40,"catTia":["n4","n22","n25","n39","n15","n34","n6","n30","n5","n9","n17"],"raiDeu":false}',
  '11 hạng trộn L1–L4': '{"dao":["m51","n0","m81","m24","m28","m15","m27","n6","m29","m54","m18","m26","m64","m78","m73","m6","m72","m14","m85","m71"],"doan":["n7","n1","n4","n2","n5"],"huyetChien":false,"khoiLuong":194,"sucChua":320,"D":8,"tran":40,"catTia":["n3"],"raiDeu":true}',
  '12 hạng L4 toàn bộ': '{"dao":["m37","m24","m41","m46","m30","m16","m31","m26","m1","m35","m14","m4","m7","m13","m49","m22","m51","m10","m58","m27"],"doan":[],"huyetChien":false,"khoiLuong":120,"sucChua":216,"D":6,"tran":36,"catTia":[],"raiDeu":true}',
  '13 hạng L3 bậc thang': '{"dao":["m13","n3","m12","m65","m27","m26","m37","m91","m43","m40","m41","m80","m33","m84","m49","m96","m73","m28","m51","m21","m7","m68","m23","m63","m97","m72","m75","m92","m56","m66","m2","m42","m93","m47","m1","m8","m62","m82"],"doan":["n2","n1"],"huyetChien":false,"khoiLuong":206,"sucChua":360,"D":9,"tran":40,"catTia":["n0","n4"],"raiDeu":false}',
  '14 nhịp riêng tiLeNo 0,8': '{"dao":["n23","m9","n19","m15","m29","m5","c8","m32","n15","m0","n5","m16","n11","m13"],"doan":["n12","n14","c5","n9","c4","n26","n28","n1","c1","c6","n21","n20","c7","n8","n13","n22","n29","c3","n7","n10","n17","n34","c9","n16","n32","n27"],"huyetChien":false,"khoiLuong":160,"sucChua":280,"D":7,"tran":40,"catTia":["n4","n18","n2","n30","n25"],"raiDeu":true}',
  '15 kênh riêng onVaoDao': '{"dao":["n10","c4","u0","c1","n9","c0","t0","c2","n1","u3","m13","n13","n7","u2","m1","n4","n5","u5","m7","n12","n6","m17","m5","n8","c3","m14","m2","n0"],"doan":[],"huyetChien":false,"khoiLuong":72,"sucChua":240,"D":6,"tran":40,"catTia":["n14","n3","n2","n11"],"raiDeu":true}',
  '16 lập lại giữa ngày (đã làm 10, mới đã làm 5)': '{"dao":["m20","m41","m29","m24","m26","m28","m36","m32","m47","m22","m6","m9","m31","m2"],"doan":["n7","n11","n1","n2","n10","n6","n0","n4"],"huyetChien":false,"khoiLuong":116,"sucChua":240,"D":6,"tran":40,"catTia":["n8","n3","n9","n5"],"raiDeu":true}',
  '17 duy trì vượt 20 %': '{"dao":["n0","m3","u24"],"doan":["u11","n1","u10","u25","u1","u18","u36","u37"],"huyetChien":false,"khoiLuong":12,"sucChua":280,"D":7,"tran":40,"catTia":[],"raiDeu":true}',
  '18 củng cố câu đã thành thạo': '{"dao":["d4","m7","m2","d10"],"doan":["t2","d8","t9","t19","t18","d5","t1","t13","t4","t0","d7","t17","t3","t7","t12"],"huyetChien":false,"khoiLuong":39,"sucChua":480,"D":12,"tran":40,"catTia":[],"raiDeu":true}',
  '19 cắt tỉa': '{"dao":["m8","n0","m9","m7","m0"],"doan":["n7","n5","n1","n3","n4"],"huyetChien":false,"khoiLuong":32,"sucChua":180,"D":6,"tran":30,"catTia":["n8","x2","n6","x5","x4","x3","x1","n2","n9","x6","x0"],"raiDeu":true}',
  '20 câu 2 sao ưu tiên nợ': '{"dao":["n21","n11","m6","c8","n24","n9","m0","c1","n13","m7","m1","n10"],"doan":["n17","n18","n22","c7","n3","c2","n26","n8","c4","c0","n12","c3","n19","n23","c6","n27","n16","n4"],"huyetChien":false,"khoiLuong":96,"sucChua":180,"D":6,"tran":30,"catTia":["n20","n25"],"raiDeu":true}',
  '21 rỗng': '{"dao":[],"doan":[],"huyetChien":false,"khoiLuong":0,"sucChua":200,"D":5,"tran":40,"catTia":[],"raiDeu":false}',
  '22 chỉ cắt tỉa': '{"dao":[],"doan":[],"huyetChien":false,"khoiLuong":0,"sucChua":40,"D":1,"tran":40,"catTia":["x2","x0","x1","x5","x4","x3"],"raiDeu":false}',
  '23 lớn: 150 mới + 60 nợ D10 hạng trộn': '{"dao":["m94","n35","m95","n32","m55","m138","m115","n7","m92","n24","m97","m139","m87","n38","m56","n2","m111","m28","m100","n6","m91","n4","m90","m118","m122","c5","m41","m38","c13","m50","m9","c1","c14","m116"],"doan":["n17","n23","c8","n14","t7","n12","n39","n16","c4","c12","u8","n29","n26","n27","c3","n18","t2","n43","n25","n13","d5","n15","t1","d16","n10","n40","u10","n8","u13","d17","n44","n42","u5","n1","u3","d8","n41","n9","u7","c7","u6","c0","n22","u4","c9","c10","u12","n28","n3","u2","c2","c6","u1","n19","n5","c11"],"huyetChien":true,"khoiLuong":412,"sucChua":450,"D":10,"tran":90,"catTia":["n30","n21","n37","n11","n34","n36","n33","n31","n0","n20"],"raiDeu":true}',
  '24 chỉ hạng chung (đan xen theo sức)': '{"dao":["m21","n15","m2","m12","m7","n5","m19","m16","m15","n0","m18","m5"],"doan":["n7","n13","n4","n8","n16","n11","n14","n2"],"huyetChien":false,"khoiLuong":72,"sucChua":240,"D":6,"tran":40,"catTia":["n17","n6","n9","n19","n3","n12","n1","n10","n18"],"raiDeu":true}',
  '25 thể lực nhỏ 12': '{"dao":["m6","n9","m2","m10","m18","m12","m11"],"doan":["n6","n1","n7","n0","n2"],"huyetChien":false,"khoiLuong":54,"sucChua":60,"D":5,"tran":12,"catTia":["n8","n4","n3"],"raiDeu":true}',
  '26 trộn tất cả + onVaoDao + Huyết Chiến': '{"dao":["n21","m25","c17","m32","n12","m14","n25","m39","c8","m20","n31","m6","n35","m12","c6","m34","n36","m3","n3","m21","c13","m38","n37","m31","n7","m10","c18","m22","n19","m27","n28","m36","n23","m29","n11","m16","n22","m15","n15","m17","n39","m18","n20","m37","n10","m9","n34","m5","n1","m4","c12","m1","n4","m30","m8","n18","m19","c11","m23","c15","m35","n13","c16","m24","m28","n30","n33","m13","n9","m0","m33","c2","m2","c10","m11","n5","m7","m26","c3","n17"],"doan":[],"huyetChien":true,"khoiLuong":176,"sucChua":120,"D":3,"tran":80,"catTia":["n8","n26","x2","n24","n0","n38","x1","n6","n29","n32","x0","n2","n27","n16","n14"],"raiDeu":false}',
  '27 nợ có \"Thầy đã chữa\"': '{"dao":["n1","n4","c2","c4","n9"],"doan":["n2","n8","c6","c3","n10","n7","n3","c0","c5","c1","n6","n11","n0","c7","n5"],"huyetChien":false,"khoiLuong":0,"sucChua":40,"D":1,"tran":40,"catTia":[],"raiDeu":false}',
  '28 vắng thể lực (mặc định 40/80)': '{"dao":["m26","n16","m52","m55","m51","m13","m64","n13","m33","m34","m11","m54","m31","n17","m75","m47","m20","m4","m32","n1","m3","m73","m60","m0","n6","m43","m69","m24","m50","m22","n23","m53","m27","m7","m68","m63","n22","m9","m57","m79","m59","m77","m18","m65","m21","m62","m5","m42","m29","m49","m36","m66"],"doan":["n3","n11","n2","d28","n5","n0","n7","d18","n27","n28","d16","n26","n19","n18","d1","n10","n20","n14","d7","n8","n25","n9","d12","d8","n12","n24","d13","d25"],"huyetChien":true,"khoiLuong":231,"sucChua":160,"D":4,"tran":80,"catTia":["n29","n21","n15","n4"],"raiDeu":false}',
  '29 hạng L1 dễ trước + nguồn ghi rõ': '{"dao":["m22","n3","m37","m12","m36","n2","m41","m18","m35","n1","m25","m6","m5","n7","m16","m32"],"doan":["n9","n6","n0","n8","n4"],"huyetChien":false,"khoiLuong":108,"sucChua":280,"D":7,"tran":40,"catTia":["n5"],"raiDeu":true}',
  '30 lập lại giữa ngày rải đều tắt': '{"dao":["m8","n5","m27","m20","m10","m9","m5","m13","m22"],"doan":["n20","n17","n22","n18","n11","n9"],"huyetChien":false,"khoiLuong":100,"sucChua":320,"D":8,"tran":40,"catTia":["n1","n0","n3","n24","n4","n6","n2"],"raiDeu":false}',
}

describe('OMNI 3 · lapKeHoachNgay vắng tham số mới ⇒ JSON y hệt bản cũ (chốt hành vi)', () => {
  it('có ≥ 20 kịch bản, mỗi kịch bản có giá trị kỳ vọng', () => {
    expect(KICH_BAN.length).toBeGreaterThanOrEqual(20)
    expect(new Set(KICH_BAN.map((k) => k.ten)).size).toBe(KICH_BAN.length)
    for (const kb of KICH_BAN) expect(KY_VONG[kb.ten], kb.ten).toBeTypeOf('string')
  })
  for (const kb of KICH_BAN) {
    it(kb.ten, () => {
      expect(chayKichBan(kb)).toBe(KY_VONG[kb.ten])
    })
  }
  it('sinh lại hai lần cùng kịch bản ⇒ cùng đầu vào, cùng đầu ra (tất định)', () => {
    for (const kb of KICH_BAN) expect(chayKichBan(kb)).toBe(chayKichBan(kb))
  })
})

describe('OMNI 3 · trường mới mang giá trị TRUNG TÍNH ⇒ kế hoạch y hệt bản cũ', () => {
  const coCd = KICH_BAN.filter((k) => k.D === null || k.D === 'qua' || k.D >= 5) // D ≤ 4: luật "câu mới bắt buộc giữ chỗ" của nhiều bài khác đường cũ (có chủ ý)
  it('đủ kịch bản để so', () => expect(coCd.length).toBeGreaterThanOrEqual(20))
  for (const kb of coCd) {
    it(`một chiến dịch qua chienDich (cd trên câu) ⇒ y hệt hanNop — ${kb.ten}`, () => {
      const { cau, tt, tc, daLam } = dungKichBan(kb)
      const cauCd = cau.map((c) => ((c.nguon ?? 'chien_dich') === 'chien_dich' ? { ...c, cd: 'CD-1' } : c))
      const ds = tc.hanNop ? [{ id: 'CD-1', hanNop: tc.hanNop, theLucNgay: tc.tranNgay ?? 40, raiDeu: tc.raiDeu === true }] : []
      const { moiTheoCd, ...conLai } = lapKeHoachNgay(cauCd, tt, { ...tc, tranHuyetChien: tc.tranHuyetChien ?? 80, chienDich: ds }, daLam)
      expect(JSON.stringify(conLai)).toBe(KY_VONG[kb.ten])
      if (ds.length && tc.hanNop! >= '2026-10-05') expect(Object.keys(moiTheoCd ?? {})).toEqual(['CD-1'])
    })
  }
  for (const kb of KICH_BAN) {
    it(`onBaiCu rỗng / dangVung rỗng / cheDoCho khi có chiến dịch ⇒ y hệt — ${kb.ten}`, () => {
      const { cau, tt, tc, daLam } = dungKichBan(kb)
      const { onBaiCu, ...conLai } = lapKeHoachNgay(cau, tt, { ...tc, onBaiCu: [], dangVung: [] }, daLam)
      expect(onBaiCu).toEqual([])
      expect(JSON.stringify(conLai)).toBe(KY_VONG[kb.ten])
      if (tc.hanNop && tc.hanNop >= '2026-10-05') expect(JSON.stringify(lapKeHoachNgay(cau, tt, { ...tc, cheDoCho: { theLuc: 24 } }, daLam))).toBe(KY_VONG[kb.ten])
    })
  }
})
