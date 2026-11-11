// ĐO THỜI GIAN CHỐT (11/11) — phòng THẬT của Bình Phản Ứng trên kho + R2 giả trong bộ nhớ (Node), buổi live giả 30 / 60 / 90 phút: chỉ đo phần TÍNH TOÁN của chốt
// (đọc khúc, cắt khung, ghép, dựng chỉ mục), KHÔNG gồm độ trễ mạng R2 / D1 thật. Cách chạy:
//   npx esbuild scripts/thu-live-xem-lai-1111/do-chot.ts --bundle --platform=node --format=esm --outfile=<tạm>/do-chot.mjs && node <tạm>/do-chot.mjs
import { CAU_GIA, chot, datKhuc, guiBangMoi, guiNet, huyHen, khucGia, netGia, taoBuoiGia, taoR2Gia } from '../../tests/_live-xem-lai-gia'

const MS_KHUC = 417 * 24
const goc = Date.now
let gio = 1_794_000_000_000
Date.now = () => gio
const ra: Record<string, unknown>[] = []
for (const phut of [30, 60, 90]) {
  const T0 = gio = 1_794_000_000_000 + phut * 10_000_000
  const r2 = taoR2Gia(), b = await taoBuoiGia({ r2, soEm: 150 })
  await guiBangMoi(b.ph, b.gv)
  await b.ph.gui(b.gv, { t: 'live-bat' }); await b.ph.gui(b.gv, { t: 'live-ghi', tt: 'dang-ghi', dh: T0, p: 'p1' })
  const soCau = Math.round(phut / 9)
  let net = 0
  for (let c = 0; c < soCau; c++) {
    const dau = T0 + c * 9 * 60_000
    gio = dau + 5000; await b.ph.post('/luot', CAU_GIA(`q${c}`))
    for (let i = 0; i < 150; i++) await b.ph.gui(b.hs[i]!, { t: 'tra', chon: i % 3 ? 'A' : 'B' })
    gio = dau + 120_000; await b.ph.gui(b.gv, { t: 'goi', sbd: `e${String((c % 150) + 1).padStart(2, '0')}`, lyDo: [] })
    for (let i = 0; i < 60; i++) { gio = dau + 130_000 + i * 6000; await guiNet(b.ph, b.gv, netGia(`n${net++}`, 40, 30)) } // 60 nét × 40 điểm mỗi câu
    gio = dau + 500_000; await b.ph.gui(b.gv, { t: 'dat', v: true }); await b.ph.gui(b.gv, { t: 'mo' })
  }
  const soKhuc = Math.ceil((phut * 60_000) / MS_KHUC)
  for (let i = 0; i < soKhuc; i++) await datKhuc(r2, 'b1', 'p1', i, khucGia({ t0: T0 + i * MS_KHUC, soDau: i * 417 + 1 }))
  gio = T0 + phut * 60_000; await b.ph.gui(b.gv, { t: 'live-tat' })
  const t = performance.now()
  const kq = await chot(b.ph)
  const ms = Math.round(performance.now() - t)
  huyHen(b.ph)
  const j = JSON.parse(new TextDecoder().decode(r2.du.get('live/b1/buoi.json')!.b)) as { cau: unknown[]; doan: unknown[]; byteTieng: number; byteNet: number }
  ra.push({ phut, soKhuc, soNet: net, msChot: ms, du: kq.du, soCau: j.cau.length, soDoan: j.doan.length, mbTieng: Math.round(j.byteTieng / 104857.6) / 10, kbNet: Math.round(j.byteNet / 1024), kbBuoiJson: Math.round(r2.du.get('live/b1/buoi.json')!.b.length / 1024), docR2: r2.dem.get, phanTaiLen: r2.dem.phan })
}
Date.now = goc
console.log(JSON.stringify(ra))
process.exit(0)
