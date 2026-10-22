// HỒ SƠ 6 MỨC — các khối mới của tấm "Hồ sơ làm bài" (thầy duyệt bản vẽ docs/ban-ve-ho-so-em-2210 ngày 22/10, chốt 4 điểm như đề xuất).
// Tệp này CHỈ do `HoSoLamCauEm.tsx` nhập (cùng mảnh nạp lười, ngoài precache). Biểu tượng VIẾT TAY bằng SVG (không nhập lucide: biểu tượng mới bị dồn vào
// mảnh biểu tượng tải lúc mở app). MÁY KHÁCH KHÔNG TỰ XẾP MỨC: mọi số do máy chủ gửi (`mucLam6`, `mucLam` từng lượt).
// Ba góc nhìn: THẦY thấy đủ 6 mức (Mức 6 chỉ ở đây: chip đầu tấm, thẻ bằng chứng, nút lọc); HỌC SINH thấy Mức 5 "Máy để treo" kèm số phút từng lượt;
// PHỤ HUYNH chỉ thấy chip "Máy để treo" (không số phút) và một dòng tổng. Màu: Mức 1–4 dải xanh --hslc-m1..4; Mức 5 hồng sọc; Mức 6 hồng đậm đặc.
import type { ReactNode } from 'react'
import type { LanLamCau, MucLamLuot, TongMucLam } from '../../lib/lich-su-lam-cau-api'
import type { MucLam6, NgayCoTinh, NgayMucLam } from '../../../server/src/lich-su-lam-cau-kieu'
import { gioPhutVN, ngayThuChu } from '../../lib/em-toan-canh'
import { ngayNgan, thuDu } from './bai-hang-ngay-ui'
import { CachTinhMuc, ChipChuaCoSoDo, ChipMuc, MucCuaLuot, PipMuc, TEN_MUC_EM, TEN_MUC_THAY, type CheDoMuc, type MaMuc } from './muc-lam-giao-dien'

