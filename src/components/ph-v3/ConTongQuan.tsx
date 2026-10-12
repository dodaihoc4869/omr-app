// LÀN PHỤ HUYNH 12/10 (thầy: "cho phụ huynh biết nhiều thông tin cần thiết nữa về con, số câu làm đúng, làm sai, thời gian làm từng câu gợi ý nhắc …
// làm app phụ huynh siêu đẹp trực quan để phụ huynh theo dõi được con toàn diện"). Các khối đọc `/ph/con-tong-quan` (src/lib/ph-v3/con-tong-quan.ts):
//   Hôm nay  — ba số trong khối chính (câu đúng · câu sai · trung bình mỗi câu) · Gợi ý nhắc con · Lịch học tuần này (+ từng ngày từ 12/10).
//   Tiến bộ  — Đúng và sai theo ngày (cột chồng 14 ngày + ba ô Hôm nay / 7 ngày / Từ 12/10) · Thời gian làm câu (phân bố + câu gần đây) · Câu sai gần đây.
// Biểu đồ vẽ bằng CSS (không thư viện). Màu CHỈ biến --ph3-* sẵn có; màu không là kênh duy nhất (luôn kèm chữ / số / biểu tượng).
// Không mã câu, không đáp án; số nào cũng có nhãn; ước tính ghi "≈"; lượt không đo được ghi "chưa đo giờ".
import type { ReactElement } from 'react'
import type { ConTongQuan, DemCau, GoiYNhac, LuotGanDay, NgayHoc } from '../../lib/ph-v3/con-tong-quan'
import { chuGiay, nhanKhoangGiay, tiLeDung } from '../../lib/ph-v3/con-tong-quan'
import { ngayChuoiNgan, ngayNganVn, gioVn, thuTuChuoiNgay } from '../../lib/ph-moi/dinh-dang'
import { BtBongDen, BtBut, BtDongHo, BtHomNay, BtLich, BtNhan, BtPhai, BtTich, BtTrang, BtXuong } from './BieuTuong'
import { The, TheLoi } from './dung-chung'
import type { Mau } from './dung-chung'
import { tuanNay } from './tien-ich'

const THU_NGAN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const
const THU_DAY = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'] as const
/** Số dòng "câu gần đây" hiện sẵn; phần còn lại mở bằng "Xem thêm". */
const DONG_GAN_DAY = 6
const DONG_CAU_SAI = 6

/** Trạng thái tải của khối tổng quan (máy chủ cũ chưa có lệnh ⇒ `v: null`, các khối mới vắng). */
export type TaiTongQuan = { v: ConTongQuan | null; daTai: boolean; chuLoi: string; thuLai: () => void }

export const homNayCua = (tq: ConTongQuan | null): NgayHoc | null => tq?.ngay.find((n) => n.homNay) ?? null
const xap = (n: NgayHoc) => (n.mucUocTinh ? '≈' : '')

/** Câu tình trạng hôm nay theo mức tối thiểu (một câu, không nhắc lại số đã ghi to). */
export function chuTinhTrangMuc(n: NgayHoc): string {
  if (n.daLam >= n.canLam) return 'Con đã đủ mức tối thiểu hôm nay.'
  if (n.daLam === 0 && n.soCau === 0) return 'Con chưa làm câu nào hôm nay.'
  return `Còn ${xap(n)}${n.canLam - n.daLam} câu nữa là đủ mức tối thiểu của ngày.`
}

/** Nhãn ngắn trạng thái một ngày: "Đủ mức" · "Thiếu 12 câu" · "Không làm"; hôm nay: "Đủ mức" · "Còn 12 câu" · "Chưa làm". */
export function chuTrangThaiNgay(n: NgayHoc): string {
  const con = n.canLam - n.daLam
  if (n.daLam >= n.canLam) return 'Đủ mức'
  if (n.homNay) return n.daLam === 0 && n.soCau === 0 ? 'Chưa làm' : `Còn ${xap(n)}${con} câu`
  return n.trangThai === 'khong' ? 'Không làm' : `Thiếu ${xap(n)}${con} câu`
}
const mauTrangThai = (n: NgayHoc): Mau => (n.daLam >= n.canLam ? 'xl' : n.homNay ? 'xd' : n.trangThai === 'khong' ? 'ho' : 'hp')

