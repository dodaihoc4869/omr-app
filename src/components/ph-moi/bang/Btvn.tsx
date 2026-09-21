// Khối "Bài tập về nhà" của bảng "Mọi thứ về con" kiểu Apple (mẫu docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html #muc-btvn): bài đang chạy (chấm chặng · hạn nộp) + dòng cam nợ (Dồn về đích) + "Gần đây · mới nhất trước".
// Máy chủ KHÔNG trả số đúng/tổng câu hay giờ nộp từng chặng ⇒ không dựng dòng "Chặng N · đúng x/y câu" và chip "Nộp đúng nhịp". Chặng thiếu ⇒ vẽ tiến độ "Xong a trong b chặng" bằng thanh; thiếu cả hai ⇒ không vẽ tiến độ.
import type { CSSProperties } from 'react'
import { gioVn, ngayDayDuVn, soVn, thuTuChuoiNgay } from '../../../lib/ph-moi/dinh-dang'
import type { BtvnDangChay, BtvnGan, ChangBtvn, NoPh, PhMoi } from '../../../lib/ph-moi/du-lieu'
import { BtDongHo, BtSach, BtTich } from './bieu-tuong'
import { Thanh, Chip } from './dung-chung'
import { chuConLai, mocMay, ngayVnChuoi } from './c-chung'
import './khoi-c.css'

export const coBtvn = (pm: PhMoi): boolean => !!pm.baiTapVeNha && (pm.baiTapVeNha.dangChay.length > 0 || pm.baiTapVeNha.gan.length > 0)

/** Tối đa bấy nhiêu chấm chặng trên một hàng (điện thoại 390 px); nhiều hơn ⇒ vẽ bằng thanh. */
const TOI_DA_CHAM = 7

const TEN_TRANG_THAI: Record<ChangBtvn['trangThai'], string> = { xong: 'đã xong', hom_nay: 'của hôm nay', sap_toi: 'sắp tới' }

function ChamChang({ chang, homNay }: { chang: ChangBtvn[]; homNay: string }) {
  const dem = { xong: 0, hom_nay: 0, sap_toi: 0 }
  for (const c of chang) dem[c.trangThai]++
  const chu = [`${dem.xong} đã xong`, dem.hom_nay > 0 ? `${dem.hom_nay} của hôm nay` : '', dem.sap_toi > 0 ? `${dem.sap_toi} sắp tới` : ''].filter(Boolean).join(', ')
  return (
    <ol className="phm-chang" style={{ '--so-chang': chang.length } as CSSProperties} aria-label={`${chang.length} chặng: ${chu}`}>
      {chang.map((c, i) => (
        <li key={`${c.ngay}-${i}`} data-tt={c.trangThai === 'xong' ? 'xong' : c.trangThai === 'hom_nay' ? 'hom-nay' : ''}>
          <i>{c.trangThai === 'xong' ? <BtTich /> : i + 1}</i>
          {c.ngay === homNay ? 'Hôm nay' : `${c.thu} ${c.ngay.slice(8, 10)}`}
          <span className="phm-sr"> · chặng {i + 1} {TEN_TRANG_THAI[c.trangThai]}</span>
        </li>
      ))}
    </ol>
  )
}

function BaiDangChay({ d, nay }: { d: BtvnDangChay; nay: number }) {
  const homNay = ngayVnChuoi(nay)
  const coChang = !!d.chang && d.chang.length > 0 && d.chang.length <= TOI_DA_CHAM
  const changTong = d.changTong ?? (d.chang ? d.chang.length : null)
  const changXong = d.changXong ?? (d.chang ? d.chang.filter((c) => c.trangThai === 'xong').length : null)
  const coTienDo = changTong !== null && changXong !== null && changTong > 0 && changXong <= changTong
  const chuTienDo = coTienDo ? `Xong ${changXong} trong ${changTong} chặng` : ''
  const han = Date.parse(d.hanNop)
  return (
    <div className="phm-the phm-the--dem">
      <p className="phm-nhan-muc">
        <BtSach />
        Đang chạy
      </p>
      <h3 className="phm-ten-the">{d.ten}</h3>
      {coTienDo && <p className="phm-phu">{chuTienDo}</p>}
      {coChang ? (
        <ChamChang chang={d.chang as ChangBtvn[]} homNay={homNay} />
      ) : (
        coTienDo && (
          <div style={{ marginTop: 12 }}>
            <Thanh ti={(changXong as number) / (changTong as number)} nhan={chuTienDo} />
          </div>
        )
      )}
      {Number.isFinite(han) && (
        <ul className="phm-ds phm-ds--vach">
          <li>
            <span>Hạn nộp</span>
            <b>
              {gioVn(d.hanNop)} · {ngayDayDuVn(d.hanNop)}
              <small>{chuConLai(han, nay)}</small>
            </b>
          </li>
        </ul>
      )}
    </div>
  )
}

