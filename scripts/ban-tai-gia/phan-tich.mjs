// PHÂN TÍCH KẾT QUẢ BẮN TẢI GIẢ (Code 1, 21/09/2026): gộp số đo phía MÁY KHÁCH (thời gian, mã trạng thái) với sổ đo phía Worker (`/__do/dump`: mỗi truy vấn D1 của từng lượt gọi, kể cả việc phụ sau khi trả lời)
// ⇒ bảng theo LỆNH (số lượt, lỗi, p50/p95, truy vấn, dòng đọc), danh sách lệnh VƯỢT NGÂN SÁCH (≤ 8 truy vấn, ≤ 2.000 dòng; lệnh nộp ≤ 15 truy vấn) và TOP truy vấn tốn nhất. Thuần: nhận dữ liệu, trả chuỗi Markdown.

export const NGAN_SACH = { truyVan: 8, truyVanNop: 15, dongDoc: 2000 }
/** Lệnh "nộp" (thiêng, ngân sách truy vấn rộng hơn): tên lệnh chứa một trong các mẩu này. */
const LA_LENH_NOP = /(xong-lo|btvn\/nop|on-lai\/nop|thu-thach-hom-nay\/nop|game-v2\/(complete|answer)|\bnop\b)/

export const phanVi = (ds, p) => {
  if (ds.length === 0) return 0
  const s = [...ds].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))]
}
const tb = (ds) => (ds.length ? ds.reduce((t, x) => t + x, 0) / ds.length : 0)
const lam = (x, so = 0) => (Number.isFinite(x) ? x.toFixed(so) : '—')
const dinhDang = (x) => Math.round(x).toLocaleString('vi-VN')

/**
 * @param khach  mảng {id, lenh, ms, ma, loi} — số đo của máy khách cho từng lượt gọi
 * @param dump   mảng luot của `/__do/dump` — {id, lenh, cau:[{khung, doc, ghi, msD1, msTuong}], ...}
 */
export function gomTheoLenh(khach, dump) {
  const theoId = new Map(dump.map((l) => [l.id, l]))
  const nhom = new Map()
  for (const k of khach) {
    const l = theoId.get(k.id)
    const n = nhom.get(k.lenh) ?? { lenh: k.lenh, luot: [] }
    n.luot.push({
      ms: k.ms, ma: k.ma, loi: k.loi,
      tv: l ? l.cau.length : 0,
      doc: l ? l.cau.reduce((t, c) => t + c.doc, 0) : 0,
      ghi: l ? l.cau.reduce((t, c) => t + c.ghi, 0) : 0,
      msD1: l ? l.cau.reduce((t, c) => t + c.msD1, 0) : 0,
      thieuSo: !l,
    })
    nhom.set(k.lenh, n)
  }
  return [...nhom.values()].map((n) => {
    const nop = LA_LENH_NOP.test(n.lenh)
    const tran = nop ? NGAN_SACH.truyVanNop : NGAN_SACH.truyVan
    const vuotTv = n.luot.filter((x) => x.tv > tran)
    const vuotDong = n.luot.filter((x) => x.doc > NGAN_SACH.dongDoc)
    const loi = n.luot.filter((x) => x.ma >= 400 || x.loi)
    return {
      lenh: n.lenh, nop, tran, n: n.luot.length, loi: loi.length,
      ms50: phanVi(n.luot.map((x) => x.ms), 0.5), ms95: phanVi(n.luot.map((x) => x.ms), 0.95),
      tvTb: tb(n.luot.map((x) => x.tv)), tv95: phanVi(n.luot.map((x) => x.tv), 0.95), tvMax: Math.max(...n.luot.map((x) => x.tv)),
      docTb: tb(n.luot.map((x) => x.doc)), doc95: phanVi(n.luot.map((x) => x.doc), 0.95), docMax: Math.max(...n.luot.map((x) => x.doc)),
      ghiTb: tb(n.luot.map((x) => x.ghi)), msD1Tb: tb(n.luot.map((x) => x.msD1)), msD1Tong: n.luot.reduce((t, x) => t + x.msD1, 0),
      vuotTv: vuotTv.length, vuotDong: vuotDong.length, vuot: vuotTv.length > 0 || vuotDong.length > 0,
    }
  }).sort((a, b) => b.docTb * b.n - a.docTb * a.n)
}

