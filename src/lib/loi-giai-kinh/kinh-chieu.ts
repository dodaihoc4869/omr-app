// LỜI GIẢI KÍNH TRÊN MÀN CHIẾU (thầy 03/11 «Hiển thị lời giải mới cho tất cả phần chiếu lên bảng nhé», «Câu tự luận giải luôn để lời giải hiện trên
// máy chiếu lúc dạy học»). Tờ chiếu là CHUỖI HTML (html-may-chieu.ts, iframe srcDoc) dùng bảng màu máy chiếu --mc-* ⇒ bản Kính vẽ lại thành HTML TĨNH,
// chữ to, tương phản cao, cùng nhãn / thứ tự khối với app học sinh: cốt lõi → thầy dẫn từng bước → (gọi tên / thí nghiệm / tác động) → sơ đồ + một
// phép tính (nghĩa từng số) → thầy giảng → vì sao từng phương án / ý → chỗ hay nhầm → đáp án. Câu không có bản Kính ⇒ nơi gọi giữ lời giải cũ.
import type { BanKinh } from './kieu'
import type { CauLuyen } from '../bai-tap-pdf'

const thoat = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** Chữ bản Kính ⇒ HTML: **đậm**, chỉ số `_2` / `_{2n}`, mũ `^{3+}`, số dính sau chữ cái hoá học (H2SO4 ⇒ H₂SO₄ kiểu sub) — cùng cách app vẽ. */
export function chuKinhHtml(t: unknown): string {
  let h = thoat(t)
  // Mũ / chỉ số viết tường minh: ^{3+}, _{2n}, _2, _n (một chữ thường). Chỉ số ngầm: số dính sau kí hiệu nguyên tố / ngoặc (H2SO4, Fe(OH)3) — không đụng số thập phân.
  h = h.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>').replace(/_\{([^}]+)\}/g, '<sub>$1</sub>').replace(/_(\d+|[a-zà-ỹ]+)/g, '<sub>$1</sub>')
  h = h.replace(/([A-Z][a-z]?|\))(\d+)(?!\d|,\d)/g, '$1<sub>$2</sub>')
  return h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
}

const KHOA = { I: ['A', 'B', 'C', 'D'], II: ['a', 'b', 'c', 'd'] } as const
const NHAN_MANH: Record<string, string> = { nhanh: 'Nhánh', mach: 'Mạch chính', 'lien-ket': 'Liên kết', chuc: 'Chức', 'goc-ancol': 'Gốc R′', 'goc-acid': 'Gốc RCOO' }

