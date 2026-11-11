// DỮ LIỆU GIẢ đúng hợp đồng Xem lại Live (src/lib/live/xem-lai-kieu.ts) — dùng chung cho test `live-xem-lai-hs-*-1111` và trang chụp
// `scripts/chup-live-xem-lai-hs-1111`. KHÔNG có dữ liệu học sinh thật: lớp 12A1 giả, Bài 8. Amine (đúng bộ số của bản vẽ docs/ban-ve-live-xem-lai-1011).
// Nét là NÉT THẬT của bộ máy bút: mã hoá bằng `maNetXong` / `maBangMoi` / `maXoaHet` rồi đóng `net.bin` bằng `ghiNetBin` — y như máy chủ sẽ ghi.
import type { DiemBut, NetBut } from '../src/lib/but-bang-loi'
import { maBangMoi, maNetXong, maXoaHet, maXoaNet } from '../src/lib/live/ma-net'
import { DAU_BAN_GHI_NET, ghiNetBin, type BuoiLiveJson, type CauBuoiLive, type DoanBuoiLive, type KhoangMs, type TraLiveBuoiHs, type TraLiveDsHs } from '../src/lib/live/xem-lai-kieu'
import { VUNG_MAC_DINH, maTrang } from '../src/components/live/bo-cuc'