/** Chữ của dòng cam nợ: { dam: "Con còn 1 chặng của Thứ Hai", phu: "tối nay cần khoảng 15 phút" }; phần nào không có số thật thì rỗng. */
export function chuDongNo(no: NoPh): { dam: string; phu: string } {
  let chang = 0
  let gia = 0
  let onCau = 0
  let khac = 0
  for (const m of no.theoNgay) {
    if (/^chang/.test(m.loai)) chang++
    else if (m.loai === 'goi_gia_dinh') gia++
    else if (m.loai === 'on_lai' && m.soCau !== null && m.soCau > 0) onCau += m.soCau
    else khac++
  }
  const viec = [chang > 0 ? `${chang} chặng` : '', gia > 0 ? `${gia} bài gia đình giao` : '', onCau > 0 ? `${onCau} câu ôn lại` : '', khac > 0 ? `${khac} việc` : ''].filter(Boolean).join(', ')
  const ngay = [...new Set(no.theoNgay.map((m) => m.ngay))].sort()
  const thu = [...new Set(ngay.map(thuTuChuoiNgay))].filter(Boolean)
  const cua = ngay.length <= 3 && thu.length > 0 ? thu.join(', ') : 'các ngày trước'
  const phut = no.tongPhut !== null && no.tongPhut > 0 ? Math.round(no.tongPhut) : 0
  return { dam: `Con còn ${viec} của ${cua}`, phu: phut > 0 ? `tối nay cần khoảng ${phut} phút` : '' }
}

function DongNo({ no }: { no: NoPh }) {
  const { dam, phu } = chuDongNo(no)
  return (
    <p className="phm-dong-cam">
      <BtDongHo />
      <span>
        <b>{dam}</b>
        {phu ? ` · ${phu}` : ''}
      </span>
    </p>
  )
}

function ChipNop({ g }: { g: BtvnGan }) {
  if (g.dungHan === true)
    return (
      <Chip mau="dat" icon={<BtTich />}>
        Nộp đúng hạn
      </Chip>
    )
  if (g.dungHan === false)
    return (
      <Chip mau="cam" icon={<BtDongHo />}>
        {g.nopTreGio !== null && g.nopTreGio > 0 ? `Nộp trễ ${soVn(g.nopTreGio)} giờ` : 'Nộp sau hạn'}
      </Chip>
    )
  return null
}

export function Btvn({ pm }: { pm: PhMoi }) {
  const b = pm.baiTapVeNha
  if (!b || (b.dangChay.length === 0 && b.gan.length === 0)) return null
  const nay = mocMay(pm)
  const gan = [...b.gan].sort((x, y) => Date.parse(y.nopLuc) - Date.parse(x.nopLuc))
  const dem = [b.dangChay.length > 0 ? `${b.dangChay.length} bài đang chạy` : '', gan.length > 0 ? `${gan.length} bài gần đây` : ''].filter(Boolean).join(' · ')
  return (
    <section className="phm-muc" id="muc-btvn" aria-label="Bài tập về nhà">
      <header className="phm-muc__dau">
        <h2>Bài tập về nhà</h2>
        <p>{dem}</p>
      </header>
      {b.dangChay.map((d) => (
        <BaiDangChay key={d.maBtvn} d={d} nay={nay} />
      ))}
      {pm.no && <DongNo no={pm.no} />}
      {gan.length > 0 && (
        <>
          <div className="phm-nhom__dau" style={{ marginTop: b.dangChay.length > 0 || pm.no ? 20 : 0 }}>
            <h3>Gần đây · mới nhất trước</h3>
          </div>
          <div className="phm-the">
            <ul className="phm-bai">
              {gan.map((g) => (
                <li key={g.maBtvn}>
                  <div>
                    <h3>{g.ten}</h3>
                    <p>
                      Nộp {gioVn(g.nopLuc)} · {ngayDayDuVn(g.nopLuc)}
                    </p>
                    <ChipNop g={g} />
                  </div>
                  {g.diem !== null && (
                    <p className="phm-bai__diem">
                      {soVn(g.diem)}
                      <small>/10 điểm</small>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  )
}
