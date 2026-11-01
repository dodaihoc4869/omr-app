// APP PHỤ HUYNH «MỘT TRANG VỀ CON» (thầy chốt bản vẽ 01/11: docs/ban-ve-ph-mot-trang-0111 — DAC-TA.md; «bỏ ô nhắn thầy»). Thay màn «Chỉ đọc» (DocPh).
// MỘT trang cao đúng màn, KHÔNG cuộn ở mọi khổ (điện thoại dọc / ngang, Z Fold mở / gập, máy tính bảng, máy tính): Hôm nay · 4 số đo (Học thật · Đối phó ·
// Chăm · Lười) · Kiểm tra gần nhất · Con cần luyện thêm · Sắp tới · Thầy nhắn · Anh chị nên làm gì. Chi tiết mở bằng TẤM (điện thoại trượt từ dưới, khổ rộng
// ngăn kéo phải): tấm số đo (vì sao + nên làm gì), tấm điểm (màn «Ca kiểm tra» cũ), tấm lời thầy (màn cũ), tấm nên làm gì.
// SỐ — lệnh sẵn có lúc mở AppPhuHuynh (tat-ca-ve-con · con-tong-quan · hoc-2 · loi-thay · cảnh báo) + `/ph/bon-so-do` (gọi SONG SONG lúc mảnh này chạy).
// Thiếu số ⇒ câu nói vì sao, không bịa. MÀU: mot-trang-con.css (chỉ biến --ph3-*). Phép thuần: src/lib/ph-v3/mot-trang-con.ts.
import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { TrangVeConProps } from './trang-ve-con-chung'
import { soHomNay } from './trang-ve-con-chung'
import { LoiThe } from './LoiThe'
import { chuCongBoCa } from '../ph-moi/nhan'
import { gioVn, ngayChuoiNgan, ngayNganVn, soVn, thuNgayVn } from '../../lib/ph-moi/dinh-dang'
import { tieuDeCanhBao } from '../../lib/canh-bao-thay-hien-thi'
import { layBonSoDo } from '../../lib/ph-v3/bon-so-do-api'
import type { MaSoDo, TraLoiBonSoDo } from '../../lib/ph-v3/bon-so-do-kieu'
import {
  CAO_LA_TOT, MOC_TOT, NGHIA_SO, TEN_SO, THU_TU_SO, cauHomNay, cauPhuHomNay, dangCanLuyen, doiTot, doiTuan, giaTriNgay, mucSoDo, nenLamGi, nenTheoSoDo, noiSoDo, o14, viecSap,
} from '../../lib/ph-v3/mot-trang-con'
import './mot-trang-con.css'

const ManDiemSo = lazy(() => import('./ManDiemSo'))

export interface MotTrangConProps extends Pick<TrangVeConProps, 'v' | 'hoc2' | 'tongQuan' | 'nhip' | 'loiThay' | 'thuLaiLoiThay' | 'canhBao' | 'sbd' | 'tenCon' | 'lop'> {
  /** Nút tài khoản (menu «Đổi số báo danh») của AppPhuHuynh. */
  taiKhoan: ReactNode
  thongBao?: ReactNode
  /** Đổi chữ «A.I / Bộ não» cũ thành «Thầy Đỗ Đại Học» (src/lib/chu-thay.ts) — AppPhuHuynh truyền vào: mảnh này KHÔNG nhập tien-ich / dung-chung / chu-thay
   *  để bộ gom không tách chúng thành mảnh dùng chung mới (precache ≤ 170, scripts/kiem-sw.mjs). */
  chuThay: (s: string) => string
  /** Màn «Lời thầy» cũ (ManLoiThay, đã nằm trong mảnh AppPhuHuynh) vẽ sẵn cho tấm «Thầy nhắn» — cùng lý do precache như `chuThay`. */
  manLoiThay: ReactNode
}
/** Khung chờ nhỏ (không kéo dung-chung). */
const Cho = ({ chu }: { chu: string }) => <div className="mtc-cho" role="status" aria-live="polite" data-vung="dang-tai"><span className="ph3-an">{chu}</span><i /><i /><i /></div>
type Tam = MaSoDo | 'diem' | 'thay' | 'nen'
type TaiBon = { du: TraLoiBonSoDo | null; loi: string; xong: boolean }