// ---------------------------------------------------------------- HÔM NAY · ba số trong khối chính ----------------------------------------------------------------
/** Ba ô trong khối chính (nền xanh đậm): câu đúng · câu sai · trung bình mỗi câu. Số đúng/sai tính theo từng lần trả lời. */
export function BaSoHomNay({ d }: { d: DemCau }) {
  return (
    <div className="ph3-ah__ba-khoi" data-vung="dung-sai-hom-nay">
      <dl className="ph3-ah__ba">
        <div><dt><i data-mau="xl" aria-hidden="true" />Câu đúng</dt><dd>{d.dung}</dd></div>
        <div><dt><i data-mau="ho" aria-hidden="true" />Câu sai</dt><dd>{d.sai}</dd></div>
        <div><dt>Trung bình</dt><dd>{d.giayTb === null ? <small>chưa đo giờ</small> : d.giayTb < 60 ? <>{d.giayTb}<small> giây/câu</small></> : <>{chuGiay(d.giayTb)}<small>/câu</small></>}</dd></div>
      </dl>
      <p className="ph3-ah__ghi-nho">Đúng, sai tính theo từng lần con trả lời{d.boTrong > 0 ? ` · ${d.boTrong} câu bỏ trống` : ''}.</p>
    </div>
  )
}

// ---------------------------------------------------------------- HÔM NAY · Gợi ý nhắc con ----------------------------------------------------------------
const BT_GOI_Y: Record<GoiYNhac['ma'], { bt: () => ReactElement; mau: Mau }> = {
  'con-cau-hom-nay': { bt: () => <BtHomNay co={20} />, mau: 'xd' },
  'chua-lam-hom-nay': { bt: () => <BtHomNay co={20} />, mau: 'xd' },
  'sai-chua-sua': { bt: () => <BtBut co={20} />, mau: 'ho' },
  'nhanh-sai': { bt: () => <BtDongHo co={20} />, mau: 'hp' },
  'thieu-ngay': { bt: () => <BtLich co={20} />, mau: 'tim' },
  'ti-le-giam': { bt: () => <BtXuong co={20} day={2.4} />, mau: 'ho' },
  'lam-khuya': { bt: () => <BtTrang co={20} />, mau: 'tim' },
  'dung-goi-y': { bt: () => <BtBongDen co={20} />, mau: 'hp' },
}