export function kinhChieuHtml(ban: BanKinh, c: Pick<CauLuyen, 'phan' | 'dapAn' | 'luaChon'>): string {
  const k: string[] = ['<div class="sol-label sol-tieu">LỜI GIẢI</div>']
  // 1. kiến thức cốt lõi
  k.push(`<div class="sol-label">Kiến thức cốt lõi</div><div class="sol-text sol-cot-loi">${ban.cotLoi.congThuc ? `<div class="mck-ct">${chuKinhHtml(ban.cotLoi.congThuc)}</div>` : ''}${chuKinhHtml(ban.cotLoi.chu)}</div>`)
  if (ban.cotLoi.chip.length) k.push(`<div class="mck-chip">${ban.cotLoi.chip.map((x) => `<span><b>${chuKinhHtml(x.nhan)}</b> ${chuKinhHtml(x.chu)}</span>`).join('')}</div>`)
  // 2. thầy dẫn từng bước
  if (ban.phim.length) k.push(`<div class="sol-label">Thầy dẫn từng bước</div>${ban.phim.map((p, i) => `<div class="sol-step"><b>${i + 1}.</b> ${chuKinhHtml(p.chu)}${p.phu ? `<span class="mck-phu">${chuKinhHtml(p.phu)}</span>` : ''}</div>`).join('')}`)
  // 3. cảnh
  const cn = ban.canh
  if (cn?.loai === 'danh-phap') {
    const mach = cn.soC ? `<div class="sol-step">Mạch chính <b>${cn.soC} C</b>, đánh số ưu tiên <b>chức → π → nhánh</b>${cn.chuc ? ` (nhóm ${chuKinhHtml(cn.chuc.ten)} gắn carbon số ${cn.chuc.viTri})` : ''}${cn.nhanh.length ? `; nhánh: ${cn.nhanh.map((n) => `${chuKinhHtml(n.ten)} ở carbon số ${n.viTri}`).join(', ')}` : ''}${cn.pi.length ? `; liên kết bội: ${cn.pi.map((p) => `${p.loai === 'ba' ? 'ba' : 'đôi'} ở ${p.viTri}–${p.viTri + 1}`).join(', ')}` : ''}.</div>` : ''
    k.push(`<div class="sol-label">Gọi tên theo cách của thầy</div>${mach}<div class="mck-manh">${cn.manh.map((m) => `<span data-loai="${m.loai}"><small>${NHAN_MANH[m.loai] ?? ''}</small><b>${chuKinhHtml(m.chu.trim())}</b><em>${chuKinhHtml(m.giai)}</em></span>`).join('')}</div><div class="mck-ten">${chuKinhHtml(cn.ten)}</div>`)
  } else if (cn?.loai === 'ong-nghiem') {
    k.push(`<div class="sol-label">Thí nghiệm</div>${cn.buoc.map((b, i) => `<div class="sol-step"><b>${i + 1}.</b> ${chuKinhHtml(b.chu)}<span class="mck-phu">${b.lop.map((l) => chuKinhHtml(l.nhan)).join(' · ')}${b.dun ? ' · đun nóng' : ''}${b.khi ? ' · có khí thoát ra' : ''}${b.ketTua ? ' · có kết tủa' : ''}</span></div>`).join('')}`)
  } else if (cn?.loai === 'can-bang') {
    k.push(`<div class="sol-label">Tác động lên cân bằng · ${chuKinhHtml(cn.trai)} ⇌ ${chuKinhHtml(cn.phai)}</div>${cn.tacDong.map((t) => `<div class="sol-step"><b>${chuKinhHtml(t.nut)}</b> ⇒ ${t.chieu === 'thuan' ? 'chiều thuận' : t.chieu === 'nghich' ? 'chiều nghịch' : 'không chuyển dịch'}: ${chuKinhHtml(t.chu)}</div>`).join('')}`)
  } else if (cn?.loai === 'so-sanh') {
    k.push(`<div class="sol-label">Đặt cạnh nhau</div><div class="mck-ss">${[cn.trai, cn.phai].map((v) => `<div><b>${chuKinhHtml(v.ten)}</b>${v.y.map((y) => `<span>${chuKinhHtml(y)}</span>`).join('')}</div>`).join('')}</div>`)
  }
  // 4. sơ đồ + một phép tính (nghĩa từng số)
  if (ban.soDo) k.push(`<div class="sol-label">Sơ đồ</div><div class="mck-sd">${ban.soDo.nut.map((n, i) => `${i ? `<i>→${ban.soDo!.muiTen[i - 1]?.H ? ` H = ${thoat(String(ban.soDo!.muiTen[i - 1]!.H).replace('.', ','))}%` : ''}</i>` : ''}<span><b>${chuKinhHtml(n.chat)}</b>${n.soLieu.map((s) => ` ${chuKinhHtml(s)}`).join(' ·')}</span>`).join('')}</div>`)
  for (const b of ban.buoc ?? []) {
    k.push(`<div class="sol-label">Một phép tính</div><div class="mck-pt">${chuKinhHtml(b.ten)} = ${b.thuaSo.map((t) => `<span>${chuKinhHtml(t.so)}</span>`).join(' · ')}${b.ketQua ? ` = <b>${chuKinhHtml(b.ketQua)}${b.donVi ? ` ${thoat(b.donVi)}` : ''}</b>` : ''}</div>`)
    k.push(b.thuaSo.map((t) => `<div class="sol-step"><b class="mck-so">${chuKinhHtml(t.so)}</b> ${chuKinhHtml(t.nghia)}${t.denDay ? `<span class="mck-phu">Tới đây: ${chuKinhHtml(t.denDay)}</span>` : ''}</div>`).join(''))
  }
  if (ban.phepTinh?.length) k.push(`<div class="sol-label">Các phép tính</div>${ban.phepTinh.map((p) => `<div class="sol-step"><b>${chuKinhHtml(p.ten)}</b> = ${thoat(p.bieuThuc.replace(/\*/g, ' · ').replace(/\./g, ','))} = <b>${thoat(p.ketQua)}</b>${p.nghia ? `<span class="mck-phu">${chuKinhHtml(p.nghia)}</span>` : ''}</div>`).join('')}`)
  if (ban.kiemLai) k.push(`<div class="sol-step mck-kiem">✓ <b>Kiểm bằng cách khác.</b> ${chuKinhHtml(ban.kiemLai)}</div>`)
  // 5. thầy giảng
  const giang: string[] = []
  for (const t of ban.thanChu) giang.push(`<div class="mck-tc"><small>Thần chú của thầy</small><b>${chuKinhHtml(t)}</b></div>`)
  if (ban.thayNoi) giang.push(`<div class="mck-noi"><small>Thầy nói</small>${chuKinhHtml(ban.thayNoi)}</div>`)
  if (ban.meo && ban.meo !== ban.thayNoi) giang.push(`<div class="mck-noi"><small>Mẹo của thầy</small>${chuKinhHtml(ban.meo)}</div>`)
  if (giang.length) k.push(`<div class="sol-label">Thầy giảng dạng này</div>${giang.join('')}`)
  // 6. vì sao từng phương án / ý (theo thứ tự đang chiếu — bản đã xếp ở nơi gọi)
  if ((c.phan === 'I' || c.phan === 'II') && ban.lyDo.length === 4) {
    const khoa = KHOA[c.phan]
    k.push(`<div class="sol-label">${c.phan === 'II' ? 'Vì sao từng ý đúng / sai' : 'Vì sao chọn / không chọn từng phương án'}</div><div class="sol-text">${khoa.map((kk, i) => {
      const l = ban.lyDo[i]!
      return `<div class="sol-pa${l.dung ? ' chon' : ''}"><strong>${kk}.</strong><span class="sol-dau ${l.dung ? 'dung' : 'sai'}">${l.dung ? '✓' : '✗'}</span><span class="sol-ly">${chuKinhHtml(l.chu)}</span></div>`
    }).join('')}</div>`)
  }
  // 7. chỗ hay nhầm
  if (ban.hayNham.length) k.push(`<div class="sol-label">Chỗ hay nhầm</div>${ban.hayNham.map((h) => `<div class="sol-step mck-nham"><span>✗ ${chuKinhHtml(h.nghi)}</span><span>✓ ${chuKinhHtml(h.dung)}</span></div>`).join('')}`)
  if (ban.ketQua && (c.phan === 'III' || ban.tuLuan)) k.push(`<div class="sol-label">Kết quả</div><div class="sol-text sol-ket">${chuKinhHtml(ban.ketQua)}</div>`)
  return `<div class="mck">${k.join('')}</div>`
}

