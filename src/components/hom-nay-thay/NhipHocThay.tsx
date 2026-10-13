// NHỊP HỌC TRÊN "HÔM NAY CỦA THẦY" — BẢN VẼ THẦY DUYỆT 12/10 (dot10-canvas: Main.dc.html máy tính · HomNay-DienThoai.dc.html điện thoại). Thầy:
// "Mục hôm nay hiển thị rõ cho tôi vô cùng đẹp Nhịp học, phải làm rất đẹp, tôi nhìn vào thấy ngay học sinh nào chăm học sinh nào lười."
//   · Thẻ Nhịp học (điểm nhấn của màn): lọc Khối (Tất cả · 10 · 11 · 12, có số em) + ô Lớp · thanh chia nhóm MỌI em · bốn ô Chăm · Chưa đều · Lười ·
//     Có dấu hiệu đối phó (số em, %, điều kiện bằng chữ) · dòng "Hôm nay" (đủ mức / đang làm / chưa làm) + câu "Ngày chưa hết nên…" · nút chữ
//     "Xem bảng từng ngày ›" mở NGAY TẠI ĐÂY bảng nhiệt đầy đủ của thẻ Bài hằng ngày (`TheBaiHangNgay`, nạp lười) — thẻ Nhịp học / Bài hằng ngày cũ
//     đã rời Hành trình nên mọi chức năng của chúng còn ở đây.
//   · Máy tính: hai cột "Lười nhất · cần nhắc ngay" | "Chăm nhất · đáng khen" (mỗi cột 6 em, dải ô mỗi ngày từ 01/10, "Xem đủ N em ›" mở rộng
//     tại chỗ có ô tìm tên) · chú giải màu · "Có dấu hiệu đối phó · N em" (3 em đầu + Xem đủ) | "Theo lớp" (lớp nhiều em lười đứng trước).
//   · Điện thoại (≤ 600 px): thẻ phân đoạn Lười · Chăm · Đối phó thay cho hai cột; dòng em xếp tên → số → dải ô (bản vẽ điện thoại).
//   · Bấm một em ⇒ tấm Hồ sơ làm bài sẵn có (`HoSoLamCauEm`, nạp lười); đóng tấm ⇒ focus về đúng nút.
//   · 13/10 đợt 18: mỗi dòng em có chip "Độ tin cậy N%" của nhóm (máy chủ gửi, cùng số bảng của em); dưới 90% ⇒ "· đang theo dõi" tông hổ phách,
//     câu "cần thêm" hiện khi trỏ chuột (title) và hiện thành dòng chữ khi mở rộng cột ("Xem đủ"). Ở cột Đối phó chip kèm tên nhóm của em.
// Số CHỈ từ lệnh CHỈ ĐỌC `/gv/nhip-hoc` (src/lib/nhip-hoc-thay.ts: luật nhóm + phép thuần có test). Màu chỉ biến --gvm-* (hom-nay-thay.css); ô ngày
// dùng ĐÚNG bộ màu bảng nhiệt `bai-hang-ngay.css` (lớp `gvv2-bhn-mau-o`).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Activity, Check, ChevronRight, Clock, RefreshCw, Search, TriangleAlert } from 'lucide-react'
import {
  chipTinCay, chuCham, chuDieuKien, chuLuoi, chuMotO, LUAT_NHOM_NHIP, ngayNgan, TEN_LOAI_O, TEN_NHOM_NHIP, tinhNhipHoc, xepCham, xepDoiPho, xepLuoi,
  type DongNhipHoc, type KetQuaNhipHoc, type ONgay,
} from '../../lib/nhip-hoc-thay'
import { chuCaiTen, khopTim } from '../chien-dich/nhip-hanh-trinh'
import type { EmHoSo } from '../chien-dich/HoSoLamCauEm'
import '../chien-dich/bai-hang-ngay.css'
import './hom-nay-thay.css'

const HoSoLamCauEm = lazy(() => import('../chien-dich/HoSoLamCauEm'))
const TheBaiHangNgay = lazy(() => import('../chien-dich/TheBaiHangNgay'))