/** 4 số đo đã tải trong phiên (quay lại từ màn con không gọi lại lệnh). */
let bonNho: { sbd: string; du: TraLoiBonSoDo } | null = null

// ── biểu tượng nhỏ (nét theo currentColor)
const BT: Record<string, ReactNode> = {
  check: <path className="mtc-net" d="M5 12.5l4.5 4.5L19 7.5" />,
  lua: <path d="M12 2.5c.9 3.4 5.2 5.6 5.2 10.4a5.2 5.2 0 0 1-10.4 0c0-2.2 1-3.8 2.2-4.9.2 1.7 1.1 2.7 2 2.8-.5-3.1.2-5.9 1-8.3z" />,
  canh: <path className="mtc-net" d="M12 4l9 16H3z M12 10v4 M12 17v.5" />,
  tim: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />,
  toi: <path className="mtc-net" d="M9 6l6 6-6 6" />,
  thay: <path className="mtc-net" d="M4 5.5h16v10.5H9l-5 4z" />,
  dong: <path className="mtc-net" d="M6 6l12 12M18 6L6 18" />,
}
const Bt = ({ t, lop = '' }: { t: keyof typeof BT; lop?: string }) => <svg className={`mtc-bt ${lop}`} viewBox="0 0 24 24" aria-hidden="true">{BT[t]}</svg>

function Vong({ p, mau, so }: { p: number | null; mau: string; so: ReactNode }) {
  const r = 15.5, c = 2 * Math.PI * r, dai = p === null ? 0 : (Math.max(2, Math.min(100, p)) / 100) * c
  return (
    <span className="mtc-vong" data-mau={mau}>
      <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r={r} className="mtc-vong__nen" />{p !== null && <circle cx="18" cy="18" r={r} className="mtc-vong__day" style={{ strokeDasharray: `${dai.toFixed(1)} ${c.toFixed(1)}` }} />}</svg>
      <b>{so}</b>
    </span>
  )
}
/** Đường xu hướng (bỏ điểm null); `het` ⇒ chấm mọi điểm, mặc định chỉ chấm điểm cuối. */
function Duong({ ds, mau, min = 0, max = 100, het = false }: { ds: readonly (number | null)[]; mau: string; min?: number; max?: number; het?: boolean }) {
  const w = 100, h = 30
  const pt = ds.map((v, i) => (v === null ? null : { x: ds.length > 1 ? (i / (ds.length - 1)) * (w - 4) + 2 : w / 2, y: h - 3 - ((v - min) / (max - min || 1)) * (h - 6) })).filter((x): x is { x: number; y: number } => !!x)
  if (!pt.length) return null
  const d = pt.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('')
  const cham = het ? pt : pt.slice(-1)
  return (
    <svg className="mtc-xu" data-mau={mau} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {pt.length > 1 && <path className="mtc-xu__vung" d={`${d}L${pt[pt.length - 1]!.x.toFixed(1)} ${h}L${pt[0]!.x.toFixed(1)} ${h}Z`} />}
      <path className="mtc-xu__duong" d={d} />
      {cham.map((q, i) => <path key={i} className="mtc-xu__cham" d={`M${q.x.toFixed(1)} ${q.y.toFixed(1)}h0`} />)}
    </svg>
  )
}
/** Giờ của ví dụ: mốc ISO ⇒ «21:52 · Thứ Sáu 30/10»; chuỗi đã định dạng ⇒ giữ nguyên. */
const lucVd = (s: string): string => (Number.isFinite(Date.parse(s)) ? `${gioVn(s)} · ${thuNgayVn(s)}` : s)
const ngayNhan = (s: string): string => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? ngayChuoiNgan(s) : ngayNganVn(s))

