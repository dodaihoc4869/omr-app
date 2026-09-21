// DỮ LIỆU GIẢ có hạt giống cố định cho bản vẽ, kiểm thử và chụp ảnh (KHÔNG dùng ở màn thật: màn thật chỉ nhận `/gv/bang-tin-song`).
// Sinh ra ĐÚNG hợp đồng `DuLieuSan` và các số KHỚP nhau (tổng lớp = câu đã làm; ô nhiệt = em đã học) — cùng luật với `chotSo`.
import type { DuLieuSan, EmNhiet, LopSan, NenSan, TinSan } from './kieu'

const PHUT = 60_000
const NEN_MS = 5 * PHUT
const GIO_VN_MS = 7 * 3_600_000

function taoNgauNhien(h0: number): () => number {
  let h = h0 | 0
  return () => {
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Chia số nguyên `tong` theo trọng số, tổng khớp tuyệt đối (phần dư chia cho số dư thập phân lớn nhất). */
export function chiaNguyen(tong: number, ws: readonly number[]): number[] {
  const s = ws.reduce((a, b) => a + b, 0) || 1
  const tho = ws.map((w) => (tong * w) / s)
  const kq = tho.map(Math.floor)
  const du = tong - kq.reduce((a, b) => a + b, 0)
  const tt = tho.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0])
  for (let k = 0; k < du; k++) kq[tt[k % tt.length]![1]]!++
  return kq
}

const LOP = [
  { ten: 'Khối 10', siSo: 62, hoc: 7, cau: 212, dung: 180 },
  { ten: 'Khối 11', siSo: 71, hoc: 9, cau: 298, dung: 247 },
  { ten: '12 - Tinh Hoa', siSo: 38, hoc: 7, cau: 247, dung: 227 },
  { ten: '12 - Lớp Thường', siSo: 54, hoc: 6, cau: 231, dung: 199 },
  { ten: '12 - Nhóm 10 điểm', siSo: 27, hoc: 4, cau: 131, dung: 123 },
  { ten: 'Chưa xếp lớp', siSo: 12, hoc: 1, cau: 23, dung: 18 },
]
// TÊN GIẢ RÕ RÀNG: đệm luôn là "Mẫu" (Nguyễn Mẫu An…) ⇒ không bao giờ trùng tên học sinh thật (Boss 21/09: ảnh/tài liệu không được lộ em thật).
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Phan', 'Trịnh', 'Mai']
const TEN = ['An', 'Lâm', 'Nhi', 'Khôi', 'Vân', 'Đăng', 'Trúc', 'Phúc', 'Quỳnh', 'Sơn', 'Chi', 'Nam', 'Uyên', 'Tùng', 'Hà', 'Long', 'My', 'Kiên', 'Thư', 'Duy']

