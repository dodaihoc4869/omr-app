// BỘ BẮN TẢI GIẢ — PHẦN MÁY KHÁCH (Code 1, 21/09/2026; Boss: mô phỏng 250 em giờ cao điểm 10 phút, đếm truy vấn/dòng đọc từng lệnh). Xuất `banTai(opts)`; thường gọi qua `chay.mjs`.
// CHỈ bắn vào Worker CỤC BỘ (`http://127.0.0.1:<cổng>`) — hàm từ chối mọi địa chỉ khác. Em GIẢ và mật khẩu giả do `chuan-bi.mjs` tạo (`.trang-thai/em-gia.json`).
//
// KỊCH BẢN MỖI EM (giây mô phỏng S, tính từ lúc em mở app; `nhanh` chia thời gian thật):
//   S≈0        MỞ APP: presence, academic-sync, mom/list, hs/lich-su, hs/btvn, ke-hoach-ngay, thu-thach-hom-nay, thi-dua-hom-nay, ca-dang-mo, notifications/list, daily-honors (gọi song song như app)
//   mỗi 180±30 NỀN: ke-hoach-ngay, academic-sync, mom/list, thi-dua-hom-nay, ca-dang-mo, notifications/list, daily-honors (nhịp-bền-vững của app, P15); presence mỗi 60±10
//   S≈20–120   LÀM 1 CHẶNG: btvn/cua-em → (làm ~20–50 giây) → btvn/xong-lo với đáp án ngẫu nhiên → ke-hoach-ngay lại
//   S≈100–250  ÔN 3 CÂU (nếu kế hoạch có việc ôn lại): hs/cau-theo-qid → hs/on-lai/nop → ke-hoach-ngay lại
//   S≈150–300  1 LƯỢT ĐẢO: game-v2/profile, recommendations, so-tay, resume, start → answer từng câu (cách 8–20 giây) → complete
// Đáp án là NGẪU NHIÊN (không cần đúng — chi phí truy vấn không phụ thuộc đúng/sai nhiều; ghi chú trong bản đo).
import { readFileSync } from 'node:fs'
import { chuanHoa } from './phan-hoi.mjs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = dirname(fileURLToPath(import.meta.url))

const chonNgauNhien = (mang, r) => mang[Math.floor(r() * mang.length)]
function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const dapAnCho = (phan, r) => (phan === 'II' ? Array.from({ length: 4 }, () => (r() < 0.5 ? 'D' : 'S')).join('') : phan === 'III' ? String(Math.floor(r() * 90) + 1) : chonNgauNhien(['A', 'B', 'C', 'D'], r))