export default function MotTrangCon(p: MotTrangConProps) {
  const { v, sbd } = p
  const pm = v.pm
  const tq = p.tongQuan.v
  const [bon, setBon] = useState<TaiBon>(() => (bonNho?.sbd === sbd ? { du: bonNho.du, loi: '', xong: true } : { du: null, loi: '', xong: false }))
  const [lanBon, setLanBon] = useState(0)
  useEffect(() => {
    if (bonNho?.sbd === sbd && lanBon === 0) return
    let song = true
    void layBonSoDo(sbd).then(
      (r) => { if (r.ok) bonNho = { sbd, du: r.du }; if (song) setBon((x) => (r.ok ? { du: r.du, loi: '', xong: true } : { du: x.du, loi: r.chu, xong: true })) },
      () => { if (song) setBon((x) => ({ ...x, loi: 'Chưa tải được 4 số đo.', xong: true })) },
    )
    return () => { song = false }
  }, [sbd, lanBon])
  const [tam, setTam] = useState<Tam | null>(null)
  const dongTam = useCallback(() => setTam(null), [])

  const ten = pm?.hoTen || p.tenCon
  const nowMs = tq?.serverNow ?? pm?.serverNow ?? null
  const dong2 = [p.lop ? `Lớp ${p.lop}` : '', nowMs !== null ? thuNgayVn(nowMs) : ''].filter(Boolean).join(' · ')
  return (
    <div className="mtc" data-vung="ph-mot-trang">
      <header className="mtc-dau">
        <div className="mtc-dau__ten">
          <b data-vung="ten-con">{ten}</b>
          <span>{dong2}{nowMs !== null && <span className="mtc-chi-rong"> · cập nhật {gioVn(nowMs)}</span>}</span>
        </div>
        {p.taiKhoan}
      </header>
      {p.thongBao}
      {!pm ? (
        v.trangThai === 'loi' ? <div className="mtc-loi-mo"><LoiThe chu={v.chuLoi} thuLai={v.thuLai} nut="Thử lại" /></div> : <div className="mtc-cho-mo"><Cho chu="Đang tải dữ liệu của con…" /></div>
      ) : (
        <main className="mtc-luoi">
          <div className="mtc-cot">
            <HomNay p={p} />
            <ThayNhan p={p} mo={() => setTam('thay')} />
            <NenLam p={p} bon={bon.du} mo={() => setTam('nen')} />
          </div>
          <div className="mtc-cot">
            <BonSo bon={bon} mo={setTam} thuLai={() => setLanBon((x) => x + 1)} />
          </div>
          <div className="mtc-cot">
            <DiemGanNhat p={p} mo={() => setTam('diem')} />
            <CanLuyen p={p} />
            <SapToi p={p} nowMs={nowMs ?? 0} />
          </div>
        </main>
      )}
      {tam && (
        <TamChiTiet tieuDe={tam === 'diem' ? 'Ca kiểm tra của con' : tam === 'thay' ? 'Thầy Đỗ Đại Học nhắn' : tam === 'nen' ? 'Anh chị nên làm gì' : TEN_SO[tam]} loai={tam} dong={dongTam}>
          {tam === 'diem' ? <Suspense fallback={<Cho chu="Đang mở…" />}><ManDiemSo v={v} loiThay={p.loiThay.ds} /></Suspense>
            : tam === 'thay' ? p.manLoiThay
            : tam === 'nen' ? <ol className="mtc-tnen mtc-tnen--lon">{viecNen(p, bon.du).map((n, i) => <li key={i}><Bt t="tim" /><span>{n.dong && <b>{n.dong} </b>}{n.chu}</span></li>)}</ol>
            : <TamSo ma={tam} bon={bon.du} />}
        </TamChiTiet>
      )}
    </div>
  )
}

type PP = { p: MotTrangConProps }