// ------------------------------------------------------------------ BIỂU TƯỢNG (nét lucide, vẽ tay)
function Hinh({ children }: { children: ReactNode }) {
  return (
    <svg className="hsv-ico" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}
/** Mức làm 5: vòng tròn "tạm dừng". */
export const HinhTreo = () => (
  <Hinh>
    <circle cx="12" cy="12" r="10" />
    <path d="M10 15V9M14 15V9" />
  </Hinh>
)
/** Mức làm 6: bát giác cảnh báo. */
export const HinhCoTinh = () => (
  <Hinh>
    <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86Z" />
    <path d="M12 8v4M12 16h.01" />
  </Hinh>
)
export const HinhMatMang = () => (
  <Hinh>
    <path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.17-2.8M19 13a10 10 0 0 0-2.2-1.6M12 20h.01" />
  </Hinh>
)

// ------------------------------------------------------------------ TÊN, MÃ HIỆN, CHỮ PHÚT
export type MaMuc6 = MaMuc | 5 | 6
/** Tên Mức 5–6: thầy "Treo máy" / "Cố tình treo máy"; học sinh / phụ huynh "Máy để treo" (tả việc, không nhãn năng lực — và KHÔNG BAO GIỜ có Mức 6). */
export const TEN_TREO_THAY: Readonly<Record<5 | 6, string>> = { 5: 'Treo máy', 6: 'Cố tình treo máy' }
export const TEN_TREO_EM = 'Máy để treo'
export function tenMuc6(ma: MaMuc6, cheDo: CheDoMuc): string {
  if (ma <= 4) return cheDo === 'thay' ? TEN_MUC_THAY[ma as MaMuc] : TEN_MUC_EM[ma as MaMuc]
  return cheDo === 'thay' ? TEN_TREO_THAY[ma as 5 | 6] : TEN_TREO_EM
}
/** Mức HIỆN của một lượt: treo ĐÈ lên `ma`; bản học sinh / phụ huynh không bao giờ hiện 6 (chặn thêm một lớp ở máy khách). */
export function maHien(m: Pick<MucLamLuot, 'ma' | 'treo'>, laThay: boolean): MaMuc6 {
  if (m.treo === 'co_tinh') return laThay ? 6 : 5
  if (m.treo === 'treo') return 5
  return m.ma
}

const chuGio = (p: number): string => {
  const h = Math.floor(p / 60)
  const du = p % 60
  return du ? `${h} giờ ${du} phút` : `${h} giờ`
}
/** Thầy: "7 phút 14 giây" · "2 giờ" (từ 60 phút đổi sang giờ). Thuần. */
export function chuTreoThay(giay: number): string {
  const g = Math.max(0, Math.round(giay))
  if (g >= 3600) return chuGio(Math.round(g / 60))
  const p = Math.floor(g / 60)
  const s = g % 60
  if (p === 0) return `${s} giây`
  return s ? `${p} phút ${s} giây` : `${p} phút`
}
/** Học sinh: làm tròn tới phút ("7 phút"; dưới nửa phút ⇒ "dưới 1 phút"; từ 60 phút ⇒ giờ). Thuần. */
export function chuTreoEm(giay: number): string {
  const p = Math.round(Math.max(0, giay) / 60)
  if (p < 1) return 'dưới 1 phút'
  return p >= 60 ? chuGio(p) : `${p} phút`
}
/** Thanh phút: đầy ở 12 phút (đặc tả mục 5 — có trần). */
const PHUT_DAY = 720

// ------------------------------------------------------------------ CHIP + PHẦN MỨC CỦA MỘT LƯỢT
/** Chip "Mức làm N" cho cả 6 mức (luôn chữ + biểu tượng — màu không là kênh duy nhất). */
export function ChipMuc6({ ma, cheDo, dai = false }: { ma: MaMuc6; cheDo: CheDoMuc; dai?: boolean }) {
  if (ma <= 4) return <ChipMuc ma={ma as MaMuc} cheDo={cheDo} dai={dai} />
  return (
    <span className="hslc-chip-m" data-t={ma}>
      {ma === 6 ? <HinhCoTinh /> : <HinhTreo />}
      <b>Mức làm {ma}</b>
      {dai && (
        <>
          {' '}
          <span className="hslc-chip-m-ten">{tenMuc6(ma, cheDo)}</span>
        </>
      )}
    </span>
  )
}

/** Phần Mức làm của MỘT dòng "Từng lượt". Mức 1–4: thước giây như cũ (+ nhãn "Chưa đo treo máy" cho thầy ở lượt cũ). Mức 5–6: câu "không ở với câu X phút"
 *  + thanh phút có sọc (thước giây kéo tới 420 giây thì vô nghĩa). Phụ huynh: chỉ chip, không số phút (máy chủ đã bỏ `giayTreo`). */
export function MucLuot6({ m, cheDo, soCungNgay }: { m: MucLamLuot; cheDo: CheDoMuc; soCungNgay?: number }) {
  const laThay = cheDo === 'thay'
  // Thầy chốt 22/10 (điểm 3): nhãn nhỏ "Chưa đo treo máy" ở TỪNG lượt cũ cho thầy; học sinh / phụ huynh chỉ một dòng ghi chú ở khối tổng.
  if (!m.treo) return <MucCuaLuot m={m} cheDo={cheDo} chuaDoTreo={laThay && !m.daDoTreo} />
  const ma = maHien(m, laThay)
  const g = m.giayTreo
  return (
    <span className="hslc-muc-luot hsv-muc">
      <span className="hslc-muc-luot-dong">
        <ChipMuc6 ma={ma} cheDo={cheDo} dai />
      </span>{' '}
      {cheDo !== 'phu-huynh' && g !== undefined && (
        <span className="hsv-phut">
          <span>
            {laThay
              ? `${ma === 6 && soCungNgay ? `Cùng ngày có ${soCungNgay} lượt treo máy. ` : ''}Em không ở với câu ${chuTreoThay(g)} (không chạm màn hoặc rời app).`
              : `Câu này máy để treo ${chuTreoEm(g)}.`}
          </span>
          <span className="hsv-phut-thanh" aria-hidden="true">
            <i style={{ width: `${Math.min(100, Math.max(4, (100 * g) / PHUT_DAY))}%` }} />
          </span>
        </span>
      )}
    </span>
  )
}

// ------------------------------------------------------------------ THANH CHỒNG 6 MỨC
const thuocTinh = (ma: MaMuc6) => (ma <= 4 ? { 'data-m': ma } : { 'data-t': ma })

/** Thanh chồng theo số lượt (mỗi đoạn có số; đoạn nét đứt = chưa có số đo). `dem[i]` = Mức làm i+1. */
export function ThanhSau({ dem, chua = 0, cheDo, duoi = '' }: { dem: readonly number[]; chua?: number; cheDo: CheDoMuc; duoi?: string }) {
  if (!dem.some((n) => n > 0) && chua === 0) return null
  const nhan = dem.flatMap((n, i) => (n > 0 ? [`Mức làm ${i + 1} (${tenMuc6((i + 1) as MaMuc6, cheDo)}): ${n} lượt${duoi}`] : []))
  if (chua > 0) nhan.push(`Chưa có số đo: ${chua} lượt`)
  return (
    <div className="hsv-thanh" role="img" aria-label={nhan.join('; ')}>
      {dem.map((n, i) =>
        n > 0 ? (
          <i key={i} {...thuocTinh((i + 1) as MaMuc6)} style={{ flex: n }}>
            <b>{n}</b>
          </i>
        ) : null,
      )}
      {chua > 0 && (
        <i data-chua="" style={{ flex: chua }}>
          <b>{chua}</b>
        </i>
      )}
    </div>
  )
}

/** Không lượt nào trong khoảng có số đo treo máy (lượt cũ / máy chủ cũ) ⇒ Mức 5–6 "Chưa đo treo máy", không đoán. */
export function chuaDoTreoHet(t: TongMucLam | undefined, coM6: boolean): boolean {
  return !coM6 || !t || (t.soTreo + t.soCoTinh === 0 && t.soChuaDoTreo >= t.soDo)
}
export const chuKhoang7 = (m6: Pick<MucLam6, 'tu' | 'den'>): string => `7 ngày gần nhất (${ngayNgan(m6.tu)} – ${ngayNgan(m6.den)})`

// ------------------------------------------------------------------ KHỐI "CÁCH LÀM BÀI · 6 MỨC" (THẦY)
function OMuc({ ma, so, ds, chuaTreo }: { ma: MaMuc6; so: number; ds: string; chuaTreo?: boolean }) {
  const dau = (
    <span className="hsv-o-dau">
      {ma <= 4 ? <PipMuc n={ma as MaMuc} /> : ma === 6 ? <HinhCoTinh /> : <HinhTreo />}
      Mức làm {ma}
    </span>
  )
  if (chuaTreo)
    return (
      <li className="hsv-o" data-chua="">
        {dau} <span className="hsv-o-ten">{tenMuc6(ma, 'thay')}</span> <span className="hsv-o-ds">Chưa đo treo máy</span>
      </li>
    )
  return (
    <li className="hsv-o" {...thuocTinh(ma)}>
      {dau} <span className="hsv-o-ten">{tenMuc6(ma, 'thay')}</span>{' '}
      <span className="hsv-o-so gvv2-so">
        {so} <small>lượt</small>
      </span>
      {ds && (
        <>
          {' '}
          <span className="hsv-o-ds gvv2-so">{ds}</span>
        </>
      )}
    </li>
  )
}

/** Bằng chứng Mức 6 của MỘT ngày (chỉ thầy): ngày, giờ + số phút từng lượt (6 lượt đầu, "+N lượt"), nút phụ lọc danh sách. */
function TheBangChung({ n, onXem }: { n: NgayCoTinh; onXem: (ngay: string) => void }) {
  const hien = n.luot.slice(0, 6)
  const con = n.so - hien.length
  return (
    <div className="hsv-canh" role="note">
      <span className="hsv-canh-dau">
        <HinhCoTinh />
        Mức làm 6 · Cố tình treo máy · {ngayThuChu(n.ngay) || ngayNgan(n.ngay)}
      </span>
      <p>{n.so} lượt treo máy trong cùng một ngày (từ 3 lượt trở lên là Mức làm 6). Thời gian em không ở với câu:</p>
      <ol aria-label={`Các lượt treo máy ngày ${ngayNgan(n.ngay)}`}>
        {hien.map((l, i) => (
          <li key={`${l.luc}-${i}`} className="gvv2-so" title={l.tieuDe || undefined}>
            {gioPhutVN(l.luc)} · {chuTreoEm(l.giayTreo)}
          </li>
        ))}
        {con > 0 && <li className="gvv2-so">+{con} lượt</li>}
      </ol>
      <p>Chỉ thầy thấy mức này. Học sinh và phụ huynh thấy “Máy để treo”.</p>
      <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => onXem(n.ngay)}>
        Xem {n.so} lượt này
      </button>
    </div>
  )
}