export async function banTai(opts) {
  const { goc, soEm = 250, phut = 10, nhanh = 1, nhipNenGiay = 180, hat = 2109, log = () => {}, mauPhanHoi = 40 } = opts
  if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(goc)) throw new Error(`TỪ CHỐI: bộ bắn tải chỉ bắn vào Worker cục bộ (http://127.0.0.1:cổng), không phải "${goc}".`)
  const danhSach = JSON.parse(readFileSync(join(GOC, '.trang-thai/em-gia.json'), 'utf8')).em.slice(0, soEm)
  const khach = []
  const ghiChu = []
  const phanHoi = new Map() // "stt|lệnh" -> {lenh, body} — LƯỢT ĐẦU của mỗi cặp, chỉ `mauPhanHoi` em đầu, để so trước/sau (Boss 22/09)
  const dem = { loi: new Map(), chang: { thu: 0, xong: 0, loi: 0 }, on: { co: 0, khongCoViec: 0, xong: 0 }, dao: { thu: 0, xong: 0, hetLuot: 0 } }
  const tinh = (m, k) => m.set(k, (m.get(k) ?? 0) + 1)
  let seq = 0
  const ngu = (giay) => new Promise((ok) => setTimeout(ok, (giay * 1000) / nhanh))
  const t0 = Date.now()
  const hetGio = () => (Date.now() - t0) / 1000 * nhanh >= phut * 60

  async function goi(em, duong, body, nhan) {
    const id = `${em.stt}-${++seq}`
    const lenh = `${duong.replace(/^\//, '')}${nhan ? ` [${nhan}]` : ''}`
    const b = Date.now()
    const ac = new AbortController()
    const tre = setTimeout(() => ac.abort(), 60_000)
    let ma = 0, loi = null, j = null
    try {
      const r = await fetch(goc + duong, { method: 'POST', headers: { 'content-type': 'application/json', 'x-tai-gia-id': id, 'x-tai-gia-lenh': encodeURIComponent(lenh) }, body: JSON.stringify(body), signal: ac.signal })
      ma = r.status
      const t = await r.text()
      try { j = JSON.parse(t) } catch { j = null }
      if (j && j.ok === false) loi = String(j.lyDo ?? j.error ?? 'ok=false').slice(0, 60)
    } catch (e) { loi = e?.name === 'AbortError' ? 'hết giờ 60 giây' : String(e?.message ?? e).slice(0, 60) } finally { clearTimeout(tre) }
    khach.push({ id, lenh, ms: Date.now() - b, ma, loi })
    if (loi) tinh(dem.loi, `${lenh} → ${loi}`)
    if (em.stt <= mauPhanHoi && j !== null) {
      const kPhanHoi = `${em.stt}|${lenh}`
      if (!phanHoi.has(kPhanHoi)) phanHoi.set(kPhanHoi, { lenh, body: chuanHoa(j) })
    }
    return j
  }

  // ---- Thiết lập: đăng nhập từng em (lấy token) — KHÔNG tính vào số đo (xoá sau).
  log(`Đăng nhập ${danhSach.length} em giả…`)
  const emCoToken = []
  for (let i = 0; i < danhSach.length; i += 10) {
    await Promise.all(danhSach.slice(i, i + 10).map(async (e) => {
      const j = await goi(e, '/hs/dang-nhap', { sbd: e.sbd, matKhau: e.matKhau }, 'thiết lập')
      if (j?.token) emCoToken.push({ ...e, token: j.token })
    }))
  }
  if (emCoToken.length === 0) throw new Error(`Không em nào đăng nhập được (kiểm .dev.vars / chuan-bi.mjs). Lượt đầu: ${JSON.stringify(khach[0])}`)
  ghiChu.push(`Đăng nhập được ${emCoToken.length}/${danhSach.length} em giả (bước thiết lập, không tính vào bảng).`)
  const khachThietLap = khach.splice(0, khach.length)
  await fetch(goc + '/__do/reset')

  // ---- Khởi động kế hoạch ngày: em đã mở app trước đó trong ngày (giờ cao điểm 20:00 hầu hết em đã có kế hoạch hôm nay) — đo riêng lần dựng đầu.
  if (opts.khoiDongKeHoach !== false) {
    log('Dựng kế hoạch ngày lần đầu cho mọi em (đo riêng: "dựng đầu ngày")…')
    for (let i = 0; i < emCoToken.length; i += 10) await Promise.all(emCoToken.slice(i, i + 10).map((e) => goi(e, '/hs/ke-hoach-ngay', { token: e.token }, 'dựng đầu ngày')))
  }

  // ---- Kịch bản từng em.
  const tBatDau = Date.now()
  async function mot(em, chiSoEm) {
    const r = mulberry(hat * 1000 + chiSoEm)
    const tk = { token: em.token }
    let viecOn = []
    const doiKeHoach = async (nhan) => { const kh = await goi(em, '/hs/ke-hoach-ngay', tk, nhan); if (kh?.ok) viecOn = (kh.viec ?? []).filter((v) => v.loai === 'on_lai' && Array.isArray(v.chiTiet?.qid)).flatMap((v) => v.chiTiet.qid); return kh }
    await ngu(r() * 60) // em vào app rải trong phút đầu
    const moApp = async () => {
      const [kh] = await Promise.all([
        doiKeHoach('mở'),
        goi(em, '/presence', { session: `taigia-${String(em.stt).padStart(4, '0')}-hs`, role: 'hs' }, 'mở'),
        goi(em, '/game-v2/academic-sync', { ...tk, mom: [] }, 'mở'),
        goi(em, '/mom/list', tk, 'mở'),
        goi(em, '/hs/lich-su', { sbd: em.sbd }, 'mở'),
        goi(em, '/hs/thu-thach-hom-nay', tk, 'mở'),
        goi(em, '/hs/thi-dua-hom-nay', tk, 'mở'),
        goi(em, '/hs/ca-dang-mo', tk, 'mở'),
        goi(em, '/notifications/list', tk, 'mở'),
        goi(em, '/daily-honors', {}, 'mở'),
      ])
      void kh
      return goi(em, '/hs/btvn', { sbd: em.sbd }, 'mở')
    }
    const btvn = await moApp()
    // Nền: vòng hỏi 180±30 giây + presence 60±10 giây, tới hết giờ.
    const nen = (async () => {
      let tiepNen = nhipNenGiay + (r() - 0.5) * 60
      let tiepPresence = 60 + (r() - 0.5) * 20
      let s = 0
      while (!hetGio()) {
        const buoc = Math.min(tiepNen, tiepPresence)
        await ngu(buoc); s += buoc; tiepNen -= buoc; tiepPresence -= buoc
        if (hetGio()) break
        if (tiepPresence <= 0.001) { void goi(em, '/presence', { session: `taigia-${String(em.stt).padStart(4, '0')}-hs`, role: 'hs' }, 'nền'); tiepPresence = 60 + (r() - 0.5) * 20 }
        if (tiepNen <= 0.001) {
          await Promise.all([doiKeHoach('nền'), goi(em, '/game-v2/academic-sync', { ...tk, mom: [] }, 'nền'), goi(em, '/mom/list', tk, 'nền'), goi(em, '/hs/thi-dua-hom-nay', tk, 'nền'), goi(em, '/hs/ca-dang-mo', tk, 'nền'), goi(em, '/notifications/list', tk, 'nền'), goi(em, '/daily-honors', {}, 'nền')])
          tiepNen = nhipNenGiay + (r() - 0.5) * 60
        }
      }
    })()
    // Làm 1 chặng.
    const chang = (async () => {
      await ngu(20 + r() * 100)
      if (hetGio()) return
      const it = (btvn?.items ?? []).find((x) => !x.daNop && x.caNhan) ?? (btvn?.items ?? []).find((x) => !x.daNop)
      if (!it) { dem.chang.loi++; tinh(dem.loi, 'chặng: em không có bài về nhà chưa nộp'); return }
      dem.chang.thu++
      const ct = await goi(em, '/btvn/cua-em', { maCa: it.maCa || 'Riêng', sbd: em.sbd, maBtvn: it.maBtvn }, 'chặng')
      if (!ct?.ok) { dem.chang.loi++; return }
      const soChang = Array.isArray(ct.chang) ? ct.chang : []
      const k = Number.isInteger(ct.changDangMo) ? ct.changDangMo : 0
      const cau = ct.de?.cau ?? []
      const dau = soChang.slice(0, k).reduce((t, c) => t + (c.soCau ?? 0), 0)
      const lat = cau.slice(dau, dau + (soChang[k]?.soCau ?? cau.length))
      await ngu(20 + r() * 30) // thời gian em làm chặng
      const dapAn = {}
      for (const c of lat) dapAn[c.qid] = dapAnCho(c.phan, r)
      const xl = await goi(em, '/btvn/xong-lo', { maBtvn: it.maBtvn, sbd: em.sbd, chiSo: k, dapAn }, 'nộp chặng')
      if (xl?.ok) dem.chang.xong++; else dem.chang.loi++
      await doiKeHoach('sau ghi')
    })()
    // Ôn 3 câu.
    const on = (async () => {
      await ngu(100 + r() * 150)
      if (hetGio()) return
      const chon = viecOn.slice(0, 3)
      if (chon.length === 0) { dem.on.khongCoViec++; return }
      dem.on.co++
      const c = await goi(em, '/hs/cau-theo-qid', { ...tk, qid: chon }, 'ôn')
      const ds = (c?.cau ?? chon.map((q) => ({ qid: q, phan: 'I' })))
      await ngu(15 + r() * 30)
      const nop = await goi(em, '/hs/on-lai/nop', { ...tk, traLoi: ds.map((x) => ({ qid: x.qid, dapAn: dapAnCho(x.phan, r), giay: 10 + Math.floor(r() * 30) })) }, 'nộp ôn')
      if (nop?.ok) dem.on.xong++
      await doiKeHoach('sau ghi')
    })()
    // 1 lượt Đảo.
    const dao = (async () => {
      await ngu(150 + r() * 150)
      if (hetGio()) return
      dem.dao.thu++
      const pf = await goi(em, '/game-v2/profile', tk, 'Đảo')
      if (pf?.profile?.choice === true) return // em chưa chọn thần thú: bỏ qua (không giả lập chọn)
      await Promise.all([goi(em, '/game-v2/recommendations', tk, 'Đảo'), goi(em, '/game-v2/so-tay', tk, 'Đảo')])
      await goi(em, '/game-v2/resume', tk, 'Đảo')
      const st = await goi(em, '/game-v2/start', { ...tk, mode: 'adventure' }, 'Đảo')
      const ds = st?.questions ?? []
      if (!st?.ok || ds.length === 0) { dem.dao.hetLuot++; tinh(dem.loi, `Đảo start không có câu: ${String(st?.lyDo ?? st?.message ?? (st?.het ? 'hết lượt thần thú' : 'không rõ')).slice(0, 70)}`); return }
      for (const q of ds) {
        await ngu(8 + r() * 12)
        if (hetGio()) return
        await goi(em, '/game-v2/answer', { ...tk, session: st.id, qid: q.qid, answer: dapAnCho(q.phan, r), assisted: false }, 'Đảo')
      }
      const cp = await goi(em, '/game-v2/complete', { ...tk, session: st.id }, 'Đảo')
      if (cp?.ok) dem.dao.xong++
    })()
    await Promise.all([nen, chang, on, dao])
  }
  log(`Bắt đầu ${phut} phút mô phỏng (${emCoToken.length} em, tua nhanh ×${nhanh})…`)
  const tien = setInterval(() => log(`  … ${Math.round(((Date.now() - tBatDau) / 1000) * nhanh)}s mô phỏng · ${khach.length} lượt gọi`), 60_000 / Math.max(1, nhanh))
  await Promise.all(emCoToken.map((e, i) => mot(e, i).catch((err) => tinh(dem.loi, `kịch bản lỗi: ${String(err?.message ?? err).slice(0, 50)}`))))
  clearInterval(tien)
  const thoiGianThatGiay = (Date.now() - tBatDau) / 1000
  ghiChu.push(`Chặng: ${dem.chang.thu} em thử làm, ${dem.chang.xong} nộp được, ${dem.chang.loi} lỗi/không có bài. Ôn: ${dem.on.co} em có việc ôn (nộp được ${dem.on.xong}), ${dem.on.khongCoViec} em không có câu tới hạn. Đảo: ${dem.dao.thu} em thử, ${dem.dao.xong} xong lượt, ${dem.dao.hetLuot} hết lượt/không có câu.`)
  const loiTop = [...dem.loi.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  if (loiTop.length) ghiChu.push('Lỗi/từ chối hay gặp (không phải lỗi bộ đo — nhiều là đúng luật máy chủ): ' + loiTop.map(([k, n]) => `${k} ×${n}`).join(' · '))
  ghiChu.push('Đáp án của em giả là NGẪU NHIÊN; thời gian "làm" giữa các bước là ngẫu nhiên. D1 cục bộ nhanh hơn D1 thật: số truy vấn và dòng đọc là thước đo chính.')
  return { khach, ghiChu, thoiGianThatGiay, soEm: emCoToken.length, khachThietLap, phanHoi }
}