// ───────────────────────────── Hôm nay
function HomNay({ p }: PP) {
  const pm = p.v.pm!
  const tq = p.tongQuan.v
  const so = soHomNay(pm, p.hoc2, tq)
  const d = tq?.dem.homNay ?? null
  const soCau = d ? d.soCau : so.daLam
  const cau = cauHomNay({ soCau, dung: d ? d.dung : pm.tongQuan?.soDung ?? null, phut: pm.tongQuan?.phutHoc ?? null })
  const ds = tq?.ngay ?? []
  const iNay = ds.findIndex((n) => n.homNay)
  const qua = iNay > 0 ? ds[iNay - 1]! : null
  const phu = cauPhuHomNay({ soCau, giayTb: d?.giayTb ?? null, homQua: qua ? { daLam: qua.daLam, canLam: qua.canLam } : null })
  const du = so.tong !== null && so.tong > 0 && so.daLam >= so.tong
  const chuoi = pm.tongQuan?.chuoiNgayHoc ?? null
  const { o, du: soDu } = o14(ds)
  return (
    <section className="mtc-o mtc-o--ah" aria-label="Hôm nay của con" data-vung="hom-nay">
      <p className="mtc-ah__tren">Hôm nay{p.v.pm?.serverNow ? ` · ${thuNgayVn(p.v.pm.serverNow)}` : ''}</p>
      <h1 className="mtc-ah__cau" data-vung="cau-hom-nay">{cau.map((x, i) => (x.nhan ? <em key={i}>{x.chu}</em> : <span key={i}>{x.chu}</span>))}</h1>
      {phu && <p className="mtc-ah__phu">{phu}</p>}
      <div className="mtc-ah__hang">
        <span className="mtc-ah__chip" data-mau={du ? 'xl' : 'hp'}><Bt t={du ? 'check' : 'canh'} />{du ? 'Đủ mức hôm nay' : so.tong ? `Mức hôm nay ${so.daLam}/${so.xap}${so.tong} câu` : 'Chưa đủ mức'}</span>
        {chuoi !== null && <span className="mtc-ah__chip" data-mau={chuoi > 0 ? 'hp' : 'mo'}><Bt t="lua" />Chuỗi {chuoi} ngày</span>}
      </div>
      {o.length > 0 && (
        <div className="mtc-ah__chuoi">
          <div className="mtc-ah__o" role="img" aria-label={`${o.length} ngày qua: ${soDu} ngày đủ mức`}>
            {o.map((x) => <i key={x.ngay} data-t={x.t} data-nay={x.nay ? '' : undefined} />)}
          </div>
          <p className="mtc-ah__giai"><span>{o.length} ngày qua: <b>{soDu}/{o.length} ngày</b> đủ mức</span><span className="mtc-ah__chu-giai"><i data-t="du" />đủ mức <i data-t="thieu" />chưa đủ <i data-t="khong" />không học</span></p>
        </div>
      )}
    </section>
  )
}