export function taoDuLieuGia(nowMs: number, hatGiong = 20260921): DuLieuSan {
  const rnd = taoNgauNhien(hatGiong)
  const chon = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]!
  const gauss = (): number => (rnd() + rnd() + rnd() + rnd() - 2) / 0.577
  const kep = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v))

  // mốc 12:00 giờ VN của ngày `nowMs`
  const ngayVN = Math.floor((nowMs + GIO_VN_MS) / 86_400_000) * 86_400_000 - GIO_VN_MS
  const mocMs = ngayVN + 12 * 3_600_000

  // 264 em, tên giả; mỗi lớp chọn `hoc` em đã học và chia số câu / số đúng của lớp cho các em ấy
  const daCo = new Set<string>()
  const nhiet: EmNhiet[] = []
  const theoLop: LopSan[] = []
  LOP.forEach((lop, li) => {
    const dau = nhiet.length
    for (let i = 0; i < lop.siSo; i++) {
      let khoa = ''
      let hoTen = ''
      do {
        const ho = chon(HO)
        const ten = chon(TEN)
        khoa = ho + ten
        hoTen = `${ho} Mẫu ${ten}`
      } while (daCo.has(khoa))
      daCo.add(khoa)
      nhiet.push({ sbd: `S${String(nhiet.length + 1).padStart(4, '0')}`, hoTen, lop: lop.ten, soCau: 0, soCauDung: 0, dangVap: false })
    }
    const chiSo: number[] = []
    while (chiSo.length < lop.hoc) {
      const k = dau + Math.floor(rnd() * lop.siSo)
      if (!chiSo.includes(k)) chiSo.push(k)
    }
    const cauArr = chiaNguyen(lop.cau - 3 * lop.hoc, chiSo.map(() => 0.35 + rnd())).map((v) => v + 3)
    const dungArr = chiaNguyen(lop.dung, cauArr.map((c) => c * (1 + 0.06 * gauss())))
    for (let i = 0; i < dungArr.length; i++) {
      while (dungArr[i]! > cauArr[i]!) {
        dungArr[i]!--
        const j = dungArr.findIndex((d, k) => d < cauArr[k]!)
        dungArr[j]!++
      }
    }
    chiSo.forEach((k, i) => {
      nhiet[k]!.soCau = cauArr[i]!
      nhiet[k]!.soCauDung = dungArr[i]!
    })
    theoLop.push({ lop: lop.ten, siSo: lop.siSo, daHoc: lop.hoc, soCau: lop.cau, soCauDung: lop.dung })
    void li
  })
  // vài em đang vấp (viền đỏ trên bản đồ nhiệt): em đã học có tỉ lệ đúng thấp nhất mỗi lớp
  LOP.forEach((lop) => {
    const em = nhiet.filter((e) => e.lop === lop.ten && e.soCau > 0).sort((a, b) => a.soCauDung / a.soCau - b.soCauDung / b.soCau)
    if (em[0]) em[0].dangVap = true
  })

  const soCau = theoLop.reduce((t, l) => t + l.soCau, 0)
  const soCauDung = theoLop.reduce((t, l) => t + l.soCauDung, 0)
  const soEmHoc = theoLop.reduce((t, l) => t + l.daHoc, 0)
  const tongEm = theoLop.reduce((t, l) => t + l.siSo, 0)

  // nến 5 phút từ mốc tới bây giờ; số câu các nến cộng đúng bằng `soCau`
  const batDauCuoi = Math.floor(nowMs / NEN_MS) * NEN_MS
  const n = Math.max(0, Math.round((batDauCuoi - mocMs) / NEN_MS))
  const ws: number[] = []
  for (let i = 0; i <= n; i++) {
    let w = (0.25 + 3.2 * Math.pow(n > 0 ? i / n : 1, 2.2)) * (0.8 + rnd() * 0.4)
    if (i === n) w *= Math.max(0.05, (nowMs - batDauCuoi) / NEN_MS)
    ws.push(w)
  }
  const vol = chiaNguyen(soCau, ws)
  const nen: NenSan[] = []
  let c = 83.4
  const tiLeCuoi = (soCauDung / soCau) * 100
  for (let i = 0; i <= n; i++) {
    const o = c
    c = kep(o + gauss() * 1.7 + (87.2 - o) * 0.16, 74, 96)
    if (i === n) c = tiLeCuoi
    const h = Math.max(o, c) + Math.abs(gauss()) * 0.9 + 0.2
    const l = Math.min(o, c) - Math.abs(gauss()) * 0.9 - 0.2
    nen.push({ tu: mocMs + i * NEN_MS, mo: o, cao: h, thap: l, dong: c, soCau: vol[i]! })
  }

  // chuỗi 60 phút cho 4 đường tia
  const bac = (cuoi: number, soBuoc: number): number[] => {
    const a = new Array<number>(60).fill(0)
    for (let k = 0; k < soBuoc; k++) a[1 + Math.floor(rnd() * 59)]!++
    let v = cuoi - soBuoc
    return a.map((d) => (v += d))
  }
  const luyKe = (t: number): number => {
    let s = 0
    for (const x of nen) {
      const het = x.tu + NEN_MS
      if (het <= t) s += x.soCau
      else if (x.tu < t) s += (x.soCau * (t - x.tu)) / (Math.min(het, nowMs) - x.tu)
    }
    return s
  }
  const cauTia = Array.from({ length: 60 }, (_, k) => Math.round(luyKe(nowMs - (59 - k) * PHUT)))
  cauTia[59] = soCau
  let v = 86.4
  const th = Array.from({ length: 60 }, () => (v += gauss() * 0.035))
  const dich = tiLeCuoi - th[59]!
  const tileTia = th.map((x, k) => x + (dich * k) / 59)
  const dungNhip = { soEm: 59, soCoLo: 59 }

  const tenEm = (e: EmNhiet): string => e.hoTen
  const dangHoc = nhiet.filter((e) => e.soCau > 0)
  const tin: TinSan[] = [
    { luc: nowMs - 9 * PHUT, loai: 'len', chu: tenEm(dangHoc[0]!), phu: `· ${dangHoc[0]!.lop} · đúng 5 câu liền` },
    { luc: nowMs - 8 * PHUT, loai: 'cham', chu: 'Khối 11', phu: '· 3 em vừa xong chặng 2, đúng nhịp' },
    { luc: nowMs - 7 * PHUT, loai: 'xuong', chu: 'Phản ứng tráng bạc', phu: '· 12 - Lớp Thường · 3 em vừa sai' },
    { luc: nowMs - 6 * PHUT, loai: 'len', chu: tenEm(dangHoc[2]!), phu: `· ${dangHoc[2]!.lop} · vừa nộp bài Amine – Amino acid` },
    { luc: nowMs - 5 * PHUT, loai: 'cham', chu: 'A.I Đỗ Đại Học', phu: `· rút bộ câu riêng cho ${dangHoc[4]!.hoTen}` },
    { luc: nowMs - 4 * PHUT, loai: 'cham', chu: '12 - Tinh Hoa', phu: '· thêm 12 câu · đúng 92 %' },
    { luc: nowMs - 3 * PHUT, loai: 'len', chu: tenEm(dangHoc[5]!), phu: `· ${dangHoc[5]!.lop} · đúng 8 câu liền` },
    { luc: nowMs - 2 * PHUT, loai: 'xuong', chu: 'Chuyển dịch cân bằng', phu: '· Khối 11 · 3 em vừa sai' },
    { luc: nowMs - 1 * PHUT, loai: 'cham', chu: tenEm(dangHoc[7]!), phu: `· ${dangHoc[7]!.lop} · vừa vào học, mở bài Ester – Lipid` },
  ]

  return {
    mocMs,
    serverNow: nowMs,
    nhanLucMs: nowMs,
    tongEm,
    soEmHoc,
    soCau,
    soCauDung,
    dungNhip,
    tia: { hs: bac(soEmHoc, 15), cau: cauTia, tile: tileTia, nhip: bac(dungNhip.soEm, 17) },
    tin,
    nen,
    theoLop,
    nhiet,
    moPhong: true,
  }
}