/** Khối "Gợi ý nhắc con": đang tải ⇒ khung xương; lỗi ⇒ lý do + Thử lại; không có câu nhắc ⇒ nói rõ vì sao. Máy chủ cũ (v null, đã tải) ⇒ vắng. */
export function GoiYNhacCon({ tai }: { tai: TaiTongQuan }) {
  if (!tai.v) {
    if (tai.chuLoi) return <TheLoi chu={/^Chưa /.test(tai.chuLoi) ? tai.chuLoi : `Chưa xem được gợi ý nhắc con. ${tai.chuLoi}`} thuLai={tai.thuLai} />
    if (!tai.daTai) return <div className="ph3-xuong tt-xuong ph3-o-rong" data-hinh="the" data-vung="goi-y-dang-tai" aria-hidden="true"><span /><span /><span /></div>
    return null
  }
  const ds = tai.v.goiY
  return (
    <The id="ph3-goi-y" className="ph3-the--goi-y ph3-o-rong ph3-o-cao" vung="goi-y-nhac" bieuTuong={<BtBongDen co={22} />} mau="hp" tieuDe="Gợi ý nhắc con"
      phu={`Theo số liệu đến ${gioVn(tai.v.serverNow)} hôm nay`}>
      {tai.chuLoi && <div className="ph3-lam-moi-loi" role="status"><span>Gợi ý đang theo bản đã tải. {tai.chuLoi}</span><button type="button" className="tt-nhan" onClick={tai.thuLai}>Thử lại gợi ý</button></div>}
      {ds.length > 0 ? (
        <ol className="ph3-goi-y">
          {ds.map((g) => {
            const k = BT_GOI_Y[g.ma]
            return (
              <li key={g.ma} data-ma={g.ma}>
                <span className="ph3-o-bt" data-mau={k.mau} aria-hidden="true">{k.bt()}</span>
                <p>{g.chu}</p>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="ph3-ghi">Chưa có điều cần nhắc: con không có ngày thiếu mức, câu sai chờ sửa hay câu làm vội trong số liệu hiện có.</p>
      )}
    </The>
  )
}

// ---------------------------------------------------------------- HÔM NAY · Lịch học tuần này ----------------------------------------------------------------
/** Lịch tuần (Thứ Hai → Chủ nhật): mỗi ngày từ 12/10 một ô tròn có số câu đã làm và mức; ngày chưa tới nét đứt; trước mốc ghi "chưa theo dõi". */
export function LichTuan({ tq }: { tq: ConTongQuan }) {
  const { ngay: tuan, homNay } = tuanNay(tq.serverNow)
  if (tuan.length !== 7) return null
  const theo = new Map(tq.ngay.map((n) => [n.ngay, n]))
  const tuMoc = tq.ngay.filter((n) => n.ngay >= tq.moc)
  const trongTuan = tuan.map((n) => theo.get(n)).filter((n): n is NgayHoc => !!n && n.ngay >= tq.moc && (!n.homNay || n.daLam >= n.canLam))
  const du = trongTuan.filter((n) => n.daLam >= n.canLam).length
  const coUoc = tuMoc.some((n) => n.mucUocTinh)
  return (
    <The id="ph3-lich" className="ph3-o-hep" vung="lich-tuan" tieuDe="Lịch học tuần này" phu={`Theo dõi từ ${ngayChuoiNgan(tq.moc)} · số câu đã làm / mức tối thiểu`}
      chip={trongTuan.length > 0 ? <b className="ph3-the__so">Đủ mức {du}/{trongTuan.length} <small>ngày</small></b> : undefined}>
      <ol className="ph3-lich">
        {tuan.map((n, i) => {
          const d = theo.get(n)
          const sau = i > homNay
          const truocMoc = n < tq.moc
          const tt = sau ? 'chua-toi' : truocMoc || !d ? 'truoc' : d.daLam >= d.canLam ? 'du' : d.homNay ? 'nay' : d.trangThai
          const chu = sau ? 'chưa tới' : truocMoc || !d ? 'chưa theo dõi' : `${chuTrangThaiNgay(d)}, đã làm ${d.daLam}/${xap(d)}${d.canLam} câu`
          return (
            <li key={n} data-tt={tt} data-nay={i === homNay ? '' : undefined}>
              <span className="ph3-lich__thu" aria-hidden="true">{THU_NGAN[i]}</span>
              <i aria-hidden="true">{d && !sau && !truocMoc ? (d.daLam >= d.canLam ? <BtTich co={16} day={3} /> : d.daLam) : ''}</i>
              <span className="ph3-lich__muc" aria-hidden="true">{d && !sau && !truocMoc ? `/${xap(d)}${d.canLam}` : ''}</span>
              <span className="ph3-an">{THU_DAY[i]} {n.slice(8)}/{n.slice(5, 7)}: {chu}</span>
            </li>
          )
        })}
      </ol>
      <div className="ph3-chu-thich ph3-lich__chu-thich" aria-hidden="true">
        <span><i data-tt="du" />Đủ mức</span>
        <span><i data-tt="thieu" />Chưa đủ</span>
        <span><i data-tt="khong" />Không làm</span>
      </div>
      {tuMoc.length > 0 && (
        <details className="ph3-xem-them">
          <summary className="tt-nhan"><BtPhai co={18} day={2.5} />Xem từng ngày từ {ngayChuoiNgan(tq.moc)} ({tuMoc.length} ngày)</summary>
          <ul className="ph3-ngay-ds" data-vung="lich-tung-ngay">
            {[...tuMoc].reverse().map((n) => (
              <li key={n.ngay}>
                <div className="ph3-ngay-ds__dau">
                  <b>{n.homNay ? 'Hôm nay' : thuTuChuoiNgay(n.ngay)} {ngayChuoiNgan(n.ngay)}</b>
                  <span className="ph3-chip ph3-chip--nho" data-mau={mauTrangThai(n)}>{chuTrangThaiNgay(n)}</span>
                </div>
                <span>Đã làm {n.daLam}/{xap(n)}{n.canLam} câu · {n.dung} câu đúng · {n.sai} câu sai</span>
              </li>
            ))}
          </ul>
          {coUoc && <p className="ph3-ghi-nho">≈ là mức ước tính theo quy tắc hiện hành (24, 30 hoặc 36 câu theo tầng của con) vì ngày đó máy chưa lưu mức.</p>}
        </details>
      )}
    </The>
  )
}

// ---------------------------------------------------------------- TIẾN BỘ · Đúng và sai theo ngày ----------------------------------------------------------------
/** Chiều cao tối đa của cột (px). */
const CAO_COT = 104

function OTiLe({ nhan, d }: { nhan: string; d: DemCau }) {
  const tl = tiLeDung(d)
  return (
    <div>
      <span>{nhan}</span>
      <b>{tl === null ? <small>chưa làm</small> : <>{tl}%<small> đúng</small></>}</b>
      <small><span>{d.dung} đúng</span> · <span>{d.sai} sai</span></small>
    </div>
  )
}

/** Cột chồng 14 ngày gần nhất (đúng ở dưới, sai ở trên, khe 2 px); số trên cột = tổng câu đúng + sai; ba ô tỉ lệ Hôm nay · 7 ngày · Từ 12/10. */
export function DungSaiTheoNgay({ tq }: { tq: ConTongQuan }) {
  const ngay = tq.ngay.slice(-14)
  if (ngay.length === 0) return null
  const max = Math.max(1, ...ngay.map((n) => n.dung + n.sai))
  return (
    <The id="ph3-dung-sai" className="ph3-o-du" vung="dung-sai-ngay" tieuDe="Đúng và sai theo ngày" phu={`Phần trăm câu đúng · cột: ${ngay.length} ngày gần nhất, số trên cột là số câu con làm trong ngày`}>
      <div className="ph3-so3 ph3-so3--ti-le">
        <OTiLe nhan="Hôm nay" d={tq.dem.homNay} />
        <OTiLe nhan="7 ngày qua" d={tq.dem.bayNgay} />
        <OTiLe nhan={`Từ ${ngayChuoiNgan(tq.moc)}`} d={tq.dem.tuMoc} />
      </div>
      <div className="ph3-cot-ds" style={{ ['--so-cot' as string]: ngay.length }}>
        <div className="ph3-cot-ds__cot" role="img" aria-label={`Câu đúng và câu sai mỗi ngày: ${ngay.map((n) => `${ngayChuoiNgan(n.ngay)} ${n.dung} đúng ${n.sai} sai`).join('; ')}`}>
          {ngay.map((n) => {
            const tong = n.dung + n.sai
            return (
              <span key={n.ngay} data-nghi={tong === 0 ? '' : undefined} data-nay={n.homNay ? '' : undefined} title={`${ngayChuoiNgan(n.ngay)}: ${n.dung} đúng, ${n.sai} sai`}>
                <b>{tong}</b>
                {tong > 0 ? (
                  <>
                    {n.sai > 0 && <i data-loai="sai" style={{ height: `${Math.max(4, Math.round((n.sai / max) * CAO_COT))}px` }} />}
                    {n.dung > 0 && <i data-loai="dung" style={{ height: `${Math.max(4, Math.round((n.dung / max) * CAO_COT))}px` }} />}
                  </>
                ) : <i data-loai="nghi" />}
              </span>
            )
          })}
        </div>
        <div className="ph3-cot-ds__ngay" aria-hidden="true">
          {ngay.map((n) => (n.homNay ? <b key={n.ngay}>{n.ngay.slice(8)}</b> : <span key={n.ngay} data-moc={n.ngay === tq.moc ? '' : undefined}>{n.ngay.slice(8)}</span>))}
        </div>
      </div>
      <div className="ph3-chu-thich ph3-cot-ds__chu-thich">
        <span><i data-loai="dung" />Câu đúng</span>
        <span><i data-loai="sai" />Câu sai</span>
        <span><i data-loai="nghi" />Ngày không làm</span>
      </div>
    </The>
  )
}

// ---------------------------------------------------------------- TIẾN BỘ · Thời gian làm câu ----------------------------------------------------------------
function DongLuot({ l }: { l: LuotGanDay }) {
  const kq = l.dung === true ? 'Đúng' : l.dung === false ? 'Sai' : 'Bỏ trống'
  return (
    <li className="ph3-luot" data-kq={l.dung === true ? 'dung' : l.dung === false ? 'sai' : 'trong'}>
      <span className="ph3-luot__dau" aria-hidden="true">{l.dung === true ? <BtTich co={16} day={3} /> : l.dung === false ? <BtNhan co={16} day={3} /> : '–'}</span>
      <div className="ph3-luot__giua">
        <b>{l.tieuDe || 'Câu chưa ghi tên dạng'}</b>
        <span><span className="ph3-an">{kq} · </span>{l.noi} · {ngayNganVn(l.luc)} {gioVn(l.luc)}{l.coGoiY ? ' · có dùng gợi ý' : ''}</span>
      </div>
      <span className="ph3-luot__giay" data-chua={l.giay === null ? '' : undefined}>{chuGiay(l.giay, l.nguonGiay)}</span>
    </li>
  )
}

/** Trung bình + trung vị (7 ngày), phân bố số giây (thanh ngang, phần sai tô riêng), rồi danh sách câu gần đây có số giây và đúng/sai. */
export function ThoiGianLamCau({ tq }: { tq: ConTongQuan }) {
  const t = tq.thoiGian
  const coPhanBo = t.phanBo.some((k) => k.so > 0)
  if (!coPhanBo && tq.ganDay.length === 0) return null
  const max = Math.max(1, ...t.phanBo.map((k) => k.so))
  const dau = tq.ganDay.slice(0, DONG_GAN_DAY), sau = tq.ganDay.slice(DONG_GAN_DAY)
  return (
    <The id="ph3-thoi-gian" className="ph3-o-rong" vung="thoi-gian-lam" bieuTuong={<BtDongHo co={22} />} mau="tim" tieuDe="Thời gian làm câu" phu="7 ngày gần nhất">
      {t.giayTb !== null ? (
        <div className="ph3-tg-so">
          <div><span>Trung bình mỗi câu</span><b data-vung="giay-tb">{chuGiay(t.giayTb)}</b></div>
          {t.giayGiua !== null && <div><span>Một nửa số câu làm dưới</span><b>{chuGiay(t.giayGiua)}</b></div>}
          {t.nhanh.so > 0 && <div data-canh={t.nhanh.sai * 2 >= t.nhanh.so ? '' : undefined}><span>Làm dưới 8 giây</span><b>{t.nhanh.so} câu</b><small>sai {t.nhanh.sai} câu</small></div>}
        </div>
      ) : (
        <p className="ph3-ghi">7 ngày qua chưa có câu nào đo được giờ làm.</p>
      )}
      {coPhanBo && (
        <ul className="ph3-pb" aria-label="Số câu theo thời gian làm, kèm số câu sai">
          {t.phanBo.map((k) => (
            <li key={k.tu} data-nhanh={k.tu === 0 ? '' : undefined}>
              <span className="ph3-pb__nhan">{nhanKhoangGiay(k)}</span>
              <span className="ph3-pb__ray" aria-hidden="true">
                {k.so - k.sai > 0 && <i data-loai="dung" style={{ width: `${((k.so - k.sai) / max) * 100}%` }} />}
                {k.sai > 0 && <i data-loai="sai" style={{ width: `${(k.sai / max) * 100}%` }} />}
              </span>
              <span className="ph3-pb__so"><b>{k.so}</b> câu{k.sai > 0 ? <small> · sai {k.sai}</small> : null}</span>
            </li>
          ))}
        </ul>
      )}
      {(t.soUoc > 0 || t.soChuaDo > 0) && (
        <p className="ph3-ghi-nho">
          {t.soUoc > 0 ? `≈ là số giây ước tính (${t.soUoc} câu): tính từ lúc con trả lời câu liền trước. ` : ''}
          {t.soChuaDo > 0 ? `${t.soChuaDo} câu chưa đo giờ, không tính vào trung bình.` : ''}
        </p>
      )}
      {dau.length > 0 && (
        <div className="ph3-ds-luot" data-vung="cau-gan-day">
          <h3 className="ph3-tieu-de-nho">Câu con làm gần đây</h3>
          <ul>{dau.map((l, i) => <DongLuot key={`${l.luc}-${i}`} l={l} />)}</ul>
          {sau.length > 0 && (
            <details className="ph3-xem-them">
              <summary className="tt-nhan"><BtPhai co={18} day={2.5} />Xem thêm {sau.length} câu</summary>
              <ul>{sau.map((l, i) => <DongLuot key={`${l.luc}-s${i}`} l={l} />)}</ul>
            </details>
          )}
        </div>
      )}
    </The>
  )
}

// ---------------------------------------------------------------- TIẾN BỘ · Câu sai gần đây ----------------------------------------------------------------
/** Câu con từng sai trong khoảng đọc: đã sửa / chưa sửa (thanh hai khúc + số) và danh sách tên câu, chủ đề. Không đáp án. */
export function CauSaiGanDay({ tq }: { tq: ConTongQuan }) {
  const c = tq.cauSai
  if (c.tong === 0) return null
  const dau = c.ds.slice(0, DONG_CAU_SAI), sau = c.ds.slice(DONG_CAU_SAI)
  const dong = (x: (typeof c.ds)[number], i: number) => (
    <li key={`${x.lanCuoi}-${i}`} className="ph3-cs">
      <div className="ph3-cs__giua">
        <b>{x.tieuDe || 'Câu chưa ghi tên dạng'}</b>
        <span>Sai {x.soSai} lần · lần gần nhất {ngayNganVn(x.lanCuoi)}</span>
      </div>
      <span className="ph3-chip ph3-chip--nho" data-mau={x.daSua ? 'xl' : 'ho'}>{x.daSua ? 'Đã sửa' : 'Chưa sửa'}</span>
    </li>
  )
  return (
    <The id="ph3-cau-sai" className="ph3-o-hep" vung="cau-sai-gan-day" bieuTuong={<BtBut co={22} />} mau="ho" tieuDe="Câu sai gần đây"
      phu={`Từ ${ngayChuoiNgan(tq.tuNgay)} · đã sửa là lần làm lại gần nhất đúng`}>
      <div className="ph3-cs-tong">
        <div className="ph3-cs-tong__ray" aria-hidden="true">
          {c.daSua > 0 && <span data-loai="dung" style={{ flexGrow: c.daSua }} />}
          {c.chuaSua > 0 && <span data-loai="sai" style={{ flexGrow: c.chuaSua }} />}
        </div>
        <div className="ph3-dem-bac ph3-cs-tong__so">
          <div><b>{c.tong}</b><span>câu từng sai</span></div>
          <div><b>{c.daSua}</b><span><i data-loai="dung" aria-hidden="true" />đã sửa</span></div>
          <div><b data-vung="chua-sua">{c.chuaSua}</b><span><i data-loai="sai" aria-hidden="true" />chưa sửa</span></div>
        </div>
      </div>
      <ul className="ph3-cs-ds">{dau.map(dong)}</ul>
      {sau.length > 0 && (
        <details className="ph3-xem-them">
          <summary className="tt-nhan"><BtPhai co={18} day={2.5} />Xem thêm {sau.length} câu</summary>
          <ul className="ph3-cs-ds">{sau.map((x, i) => dong(x, i + DONG_CAU_SAI))}</ul>
        </details>
      )}
    </The>
  )
}
