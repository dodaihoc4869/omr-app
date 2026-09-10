#!/usr/bin/env node
// ĐO TẢI APPS SCRIPT — KHACPHUCTREOHANGLOAT.md mục 1.
//
// "CẤM SỬA KHI CHƯA ĐO". Script này dựng bảng mốc TRƯỚC, rồi chạy lại sau mỗi
// thuốc để bảng SAU đứng cạnh bảng TRƯỚC.
//
// ─────────────────────────────────────────────────────────────────────────────
// ĐỌC KỸ TRƯỚC KHI CHẠY — mục 4 của đặc tả
//
//   · CHỈ chạy trên CA THỬ do chính script tạo, SBD `TEST0001`…
//   · TUYỆT ĐỐI không chạm ca thật, không chạm SBD thật.
//   · Script tự dọn ca thử sau khi đo. Còn sót dòng `TEST%` là bẩn dữ liệu thật.
//   · KHÔNG chạy khi đang có ca thi mở — script tự kiểm và tự dừng.
//
// ─────────────────────────────────────────────────────────────────────────────
// CÁCH DÙNG
//
//   node scripts/do-tai.mjs --url <link Apps Script> --mat <mã bí mật> [--n 10,20,30,50]
//
// Mã bí mật KHÔNG được đặt trong mã nguồn và KHÔNG in ra nhật ký.
//
// ─────────────────────────────────────────────────────────────────────────────
// LƯU Ý VỀ MẠNG (đo 10/09 khuya, phiên Cowork)
//
// Trong phiên làm việc hiện tại, CẢ máy trong đám mây LẪN máy thầy đều không ra
// được `script.google.com` — cả hai trả HTTP 000, từ chối ngay trong 4 mili
// giây. Chỉ tab trình duyệt gọi được Apps Script. Nên lượt đo thật hôm đó chạy
// trong tab, dùng CHUNG lõi `src/lib/do-tai-loi.ts` với script này: cùng phép
// tính phân vị, cùng cách bắn đồng thời, cùng bảng số.
//
// Script này vẫn phải tồn tại và phải đúng: máy nào có mạng là chạy được ngay,
// và nó là bản ghi chính thức của cách đo.
import { banDongThoi, doMot, dongBang, sbdThu, tomTat } from '../src/lib/do-tai-loi.ts'

const args = process.argv.slice(2)
function co(ten, mac) {
  const i = args.indexOf(`--${ten}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : mac
}

const URL_AS = co('url', process.env.OMR_URL || '')
const MAT = co('mat', process.env.OMR_MAT || '')
const CAC_N = co('n', '10,20,30,50').split(',').map((x) => Number(x.trim())).filter((x) => x > 0)

if (!URL_AS || !MAT) {
  console.error('Thiếu --url hoặc --mat. Xem phần CÁCH DÙNG ở đầu tệp.')
  process.exit(1)
}

/** Một lượt POST tới Apps Script. Hạn rộng: đang đo cái CHẬM, cắt sớm là mất số. */
async function goi(body, giay = 120) {
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), giay * 1000)
  try {
    const r = await fetch(URL_AS, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: bo.signal,
    })
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` }
    return await r.json()
  } catch (e) {
    return { ok: false, error: e?.name === 'AbortError' ? `quá ${giay} giây` : String(e?.message || e) }
  } finally {
    clearTimeout(hen)
  }
}

// ── CHỐT AN TOÀN: không đo khi đang có ca thi mở ───────────────────────────────
const ds = await goi({ action: 'danhSachCa', secret: MAT })
if (!ds.ok) {
  console.error('Không đọc được danh sách ca:', ds.error)
  process.exit(1)
}
const dangMo = (ds.items || []).filter((c) => c.trangThai === 'mo' && c.daVao > c.daNop)
if (dangMo.length) {
  console.error(`DỪNG: đang có ${dangMo.length} ca mở còn em chưa nộp. Đo tải lúc này là phá ca thật.`)
  console.error(dangMo.map((c) => `  ${c.maCa} ${c.tenCa} — vào ${c.daVao}, nộp ${c.daNop}`).join('\n'))
  process.exit(1)
}

const R = (await goi({ action: 'demDongLuot', secret: MAT })).so ?? null
if (R !== null) console.log(`R (số dòng LuotThi) = ${R} · mỗi lượt quét cũ = ${R * 22} ô`)

// ── Dựng ca thử ───────────────────────────────────────────────────────────────
const MA_THU = `THU${Date.now().toString().slice(-6)}`
console.log(`\nCa thử: ${MA_THU} — SBD TEST0001…TEST${String(Math.max(...CAC_N)).padStart(4, '0')}`)

const tao = await goi({
  action: 'publish',
  secret: MAT,
  maCa: MA_THU,
  lop: '12',
  tenCa: `ĐO TẢI ${MA_THU} — XOÁ SAU KHI ĐO`,
  thoiGianPhut: 45,
  phamVi: 'tu_do',
  bank: { phanI: [], phanII: [], phanIII: [] },
})
if (!tao.ok) {
  console.error('Không tạo được ca thử:', tao.error)
  process.exit(1)
}

const bang = []
try {
  for (const n of CAC_N) {
    console.log(`\n── N = ${n} ─────────────────────────────`)

    const vao = await banDongThoi(n, (i) =>
      doMot(() => goi({ action: 'vaoThi', maCa: MA_THU, sbd: sbdThu(i), hoTen: `Thử ${i}`, namSinh: '2009' })),
    )
    bang.push(tomTat(`vaoThi n=${n}`, vao))
    console.log(dongBang(bang.at(-1)))

    const luu = await banDongThoi(n, (i) =>
      doMot(() => goi({ action: 'luuTam', maCa: MA_THU, sbd: sbdThu(i), dapAn: { phanI: { q1: 'A' } } })),
    )
    bang.push(tomTat(`luuTam n=${n}`, luu))
    console.log(dongBang(bang.at(-1)))

    const nop = await banDongThoi(n, (i) =>
      doMot(() =>
        goi({
          action: 'submit',
          maCa: MA_THU,
          sbd: sbdThu(i),
          dapAn: { phanI: { q1: 'A' }, phanII: {}, phanIII: {} },
          integrity: { leaveCount: 0, totalHiddenMs: 0, events: [] },
        }),
      ),
    )
    bang.push(tomTat(`submit n=${n}`, nop))
    console.log(dongBang(bang.at(-1)))
  }
} finally {
  // ── DỌN, kể cả khi đo hỏng giữa chừng (mục 1.2) ─────────────────────────────
  console.log('\nDọn ca thử…')
  const xoa = await goi({ action: 'xoaCa', secret: MAT, maCa: MA_THU, xacNhan: MA_THU })
  console.log(xoa.ok ? `  đã xoá ca ${MA_THU}` : `  CHƯA XOÁ ĐƯỢC: ${xoa.error} — thầy xoá tay ca ${MA_THU}`)
}

console.log('\n══ BẢNG ══')
for (const t of bang) console.log(dongBang(t))
const conHong = bang.filter((t) => t.soHong > 0)
if (conHong.length) {
  console.log('\nCÒN LỖI:')
  for (const t of conHong) console.log(`  ${t.hanhDong}: ${t.loi.join(' · ')}`)
}