export interface PropsSauMuc {
  tong: TongMucLam
  m6?: MucLam6
  onXemTreo: (ngay?: string) => void
}

/** «Cách làm bài · 6 mức» (thầy): điểm nhấn cột trái — đo được N/M · thanh 6 mức · thẻ bằng chứng Mức 6 · 6 ô mức · 3 ô "lượt sai rơi vào đâu". */
export function KhoiSauMucThay({ tong, m6, onXemTreo }: PropsSauMuc) {
  const chuaTreo = chuaDoTreoHet(tong, !!m6)
  const tongLuot = tong.soDo + tong.chuaCoSoDo
  const td = m6?.treoDungSai
  const saiTreo = chuaTreo || !td ? 0 : td.treo.sai + td.coTinh.sai
  const mau = tong.saiLamVoi + tong.saiDuNghi + saiTreo
  const ty = (n: number) => (mau > 0 ? `${n}/${mau}` : '—')
  let than: ReactNode
  if (tongLuot === 0) {
    than = (
      <div className="hsv-trong">
        <b>Chưa có lượt làm câu nào trong 7 ngày</b>
        <p>Khi em làm Bài tập về nhà, Bát Linh Đảo hay Ôn lại, từng lượt và Mức làm sẽ hiện ở đây.</p>
      </div>
    )
  } else if (tong.soDo === 0) {
    than = (
      <div className="hslc-cl-trong">
        <ChipChuaCoSoDo /> <p>Chưa lượt nào của em có số đo Mức làm ({tong.chuaCoSoDo} lượt chưa có số đo). Từ khi máy em nạp bản mới, mức hiện ở đây.</p>
      </div>
    )
  } else {
    const dem = [...tong.theoMuc.map((r) => r.luot), chuaTreo ? 0 : tong.soTreo, chuaTreo ? 0 : tong.soCoTinh]
    const ds = (d?: { dung: number; sai: number }) => (d ? `đúng ${d.dung} · sai ${d.sai}` : '')
    than = (
      <>
        <p className="hsv-phu gvv2-so">
          Đo được <b>{tong.soDo}</b>/<b>{tongLuot}</b> lượt
          {tong.chuaCoSoDo > 0 && (
            <>
              {' '}
              · <b>{tong.chuaCoSoDo}</b> lượt chưa có số đo
            </>
          )}
          {tong.soChuaDoTreo > 0 && (
            <>
              {' '}
              · <b>{tong.soChuaDoTreo}</b> lượt chưa đo treo máy
            </>
          )}
          .
        </p>
        <ThanhSau dem={dem} chua={tong.chuaCoSoDo} cheDo="thay" />
        {m6?.ngayCoTinh?.map((n) => <TheBangChung key={n.ngay} n={n} onXem={onXemTreo} />)}
        <ul className="hsv-o-luoi" aria-label="Sáu mức làm">
          {tong.theoMuc.map((r) => (
            <OMuc key={r.ma} ma={r.ma} so={r.luot} ds={ds(r)} />
          ))}
          <OMuc ma={5} so={tong.soTreo} ds={ds(td?.treo)} chuaTreo={chuaTreo} />
          <OMuc ma={6} so={tong.soCoTinh} ds={ds(td?.coTinh)} chuaTreo={chuaTreo} />
        </ul>
        <div className="hsv-ba gvv2-so">
          <p>
            <b>{ty(tong.saiLamVoi)}</b>{' '}
            <span>lượt sai là lúc làm vội (Mức làm 1–2)</span>
          </p>
          <p>
            <b>{ty(tong.saiDuNghi)}</b>{' '}
            <span>lượt sai dù đã nghĩ (Mức làm 3–4)</span>
          </p>
          {!chuaTreo && (
            <p data-t="5">
              <b>{ty(saiTreo)}</b>{' '}
              <span>lượt sai sau khi máy để treo (Mức làm 5–6)</span>
            </p>
          )}
        </div>
        {chuaTreo && (
          <p className="hsv-ghi">
            Các lượt có số đo trong khoảng này làm trước khi máy em có đồng hồ đo treo máy, nên chưa xếp được Mức làm 5–6 (không đoán). Lượt làm từ khi máy em nạp bản mới sẽ có số đo.
          </p>
        )}
        {tong.soUocTinh > 0 && (
          <p className="hsv-ghi" data-uoc="">
            {tong.soUocTinh} lượt xếp từ số giây đồng hồ cũ hoặc ước tính (≈): số giây có thể cao hơn thật nên mức chỉ là ước tính, không xếp Mức làm 4.
          </p>
        )}
        {tong.dungTruocDoc > 0 && <p className="hsv-ghi">{tong.dungTruocDoc} lượt đúng nộp trước khi đọc hết đề. Chỉ ghi chú, không tính là vội.</p>}
        {!tong.coBetaThat && <p className="hsv-ghi">Lớp chưa đủ mẫu của các câu này để xếp Mức làm 4.</p>}
      </>
    )
  }
  return (
    <section className="hsv-khoi hslc-cl" aria-labelledby="hsv-cl" data-che-do="thay">
      <h3 id="hsv-cl">
        Cách làm bài <small>· 6 mức từng lượt{m6 ? '' : ' · toàn bộ sổ'}</small>
      </h3>
      {than}
      <CachTinhMuc coTreo />
    </section>
  )
}