const PHUT = 60_000
/** Số ngẫu nhiên có hạt (mulberry32) ⇒ cùng hạt ra cùng dữ liệu. */
function taoRng(hat: number): () => number {
  let a = hat >>> 0
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const PHAN = '#f4efe4', VANG = '#fdd663', LAM = '#c2e7ff'
/** Ô bảng đen trên cửa sổ thầy (0..1). */
const B = { x0: VUNG_MAC_DINH.bang[0] + 0.012, x1: VUNG_MAC_DINH.bang[2] - 0.012, y0: VUNG_MAC_DINH.bang[1] + 0.04, y1: VUNG_MAC_DINH.bang[3] - 0.04 }

/** Một đường qua các mốc (x, y) ⇒ điểm của bộ máy bút: chia nhỏ mỗi chặng, giờ tăng 14–18 ms, lực 0,45–0,8. */
function duong(moc: [number, number][], rng: () => number, buoc = 6): DiemBut[] {
  const ra: DiemBut[] = []
  let t = 0
  for (let i = 0; i + 1 < moc.length; i++) {
    const [ax, ay] = moc[i]!, [bx, by] = moc[i + 1]!
    for (let k = i === 0 ? 0 : 1; k <= buoc; k++) {
      const f = k / buoc
      ra.push([+(ax + (bx - ax) * f).toFixed(5), +(ay + (by - ay) * f).toFixed(5), +(0.45 + 0.35 * Math.sin((ra.length + 1) / 5) ** 2).toFixed(2), t])
      t += 14 + Math.floor(rng() * 5)
    }
  }
  return ra
}
/** Một «chữ» viết tay: vòng lượn kiểu chữ thường (e, l, o, m, n, u…) trong ô rộng `w`, cao `h` tại (x, y = dòng kẻ). */
function chu(x: number, y: number, w: number, h: number, rng: () => number): DiemBut[] {
  const kieu = Math.floor(rng() * 4), moc: [number, number][] = []
  const n = 10
  for (let i = 0; i <= n; i++) {
    const f = i / n, goc = f * Math.PI * 2
    if (kieu === 0) moc.push([x + w * (0.5 - 0.5 * Math.cos(goc) * (1 - f * 0.2)), y - h * (0.5 + 0.5 * Math.sin(goc))]) // vòng «o / e»
    else if (kieu === 1) moc.push([x + w * f, y - h * Math.abs(Math.sin(goc * 1.5)) * (1.5 - f * 0.4)]) // «l / h» cao
    else if (kieu === 2) moc.push([x + w * f, y - h * (0.5 + 0.5 * Math.sin(goc * 1.5 - Math.PI / 2))]) // «m / n / u»
    else moc.push([x + w * (f + 0.12 * Math.sin(goc * 2)), y - h * (0.35 + 0.45 * Math.sin(goc))]) // nét lượn
  }
  return duong(moc, rng, 3)
}
interface NetCoGio { tre: number; net: NetBut }
/** Bài chữa trên bảng: `soNet` nét — dòng tiêu đề vàng có gạch chân, các dòng chữ phấn trắng, mũi tên xanh, ô đóng khung kết quả. */
function baiChua(ma: string, soNet: number, rng: () => number): NetCoGio[] {
  const ds: NetCoGio[] = [], rong = B.x1 - B.x0
  let dem = 0, dong = 0, x = B.x0
  const them = (diem: DiemBut[], mau: string, tre: number, co = 3.2): void => { ds.push({ tre, net: { id: `${ma}-n${++dem}`, cong: 'but', mau, co, diem } }) }
  while (dem < soNet) {
    const y = B.y0 + 0.062 + dong * 0.072
    if (y > B.y1 - 0.02) { dong = 0; x = B.x0; continue } // (bảng giả không cuộn: viết đè lại từ đầu — dữ liệu thật sẽ có «bảng mới»)
    const conLai = soNet - dem
    if (dong === 0 && x === B.x0) {
      // tiêu đề 4 chữ vàng + gạch chân
      for (let i = 0; i < 4 && dem < soNet - 1; i++) them(chu(B.x0 + i * rong * 0.16, y, rong * 0.13, 0.04, rng), VANG, i ? 180 : 600)
      them(duong([[B.x0, y + 0.012], [B.x0 + rong * 0.66, y + 0.008]], rng, 10), VANG, 260, 3.6)
      dong = 1; continue
    }
    if (conLai === 1) { // ô đóng khung kết quả
      const yb = y + 0.01
      them(duong([[B.x0 + rong * 0.2, yb - 0.05], [B.x0 + rong * 0.8, yb - 0.05], [B.x0 + rong * 0.8, yb + 0.012], [B.x0 + rong * 0.2, yb + 0.012], [B.x0 + rong * 0.2, yb - 0.05]], rng, 8), VANG, 900, 3.6)
      break
    }
    if (dong % 3 === 2 && x === B.x0) { // mũi tên xanh đầu dòng
      them(duong([[B.x0 + rong * 0.02, y - 0.02], [B.x0 + rong * 0.12, y - 0.02]], rng, 6), LAM, 700)
      if (dem < soNet - 1) them(duong([[B.x0 + rong * 0.09, y - 0.034], [B.x0 + rong * 0.12, y - 0.02], [B.x0 + rong * 0.09, y - 0.006]], rng, 3), LAM, 150)
      x = B.x0 + rong * 0.17; continue
    }
    const w = rong * (0.07 + rng() * 0.05)
    if (x + w > B.x1) { dong += 1; x = B.x0; continue }
    them(chu(x, y, w, 0.03 + rng() * 0.012, rng), PHAN, x === B.x0 ? 1400 + rng() * 2600 : 160 + rng() * 420)
    x += w + rong * 0.03
  }
  return ds
}
const daiNet = (n: NetBut): number => (n.diem.length ? n.diem[n.diem.length - 1]![3] : 0)

const CAU: { de: string; phan: 'I' | 'II' | 'III'; pa?: string[]; dung: string; lop: number; len: string; sbd: string; doi: number; dat: boolean; giay: number; dang: string; net: number; hay?: string }[] = [
  { de: 'Chất nào sau đây là amine bậc hai?', phan: 'I', pa: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], dung: 'B', lop: 82, len: 'Nguyễn Gia Huy', sbd: 'G012', doi: 0, dat: true, giay: 252, dang: 'Bậc của amine', net: 21 },
  { de: 'Dung dịch chất nào sau đây làm quỳ tím chuyển sang màu xanh?', phan: 'I', pa: ['Aniline', 'Methylamine', 'Glycine', 'Phenol'], dung: 'B', lop: 71, len: 'Lê Thu Trang', sbd: 'G031', doi: 3, dat: true, giay: 338, dang: 'Tính base của amine', net: 34 },
  { de: 'Cho 9,3 gam aniline (C6H5NH2) tác dụng vừa đủ với dung dịch HCl. Khối lượng muối thu được là bao nhiêu gam?', phan: 'III', dung: '12,95', lop: 46, len: 'Trần Minh Anh', sbd: 'G007', doi: 1, dat: false, giay: 527, dang: 'Amine tác dụng với acid', net: 64, hay: 'cả lớp sai nhiều nhất' },
  { de: 'Đốt cháy hoàn toàn 0,1 mol methylamine (CH3NH2), thu được bao nhiêu mol khí N2?', phan: 'III', dung: '0,05', lop: 64, len: 'Phạm Đức Long', sbd: 'G045', doi: 2, dat: true, giay: 305, dang: 'Đốt cháy amine', net: 38 },
  { de: 'Tên thay thế của CH3–CH2–NH2 là', phan: 'I', pa: ['methanamine', 'ethanamine', 'propan-1-amine', 'N-methylmethanamine'], dung: 'B', lop: 88, len: 'Vũ Hà My', sbd: 'G058', doi: 1, dat: true, giay: 303, dang: 'Danh pháp amine', net: 19 },
]
export const SO_EM_GIA = 150
export const ID_BUOI_GIA = 'buoi-gia-1011'