/** Số em mỗi cột khi chưa mở rộng (bản vẽ: 6) · đối phó 3 · mỗi đợt khi mở rộng (chuẩn B16: danh sách dài chia đợt). */
export const SO_EM_COT = 6
export const SO_EM_DOI_PHO = 3
export const MOI_DOT_MO_RONG = 50

export type DuNhip = { ok: true; kq: KetQuaNhipHoc } | { ok: false; chu: string }
type Kieu = 'luoi' | 'cham' | 'doi-pho'
const KHOI = ['10', '11', '12'] as const

/** Khớp media query; môi trường không có matchMedia (test) ⇒ máy tính. */
function useHep(): boolean {
  const q = '(max-width: 600px)'
  const co = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  const [hep, setHep] = useState(() => (co() ? window.matchMedia(q).matches : false))
  useEffect(() => {
    if (!co()) return
    const m = window.matchMedia(q)
    const doi = () => setHep(m.matches)
    doi()
    m.addEventListener?.('change', doi)
    return () => m.removeEventListener?.('change', doi)
  }, [])
  return hep
}

const phanTram = (a: number, b: number) => (b > 0 ? Math.round((100 * a) / b) : 0)

/** Khung xương đúng hình thẻ Nhịp học + hai cột. */
function XuongNhip() {
  return (
    <div className="nht-xuong" role="status" aria-label="Đang tải Nhịp học">
      <div className="gvv2-the nht-the">
        <span className="gv-xuong-khoi tt-xuong" style={{ width: 160, height: 26 }} />
        <span className="gv-xuong-khoi tt-xuong" style={{ width: '100%', height: 44, borderRadius: 14 }} />
        <div className="nht-o-ds">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="gv-xuong-khoi tt-xuong" style={{ height: 120, borderRadius: 20 }} />
          ))}
        </div>
        <span className="gv-xuong-khoi tt-xuong" style={{ width: '100%', height: 48, borderRadius: 16 }} />
      </div>
      <div className="nht-cot-ds">
        {[0, 1].map((c) => (
          <div key={c} className="gvv2-the nht-cot">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="nht-xuong-dong">
                <span className="gv-xuong-khoi tt-xuong" style={{ width: 40, height: 40, borderRadius: 999 }} />
                <span className="gv-xuong-khoi tt-xuong" style={{ flex: 1, height: 32 }} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Dải ô mỗi ngày (màu bảng nhiệt). Trình đọc màn hình đọc câu tóm tắt ở nhãn nút của dòng — dải ô ẩn khỏi cây truy cập. */
function DaiO({ o }: { o: readonly ONgay[] }) {
  return (
    <span className="nht-dai" aria-hidden="true" style={{ '--nht-so-o': Math.min(o.length, 16) } as CSSProperties}>
      {o.map((x) => (
        <i
          key={x.ngay}
          className="gvv2-bhn-mau-o nht-o"
          data-muc={x.loai === 'chua-vao' ? 'chua-vao' : x.homNay && x.lam <= 0 ? 'hom-nay' : x.loai}
          data-hom-nay={x.homNay ? 'true' : undefined}
          title={chuMotO(x)}
        />
      ))}
    </span>
  )
}

function chuDong(d: DongNhipHoc, kieu: Kieu): { chinh: string; phu: string } {
  if (kieu === 'luoi') return chuLuoi(d)
  if (kieu === 'cham') return chuCham(d)
  return { chinh: '', phu: d.doiPho?.lyDo.join(' · ') ?? '' }
}

function DongEm({ d, kieu, moRong = false, onMo }: { d: DongNhipHoc; kieu: Kieu; moRong?: boolean; onMo: (d: DongNhipHoc, nut: HTMLButtonElement) => void }) {
  const c = chuDong(d, kieu)
  const tin = chipTinCay(d)
  // cột Đối phó không phải một nhóm ⇒ chip kèm tên nhóm của em; cột Lười / Chăm đã có tên nhóm ở tiêu đề cột
  const chuTin = tin ? `${kieu === 'doi-pho' ? `${TEN_NHOM_NHIP[d.nhom]} · ` : ''}${tin.chu}` : ''
  return (
    <li>
      <button
        type="button"
        className="nht-em tt-nhan"
        data-kieu={kieu}
        data-sbd={d.sbd}
        onClick={(ev) => onMo(d, ev.currentTarget)}
        aria-label={`${d.hoTen}${d.lop ? `, ${d.lop}` : ''}: ${kieu === 'doi-pho' ? c.phu : `${c.chinh}${c.phu ? `, ${c.phu}` : ''}`}${tin ? `; ${chuTin}${tin.tam ? `. ${tin.giaiThich}` : ''}` : ''} — xem hồ sơ làm bài`}
      >
        <span className="nht-av" aria-hidden="true">
          {chuCaiTen(d.hoTen)}
        </span>
        <span className="nht-ten">
          <b>{d.hoTen}</b>
          {d.lop && <small> · {d.lop}</small>}
          {tin && (
            <span className="nht-tin gvv2-so" data-du={tin.tam ? 'false' : 'true'} title={tin.giaiThich} aria-hidden="true">
              {chuTin}
            </span>
          )}
          {tin?.tam && moRong && (
            <span className="nht-tin-them" aria-hidden="true">
              {tin.giaiThich}
            </span>
          )}
        </span>
        {kieu === 'doi-pho' ? (
          <span className="nht-ly-do">{c.phu}</span>
        ) : (
          <>
            <DaiO o={d.o} />
            <span className="nht-so gvv2-so">
              <b>{c.chinh}</b>
              {c.phu && <small>{c.phu}</small>}
            </span>
          </>
        )}
      </button>
    </li>
  )
}

/** Một cột em (Lười nhất / Chăm nhất / Có dấu hiệu đối phó): N em đầu + "Xem đủ" mở rộng tại chỗ có ô tìm tên. */
function CotEm(p: {
  kieu: Kieu
  ds: readonly DongNhipHoc[]
  tieuDe: string
  phu: string
  soDau: number
  chuXemDu: string
  chuTrong: string
  ghi?: ReactNode
  onMo: (d: DongNhipHoc, nut: HTMLButtonElement) => void
  oTab?: boolean
}) {
  const [moRong, setMoRong] = useState(false)
  const [tim, setTim] = useState('')
  const [soHien, setSoHien] = useState(MOI_DOT_MO_RONG)
  const id = `nht-cot-${p.kieu}`
  const loc = moRong ? p.ds.filter((d) => khopTim({ sbd: d.sbd, ten: d.hoTen }, tim)) : p.ds.slice(0, p.soDau)
  const hien = moRong ? loc.slice(0, soHien) : loc
  return (
    <section className="gvv2-the nht-cot" data-kieu={p.kieu} aria-labelledby={`${id}-tieu`} id={id} role={p.oTab ? 'tabpanel' : undefined}>
      <div className="nht-cot-dau">
        <h3 id={`${id}-tieu`}>{p.tieuDe}</h3>
        <span>{p.phu}</span>
      </div>
      {moRong && (
        <label className="gvv2-tim nht-tim">
          <Search size={16} aria-hidden="true" />
          <input type="search" value={tim} onChange={(ev) => (setTim(ev.target.value), setSoHien(MOI_DOT_MO_RONG))} placeholder="Tìm tên hoặc số báo danh…" aria-label={`Tìm em trong nhóm ${p.tieuDe}`} />
        </label>
      )}
      {p.ds.length === 0 ? (
        <p className="nht-trong">{p.chuTrong}</p>
      ) : loc.length === 0 ? (
        <p className="nht-trong">Không em nào khớp “{tim.trim()}”.</p>
      ) : (
        <ul className="nht-em-ds">
          {hien.map((d) => (
            <DongEm key={d.sbd} d={d} kieu={p.kieu} moRong={moRong} onMo={p.onMo} />
          ))}
        </ul>
      )}
      {moRong && loc.length > hien.length && (
        <button type="button" className="gvv2-nut-vien tt-nhan nht-them" onClick={() => setSoHien((s) => s + MOI_DOT_MO_RONG)}>
          Xem thêm {Math.min(MOI_DOT_MO_RONG, loc.length - hien.length)} em (còn {loc.length - hien.length})
        </button>
      )}
      {p.ghi}
      {p.ds.length > p.soDau && (
        <button
          type="button"
          className="gvv2-nut-chu tt-nhan nht-xem-du"
          aria-expanded={moRong}
          aria-controls={id}
          onClick={() => {
            setMoRong((m) => !m)
            setTim('')
            setSoHien(MOI_DOT_MO_RONG)
          }}
        >
          {moRong ? 'Thu gọn' : p.chuXemDu}
          <ChevronRight size={16} aria-hidden="true" className={moRong ? 'nht-mui-len' : undefined} />
        </button>
      )}
    </section>
  )
}

function ChuGiai({ coChuaVao, tu, homNay }: { coChuaVao: boolean; tu: string; homNay: string }) {
  return (
    <ul className="nht-chu-giai" aria-label="Chú giải màu ô ngày">
      <li className="nht-chu-giai-dau">
        Mỗi ô một ngày, {ngayNgan(tu)} → {ngayNgan(homNay)}:
      </li>
      {(['du', 'thieu-it', 'thieu-nhieu', 'khong-lam'] as const).map((m) => (
        <li key={m}>
          <i className="gvv2-bhn-mau-o nht-o" data-muc={m} aria-hidden="true" />
          {TEN_LOAI_O[m]}
        </li>
      ))}
      <li>
        <i className="gvv2-bhn-mau-o nht-o" data-muc="hom-nay" data-hom-nay="true" aria-hidden="true" />
        Hôm nay (chưa hết ngày)
      </li>
      {coChuaVao && (
        <li>
          <i className="gvv2-bhn-mau-o nht-o" data-muc="chua-vao" aria-hidden="true" />
          {TEN_LOAI_O['chua-vao']}
        </li>
      )}
    </ul>
  )
}

export default function NhipHocThay({ du, dangTai, onThuLai }: { du: DuNhip | null; dangTai: boolean; onThuLai: () => void }) {
  const hep = useHep()
  const [khoi, setKhoi] = useState<string | null>(null)
  const [lop, setLop] = useState('')
  const [tab, setTab] = useState<Kieu>('luoi')
  const [mo, setMo] = useState<EmHoSo | null>(null)
  const [moBang, setMoBang] = useState(false)
  const nutVua = useRef<HTMLButtonElement | null>(null)
  const nutBang = useRef<HTMLButtonElement | null>(null)

  const kq = du?.ok ? du.kq : null
  const tatCa = useMemo(() => kq?.em ?? [], [kq])
  const dsKhoi = useMemo(() => KHOI.map((k) => ({ khoi: k, soEm: tatCa.filter((e) => e.khoi === k).length })).filter((k) => k.soEm > 0), [tatCa])
  const khoiChon = khoi !== null && dsKhoi.some((k) => k.khoi === khoi) ? khoi : null
  const dsLop = useMemo(() => (kq?.lop ?? []).filter((l) => !khoiChon || l.khoi === khoiChon), [kq, khoiChon])
  const lopChon = dsLop.some((l) => l.tenLop === lop) ? lop : ''
  const t = useMemo(() => (kq ? tinhNhipHoc(kq, { khoi: khoiChon, lop: lopChon }) : null), [kq, khoiChon, lopChon])
  const luoi = useMemo(() => (t ? t.dong.filter((d) => d.nhom === 'luoi').sort(xepLuoi) : []), [t])
  const cham = useMemo(() => (t ? t.dong.filter((d) => d.nhom === 'cham').sort(xepCham) : []), [t])
  const doiPho = useMemo(() => (t ? t.dong.filter((d) => d.doiPho).sort(xepDoiPho) : []), [t])

  const onMo = useCallback((d: DongNhipHoc, nut: HTMLButtonElement) => {
    nutVua.current = nut
    setMo({ sbd: d.sbd, ten: d.hoTen, khoi: d.khoi === '10' || d.khoi === '11' || d.khoi === '12' ? d.khoi : null, lop: d.lop })
  }, [])
  const onDong = useCallback(() => {
    setMo(null)
    nutVua.current?.focus()
  }, [])

  if (du === null) return <XuongNhip />
  if (!du.ok)
    return (
      <section className="gvv2-the nht-the" aria-labelledby="nht-tieu">
        <h2 id="nht-tieu" className="nht-h2">
          Nhịp học
        </h2>
        <div className="gvv2-loi nht-loi" role="alert">
          <p>Chưa tải được Nhịp học. {du.chu}</p>
          <button type="button" className="gvv2-nut-vien tt-nhan" onClick={onThuLai} disabled={dangTai}>
            <RefreshCw size={16} aria-hidden="true" />
            {dangTai ? 'Đang tải lại…' : 'Thử lại'}
          </button>
        </div>
      </section>
    )
  if (!kq || !t || tatCa.length === 0)
    return (
      <section className="gvv2-the nht-the" aria-labelledby="nht-tieu">
        <h2 id="nht-tieu" className="nht-h2">
          Nhịp học
        </h2>
        <p className="nht-trong">
          Chưa có em nào nhận bài hằng ngày: chưa có Hành trình khối hay Gói bài 7 ngày nào đang chạy. Thầy tick bài vừa dạy ở Hành trình › Dạy học để app bắt đầu xếp bài.
        </p>
      </section>
    )

  const n = t.soNgayQua
  const { dem } = t
  const nhom = [
    { k: 'cham' as const, ten: 'Chăm', so: dem.cham },
    { k: 'chua-deu' as const, ten: 'Chưa đều', so: dem.chuaDeu },
    { k: 'luoi' as const, ten: 'Lười', so: dem.luoi },
    { k: 'chua-du' as const, ten: 'Chưa đủ dữ liệu', so: dem.chuaDu },
  ]
  const tom = nhom.filter((x) => x.so > 0).map((x) => `${x.ten} ${x.so}`).join(', ')
  const coChonLap = kq.doiPhoDaTinh.chonLap
  const o = [
    { k: 'cham', icon: Check, ten: 'Chăm', so: dem.cham, pt: true, dai: chuDieuKien('cham', n), ngan: n >= LUAT_NHOM_NHIP.soNgayToiThieu ? `đủ mức ≥ ${Math.ceil((LUAT_NHOM_NHIP.chamTu * n) / 100)}/${n} ngày` : `đủ mức ≥ ${LUAT_NHOM_NHIP.chamTu}% số ngày` },
    { k: 'chua-deu', icon: Activity, ten: 'Chưa đều', so: dem.chuaDeu, pt: true, dai: chuDieuKien('chua-deu', n), ngan: chuDieuKien('chua-deu', n).replace(/^Đủ mức/, 'đủ mức').replace(/ trong \d+$/, '') },
    { k: 'luoi', icon: TriangleAlert, ten: 'Lười', so: dem.luoi, pt: true, dai: chuDieuKien('luoi', n), ngan: `${n >= LUAT_NHOM_NHIP.soNgayToiThieu ? `đủ mức ≤ ${Math.floor((LUAT_NHOM_NHIP.luoiDen * n) / 100)}/${n} ngày` : `đủ mức ≤ ${LUAT_NHOM_NHIP.luoiDen}% số ngày`} · thoát: ${LUAT_NHOM_NHIP.ngayLienThoatLuoi} ngày liền đủ` },
    { k: 'doi-pho', icon: Clock, ten: 'Có dấu hiệu đối phó', tenNgan: 'Đối phó', so: dem.doiPho, pt: false, dai: coChonLap ? 'Làm quá nhanh mà sai nhiều, chọn lặp một đáp án' : 'Làm quá nhanh mà sai nhiều (lần này chưa đọc được đáp án chọn)', ngan: coChonLap ? 'nhanh mà sai, chọn lặp' : 'nhanh mà sai' },
  ]
  const h = t.homNay
  const coChuaVao = t.dong.some((d) => d.o.some((x) => x.loai === 'chua-vao'))
  const tenLoc = `${khoiChon ? ` ở Khối ${khoiChon}` : ''}${lopChon ? ` · lớp ${lopChon}` : ''}`

  const cotLuoi = (oTab = false) => (
    <CotEm
      key={`luoi-${khoiChon}-${lopChon}`}
      kieu="luoi"
      ds={luoi}
      tieuDe="Lười nhất · cần nhắc ngay"
      phu="xếp theo số ngày thiếu"
      soDau={SO_EM_COT}
      chuXemDu={`Xem đủ ${luoi.length} em lười`}
      chuTrong={`Không em nào ở nhóm Lười${tenLoc}.`}
      onMo={onMo}
      oTab={oTab}
    />
  )
  const cotCham = (oTab = false) => (
    <CotEm
      key={`cham-${khoiChon}-${lopChon}`}
      kieu="cham"
      ds={cham}
      tieuDe="Chăm nhất · đáng khen"
      phu="xếp theo số ngày đủ mức"
      soDau={SO_EM_COT}
      chuXemDu={`Xem đủ ${cham.length} em chăm`}
      chuTrong={`Chưa có em nào ở nhóm Chăm${tenLoc}.`}
      onMo={onMo}
      oTab={oTab}
    />
  )
  const cotDoiPho = (oTab = false) => (
    <CotEm
      key={`doi-pho-${khoiChon}-${lopChon}`}
      kieu="doi-pho"
      ds={doiPho}
      tieuDe={`Có dấu hiệu đối phó · ${doiPho.length} em`}
      phu="làm cho xong, không học"
      soDau={SO_EM_DOI_PHO}
      chuXemDu={`Xem đủ ${doiPho.length} em`}
      chuTrong={`Không em nào có dấu hiệu đối phó${tenLoc}.`}
      ghi={
        <p className="nht-ghi-nho">
          Tính theo số giây và đáp án ghi trong sổ{coChonLap ? '' : ' (lần này chỉ tính trả lời quá nhanh)'}; bấm tên em để xem đủ sáu tín hiệu.
        </p>
      }
      onMo={onMo}
      oTab={oTab}
    />
  )
  const theoLop = (
    <section className="gvv2-the nht-cot nht-lop" aria-labelledby="nht-lop-tieu">
      <div className="nht-cot-dau">
        <h3 id="nht-lop-tieu">Theo lớp</h3>
        <span>lớp nhiều em lười đứng trước</span>
      </div>
      <ul className="nht-lop-ds">
        {t.lop.map((l) => (
          <li key={l.tenLop} className="nht-lop-dong">
            <span className="nht-lop-ten">
              <b>{l.tenLop || 'Chưa xếp lớp'}</b> <small className="gvv2-so">{l.si} em</small>
            </span>
            <span
              className="nht-thanh nht-thanh--nho"
              role="img"
              aria-label={`${l.tenLop}: Chăm ${l.cham}, Chưa đều ${l.chuaDeu}, Lười ${l.luoi}, chưa đủ dữ liệu ${l.chuaDu} trên ${l.si} em`}
            >
              {(['cham', 'chuaDeu', 'luoi', 'chuaDu'] as const).map((k) =>
                l[k] > 0 ? <i key={k} data-nhom={k === 'chuaDeu' ? 'chua-deu' : k === 'chuaDu' ? 'chua-du' : k} style={{ width: `${(100 * l[k]) / l.si}%` }} /> : null,
              )}
            </span>
            <b className="nht-lop-p gvv2-so" aria-label={`${l.pLuoi}% em lười`}>
              {l.pLuoi}%
            </b>
          </li>
        ))}
      </ul>
      <p className="nht-ghi-nho">Thanh: Chăm · Chưa đều · Lười · chưa đủ dữ liệu. Số bên phải là % em lười của lớp.</p>
    </section>
  )

  return (
    <>
      <section className="gvv2-the nht-the" aria-labelledby="nht-tieu">
        <div className="nht-dau">
          <div className="nht-dau-chu">
            <h2 id="nht-tieu" className="nht-h2">
              Nhịp học
            </h2>
            <p className="gvv2-so">
              Từ {ngayNgan(kq.tu)}
              <span className="nht-an-hep"> tới hôm nay</span> · {n} ngày đã qua
              <span className="nht-an-hep"> · tính theo mức tối thiểu mỗi ngày của từng em</span>
            </p>
          </div>
          <div className="nht-loc">
            {dsKhoi.length >= 2 && (
              <div className="nht-khoi" role="radiogroup" aria-label="Khối">
                <button type="button" role="radio" aria-checked={khoiChon === null} className="nht-khoi-nut tt-nhan" onClick={() => setKhoi(null)}>
                  Tất cả<span className="nht-an-hep"> ·</span> <span className="gvv2-so">{tatCa.length}</span>
                </button>
                {dsKhoi.map((k) => (
                  <button key={k.khoi} type="button" role="radio" aria-checked={khoiChon === k.khoi} aria-label={`Khối ${k.khoi} · ${k.soEm} em`} className="nht-khoi-nut tt-nhan" onClick={() => setKhoi(k.khoi)}>
                    <span className="nht-an-hep">Khối {k.khoi}</span>
                    <span className="nht-chi-hep">K{k.khoi}</span> · <span className="gvv2-so">{k.soEm}</span>
                  </button>
                ))}
              </div>
            )}
            <label className="nht-lop-chon">
              <span>Lớp</span>
              <select value={lopChon} onChange={(ev) => setLop(ev.target.value)}>
                <option value="">Mọi lớp</option>
                {dsLop.map((l) => (
                  <option key={l.tenLop} value={l.tenLop}>
                    {l.tenLop} · {l.soEm} em
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="nht-chia">
          <div className="nht-thanh" role="img" aria-label={`${dem.tong} em: ${tom}`}>
            {nhom.map((x) =>
              x.so > 0 ? (
                <span key={x.k} data-nhom={x.k} style={{ width: `${(100 * x.so) / dem.tong}%` }}>
                  <span className="nht-thanh-chu gvv2-so" aria-hidden="true">
                    {x.k === 'chua-du' ? (phanTram(x.so, dem.tong) >= 3 ? x.so : '') : phanTram(x.so, dem.tong) >= 12 ? `${x.ten} ${x.so}` : phanTram(x.so, dem.tong) >= 4 ? x.so : ''}
                  </span>
                </span>
              ) : null,
            )}
          </div>
          <span className="nht-ghi gvv2-so">
            {dem.tong} em · mỗi em một nhóm, xếp theo số ngày đủ mức từ {ngayNgan(kq.tu)}
            {dem.chuaDu > 0 && ` · xám: ${dem.chuaDu} em chưa đủ dữ liệu (dưới ${LUAT_NHOM_NHIP.soNgayToiThieu} ngày đã qua để tính)`}
          </span>
        </div>

        <div className="nht-o-ds">
          {o.map((x) => {
            const Icon = x.icon
            return (
              <div key={x.k} className="nht-o-nhom" data-nhom={x.k}>
                <span className="nht-o-nhan">
                  <Icon size={18} aria-hidden="true" />
                  <span className="nht-an-hep">{x.ten}</span>
                  <span className="nht-chi-hep">{x.tenNgan ?? x.ten}</span>
                </span>
                <b className="nht-o-so gvv2-so">
                  {x.so}{' '}
                  <small>
                    em
                    {x.pt && <span className="nht-an-hep"> · {phanTram(x.so, dem.tong)}%</span>}
                  </small>
                </b>
                <span className="nht-o-dk">
                  <span className="nht-an-hep">{x.dai}</span>
                  <span className="nht-chi-hep">{x.ngan}</span>
                </span>
              </div>
            )
          })}
        </div>

        {h && (
          <>
            <div className="nht-hom-nay">
              <b className="nht-hom-nay-nhan">Hôm nay</b>
              <span className="nht-thanh-hn" role="img" aria-label={`Hôm nay: ${h.du} em đủ mức, ${h.dangLam} em đang làm, ${h.chuaLam} em chưa làm câu nào, trên ${dem.tong} em`}>
                {h.du > 0 && <i data-nhom="du" style={{ width: `${(100 * h.du) / dem.tong}%` }} />}
                {h.dangLam > 0 && <i data-nhom="dang-lam" style={{ width: `${(100 * h.dangLam) / dem.tong}%` }} />}
              </span>
              <span className="nht-hom-nay-so gvv2-so">
                <b data-nhom="du">{h.du}</b> đủ mức · <b data-nhom="dang-lam">{h.dangLam}</b> đang làm · <b>{h.chuaLam}</b> chưa làm câu nào
              </span>
            </div>
            <p className="nht-ghi nht-ghi-hn">
              Ngày chưa hết nên số em chưa làm buổi sáng chưa nói lên điều gì; nhóm Chăm · Chưa đều · Lười chỉ tính trên {n} ngày đã qua.
            </p>
          </>
        )}
        {kq.canhBao.map((c) => (
          <p key={c} className="gvv2-bhn-canh-bao" role="status">
            {c}
          </p>
        ))}
        <div className="nht-chan">
          <button
            ref={nutBang}
            type="button"
            className="gvv2-nut-chu tt-nhan"
            aria-expanded={moBang}
            aria-controls="nht-bang"
            onClick={() => setMoBang((m) => !m)}
          >
            {moBang ? 'Ẩn bảng từng ngày' : 'Xem bảng từng ngày'}
            <ChevronRight size={16} aria-hidden="true" className={moBang ? 'nht-mui-len' : undefined} />
          </button>
          <button type="button" className="gvv2-nut-chu tt-nhan" onClick={onThuLai} disabled={dangTai} aria-busy={dangTai}>
            <RefreshCw size={16} aria-hidden="true" className={dangTai ? 'gvv2-quay' : undefined} />
            {dangTai ? 'Đang làm mới…' : 'Làm mới'}
          </button>
        </div>
      </section>

      {moBang && (
        <div id="nht-bang" className="nht-bang">
          <Suspense
            fallback={
              <div className="gvv2-the nht-the" role="status" aria-label="Đang mở bảng từng ngày">
                <span className="gv-xuong-khoi tt-xuong" style={{ width: '100%', height: 240, borderRadius: 16 }} />
              </div>
            }
          >
            <TheBaiHangNgay khoiDau={khoiChon ? Number(khoiChon) : null} />
          </Suspense>
        </div>
      )}

      {hep ? (
        <div className="nht-cot-ds nht-cot-ds--hep">
          <div className="gvv2-the nht-tab-khung">
            <div className="nht-tab" role="tablist" aria-label="Nhóm em">
              {(
                [
                  ['luoi', 'Lười', luoi.length],
                  ['cham', 'Chăm', cham.length],
                  ['doi-pho', 'Đối phó', doiPho.length],
                ] as const
              ).map(([k, ten, so]) => (
                <button key={k} type="button" role="tab" id={`nht-tab-${k}`} aria-selected={tab === k} aria-controls={`nht-cot-${k}`} data-kieu={k} className="nht-tab-nut tt-nhan" onClick={() => setTab(k)}>
                  {ten} <span className="gvv2-so">{so}</span>
                </button>
              ))}
            </div>
            {tab === 'luoi' ? cotLuoi(true) : tab === 'cham' ? cotCham(true) : cotDoiPho(true)}
          </div>
          {tab !== 'doi-pho' && <ChuGiai coChuaVao={coChuaVao} tu={kq.tu} homNay={kq.homNay} />}
          {theoLop}
        </div>
      ) : (
        <div className="nht-cot-ds">
          {cotLuoi()}
          {cotCham()}
          <ChuGiai coChuaVao={coChuaVao} tu={kq.tu} homNay={kq.homNay} />
          {cotDoiPho()}
          {theoLop}
        </div>
      )}

      {mo &&
        createPortal(
          <div className="m3 m3-thay vo-thay" data-hoa2="" data-vo-cong="ho-so-lam-cau" style={{ display: 'contents' }}>
            <Suspense
              fallback={
                <>
                  <div className="gvv2-hs-che" aria-hidden="true" />
                  <div className="gvv2-hs gvv2-hs--cho" role="status" aria-label="Đang mở hồ sơ làm bài" />
                </>
              }
            >
              <HoSoLamCauEm em={mo} onDong={onDong} />
            </Suspense>
          </div>,
          document.body,
        )}
    </>
  )
}