/** Top truy vấn theo TỔNG dòng đọc (gộp theo khung SQL) trên toàn bộ sổ đo. */
export function topTruyVan(dump, top = 15) {
  const m = new Map()
  for (const l of dump) for (const c of l.cau) {
    const x = m.get(c.khung) ?? { khung: c.khung, lan: 0, doc: 0, ms: 0, lenh: new Map() }
    x.lan++; x.doc += c.doc; x.ms += c.msD1
    x.lenh.set(l.lenh, (x.lenh.get(l.lenh) ?? 0) + 1)
    m.set(c.khung, x)
  }
  return [...m.values()].sort((a, b) => b.doc - a.doc).slice(0, top).map((x) => ({ ...x, lenhChinh: [...x.lenh.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map((e) => e[0]).join(', ') }))
}

const cat = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

export function lapMarkdown({ ma, batDau, cauHinh, khach, dump, ghiChu = [] }) {
  const bang = gomTheoLenh(khach, dump)
  const tongLuot = khach.length
  const tongDoc = dump.reduce((t, l) => t + l.cau.reduce((u, c) => u + c.doc, 0), 0)
  const tongTv = dump.reduce((t, l) => t + l.cau.length, 0)
  const tongMsD1 = dump.reduce((t, l) => t + l.cau.reduce((u, c) => u + c.msD1, 0), 0)
  const giay = Math.max(1, (cauHinh.thoiGianThatGiay ?? 600))
  const vuot = bang.filter((b) => b.vuot)
  const dong = []
  const P = (s = '') => dong.push(s)
  P(`# Bản đo tải giả — ${ma}`)
  P()
  P(`Bộ bắn tải giả \`scripts/ban-tai-gia/\` (Code 1). Chạy lúc ${batDau}. **D1 CỤC BỘ** nạp từ bản sao lưu \`${cauHinh.saoLuu}\`; Worker = mã tại commit \`${ma}\` bọc vỏ đo (\`vo-do.ts\`); **không** bắn vào máy chủ thật.`)
  P()
  P(`- **Mô phỏng:** ${cauHinh.soEm} em × ${cauHinh.phut} phút giờ cao điểm (${cauHinh.nhanh > 1 ? `tua nhanh ×${cauHinh.nhanh}, ` : ''}chạy thật ${lam(cauHinh.thoiGianThatGiay)} giây): mở app (kế hoạch ngày, bài về nhà, Thi đua, thông báo…), hỏi nền mỗi ${cauHinh.nhipNenGiay} giây, làm + nộp 1 chặng, ôn 3 câu, 1 lượt Đảo.`)
  P(`- **Tổng:** ${dinhDang(tongLuot)} lượt gọi · ${dinhDang(tongTv)} truy vấn D1 · ${dinhDang(tongDoc)} dòng đọc · trung bình ${lam(tongTv / Math.max(1, tongLuot), 1)} truy vấn và ${dinhDang(tongDoc / Math.max(1, tongLuot))} dòng đọc mỗi lượt.`)
  if (cauHinh.treD1Ms > 0) P(`- **Độ trễ giả D1:** +${cauHinh.treD1Ms} ms mỗi truy vấn (mỗi batch một lần) — p50/p95 dưới đây phản ánh số TRUY VẤN TUẦN TỰ; không mô hình hàng đợi một luồng của D1.`)
  P(`- **Ngân sách (Boss):** ≤ ${NGAN_SACH.truyVan} truy vấn và ≤ ${dinhDang(NGAN_SACH.dongDoc)} dòng đọc mỗi lượt; lệnh nộp ≤ ${NGAN_SACH.truyVanNop} truy vấn.`)
  P(`- **Kết luận:** ${vuot.length === 0 ? '✅ không lệnh nào vượt ngân sách.' : `❌ **${vuot.length}/${bang.length} lệnh VƯỢT ngân sách** (xem mục 2).`}`)
  P()
  P('## 1. Bảng theo lệnh (xếp theo tổng dòng đọc giảm dần)')
  P()
  P('| Lệnh | Lượt | Lỗi | p50 ms | p95 ms | Truy vấn TB / p95 / max | Dòng đọc TB / p95 / max | Dòng ghi TB | Vượt |')
  P('|---|---:|---:|---:|---:|---|---|---:|---|')
  for (const b of bang) {
    const co = `${b.vuotTv ? `${b.vuotTv} lượt > ${b.tran} tv` : ''}${b.vuotTv && b.vuotDong ? '; ' : ''}${b.vuotDong ? `${b.vuotDong} lượt > 2.000 dòng` : ''}` || '—'
    P(`| \`${b.lenh}\`${b.nop ? ' 🔒' : ''} | ${b.n} | ${b.loi} | ${dinhDang(b.ms50)} | ${dinhDang(b.ms95)} | ${lam(b.tvTb, 1)} / ${b.tv95} / ${b.tvMax} | ${dinhDang(b.docTb)} / ${dinhDang(b.doc95)} / ${dinhDang(b.docMax)} | ${lam(b.ghiTb, 1)} | ${b.vuot ? '❌ ' : ''}${co} |`)
  }
  P()
  P('🔒 = lệnh nộp (ngân sách truy vấn 15). Thời gian p50/p95 là thời gian máy khách đo (gồm cả xếp hàng ở Worker cục bộ), không phải thời gian D1 thật.')
  P()
  P('## 2. Lệnh VƯỢT ngân sách')
  P()
  if (vuot.length === 0) P('Không có.')
  else {
    P('| Lệnh | Vượt truy vấn | Vượt dòng đọc | Truy vấn max (trần) | Dòng đọc max (trần 2.000) |')
    P('|---|---:|---:|---|---|')
    for (const b of [...vuot].sort((a, c) => c.docMax - a.docMax)) P(`| \`${b.lenh}\` | ${b.vuotTv}/${b.n} | ${b.vuotDong}/${b.n} | ${b.tvMax} (${b.tran}) | ${dinhDang(b.docMax)} |`)
  }
  P()
  P('## 3. Top 15 truy vấn theo tổng dòng đọc')
  P()
  P('| # | Dòng đọc tổng | Số lần | Dòng/lần | Lệnh gọi nhiều nhất | Khung câu SQL |')
  P('|---:|---:|---:|---:|---|---|')
  topTruyVan(dump).forEach((x, i) => P(`| ${i + 1} | ${dinhDang(x.doc)} | ${dinhDang(x.lan)} | ${dinhDang(x.doc / x.lan)} | ${x.lenhChinh} | \`${cat(x.khung, 150).replace(/\|/g, '\\|')}\` |`))
  P()
  P('## 4. Tải D1 (ước lượng)')
  P()
  P(`- Tổng thời gian D1 ghi nhận (\`meta.duration\` của D1 cục bộ): ${lam(tongMsD1 / 1000, 2)} giây trong ${lam(giay)} giây chạy thật ⇒ ~${lam((tongMsD1 / 1000) / giay * 60, 1)} giây D1 / phút ở ${cauHinh.nhanh > 1 ? 'tải đã tua nhanh' : 'tải thật'}. D1 cục bộ là SQLite trong bộ nhớ đệm, **nhanh hơn D1 thật nhiều lần**: dùng SỐ TRUY VẤN và SỐ DÒNG ĐỌC làm thước đo chính, không dùng mili-giây.`)
  P(`- Mỗi dòng đọc trên D1 thật tính tiền/tải như nhau; lệnh nào đọc > 2.000 dòng là ứng viên chỉ mục hoặc đệm.`)
  P()
  if (ghiChu.length) {
    P('## Ghi chú đo')
    P()
    for (const g of ghiChu) P(`- ${g}`)
    P()
  }
  return dong.join('\n')
}