/**
 * MỘT sự kiện "em vừa làm một câu" trên dữ liệu giả (thuần: trả bản MỚI, không sửa bản cũ): cộng câu cho một em đang học, lớp của em, tổng, nến cuối (thêm nến mới khi sang khung 5 phút),
 * chuỗi tia; mọi khối vẫn KHỚP nhau (`kiemTraKhop` rỗng). Chỉ dùng cho bản vẽ / kiểm thử — màn thật KHÔNG bịa sự kiện.
 */
export function phatSuKienGia(du: DuLieuSan, nowMs: number, hat: number): DuLieuSan {
  const rnd = taoNgauNhien(hat)
  const nhietCu = du.nhiet ?? []
  const dangHoc = nhietCu.map((e, i) => [e, i] as const).filter(([e]) => e.soCau > 0)
  if (dangHoc.length === 0 || !du.theoLop || !du.nen || !du.tia) return du
  const [em, chiSo] = dangHoc[Math.floor(rnd() * dangHoc.length)]!
  const lop = du.theoLop.find((l) => l.lop === em.lop)
  const pDung = lop && lop.soCau > 0 ? lop.soCauDung / lop.soCau : 0.85
  const dung = rnd() < pDung
  const nhiet = nhietCu.map((e, i) => (i === chiSo ? { ...e, soCau: e.soCau + 1, soCauDung: e.soCauDung + (dung ? 1 : 0) } : e))
  const theoLop = du.theoLop.map((l) => (l.lop === em.lop ? { ...l, soCau: l.soCau + 1, soCauDung: l.soCauDung + (dung ? 1 : 0) } : l))
  const nen = du.nen.map((n) => ({ ...n }))
  const cuoi = nen[nen.length - 1]!
  if (nowMs >= cuoi.tu + NEN_MS) {
    const tu = cuoi.tu + Math.floor((nowMs - cuoi.tu) / NEN_MS) * NEN_MS
    nen.push({ tu, mo: cuoi.dong, cao: cuoi.dong, thap: cuoi.dong, dong: cuoi.dong, soCau: 0 })
  }
  const n = nen[nen.length - 1]!
  n.dong += ((dung ? 100 : 0) - n.dong) * 0.018
  n.cao = Math.max(n.cao, n.dong)
  n.thap = Math.min(n.thap, n.dong)
  n.soCau += 1
  const soCau = du.soCau + 1
  const soCauDung = du.soCauDung + (dung ? 1 : 0)
  const tia = { hs: [...du.tia.hs], cau: [...du.tia.cau], tile: [...du.tia.tile], nhip: du.tia.nhip ? [...du.tia.nhip] : null }
  tia.cau[59] = soCau
  tia.tile[59] = (soCauDung / soCau) * 100
  return { ...du, serverNow: nowMs, nhanLucMs: nowMs, soCau, soCauDung, nhiet, theoLop, nen, tia }
}