// ------------------------------------------------------------------ KHỐI CÁCH LÀM BÀI (HỌC SINH / PHỤ HUYNH)
/** Học sinh: «Em làm bài thế nào» — 5 mức của lượt SAI + ô hồng nhạt số lượt máy để treo. Phụ huynh: «Cách con làm bài» — 4 mức + một dòng "Máy để treo". */
export function KhoiCachLamEm6({ tong, m6, cheDo, soSaiTong, onMoBaiTap }: { tong: TongMucLam; m6?: MucLam6; cheDo: 'hoc-sinh' | 'phu-huynh'; soSaiTong?: number; onMoBaiTap?: () => void }) {
  const laPh = cheDo === 'phu-huynh'
  const ngoi = laPh ? 'con' : 'em'
  const chuaTreo = chuaDoTreoHet(tong, !!m6)
  const saiTreo = chuaTreo || !m6 ? 0 : m6.treoDungSai.treo.sai + m6.treoDungSai.coTinh.sai
  const soTreo = chuaTreo ? 0 : tong.soTreo + tong.soCoTinh
  const saiCo = tong.saiLamVoi + tong.saiDuNghi
  const voiPh = laPh || chuaTreo
  // Lượt sai CHƯA có số đo = mọi lượt sai 7 ngày − lượt sai có Mức 1–4 − lượt sai treo máy (lượt treo ĐÃ đo; phụ huynh thấy ở dòng tổng riêng).
  const chuaSoDo = Math.max(0, (soSaiTong ?? 0) - saiCo - saiTreo)
  let than: ReactNode
  if (tong.soDo + tong.chuaCoSoDo === 0 && !(soSaiTong && soSaiTong > 0)) {
    than = (
      <div className="hsv-trong">
        <b>Chưa có lượt làm câu nào trong 7 ngày</b>
        <p>Khi {ngoi} làm Bài tập về nhà, Bát Linh Đảo hay Ôn lại, từng lượt và Mức làm sẽ hiện ở đây.</p>
        {!laPh && onMoBaiTap && <NutMoBaiTap onMo={onMoBaiTap} />}
      </div>
    )
  } else if (tong.soDo === 0) {
    than = (
      <div className="hslc-cl-trong">
        <ChipChuaCoSoDo /> <p>Chưa có lượt nào có số đo Mức làm. Từ khi máy {ngoi} nạp bản mới, mức hiện ở đây.</p>
      </div>
    )
  } else {
    const dem = [...tong.theoMuc.map((r) => r.sai), ...(voiPh ? [] : [saiTreo])]
    than = (
      <>
        {laPh ? (
          <p className="hsv-phu gvv2-so">
            Trong <b>{saiCo}</b> lượt sai có số đo, <b>{tong.saiLamVoi}</b> lượt con nộp trước khi kịp nghĩ. <b>{tong.saiDuNghi}</b> lượt con đã dành thời gian nghĩ.
          </p>
        ) : (
          <p className="hsv-phu gvv2-so">
            Trong <b>{saiCo + (chuaTreo ? 0 : saiTreo)}</b> lượt sai có số đo: <b>{tong.saiLamVoi}</b> lượt em nộp trước khi kịp nghĩ, <b>{tong.saiDuNghi}</b> lượt em đã dành thời gian nghĩ
            {!chuaTreo && (
              <>
                , <b>{saiTreo}</b> lượt máy để treo
              </>
            )}
            .
          </p>
        )}
        <ThanhSau dem={dem} cheDo={cheDo} duoi=" sai" />
        <ul className="hslc-cl-em gvv2-so">
          {tong.theoMuc.map((r) => (
            <li key={r.ma} data-m={r.ma}>
              <ChipMuc ma={r.ma} cheDo={cheDo} /> <span className="hslc-cl-em-ten">{TEN_MUC_EM[r.ma]}</span> <b className="hslc-cl-em-luot">{r.sai} lượt sai</b>
            </li>
          ))}
          {!voiPh && (
            <li data-t="5">
              <ChipMuc6 ma={5} cheDo={cheDo} /> <span className="hslc-cl-em-ten">{TEN_TREO_EM}</span> <b className="hslc-cl-em-luot">{saiTreo} lượt sai</b>
            </li>
          )}
        </ul>
        {chuaSoDo > 0 && <p className="hsv-ghi">{chuaSoDo} lượt sai chưa có số đo (chưa có số giây đáng tin để xếp).</p>}
        {tong.soUocTinh > 0 && <p className="hsv-ghi" data-uoc="">Lượt có dấu ≈ có số giây là ước tính, có thể cao hơn thật.</p>}
      </>
    )
  }
  const dongTreo = chuaTreo ? (
    <p className="hsv-ghi">Các lượt này làm trước khi máy {laPh ? 'của con' : 'em'} có đồng hồ mới, nên chưa đo được máy để treo.</p>
  ) : laPh ? (
    <p className="hsv-nhe gvv2-so">
      <HinhTreo />
      <span>
        Máy để treo: <b>{soTreo} lượt</b> trong 7 ngày.
      </span>
    </p>
  ) : soTreo > 0 ? (
    <div className="hsv-nhe">
      <HinhTreo />
      <p>
        Có <b>{soTreo} lượt</b> máy để treo. Thời gian treo không tính vào số giây làm bài của em.
      </p>
    </div>
  ) : null
  return (
    <section className="hsv-khoi hslc-cl" aria-labelledby="hsv-cl" data-che-do={cheDo}>
      <h3 id="hsv-cl">
        {laPh ? 'Cách con làm bài' : 'Em làm bài thế nào'} <small>· lượt sai có số đo{m6 ? '' : ' · toàn bộ sổ'}</small>
      </h3>
      {than}
      {tong.soDo + tong.chuaCoSoDo > 0 && dongTreo}
    </section>
  )
}