export interface BuoiGia { buoi: BuoiLiveJson; net: Uint8Array<ArrayBuffer>; /** Khoảng CÓ tiếng (ms) — bộ sinh tệp tiếng giả phát tiếng ở các khoảng này, im ở khoảng lặng. */ coTieng: KhoangMs[] }
/** Một buổi live giả trọn vẹn: `buoi.json` + `net.bin` khớp nhau (mốc bảng trỏ đúng byte). `giayToi` = giấy đề tối. */
export function taoBuoiGia(tuy: { giayToi?: boolean; coTieng?: boolean; id?: string; ban?: number } = {}): BuoiGia {
  const rng = taoRng(20261110), giayToi = !!tuy.giayToi
  type Muc = { t: number; khung: Uint8Array }
  const muc: Muc[] = [], moc: Muc[] = []
  const mocMoi = (t: number, khung: Uint8Array): void => { const m = { t, khung }; muc.push(m); moc.push(m) }
  const cau: CauBuoiLive[] = [], doan: DoanBuoiLive[] = [], lang: KhoangMs[] = [], emNoi: BuoiLiveJson['emNoi'] = []
  let t = 5 * PHUT // 5 phút đầu buổi: thầy mở live, lớp ổn định
  // trang đầu buổi (bảng trống)
  mocMoi(0, maBangMoi(maTrang('mo-dau', VUNG_MAC_DINH, giayToi), 16 / 9))
  CAU.forEach((c, k) => {
    const so = k + 1, luot = so + 2 // (số lượt của phòng không trùng số câu: hai lượt đầu buổi thầy bỏ)
    const t0Cau = t, lamBai = 171_000
    // thầy mở câu ⇒ «bảng mới»
    mocMoi(t0Cau, maBangMoi(maTrang(`cau-${so}`, VUNG_MAC_DINH, giayToi), 16 / 9))
    const t0 = t0Cau + lamBai, t1 = t0 + c.giay * 1000
    // nét của đoạn chữa: rải đều trong đoạn, chừa một khoảng lặng dài ở giữa (câu 3: 43 giây ⇒ «Đã lược 0:42 khoảng lặng»)
    const net = baiChua(`c${so}`, c.net, rng)
    const langDai = so === 3 ? 43_000 : 9_000 + Math.floor(rng() * 6000)
    const tongNet = net.reduce((s, n) => s + n.tre + daiNet(n.net), 0)
    const gian = (c.giay * 1000 - 9000 - langDai) / tongNet // giãn / nén nhịp viết cho vừa đoạn
    let g = t0 + 5000
    const giua = Math.floor(net.length * 0.55)
    net.forEach((n, i) => {
      g += n.tre * gian
      if (i === giua) {
        lang.push([Math.round(g + 500), Math.round(g + langDai - 500)])
        g += langDai
        // câu 3: giữa đoạn thầy xoá hết bảng rồi viết tiếp ⇒ có một mốc «xoá hết» (không mang khoá trang)
        if (so === 3) mocMoi(Math.round(g - 400), maXoaHet())
      }
      for (const kh of maNetXong(n.net)) muc.push({ t: Math.round(g), khung: kh })
      // câu 2: thầy tẩy một nét vừa viết
      if (so === 2 && i === 9) for (const kh of maXoaNet(n.net.id)) muc.push({ t: Math.round(g + daiNet(n.net) + 1200), khung: kh })
      g += daiNet(n.net) * Math.max(1, gian)
    })
    emNoi.push({ ten: c.len, doi: c.doi, t0: t0 + 20_000, t1: t0 + 20_000 + 14_000 + so * 2000 })
    const soDung = Math.round((c.lop / 100) * SO_EM_GIA)
    cau.push({
      so, luot, qid: `GIA-12-C3-B8-${so}`, phan: c.phan, tuLuan: false, dang: c.dang, bai: 'Bài 8. Amine',
      cau: { qid: `GIA-12-C3-B8-${so}`, maDe: 'GIA', version: '1', group: `g${so}`, phan: c.phan, text: c.de, choices: c.pa ?? [], ideas: [], hinhAnh: [], dang: null, tenDang: c.dang, mucDo: so === 3 ? 'VD' : 'TH', sao: null, kienThuc: [], ...(c.phan === 'III' ? { soO: c.dung.length } : {}) },
      dung: c.dung, giai: so === 5 ? null : { solution: so === 3 ? 'n(aniline) = 9,3 : 93 = 0,1 mol.\nC6H5NH2 + HCl → C6H5NH3Cl\nBảo toàn: n(muối) = n(aniline) = 0,1 mol ⇒ m = 0,1 × 129,5 = 12,95 gam.' : `Đáp án đúng: ${c.dung}.`, anh: [] },
      soDung, soGui: SO_EM_GIA, t0: t0Cau, t1,
    })
    const hai = tenHaiChu(c.len)
    doan.push({ stt: so, loai: 'len_bang', cau: so, luot, ten: `Câu ${so} · ${c.dang} · ${hai} lên bảng`, lenBang: { sbd: c.sbd, ten: hai, doi: c.doi, dat: c.dat }, t0, t1, giayCoTieng: Math.round(c.giay - langDai / 1000), soNet: c.net, dangXem: c.hay ?? null, phan: 1 })
    t = t1
  })
  const msLive = t + 15_000
  // đóng net.bin + tính byte của từng mốc
  muc.sort((a, b) => a.t - b.t) // (sắp xếp ổn định: cùng giờ giữ thứ tự ghi)
  const net = ghiNetBin(muc)
  const byteCua = new Map<Muc, number>()
  { let o = 0; for (const m of muc) { byteCua.set(m, o); o += DAU_BAN_GHI_NET + m.khung.length } }
  const coTieng: KhoangMs[] = []
  { let o = 0; for (const k of lang) { coTieng.push([o, k[0]]); o = k[1] } coTieng.push([o, msLive]) }
  const buoi: BuoiLiveJson = {
    v: 1, id: tuy.id ?? ID_BUOI_GIA, ban: tuy.ban ?? 1, ngay: '2026-11-10', lop: '12A1', batLuc: '2026-11-10T12:34:00.000Z', tatLuc: '2026-11-10T13:22:00.000Z',
    tenTuDong: 'Bài 8. Amine', tenThay: null, giayToi, coTieng: tuy.coTieng !== false, msLive, msDoan: doan.reduce((s, d) => s + d.t1 - d.t0, 0),
    byteTieng: tuy.coTieng === false ? 0 : Math.round((msLive / 1000) * 6000), byteNet: net.length, cau, doan, lang, emNoi,
    mocBang: moc.map((m) => ({ t: m.t, byte: byteCua.get(m)! })),
    bangVang: {
      doi: [{ ten: 'Đội Natri', kj: 2180 }, { ten: 'Đội Kali', kj: 2450 }, { ten: 'Đội Đồng', kj: 1960 }, { ten: 'Đội Canxi', kj: 2240 }], doiThang: 1,
      top: [{ ten: 'Vũ Hà My', doi: 1, kj: 620 }, { ten: 'Nguyễn Gia Huy', doi: 0, kj: 580 }, { ten: 'Lê Thu Trang', doi: 3, kj: 540 }], chuoi: { ten: 'Vũ Hà My', doi: 1, so: 5 },
    },
  }
  return { buoi, net, coTieng }
}
const tenHaiChu = (ten: string): string => ten.trim().split(/\s+/).slice(-2).join(' ')