// ───────────────────────────── 4 số đo
function BonSo({ bon, mo, thuLai }: { bon: TaiBon; mo: (t: Tam) => void; thuLai: () => void }) {
  const b = bon.du
  return (
    <section className="mtc-bon" aria-label="Bốn số đo cách con học" data-vung="bon-so-do">
      <div className="mtc-bon__dau"><h2>Con học thế nào</h2><span>{b && b.co ? '14 ngày · bấm ô xem vì sao' : ''}</span></div>
      {!bon.xong && !b ? (
        <div className="mtc-bon__luoi" aria-busy="true">{THU_TU_SO.map((m) => <div key={m} className="mtc-so mtc-so--cho" aria-hidden="true" />)}</div>
      ) : !b ? (
        <div className="mtc-o mtc-bon__bao"><p>{bon.loi || 'Chưa tải được 4 số đo.'}</p><button type="button" className="mtc-nut-vien" onClick={thuLai}>Thử lại</button></div>
      ) : !b.co ? (
        <div className="mtc-o mtc-bon__bao" data-vung="bon-chua-tinh"><p>Thầy Đỗ Đại Học đang tính 4 số đo của con. Số sẽ có từ sáng mai.</p></div>
      ) : (
        <>
          <div className="mtc-bon__cot-ten" aria-hidden="true"><span>↑ Càng cao càng tốt</span><span>↓ Càng thấp càng tốt</span></div>
          <div className="mtc-bon__luoi">{THU_TU_SO.map((m) => <OSo key={m} ma={m} b={b} mo={() => mo(m)} />)}</div>
        </>
      )}
    </section>
  )
}
function OSo({ ma, b, mo }: { ma: MaSoDo; b: Extract<TraLoiBonSoDo, { co: true }>; mo: () => void }) {
  const d = b.diem[ma]
  const m = mucSoDo(ma, d)
  const doi = d === null ? null : doiTuan(ma, b.ngay)
  const bc = b.bangChung[ma][0]
  const muiTen = doi ? <span data-tot={doiTot(ma, doi) ? '' : undefined} data-xau={doiTot(ma, doi) ? undefined : ''}>{doi > 0 ? '↑' : '↓'} {Math.abs(doi)}</span> : null
  return (
    <button type="button" className="mtc-so" data-mau={m.mau} data-ma={ma} onClick={mo} aria-label={`${TEN_SO[ma]}: ${d ?? 'chưa có'} trên 100, ${m.chu}. Xem vì sao`}>
      <span className="mtc-so__ten">{TEN_SO[ma]}</span>
      <span className="mtc-so__vong"><Vong p={d} mau={m.mau} so={d ?? '—'} /></span>
      <span className="mtc-so__nghia">{NGHIA_SO[ma]}</span>
      <span className="mtc-so__muc">{m.chu}</span>
      <span className="mtc-so__xu"><Duong ds={b.ngay.map((n) => giaTriNgay(ma, n))} mau={m.mau} /></span>
      <span className="mtc-so__doi">{muiTen ? <>{muiTen} so với tuần trước</> : ' '}</span>
      {muiTen && <span className="mtc-so__doi-ngan">{muiTen}</span>}
      {bc && <span className="mtc-so__bc">{bc.so} {bc.ngan}</span>}
    </button>
  )
}
function TamSo({ ma, bon }: { ma: MaSoDo; bon: TraLoiBonSoDo | null }) {
  if (!bon || !bon.co) return <p className="mtc-tam__chu-nho">Chưa có số đo của con.</p>
  const d = bon.diem[ma]
  const m = mucSoDo(ma, d)
  const doi = d === null ? null : doiTuan(ma, bon.ngay)
  const moc = MOC_TOT[ma]
  return (
    <div className="mtc-tso" data-mau={m.mau} data-vung="tam-so-do">
      <div className="mtc-tso__dau">
        <span className="mtc-tso__vong"><Vong p={d} mau={m.mau} so={d ?? '—'} /></span>
        <div><p className="mtc-tso__ten">{TEN_SO[ma]} <small>/100</small></p><p className="mtc-tso__muc"><span className="mtc-chip" data-mau={m.mau}>{m.chu}</span>{CAO_LA_TOT[ma] ? '↑ Càng cao càng tốt' : '↓ Càng thấp càng tốt'}</p></div>
      </div>
      <p className="mtc-tso__noi">{noiSoDo(ma, d)}</p>
      {bon.ngay.length > 0 && (
        <>
          <h3>{bon.ngay.length} ngày qua {doi ? <small><span data-tot={doiTot(ma, doi) ? '' : undefined} data-xau={doiTot(ma, doi) ? undefined : ''}>{doi > 0 ? '↑' : '↓'} {Math.abs(doi)}</span> so với tuần trước</small> : null}</h3>
          <div className="mtc-cot14" role="img" aria-label={`Mỗi cột là một ngày; vạch đứt là mốc tốt ${moc}`}>
            {bon.ngay.map((n) => { const g = giaTriNgay(ma, n); return <span key={n.ngay} className="mtc-cot14__c"><i style={{ height: `${g ?? 0}%` }} data-trong={g === null ? '' : undefined} /></span> })}
            <span className="mtc-cot14__moc" style={{ bottom: `${moc}%` }}><em>mốc tốt {moc}</em></span>
          </div>
          <div className="mtc-cot14__nhan"><span>{ngayChuoiNgan(bon.ngay[0]!.ngay)}</span><span>{ngayChuoiNgan(bon.ngay[bon.ngay.length - 1]!.ngay)}</span></div>
        </>
      )}
      {bon.bangChung[ma].length > 0 && (
        <>
          <h3>Vì sao?</h3>
          <ul className="mtc-bc">{bon.bangChung[ma].map((b, i) => <li key={i}><b className="mtc-bc__so">{b.so}</b><p>{b.chu}{b.vd && <small>Ví dụ: {[lucVd(b.vd.luc), b.vd.chu].filter(Boolean).join(' · ')}</small>}</p></li>)}</ul>
        </>
      )}
      <h3>Anh chị nên làm gì</h3>
      <ol className="mtc-tnen">{nenTheoSoDo(ma, d).map((n, i) => <li key={i}><Bt t="tim" /><span>{n}</span></li>)}</ol>
      <p className="mtc-tam__chu-nho">Dựa trên {bon.soLuot} lượt làm câu{bon.tu && bon.den ? ` từ ${ngayChuoiNgan(bon.tu)} đến ${ngayChuoiNgan(bon.den)}` : ''}, thầy tính lại mỗi đêm. Đây là dấu hiệu để cùng con điều chỉnh, không phải điểm học tập.</p>
    </div>
  )
}