/** Học sinh, trạng thái rỗng (đặc tả mục 3): việc làm tiếp — mở Bài tập về nhà (cổng học sinh nối, đóng tấm rồi mở màn làm bài). */
export function NutMoBaiTap({ onMo }: { onMo: () => void }) {
  return (
    <button type="button" className="gvv2-nut-vien tt-nhan" onClick={onMo}>
      Mở Bài tập về nhà
    </button>
  )
}

// ------------------------------------------------------------------ THEO NGÀY (7 hàng)
/** 7 hàng cũ → mới, mỗi hàng một thanh chồng theo mức. Thầy: ngày có Mức 6 ghi tên màu hồng. "*" = ngày có lượt chưa đo treo máy. */
export function KhoiTheoNgay({ theoNgay, cheDo }: { theoNgay: readonly NgayMucLam[]; cheDo: CheDoMuc }) {
  const laThay = cheDo === 'thay'
  const coSao = theoNgay.some((n) => n.soChuaDoTreo > 0)
  const coTreo = theoNgay.some((n) => n.dem[4] + n.dem[5] > 0)
  const coChua = theoNgay.some((n) => n.chuaCoSoDo > 0)
  return (
    <section className="hsv-khoi" aria-labelledby="hsv-ngay">
      <h3 id="hsv-ngay">
        Theo ngày <small>· số lượt mỗi mức{cheDo === 'hoc-sinh' ? ' (không tính lượt đúng nộp nhanh)' : ''}</small>
      </h3>
      <ol className="hsv-ngay">
        {theoNgay.map((n) => {
          const dem = laThay ? n.dem : [n.dem[0], n.dem[1], n.dem[2], n.dem[3], n.dem[4] + n.dem[5], 0]
          const tong = dem.reduce((a, b) => a + b, 0) + n.chuaCoSoDo
          const dd = thuDu(n.ngay)
          const thu = dd.replace(` ${ngayNgan(n.ngay)}`, '')
          const nhan = [`${dd}: ${tong} lượt`, ...dem.flatMap((x, i) => (x > 0 ? [`Mức làm ${i + 1}: ${x}`] : [])), ...(n.chuaCoSoDo > 0 ? [`chưa có số đo: ${n.chuaCoSoDo}`] : [])]
          return (
            <li key={n.ngay} data-co-tinh={laThay && n.dem[5] > 0 ? '' : undefined}>
              <span className="hsv-ngay-ten">
                {thu}{' '}
                <small className="gvv2-so">
                  {ngayNgan(n.ngay)}
                  {n.soChuaDoTreo > 0 ? ' *' : ''}
                </small>
              </span>
              <span className="hsv-ngay-thanh" role="img" aria-label={nhan.join('; ')}>
                {dem.map((x, i) => (x > 0 ? <i key={i} {...thuocTinh((i + 1) as MaMuc6)} style={{ flex: x }} /> : null))}
                {n.chuaCoSoDo > 0 && <i data-chua="" style={{ flex: n.chuaCoSoDo }} />}
              </span>
              <span className="hsv-ngay-so gvv2-so">{tong} lượt</span>
            </li>
          )
        })}
      </ol>
      <p className="hsv-chu-giai" aria-hidden="true">
        {([1, 2, 3, 4] as const).map((m) => (
          <span key={m}>
            <i data-m={m} />
            {m === 1 ? 'Mức làm 1' : m}
          </span>
        ))}
        {coTreo && (
          <span>
            <i data-t="5" />
            {laThay ? TEN_TREO_THAY[5] : TEN_TREO_EM}
          </span>
        )}
        {laThay && theoNgay.some((n) => n.dem[5] > 0) && (
          <span>
            <i data-t="6" />
            {TEN_TREO_THAY[6]}
          </span>
        )}
        {coChua && (
          <span>
            <i data-chua="" />
            Chưa có số đo
          </span>
        )}
      </p>
      {coSao && <p className="hsv-ghi">* Ngày có lượt chưa đo treo máy (máy {cheDo === 'phu-huynh' ? 'của con' : 'em'} chưa có đồng hồ mới).</p>}
    </section>
  )
}

// ------------------------------------------------------------------ LỌC "TỪNG LƯỢT"
export type LoaiLoc = 'tat-ca' | 'sai' | 'treo' | 'chua-so-do'
export interface LocLuot {
  loai: LoaiLoc
  /** Chỉ với 'treo': lượt treo của MỘT ngày (nút "Xem N lượt này" của thẻ bằng chứng). */
  ngay?: string
}
/** Lọc lượt đã tải theo nút lọc. Thuần. */
export function locLuot(lan: readonly LanLamCau[], loc: LocLuot): LanLamCau[] {
  switch (loc.loai) {
    case 'sai':
      return lan.filter((l) => l.dung === false)
    case 'treo':
      return lan.filter((l) => !!l.mucLam?.treo && (!loc.ngay || l.ngay === loc.ngay))
    case 'chua-so-do':
      return lan.filter((l) => !l.mucLam)
    default:
      return [...lan]
  }
}
