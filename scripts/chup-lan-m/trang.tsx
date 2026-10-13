// TRANG CHỤP ẢNH ĐỢT 19 · LÀN M (thầy 13/10: "chỗ bấm vào bậc này cho hiện đủ 12 bậc …, thiết kế lại biểu tượng từng bậc … để học sinh phải wow" ·
// "bấm vào từng bậc sẽ hiện ra danh sách siêu đẹp của từng học sinh đó") — component THẬT + máy chủ GIẢ ngay trong trang (thay `fetch`; không yêu cầu
// nào tới máy chủ thật, tên em là tên giả). Bậc của dữ liệu giả tính bằng ĐÚNG phép máy chủ (`bacChamChi`).
//   ?man=bo            — bộ 12 huy hiệu × cỡ 20 / 32 / 72 px + chip nhỏ, trên nền trang (sáng/tối theo chế độ màu của trình duyệt).
//   ?man=hs&bac=3|11   — app học sinh: Hôm nay (chip bậc là nút ⇒ tấm 12 bậc; chup.mjs bấm chip).
//   ?man=ph&bac=3|11   — app phụ huynh (thẻ Nhịp học của con).
//   ?man=gv            — app thầy: Nhịp học cả lớp (262 em giả) — dải đếm bấm được ⇒ tấm danh sách em theo bậc (chup.mjs bấm ô).
//   ?man=chieu         — tờ chiếu điểm danh bản A (huy hiệu thay emoji, không bấm).
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-800.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/latin-800.css'
import '../../src/styles/tokens.css'
import '../../src/styles/thang.css'
import '../../src/index.css'
import '../../src/styles/gv-mau.css'
import '../../src/styles/teacher-modern.css'
import '../../src/components/chien-dich/gv-v2.css'
import HuyHieuBac from '../../src/components/bac-cham-chi/HuyHieuBac'
import ChipBac from '../../src/components/bac-cham-chi/ChipBac'
import { BAC_CHAM_CHI } from '../../src/components/bac-cham-chi/bac'
import AppPhuHuynh from '../../src/components/ph-v3/AppPhuHuynh'
import HocTapHomNay from '../../src/components/hoc-tap/HocTapHomNay'
import NhipHocThay from '../../src/components/hom-nay-thay/NhipHocThay'
import BanChieuDiemDanh from '../../src/components/day-hoc/BanChieuDiemDanh'
import { docSanh } from '../../src/components/hoa2/api'
import { nhipTheoSbd, thongKeBuoi } from '../../src/lib/diem-danh-nhip'
import type { TrangThaiBuoi } from '../../src/lib/buoi-hoc-api'
import { bacChamChi } from '../../server/src/bac-cham-chi'
import { tomTatNhip } from '../../server/src/nhip-hoc-luat'
import type { EmNhipHoc, KetQuaNhipHoc } from '../../server/src/nhip-hoc-kieu'
import { PH_OK } from '../../tests/_ph-moi/du-lieu-mau'
import { conTongQuanGia } from '../chup-v2/gia/ph-con-tong-quan'
import { nhipHocGia } from '../chup-v2/gia/nhip-hoc'
import { NHIP_BAC_11, NHIP_BAC_3 } from './gia'

const thamSo = new URLSearchParams(location.search)
const man = thamSo.get('man') ?? 'bo'
const nhipEm = thamSo.get('bac') === '11' ? NHIP_BAC_11() : NHIP_BAC_3()
const noop = () => {}

/** Cả lớp kèm bậc từng em (các ngày từ ngày vào — đúng `ngayDuocTinh` của máy chủ). */
function lopCoBac(): KetQuaNhipHoc {
  const r = nhipHocGia()
  const kq = (r.ok ? r.du : {}) as unknown as KetQuaNhipHoc
  return {
    ...kq,
    em: kq.em.map((e: EmNhipHoc) => {
      const dai = kq.ngay.map((ngay, i) => ({ ngay, muc: e.muc[i]!, lam: e.lam[i]! })).filter((x) => x.ngay >= e.ngayVao)
      const b = bacChamChi(dai, kq.homNay, tomTatNhip(dai, kq.homNay))
      return b ? { ...e, bacCham: b } : e
    }),
  }
}

const tra = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })
window.fetch = async (input: RequestInfo | URL) => {
  const u = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href)
  const d = u.pathname
  if (d.endsWith('cau-hinh.json')) return tra({ mayChuMoi: 'https://may-chu-gia.example.com' })
  if (d.endsWith('/hs/nhip-hoc') || d.endsWith('/ph/nhip-hoc')) return tra(nhipEm)
  if (d.endsWith('/ph/con-tong-quan')) return tra(conTongQuanGia())
  if (d.endsWith('/ph/tat-ca-ve-con')) return tra(PH_OK)
  if (d.endsWith('/ph/hoc-2')) return tra({ ok: true, cheDo2: true, ngay: '2026-10-12', homNay: { tong: 30, daLam: 0 } })
  return tra({ ok: true })
}