// ───────────────────────────── Kiểm tra gần nhất
function DiemGanNhat({ p, mo }: PP & { mo: () => void }) {
  const pm = p.v.pm!
  const ca = pm.caGanNhat
  const diem = ca?.ketQua?.tong ?? null
  const doi = ca?.truoc?.doi ?? null
  const xu = (pm.tienBo?.diem ?? []).slice(-5)
  const mau = doi === null || doi === 0 ? 'xd' : doi > 0 ? 'xl' : 'ho'
  return (
    <button type="button" className="mtc-o mtc-o--diem" onClick={mo} data-vung="diem-gan-nhat">
      <span className="mtc-o__nhan">Kiểm tra gần nhất<Bt t="toi" lop="mtc-bt--sau" /></span>
      {!ca ? <span className="mtc-o__trong">Con chưa có ca kiểm tra nào.</span> : diem === null ? (
        <><span className="mtc-diem__cho">Chờ công bố</span><span className="mtc-o__trong">{chuCongBoCa(ca)}</span></>
      ) : (
        <>
          <span className="mtc-diem__so"><b>{soVn(diem)}</b><small>/10</small>{doi !== null && doi !== 0 && <span className="mtc-chip" data-mau={mau}>{doi > 0 ? '↑' : '↓'} {soVn(Math.abs(doi))}<span className="mtc-chi-rong">&nbsp;so với ca trước</span></span>}</span>
          {xu.length > 1 && <span className="mtc-diem__xu"><Duong ds={xu.map((x) => x.diem)} mau={mau} min={0} max={10} het /></span>}
          {xu.length > 1 && <span className="mtc-diem__nhan-ca">{xu.map((x) => <span key={x.maCa}>{ngayNhan(x.ngay)}<b>{soVn(x.diem)}</b></span>)}</span>}
          <span className="mtc-diem__ten">{ca.tenCa} · {ngayNganVn(ca.nopLuc)}</span>
          {ca.phan.length > 0 && <span className="mtc-diem__phan">{ca.phan.map((x) => <span key={x.ma}><span>Phần {x.ma}</span><b>{x.dung}/{x.tong}</b><i style={{ ['--p' as string]: `${x.tong ? Math.round((100 * x.dung) / x.tong) : 0}%` }} /></span>)}</span>}
        </>
      )}
    </button>
  )
}

// ───────────────────────────── Con cần luyện thêm
function CanLuyen({ p }: PP) {
  const pm = p.v.pm!
  const ds = dangCanLuyen(pm.dangVap ?? (pm.manhYeu?.conVap ?? []).map((x) => ({ ma: x.tenDang, ten: x.tenDang, dung: x.dung, tong: x.tong, bac: null })))
  return (
    <section className="mtc-o mtc-o--yeu" aria-label="Dạng con cần luyện thêm" data-vung="can-luyen">
      <span className="mtc-o__nhan">Con cần luyện thêm</span>
      {ds.length ? (
        <>
          <ul className="mtc-yeu">{ds.map((d) => <li key={d.ten}><span className="mtc-yeu__ten">{d.ten}</span><span className="mtc-yeu__so">{d.dung}/{d.tong}</span><i style={{ ['--p' as string]: `${Math.round((100 * d.dung) / d.tong)}%` }} /></li>)}</ul>
          <span className="mtc-yeu__chu">Số câu đúng / đã làm gần đây</span>
        </>
      ) : <span className="mtc-o__trong">Chưa có dạng nào con sai nhiều.</span>}
    </section>
  )
}