/** Kiểu riêng khối Kính trên tờ chiếu — chỉ biến --mc-* của tờ (đổi được 5 chế độ máy chiếu). Tờ chèn MỘT lần. */
export const KINH_CHIEU_CSS = `.mck .sol-text,.mck .sol-step,.mck .sol-cot-loi,.mck .sol-text strong,.mck .sol-ly{color:var(--mc-muc)}.mck .sol-label{color:var(--mc-nhat)}
.mck .sol-step>b:first-child{color:var(--mc-xanh)}.mck .sol-pa.chon .sol-ly{font-weight:700}
.mck .mck-ct{font-size:1.5em;font-weight:800;margin-bottom:.2em}
.mck-chip{display:flex;flex-wrap:wrap;gap:.4em;margin:.2em 0 .5em}.mck-chip span{padding:.15em .6em;border-radius:1em;border:1px solid var(--mc-vien);color:var(--mc-muc)}.mck-chip b{color:var(--mc-xanh)}
.mck-phu{display:block;color:var(--mc-nhat);font-size:.9em;margin-top:.1em}
.mck-manh{display:grid;grid-template-columns:repeat(auto-fit,minmax(9em,1fr));gap:.5em;margin:.3em 0}.mck-manh span{display:flex;flex-direction:column;gap:.1em;padding:.4em .6em;border-radius:.7em;border:2px solid var(--mc-vien);background:var(--mc-xanh-nen)}
.mck-manh small{font-size:.75em;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--mc-nhat)}.mck-manh b{font-size:1.25em;color:var(--mc-xanh)}.mck-manh em{font-style:normal;font-size:.85em;color:var(--mc-muc)}
.mck-ten{font-size:1.6em;font-weight:800;color:var(--mc-xanh);margin:.2em 0 .4em;text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:.2em}
.mck-sd{display:flex;flex-wrap:wrap;align-items:center;gap:.4em;margin:.3em 0}.mck-sd span{padding:.35em .7em;border-radius:.7em;border:2px solid var(--mc-vien)}.mck-sd i{font-style:normal;font-weight:800;color:var(--mc-xanh)}
.mck-pt{font-size:1.35em;font-weight:800;margin:.3em 0}.mck-pt span,.mck-so{display:inline-block;padding:0 .35em;border-radius:.45em;background:var(--mc-xanh-nen);color:var(--mc-xanh)}
.mck-so{margin-right:.35em}.mck-kiem{font-weight:600}
.mck-tc{margin:.3em 0;padding:.5em .8em;border-radius:.8em;border:2px solid var(--mc-vien)}.mck-tc small,.mck-noi small{display:block;font-size:.75em;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--mc-nhat)}.mck-tc b{font-size:1.3em}
.mck-noi{margin:.3em 0;padding:.45em .8em;border-left:4px solid var(--mc-xanh)}
.mck-nham{display:flex;flex-direction:column;gap:.1em}
.mck-ss{display:grid;grid-template-columns:1fr 1fr;gap:.6em}.mck-ss>div{display:flex;flex-direction:column;gap:.15em;padding:.45em .7em;border-radius:.7em;border:2px solid var(--mc-vien)}.mck-ss b{color:var(--mc-xanh)}`