/** Cỡ huy hiệu của bảng (`&co=96` để soi kỹ một cỡ). */
const CO = (thamSo.get('co') ?? '20,32,72').split(',').map(Number)
function Bo() {
  const cot = { display: 'grid', gridTemplateColumns: `repeat(12, ${Math.max(78, ...CO) + 6}px)`, gap: '10px 6px', justifyItems: 'center', alignItems: 'center' } as const
  return h('div', { id: 'bo', style: { background: 'var(--nen)', color: 'var(--muc)', padding: '16px 20px', width: 'max-content', fontFamily: 'var(--sans)' } },
    h('div', { style: cot },
      ...BAC_CHAM_CHI.map((b) => h('div', { key: 's' + b.so, style: { fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.2, height: 28 } }, `${b.so} · ${b.ten}`)),
      ...CO.flatMap((co) => BAC_CHAM_CHI.map((b) => h(HuyHieuBac, { key: `${co}-${b.so}`, bac: b.so, co }))),
      ...BAC_CHAM_CHI.map((b) => h('div', { key: 'd' + b.so, style: { background: 'var(--the)', borderRadius: 12, padding: 6 } }, h(ChipBac, { bac: b.so, nho: true }))),
    ),
  )
}

// Sảnh giả của em (Gói 7 "Bài 8. Amine", 5/30 câu hôm nay).
const GOI7 = {
  bat: true, ngay: '2026-10-12', toiThieu: 30, daLamHomNay: 4, tuLamCon: 20, tiepCanCon: 6, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [],
  goi: [{ id: 'g7:amine', ten: 'Bài 8. Amine', batDau: '2026-10-11', han: '2026-10-16', tong: 164, daGap: 13, con: 151, quota: 30, gapHomNay: 4, quaHan: false, canBoSung: 0, to: ['DH-B8-TN'] }],
}

function ManHs() {
  return h(HocTapHomNay, {
    token: 'tk', ten: 'Nguyễn Minh Anh', lop: '12A1', dangTai: false, loi: '', coCa: false, onMoHoSo: noop,
    ketQua: docSanh({ cheDo2: true, theLuc: { con: 26, tong: 30 }, goi7: GOI7 }),
    onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onTaiLai: noop, onDangXuat: noop,
  })
}

function ManGv() {
  return h('div', { className: 'm3 m3-thay vo-thay', 'data-hoa2': '', style: { minHeight: '100vh', padding: '24px', boxSizing: 'border-box' } },
    h('div', { className: 'gvhn-1210', style: { display: 'grid', gap: 20, maxWidth: 1240, margin: '0 auto' } }, h(NhipHocThay, { du: { ok: true, kq: lopCoBac() }, dangTai: false, onThuLai: noop })))
}

const LOP_DD = '12 Nhóm 10 điểm'
const MO_LUC = '2026-10-12T10:52:00Z'
function ManChieu() {
  const kq = lopCoBac()
  const ds = kq.em.filter((e) => e.lop === LOP_DD)
  const vang = new Set(ds.filter((_, i) => i % 5 === 2).map((e) => e.sbd))
  const coMat = ds.filter((e) => !vang.has(e.sbd)).map((e, i) => ({ sbd: e.sbd, hoTen: e.hoTen, luc: new Date(Date.parse(MO_LUC) + 60_000 + i * 21_000).toISOString(), cach: (i === 3 ? 'thay' : 'ma') as 'thay' | 'ma' }))
  const tt: TrangThaiBuoi = {
    buoi: { id: 'BH-M', ten: `Buổi học 12/10 · ${LOP_DD}`, lop: LOP_DD, moLuc: MO_LUC, hetHan: '2026-10-13T10:52:00Z', dongLuc: null, dangMo: true },
    ma: '482915', doiMaLuc: 1, coMat, siSo: ds.length, lopEm: ds.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tenLop: LOP_DD })),
  }
  return h(BanChieuDiemDanh, {
    cheDo: thamSo.get('b') === '1' ? 'nhip-lop' : 'diem-danh', tt, tk: thongKeBuoi(tt, nhipTheoSbd(kq)), nhip: { kq, dangTai: false, loi: '' }, goc: 'https://omr-app-b3u.pages.dev',
    matKetNoi: false, hoSoMo: false, onDoiCheDo: noop, onDong: noop, onMoEm: noop, onThuLaiNhip: noop, onSangDauGio: noop,
  })
}

createRoot(document.getElementById('root')!).render(
  man === 'gv' ? h(ManGv)
  : man === 'chieu' ? h('div', { className: 'm3 m3-thay vo-thay' }, h(ManChieu))
  : man === 'ph' ? h('div', { className: 'm3' }, h(AppPhuHuynh, { sbd: '12121212', hoTen: 'Nguyễn Minh Anh', lop: '12A1', onDoiSbd: noop }))
  : man === 'hs' ? h(ManHs)
  : h(Bo),
)