/** Kết quả riêng của em «Trần Minh Anh» (giả): sai câu 3, lên bảng câu 3. Khoá theo SỐ LƯỢT của phòng. */
export function taoRiengGia(buoi: BuoiLiveJson, ve = 've-gia'): TraLiveBuoiHs {
  const ketQua: TraLiveBuoiHs['ketQua'] = {}
  for (const c of buoi.cau) ketQua[c.luot] = { dung: c.so !== 3 }
  return { id: buoi.id, ban: buoi.ban, ve, ketQua, lenBang: buoi.cau.filter((c) => c.so === 3).map((c) => c.luot) }
}
/** Danh sách 5 buổi của lớp 12A1 (giả), mới nhất trước — đúng bộ số của bản vẽ 05–08. */
export function taoDsGia(buoi: BuoiLiveJson, ve: string | null = 've-gia'): TraLiveDsHs {
  const cu = (id: string, ngay: string, ten: string, soCau: number, phut: number): TraLiveDsHs['buoi'][number] =>
    ({ id, ngay, lop: '12A1', batLuc: `${ngay}T12:31:00.000Z`, tenTuDong: ten, tenThay: null, soCau, soDoan: soCau, giayLive: phut * 60, giayDoan: Math.round(phut * 36), trangThai: 'xong', tienDo: 100, ban: 1, lenBang: [], ve })
  return { buoi: [
    { id: buoi.id, ngay: buoi.ngay, lop: buoi.lop, batLuc: buoi.batLuc, tenTuDong: buoi.tenTuDong, tenThay: buoi.tenThay, soCau: buoi.cau.length, soDoan: buoi.doan.length, giayLive: Math.round(buoi.msLive / 1000), giayDoan: Math.round(buoi.msDoan / 1000), trangThai: 'xong', tienDo: 100, ban: buoi.ban, lenBang: [3], ve },
    cu('buoi-gia-0711', '2026-11-07', 'Bài 7. Ôn tập chương 2', 6, 52),
    cu('buoi-gia-0311', '2026-11-03', 'Bài 6. Tinh bột và cellulose', 4, 37),
    cu('buoi-gia-3110', '2026-10-31', 'Bài 5. Saccharose và maltose', 5, 44),
    cu('buoi-gia-2710', '2026-10-27', 'Bài 4. Giới thiệu về carbohydrate. Glucose và fructose', 7, 58),
  ] }
}
/** Tệp tiếng giả (WAV 8 kHz, 8 bit, mono): tiếng «nói» là âm rung nhỏ ở khoảng có tiếng, im ở khoảng lặng. Máy chủ thật trả MP3; `<audio>` phát được cả hai. */
export function taoTiengGia(msLive: number, coTieng: readonly KhoangMs[]): Uint8Array<ArrayBuffer> {
  const HZ = 8000, n = Math.ceil((msLive / 1000) * HZ), b = new Uint8Array(44 + n), dv = new DataView(b.buffer)
  const chu = (o: number, s: string): void => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i) }
  chu(0, 'RIFF'); dv.setUint32(4, 36 + n, true); chu(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true)
  dv.setUint32(24, HZ, true); dv.setUint32(28, HZ, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true); chu(36, 'data'); dv.setUint32(40, n, true)
  b.fill(128, 44)
  for (const [a, z] of coTieng) {
    const i0 = Math.floor((a / 1000) * HZ), i1 = Math.min(n, Math.floor((z / 1000) * HZ))
    for (let i = i0; i < i1; i++) { const s = i / HZ, nhip = 0.5 + 0.5 * Math.sin(s * 5.2); b[44 + i] = 128 + Math.round(10 * nhip * Math.sin(2 * Math.PI * (150 + 40 * Math.sin(s * 1.7)) * s)) }
  }
  return b
}
