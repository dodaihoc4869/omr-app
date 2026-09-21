// Khối "14 ngày gần đây" của bảng "Mọi thứ về con" kiểu Apple (mẫu ph-d-bang-day-du.html #muc-14 + ph-e-bang-thua.html): số câu, biểu đồ 14 cột (ChuoiMuoiBonNgay), chú giải, ba dòng số liệu. Ngày máy chủ không có dòng = "không học".
// Ngày đầu có học muộn hơn đầu cửa sổ ⇒ "con bắt đầu dùng app từ …"; CHƯA học hôm nay ⇒ hôm nay chưa tính, chuỗi "tính đến hôm qua", bỏ ba dòng. "Trung bình mỗi ngày có học": máy chủ tính trên các ngày có học.
import type { CSSProperties } from 'react'
import { ngayChuoiNgan, soVn } from '../../../lib/ph-moi/dinh-dang'
import type { PhMoi } from '../../../lib/ph-moi/du-lieu'
import { ChuoiMuoiBonNgay } from '../../../lib/ph-moi/nhip-ngay'
import { conChuaHoc } from './dung-chung'
import { congNgay, nhanThuNgay, thuNgayChuoi } from './c-chung'
import './khoi-c.css'

/** Có thể vẽ được: máy chủ trả nhipHoc, dựng đủ 14 ngày, và con có học ít nhất một ngày trong 14 ngày. */
export function coNhip14(pm: PhMoi): boolean {
  const ds = ChuoiMuoiBonNgay(pm)
  return ds.length === 14 && !!pm.nhipHoc && ds.some((d) => d.soCau !== null && d.soCau > 0)
}

const lamRon1 = (x: number): number => Math.round(x * 10) / 10

export function Nhip14({ pm, chuaHoc }: { pm: PhMoi; chuaHoc?: boolean }) {
  const ds = ChuoiMuoiBonNgay(pm)
  const nh = pm.nhipHoc
  if (ds.length !== 14 || !nh) return null
  const hoc = (i: number): boolean => ds[i]!.soCau !== null && (ds[i]!.soCau as number) > 0
  const dau = ds.findIndex((_, i) => hoc(i))
  if (dau < 0) return null
  const chua = (chuaHoc ?? conChuaHoc(pm)) && !hoc(13) // hôm nay chưa học: không tính hôm nay vào số ngày
  const cuoi = chua ? 12 : 13
  if (dau > cuoi) return null

  const soNgay = cuoi - dau + 1
  let soNgayHoc = 0
  for (let i = dau; i <= cuoi; i++) if (hoc(i)) soNgayHoc++
  const tongCau = nh.tongCau ?? ds.reduce((t, d) => t + (d.soCau ?? 0), 0)
  const thua = dau > 0
  const chuoi = pm.tongQuan?.chuoiNgayHoc ?? null
  const coChuoi = chuoi !== null && chuoi > 0

  const chuSoNgayHoc = soNgayHoc === soNgay && soNgay >= 2 ? `con học đủ cả ${soNgay} ngày` : `con học ${soNgayHoc} trong ${soNgay} ngày`
  const chuPhuSo = chua && coChuoi ? `chuỗi ${chuoi} ngày, tính đến hôm qua` : chuSoNgayHoc
  const dauCuaSo = ngayChuoiNgan(ds[0]!.ngay)
  const cuoiCuaSo = ngayChuoiNgan(ds[13]!.ngay)
  const chuPhuMuc = thua ? `con bắt đầu dùng app từ ${thuNgayChuoi(ds[dau]!.ngay)}` : `số câu con làm mỗi ngày · ${dauCuaSo} đến ${cuoiCuaSo}`

  // Trục cao: mặc định 40 câu như mẫu; ngày nhiều hơn thì nới trục (cột không tràn khỏi khung, nhãn trục nói đúng số).
  const nhieuNhat = Math.max(...ds.map((d) => d.soCau ?? 0))
  const truc = Math.max(40, Math.ceil(nhieuNhat / 10) * 10)
  const chuBieuDo = `Số câu con làm mỗi ngày, ${dauCuaSo} đến ${cuoiCuaSo}: ${ds.map((d) => `${nhanThuNgay(d.ngay)}: ${d.soCau !== null && d.soCau > 0 ? `${d.soCau} câu` : 'không học'}`).join('; ')}`

  const trungBinh = nh.trungBinhCauMoiNgay ?? (soNgayHoc > 0 ? tongCau / soNgayHoc : null)
  const gio = nh.gioThuongHoc.replace(/\s*[–-]\s*/, ' đến ')
  const batDauChuoi = coChuoi ? ngayChuoiNgan(congNgay(ds[cuoi]!.ngay, -((chuoi as number) - 1))) : ''
  const coDong = !chua && (trungBinh !== null || gio !== '' || (coChuoi && batDauChuoi !== ''))

  return (
    <section className="phm-muc" id="muc-14" aria-label="14 ngày gần đây">
      <header className="phm-muc__dau">
        <h2>14 ngày gần đây</h2>
        <p>{chuPhuMuc}</p>
      </header>
      <div className="phm-the phm-the--dem">
        <p className="phm-so-to">
          <b>
            {tongCau} <small>câu trong {soNgay} ngày</small>
          </b>
          <span>{chuPhuSo}</span>
        </p>
        <div className="phm-bieu phm-14" role="img" aria-label={chuBieuDo}>
          <div className="phm-bieu__luoi" aria-hidden="true">
            <span style={{ top: 0 }}>
              <em>{truc} câu</em>
            </span>
            <span style={{ top: '50%' }}>
              <em>{truc / 2} câu</em>
            </span>
            <span style={{ top: '100%' }}>
              <em>0</em>
            </span>
          </div>
          <ol aria-hidden="true">
            {ds.map((d, i) => {
              const co = hoc(i)
              return (
                <li key={d.ngay} data-nghi={co ? undefined : ''} data-nay={i === 13 ? '' : undefined} style={{ '--c': co ? Math.round(((d.soCau as number) * 40 * 100) / truc) / 100 : 0, '--k': i } as CSSProperties}>
                  {i === 13 && co && <em>{d.soCau}</em>}
                  <i />
                  <span>{d.ngay.slice(8, 10)}</span>
                </li>
              )
            })}
          </ol>
        </div>
        <p className="phm-14__chu" aria-hidden="true">
          <span>
            <i data-nay="" />
            hôm nay
          </span>
          <span>
            <i />
            ngày có học
          </span>
          <span>
            <i data-nghi="" />
            ngày con không học
          </span>
        </p>
        {coDong && (
          <ul className="phm-ds phm-ds--vach">
            {trungBinh !== null && (
              <li>
                <span>Trung bình mỗi ngày có học</span>
                <b>{soVn(lamRon1(trungBinh))} câu</b>
              </li>
            )}
            {gio !== '' && (
              <li>
                <span>Giờ con thường học</span>
                <b>
                  <span className="phm-lien">{gio}</span>
                </b>
              </li>
            )}
            {coChuoi && batDauChuoi !== '' && (
              <li>
                <span>Chuỗi học đều</span>
                <b>
                  {chuoi} ngày<small>liên tục từ {batDauChuoi}</small>
                </b>
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  )
}
