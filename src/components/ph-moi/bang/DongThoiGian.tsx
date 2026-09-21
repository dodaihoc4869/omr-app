// DÒNG THỜI GIAN TRONG NGÀY của bảng "Mọi thứ về con" kiểu Apple: số lần ngồi học + biểu đồ cột 24 giờ + danh sách từng lần (chạm một lần ⇒ mở nhóm câu bên "Từng câu"). Mẫu: docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html (#muc-thoi-gian) + ph-e.
// Logic nguồn: BangMoiThu.tsx KhoiDongThoiGian. Mốc bị che: chỉ "Con đã làm N câu · kết quả hiện sau…" (không đúng/sai, không thanh). Khối nào thiếu dữ liệu thì ẩn — số lần/dài nhất/tổng lấy từ tổng quan khi có, thiếu thì đếm từ mốc.
import type { CSSProperties, ReactElement } from 'react'
import './DongThoiGian.css'
import { gioVn, tachVn } from '../../../lib/ph-moi/dinh-dang'
import type { NguonHien, PhMoi } from '../../../lib/ph-moi/du-lieu'
import { tenMoc } from '../nhan'
import { BtBac, BtDanhSach, BtKhoa, BtMucTieu, BtMui, BtNguoi, BtNha, BtSach, BtTichVong, BtXoay } from './bieu-tuong'
import { Thanh } from './dung-chung'
import { chuKetQuaChe, phutTheoGio, type NhomCau } from './nhom-cau'

type BieuTuong = (p: { lop?: string }) => ReactElement
const BIEU_TUONG_NGUON: Record<NguonHien, BieuTuong> = {
  on_lai: BtXoay,
  btvn: BtSach,
  thu_thach_rieng: BtMucTieu,
  luyen_dang_vap: BtBac,
  gia_dinh_giao: BtNha,
  ca_kiem_tra: BtDanhSach,
  len_bang: BtNguoi,
  khac_phuc: BtTichVong,
  luyen_de: BtDanhSach,
}

/** Có dòng thời gian để vẽ (máy chủ trả ít nhất một lần ngồi học)? */
export function coDongThoiGian(pm: PhMoi): boolean {
  return !!pm.dongThoiGian && pm.dongThoiGian.length > 0
}

const TRE_TOI_DA = 8

export function DongThoiGian({ pm, nhom, onChonMoc }: { pm: PhMoi; nhom: NhomCau[]; onChonMoc: (id: string) => void }) {
  const moc = pm.dongThoiGian
  if (!moc || moc.length === 0) return null
  const t = pm.tongQuan
  const soLan = t?.soLanHoc ?? moc.length
  const dai = Math.round(t?.lanDaiNhatPhut ?? Math.max(...moc.map((m) => m.phut)))
  const tong = Math.round(t?.phutHoc ?? moc.reduce((s, m) => s + m.phut, 0))
  const phu = [soLan > 1 ? `dài nhất ${dai} phút` : '', `tổng ${tong} phút`].filter(Boolean).join(' · ')

  // Biểu đồ 24 giờ: trục 30 phút; giờ nào vượt 30 phút thì nâng trục lên 60 (nhãn trục đổi theo, cột vẫn đúng tỉ lệ).
  const gio = phutTheoGio(moc)
  const dinh = Math.max(...gio) > 30 ? 60 : 30
  const gioCo = gio.map((v, k) => ({ k, v })).filter((x) => Math.round(x.v) >= 1)
  const nhanCot = `Số phút con học theo từng giờ trong ngày: ${gioCo.map((x) => `${x.k} giờ ${Math.round(x.v)} phút`).join(', ')}`
  let tre = 0

  const buoi = { sang: 0, chieu: 0, toi: 0 }
  for (const m of moc) {
    const g = tachVn(m.batDau)
    if (!g) continue
    if (g.h < 12) buoi.sang++
    else if (g.h < 18) buoi.chieu++
    else buoi.toi++
  }
  const chuBuoi = [buoi.sang ? `${buoi.sang} lần buổi sáng` : '', buoi.chieu ? `${buoi.chieu} lần buổi chiều` : '', buoi.toi ? `${buoi.toi} lần buổi tối` : ''].filter(Boolean).join(', ')

  return (
    <section className="phm-muc" id="muc-thoi-gian" aria-labelledby="muc-thoi-gian-h">
      <header className="phm-muc__dau">
        <h2 id="muc-thoi-gian-h">Dòng thời gian trong ngày</h2>
        <p>chạm một lần ngồi học để xem từng câu</p>
      </header>
      <div className="phm-the">
        <div className="phm-dt-dau">
          <p className="phm-so-to">
            <b>
              {soLan}
              <small>lần ngồi học</small>
            </b>
            <span>{phu}</span>
          </p>
          {gioCo.length > 0 && (
            <div className="phm-bieu phm-gio" role="img" aria-label={nhanCot}>
              <div className="phm-bieu__luoi" aria-hidden="true">
                <span style={{ top: 0 }}>
                  <em>{dinh} phút</em>
                </span>
                <span style={{ top: '50%' }}>
                  <em>{dinh / 2} phút</em>
                </span>
                <span style={{ top: '100%' }}>
                  <em>0</em>
                </span>
              </div>
              <ol aria-hidden="true">
                {gio.map((v, k) => {
                  const cot = Math.round(v) >= 1
                  const kieu = cot ? ({ '--c': Number(((v * 30) / dinh).toFixed(2)), '--phm-dt-tre': Math.min(TRE_TOI_DA, tre++) } as CSSProperties) : undefined
                  return (
                    <li key={k} data-moc={k % 6 === 0 ? '' : undefined}>
                      {cot && <i style={kieu} />}
                      {k % 6 === 0 && <span>{k} giờ</span>}
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
          {chuBuoi && <p className="phm-gio__loi">{chuBuoi}.</p>}
        </div>
        <ol className="phm-lan">
          {moc.map((m, i) => {
            const id = nhom[i]?.id ?? `moc-${i + 1}`
            const ten = tenMoc(m)
            const gioLan = gioVn(m.batDau)
            const Bt = m.che ? BtKhoa : BIEU_TUONG_NGUON[m.nguon]
            const phan = m.che ? [] : [m.soCau !== null ? `${m.soCau} câu` : '', m.soDung !== null && m.soCau !== null ? `đúng ${m.soDung}` : '', `${m.phut} phút`, m.ghiChu ? m.ghiChu.toLowerCase().replace('nộp đúng hạn', 'nộp đúng nhịp') : ''].filter(Boolean)
            const mota = m.che ? chuKetQuaChe(m.che, m.soCauDaLam) : phan.join(' · ')
            const nhanLan = `${gioLan}, ${ten}: ${m.che ? mota : phan.join(', ')}. Xem từng câu của lần này`
            const coThanh = !m.che && m.soCau !== null && m.soDung !== null && m.soCau > 0
            return (
              <li key={i}>
                <a
                  href={`#${id}`}
                  aria-label={nhanLan}
                  onClick={(e) => {
                    e.preventDefault()
                    onChonMoc(id)
                  }}
                >
                  <span className="phm-o-bt" data-mau={m.che ? 'xam' : undefined}>
                    <Bt />
                  </span>
                  <div>
                    <h3>{ten}</h3>
                    <p>
                      <b>{gioLan}</b> · {mota}
                    </p>
                    {coThanh && <Thanh ti={m.soDung! / m.soCau!} nhan={`đúng ${m.soDung} trong ${m.soCau} câu`} mau="dat" manh />}
                  </div>
                  <BtMui lop="phm-i--mui" />
                </a>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