// ───────────────────────────── Sắp tới
function SapToi({ p, nowMs }: PP & { nowMs: number }) {
  const ds = viecSap(p.v.pm!.baiTapVeNha?.dangChay, p.hoc2?.kiemTraCaNhan, nowMs)
  return (
    <section className="mtc-o mtc-o--sap" aria-label="Việc sắp tới" data-vung="sap-toi">
      <span className="mtc-o__nhan">Sắp tới</span>
      {ds.length ? (
        <ul className="mtc-sap">{ds.map((s, i) => <li key={i} data-loai={s.loai}><span className="mtc-sap__ngay"><small>{s.thu}</small><b>{s.ngay}</b></span><span className="mtc-sap__chu"><b>{s.ten}</b><span>{s.phu}</span></span></li>)}</ul>
      ) : <span className="mtc-o__trong">Không có việc nào sắp đến hạn.</span>}
    </section>
  )
}

// ───────────────────────────── Thầy nhắn
function ThayNhan({ p, mo }: PP & { mo: () => void }) {
  const cb = p.canhBao[0]
  const moi = p.loiThay.ds?.[0]
  const luc = moi ? moi.nopLuc || moi.capNhatLuc : ''
  const chu = cb ? tieuDeCanhBao(cb, 'phuhuynh') : moi ? p.chuThay(moi.noiDung) : p.loiThay.ds ? 'Thầy chưa gửi nhận xét nào cho con.' : p.loiThay.chuLoi ? 'Chưa tải được lời thầy.' : 'Đang tải lời thầy…'
  return (
    <button type="button" className="mtc-o mtc-o--thay" onClick={mo} data-vung="thay-nhan">
      <span className="mtc-o__nhan"><Bt t="thay" /><span className="mtc-chi-hep">Thầy nhắn</span><span className="mtc-chi-rong">Thầy Đỗ Đại Học{!cb && luc ? ` · ${ngayNganVn(luc)}` : ''}</span></span>
      <p>{chu}</p>
    </button>
  )
}

// ───────────────────────────── Anh chị nên làm gì
function viecNen(p: MotTrangConProps, bon: TraLoiBonSoDo | null) {
  const pm = p.v.pm!
  const so = soHomNay(pm, p.hoc2, p.tongQuan.v)
  return nenLamGi({ bon, homNayDaLam: so.daLam, homNayDu: so.tong !== null && so.tong > 0 && so.daLam >= so.tong, chuoi: pm.tongQuan?.chuoiNgayHoc ?? null, goiYMayChu: pm.phuHuynhLamGi })
}
function NenLam({ p, bon, mo }: PP & { bon: TraLoiBonSoDo | null; mo: () => void }) {
  const ds = viecNen(p, bon)
  if (!ds.length) return null
  return (
    <button type="button" className="mtc-o mtc-o--nen" onClick={mo} data-vung="nen-lam">
      <span className="mtc-o__nhan"><Bt t="tim" />Anh chị nên làm gì{ds.length > 1 && <span className="mtc-o__them mtc-chi-hep">1/{ds.length} · Xem thêm</span>}<Bt t="toi" lop="mtc-bt--sau" /></span>
      <ol className="mtc-nen">{ds.map((n, i) => <li key={i}><span>{n.dong && <b>{n.dong} </b>}{n.chu}</span></li>)}</ol>
    </button>
  )
}

// ───────────────────────────── Tấm chi tiết
function TamChiTiet({ tieuDe, loai, dong, children }: { tieuDe: string; loai: Tam; dong: () => void; children: ReactNode }) {
  const nut = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    nut.current?.focus()
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') dong() }
    document.addEventListener('keydown', phim)
    return () => { document.removeEventListener('keydown', phim); truoc?.focus?.() }
  }, [dong])
  return (
    <>
      <div className="mtc-che" onClick={dong} aria-hidden="true" />
      <aside className="mtc-tam" role="dialog" aria-modal="true" aria-label={tieuDe} data-loai={loai} data-vung="tam">
        <div className="mtc-tam__dau">
          <span className="mtc-tam__keo" aria-hidden="true" />
          <h2>{tieuDe}</h2>
          <button type="button" ref={nut} className="mtc-nut-tron" aria-label="Đóng" onClick={dong}><Bt t="dong" /></button>
        </div>
        <div className="mtc-tam__than">{children}</div>
      </aside>
    </>
  )
}
