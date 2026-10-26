// TRANG "HÔM NAY CỦA CON" — ĐỢT 19 · LÀN R (thầy duyệt bản vẽ docs/ban-ve-dot19/app-phu-huynh.html 13/10: "duyệt cả hai giữ xếp theo bậc phụ huynh
// xem được hạng"; yêu cầu gốc: "phụ huynh để xem đủ hết mọi thông tin của con … mọi thứ đo được về con, hiển thị không được phép dấu diếm … giao diện
// phải ấm áp để phụ huynh thấy bình an, thân thiện"; chốt "không hiện tính cách cũng được" ⇒ KHÔNG có mục tính cách).
// MỘT trang cuộn, mọi phần nằm ngay trên trang (không phần nào phải bấm mới thấy). Tệp này là PHẦN TRÊN (nằm trong tải đầu app): lời chào · thanh mục
// dính (điện thoại) · Hôm nay (số câu / mức, có mặt buổi học, các lần học, đúng · sai · giây, bậc) · Cần nhắc con · Nhịp học 14 ngày (+ bậc, hạng chăm)
// · Nhận xét của thầy. Mọi số ở đây lấy từ các lệnh ĐÃ TẢI lúc mở app (`/ph/tat-ca-ve-con`, `/ph/con-tong-quan`, `/ph/nhip-hoc`, `/ph/loi-thay`,
// `/ph/hoc-2`). PHẦN DƯỚI (Thái độ · Câu sai · Thời gian · Kiểm tra · Bài tập về nhà · Buổi học · Lịch sử) ở TrangVeConDuoi.tsx — NẠP KHI SẮP CUỘN
// TỚI (IntersectionObserver): khối mã nạp lười + hai lệnh `/ph/ho-so-thai-do` · `/ph/lich-su-lam-cau` chạy SONG SONG (AppPhuHuynh giữ số).
// Huy hiệu / thang 12 bậc (làn M) ở BacCon.tsx — khối nạp sẵn song song lúc mở trang. Tin xấu nói thẳng, có số, giọng bình tĩnh; số nào cũng có nhãn;
// không mã nội bộ, không đáp án. MÀU: chỉ biến --ph3-* sẵn có + 12 màu bậc (trang-con.css).
import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { PhMoi } from '../../lib/ph-moi/du-lieu'
import type { Hoc2, NhanXetCa } from '../../lib/ph-v3/du-lieu'
import type { ConTongQuan, GoiYNhac } from '../../lib/ph-v3/con-tong-quan'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import { chuHanNop, chuGuiLuc, tieuDeCanhBao } from '../../lib/canh-bao-thay-hien-thi'
import { gioVn, ngayChuoiNgan, ngayDayDuVn, thuNgayVn, thuTuChuoiNgay } from '../../lib/ph-moi/dinh-dang'
import { chuCanThem, loaiONgay, nhipTheoSanh, TEN_NHOM_NHIP, type KetQuaNhipHocApp, type NhomNhip } from '../../lib/nhip-hoc-em'
import {
  BtBut, BtChuong, BtDiXuong, BtLich, BtPhai, BtSach, BtTia, BtTich, BtTinNhan, BtTrang, BtBongDen,
} from './BieuTuong'
import type { Mau } from './dung-chung'
import { chuThay } from './tien-ich'
import './trang-con.css'
import { HO_SO_TRONG, PHAN, PHAN_DUOI, buoiHomNay, docPhanTuHash, homNayTq, idPhan, phanCo, soHomNay, tenGoi } from './trang-ve-con-chung'
import { LoiThe } from './LoiThe'
import type { Bt, IdPhan, TaiHoSo, TaiNhip, TaiTq, TrangVeConProps } from './trang-ve-con-chung'
// Phần chung đã chuyển sang trang-ve-con-chung.tsx (26/10) — xuất lại y tên cũ.
export { HO_SO_TRONG, LoiThe, PHAN, PHAN_DUOI, buoiHomNay, docPhanTuHash, homNayTq, idPhan, phanCo, soHomNay, tenGoi }
export type { IdPhan, TaiHoSo, TaiNhip, TaiTq, TrangVeConProps }

export const TheKiemTraCon = lazy(() => import('./TheKiemTraCon'))

const giamChuyenDong = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
/** Cuộn tới một phần (đầu phần chừa thanh mục dính — `scroll-margin-top` trong CSS). */
export function cuonToiPhan(id: IdPhan, muot = true): void {
  const el = typeof document === 'undefined' ? null : document.getElementById(idPhan(id))
  el?.scrollIntoView?.({ block: 'start', behavior: muot && !giamChuyenDong() ? 'smooth' : 'auto' })
}

// ---------------------------------------------------------------- khối nạp khi cần ----------------------------------------------------------------
const napPhanDuoi = () => import('./TrangVeConDuoi')
const PhanDuoi = lazy(napPhanDuoi)
type KhoiBac = typeof import('./BacCon')
let huaBac: Promise<KhoiBac | null> | null = null
/** Nạp sẵn khối bậc (huy hiệu + thang 12 bậc, làn M) — một lần mỗi phiên; lỗi ⇒ lần sau thử lại, phần bậc ẩn. */
export const napBacCon = (): Promise<KhoiBac | null> => (huaBac ??= import('./BacCon').catch(() => ((huaBac = null), null)))
const KhongGi = (_: { k: KetQuaNhipHocApp }) => null
const BacHomNay = lazy(async () => ({ default: (await napBacCon())?.BacHomNay ?? KhongGi }))
const BacNhip = lazy(async () => ({ default: (await napBacCon())?.BacNhip ?? KhongGi }))

// ---------------------------------------------------------------- phép thuần (test gọi thẳng) ----------------------------------------------------------------
/** Các lần học hôm nay (theo giờ, `toiDa` lần gần nhất): "19:31–19:40" · số câu · số phút; các lần sớm hơn gộp thành số lần. */
export function lanHocHomNay(pm: PhMoi, toiDa = 3): { ds: { khoang: string; cau: string; phut: string }[]; them: number } {
  const moc = [...(pm.dongThoiGian ?? [])].sort((a, b) => Date.parse(a.batDau) - Date.parse(b.batDau))
  const ds = moc.slice(-toiDa).map((m) => {
    const n = m.soCau ?? m.soCauDaLam
    return { khoang: `${gioVn(m.batDau)}–${gioVn(Date.parse(m.batDau) + m.phut * 60_000)}`, cau: n !== null ? `${n} câu` : '', phut: `${m.phut} phút` }
  })
  return { ds, them: Math.max(0, moc.length - toiDa) }
}

/** Mã gợi ý của máy chủ ⇒ biểu tượng + màu + thứ tự "mức cần để ý" (bản vẽ: trả lời quá nhanh trước, rồi ngày thiếu, câu sai chưa sửa, độ đúng giảm…). */
const NHAC: Record<GoiYNhac['ma'], { bt: Bt; mau: Mau; thu: number } | null> = {
  'nhanh-sai': { bt: BtTia, mau: 'ho', thu: 1 },
  'thieu-ngay': { bt: BtLich, mau: 'ho', thu: 2 },
  'sai-chua-sua': { bt: BtBut, mau: 'hp', thu: 3 },
  'ti-le-giam': { bt: BtDiXuong, mau: 'hp', thu: 4 },
  'lam-khuya': { bt: BtTrang, mau: 'tim', thu: 5 },
  'dung-goi-y': { bt: BtBongDen, mau: 'hp', thu: 6 },
  // hai dòng nói lại số câu hôm nay của khối Hôm nay ⇒ không lặp (một thông tin một chỗ)
  'con-cau-hom-nay': null,
  'chua-lam-hom-nay': null,
}
export type DongNhac = { khoa: string; bt: Bt; mau: Mau; chu: string }
/** Chỉ câu ĐẦU (câu nói số liệu) của dòng máy chủ sinh — bỏ vế khuyên phía sau (đợt 18, thầy bỏ chữ hướng dẫn). */
const cauDau = (chu: string): string => {
  const t = chu.trim()
  const m = /^(.*?[.!?])(?:\s|$)/.exec(t)
  return m ? m[1]! : t
}
/** "Cần nhắc con": gợi ý số liệu của máy chủ (`/ph/con-tong-quan` goiY) + câu đến lịch ôn lại hôm nay + bài tập về nhà đang chạy. Thuần. */
export function dongCanNhac(tq: ConTongQuan | null, pm: PhMoi | null, nowMs: number): DongNhac[] {
  const ra: (DongNhac & { thu: number })[] = []
  for (const g of tq?.goiY ?? []) {
    const k = NHAC[g.ma]
    if (!k) continue
    let chu = cauDau(g.chu)
    if (g.ma === 'sai-chua-sua' && pm?.lichOn && pm.lichOn.homNay > 0) chu += ` Hôm nay có ${pm.lichOn.homNay} câu đến lịch ôn lại.`
    ra.push({ khoa: g.ma, bt: k.bt, mau: k.mau, chu, thu: k.thu })
  }
  if (pm?.lichOn && pm.lichOn.homNay > 0 && !ra.some((d) => d.khoa === 'sai-chua-sua'))
    ra.push({ khoa: 'on-lai', bt: BtBut, mau: 'hp', chu: `Hôm nay có ${pm.lichOn.homNay} câu đến lịch ôn lại.`, thu: 3 })
  for (const b of (pm?.baiTapVeNha?.dangChay ?? []).slice(0, 2)) {
    const con = b.changTong !== null && b.changXong !== null ? ` còn ${b.changTong - b.changXong}/${b.changTong} chặng,` : ''
    const han = Date.parse(b.hanNop)
    if (Number.isFinite(han) && han > nowMs) ra.push({ khoa: `btvn-${b.maBtvn}`, bt: BtSach, mau: 'xd', chu: `Bài tập về nhà ${b.ten}${con} hạn nộp ${gioVn(han)} ${thuNgayVn(han)}.`, thu: 7 })
  }
  return ra.sort((a, b) => a.thu - b.thu).map(({ thu: _thu, ...d }) => d)
}

/** Tô đậm mọi con số trong câu (vd "131/409", "32%", "8 giây") — chữ giữ nguyên. */
export function DamSo({ chu }: { chu: string }) {
  const phan = chu.split(/(\d+(?:[.,/]\d+)*%?)/)
  return <>{phan.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))}</>
}

const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const
const thuNgan = (ngay: string): string => THU_NGAN[new Date(`${ngay}T00:00:00Z`).getUTCDay()] ?? ''
export type LoaiO = 'du' | 'it' | 'nhieu' | 'khong' | 'nay'
/** Ô một ngày trên dải Nhịp học (ngày hôm nay luôn là ô viền). */
export function oNgay(x: { ngay: string; muc: number; lam: number }, homNay: string): { nhan: string; loai: LoaiO; chu: string } {
  const l = loaiONgay(x, homNay)
  const loai: LoaiO = x.ngay === homNay ? 'nay' : l === 'du' ? 'du' : l === 'thieu-it' ? 'it' : l === 'thieu-nhieu' ? 'nhieu' : 'khong'
  const tt = x.lam >= x.muc ? 'đủ mức' : x.ngay === homNay ? 'đang làm' : x.lam === 0 ? 'không làm' : `thiếu ${x.muc - x.lam} câu`
  return { nhan: `${thuNgan(x.ngay)} ${x.ngay.slice(8, 10)}`, loai, chu: `${ngayChuoiNgan(x.ngay)}${x.ngay === homNay ? ' (hôm nay)' : ''}: đã làm ${x.lam}/${x.muc} câu — ${tt}` }
}
const MAU_NHOM: Record<NhomNhip, Mau> = { cham: 'xl', 'chua-deu': 'hp', luoi: 'ho', 'chua-du': 'xd' }

export default function TrangVeCon(p: TrangVeConProps) {
  const { v, hoc2, tongQuan, nhip, sbd, tenCon, lop } = p
  const pm = v.pm, kiem=hoc2?.kiemTraCaNhan
  const tq = tongQuan.v
  const nowMs = tq?.serverNow ?? pm?.serverNow ?? Date.now()
  const [moDuoi, setMoDuoi] = useState(false)
  const [veDuoi, setVeDuoi] = useState(false)
  const dich = useRef<{ id: IdPhan; han: number } | null>(null)
  const { napHoSo, hoSo } = p

  useEffect(() => { void napBacCon() }, [])
  // Mở phần dưới: khối mã + hai lệnh hồ sơ CÙNG lúc (song song), một lần.
  useEffect(() => {
    if (!moDuoi) return
    void napPhanDuoi().catch(() => {})
    if (!hoSo.daGoi) napHoSo()
  }, [moDuoi, hoSo.daGoi, napHoSo])
  // Nạp khi SẮP cuộn tới: đầu phần Thái độ cách khung nhìn ≤ 600 px. Trình duyệt không có IntersectionObserver ⇒ nạp luôn.
  useEffect(() => {
    if (moDuoi || !pm) return
    const el = document.getElementById(idPhan('thai-do'))
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setMoDuoi(true); return }
    const io = new IntersectionObserver((ds) => { if (ds.some((d) => d.isIntersecting)) setMoDuoi(true) }, { rootMargin: '600px 0px 600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [moDuoi, pm])

  const diToi = useCallback((id: IdPhan, muot = true) => {
    if (PHAN_DUOI.has(id)) setMoDuoi(true)
    dich.current = { id, han: Date.now() + 2500 }
    cuonToiPhan(id, muot)
  }, [])
  // Phần dưới vẽ xong (chiều cao đổi) ⇒ cuộn lại đúng phần đang nhắm (nếu vừa bấm mục).
  useEffect(() => {
    const d = dich.current
    if (veDuoi && d && Date.now() < d.han) cuonToiPhan(d.id, false)
  }, [veDuoi])
  const { denPhan, daDenPhan } = p
  useEffect(() => {
    if (!denPhan || !pm) return
    diToi(denPhan.id, false)
    daDenPhan()
  }, [denPhan, pm, diToi, daDenPhan])

  // Phần đang đọc: phần cuối cùng có đầu đã qua vạch 140 px dưới mép trên (chừa thanh mục dính); cuộn chạm đáy ⇒ phần cuối. Một lần mỗi khung hình.
  const { onPhanHien } = p
  useEffect(() => {
    if (!pm) return
    let cho = 0
    const tinh = () => {
      cho = 0
      let hien: IdPhan = 'hom-nay'
      let cuoi: IdPhan = 'hom-nay'
      for (const x of PHAN) {
        const el = document.getElementById(idPhan(x.id))
        if (!el) continue
        cuoi = x.id
        if (el.getBoundingClientRect().top <= 140) hien = x.id
      }
      const day = document.documentElement
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= day.scrollHeight - 2) hien = cuoi
      onPhanHien(hien)
    }
    const khiCuon = () => { if (!cho) cho = requestAnimationFrame(tinh) }
    window.addEventListener('scroll', khiCuon, { passive: true })
    tinh()
    return () => { window.removeEventListener('scroll', khiCuon); if (cho) cancelAnimationFrame(cho) }
  }, [pm, veDuoi, onPhanHien])

  const ten = tenGoi(pm?.hoTen || tenCon)
  const moc = tq?.moc ?? nhip.k?.tu ?? null
  const coPhan = phanCo(pm, tq)
  return (
    <div className="tvc" data-vung="man-chinh-ph">
      <div className="tvc-chao">
        <small>Chào anh/chị,</small>
        <h1>Hôm nay của {ten}</h1>
        {pm?.serverNow ? <p>Cập nhật {gioVn(pm.serverNow)} · {ngayDayDuVn(pm.serverNow)}{moc ? ` · mọi số đo từ ${ngayChuoiNgan(moc)}` : ''}</p> : null}
      </div>
      <MucLuc coPhan={coPhan} hien={p.phanHien} diToi={diToi} />
      {!pm ? (
        v.trangThai === 'loi' ? (
          <div className="tvc-luoi"><LoiThe chu={v.chuLoi} thuLai={v.thuLai} nut="Thử lại" /></div>
        ) : (
          <div className="tvc-luoi" role="status" aria-live="polite" data-vung="dang-tai">
            <span className="ph3-an">Đang tải dữ liệu của con…</span>
            <div className="tvc-the tvc-cho tt-xuong" data-hinh="hom-nay" aria-hidden="true" />
            <div className="tvc-the tvc-cho tt-xuong" aria-hidden="true" />
          </div>
        )
      ) : (
        <div className="tvc-luoi">
          <div className="tvc-nhom-trai">
            {/* Ngày một kiểm tra mới vẫn giữ kế hoạch 12 câu; lịch cũ chỉ kiểm tra. */}
            {(!kiem?.homNay || !!kiem.baiNgayToiThieu) && <HomNay pm={pm} hoc2={hoc2} tq={tq} k={nhip.k} nowMs={nowMs} />}
            {kiem && kiem.trangThai !== 'cho_nguon' && <Suspense fallback={null}><TheKiemTraCon kt={kiem} /></Suspense>}
            <NhipHoc pm={pm} tq={tq} nhip={nhip} />
          </div>
          <div className="tvc-nhom-phai">
            {p.canhBao.map((cb) => <CanhBao key={cb.id} cb={cb} nay={nowMs} onDaXem={p.onDaXem} />)}
            <CanNhac tai={tongQuan} pm={pm} nowMs={nowMs} />
            <LoiThay loiThay={p.loiThay} thuLai={p.thuLaiLoiThay} />
          </div>
          {moDuoi ? (
            <Suspense fallback={<KhungChoDuoi coPhan={coPhan} />}>
              <PhanDuoi pm={pm} tq={tq} hoc2={hoc2} k={nhip.k} hoSo={hoSo} napHoSo={napHoSo} sbd={sbd} tenCon={pm.hoTen || tenCon} lop={lop} coPhan={coPhan} onDaVe={setVeDuoi} />
            </Suspense>
          ) : (
            <KhungChoDuoi coPhan={coPhan} />
          )}
        </div>
      )}
      {pm && <p className="tvc-chan">Mọi con số trên trang là số app đo được, không ước đoán. Số có dấu ≈ là số giây ước tính.</p>}
    </div>
  )
}

/** Thanh mục dính (điện thoại dọc): cuộn ngang, mục đang đọc sáng; bấm ⇒ cuộn tới phần (không đổi tuyến). */
function MucLuc({ coPhan, hien, diToi }: { coPhan: IdPhan[]; hien: IdPhan; diToi: (id: IdPhan) => void }) {
  const thanh = useRef<HTMLElement>(null)
  useEffect(() => {
    const t = thanh.current
    const a = t?.querySelector<HTMLElement>('[aria-current]')
    if (t && a && typeof t.scrollTo === 'function') t.scrollTo({ left: Math.max(0, a.offsetLeft - 16), behavior: giamChuyenDong() ? 'auto' : 'smooth' })
  }, [hien])
  return (
    <nav className="tvc-muc-luc" aria-label="Đi tới phần" ref={thanh}>
      {PHAN.filter((x) => coPhan.includes(x.id)).map((x) => (
        <a key={x.id} href={`#${idPhan(x.id)}`} className="tt-nhan" aria-current={hien === x.id ? 'true' : undefined} onClick={(e) => { e.preventDefault(); diToi(x.id) }}>
          {x.ten}
        </a>
      ))}
    </nav>
  )
}

const COT_CHO: Partial<Record<IdPhan, string>> = { 'thai-do': '12', 'cau-sai': '6', 'thoi-gian': '6', 'kiem-tra': '7', btvn: '5', 'buoi-hoc': '5', 'lich-su': '7' }
/** Khung chờ đúng chỗ của phần dưới (giữ id để bấm mục cuộn tới được ngay; số về thì thay bằng phần thật). */
function KhungChoDuoi({ coPhan }: { coPhan: IdPhan[] }) {
  return (
    <>
      {PHAN.filter((x) => PHAN_DUOI.has(x.id) && coPhan.includes(x.id)).map((x) => (
        <section key={x.id} id={idPhan(x.id)} data-phan={x.id} className="tvc-the tvc-cho tt-xuong" data-cot={COT_CHO[x.id]} aria-label={`${x.ten} — đang tải`} data-vung="phan-cho" />
      ))}
    </>
  )
}

export function DauThe({ id, bt, mau, tieuDe, phu, chip }: { id: string; bt: ReactNode; mau: Mau; tieuDe: string; phu?: ReactNode; chip?: ReactNode }) {
  return (
    <div className="tvc-dau">
      <span className="ph3-o-bt" data-mau={mau} aria-hidden="true">{bt}</span>
      <div>
        <h2 id={id}>{tieuDe}</h2>
        {phu && <span>{phu}</span>}
      </div>
      {chip}
    </div>
  )
}

// ---------------------------------------------------------------- 1 · Hôm nay ----------------------------------------------------------------
export function HomNay({ pm, hoc2, tq, k, nowMs }: { pm: PhMoi; hoc2: Hoc2 | null; tq: ConTongQuan | null; k: KetQuaNhipHocApp | null; nowMs: number }) {
  const so = soHomNay(pm, hoc2, tq)
  const nTq = homNayTq(tq)
  const ti = so.tong ? Math.max(0, Math.min(1, so.daLam / so.tong)) : null
  const buoi = buoiHomNay(pm, nowMs)
  const lan = lanHocHomNay(pm)
  const hq = pm.tongQuan?.soVoiHomQua ?? null
  const d = tq?.dem.homNay ?? null
  const kSanh = k ? nhipTheoSanh(k, nTq ? { muc: nTq.canLam, daLam: nTq.daLam } : null) : null
  const ghi: string[] = []
  for (const g of hoc2?.goi7 ?? []) ghi.push(g.nguonDayDu === false ? `${g.ten}: bài chưa đủ câu, chưa tính hoàn thành.` : `Bài mới 7 ngày · ${g.ten}: đã gặp ${g.daGap}/${g.tong} câu · còn ${g.con} câu · hạn nộp ${g.han.slice(8, 10)}/${g.han.slice(5, 7)}.`)
  // Hành trình: mức tối thiểu trùng số câu đã ghi to ⇒ không nhắc lại (một số nói một lần).
  const ht = hoc2?.hanhTrinh
  const hanhTrinh = ht ? `Hành trình của con: tầng ${['Nền', 'Hiểu', 'Vận dụng', 'Tổng hợp'][ht.tang - 1]}${so.tong === null || ht.toiThieu === so.tong ? '.' : ` · mức tối thiểu ${ht.toiThieu} câu.`}` : ''
  return (
    <section className="tvc-the tvc-hom-nay" id={idPhan('hom-nay')} data-phan="hom-nay" aria-labelledby="tvc-hn" data-vung="anh-hung">
      <div className="tvc-hn-dau">
        <b id="tvc-hn">Hôm nay · {thuNgayVn(nowMs)}</b>
        {buoi && (
          <span className="ph3-chip" data-mau={buoi.kieu === 'co-mat' ? 'xl' : buoi.kieu === 'vang' ? 'ho' : 'xd'} data-vung="co-mat-hom-nay">
            {buoi.kieu === 'co-mat' ? <><BtTich co={15} day={2.6} />Có mặt buổi học · {buoi.luc}</> : buoi.kieu === 'vang' ? 'Vắng buổi học hôm nay' : 'Buổi học hôm nay: con chưa điểm danh'}
          </span>
        )}
      </div>
      <div className="tvc-hn-than">
        <div>
          {so.tong === null && so.daLam === 0 ? (
            <h2 className="tvc-hn-chua">Hôm nay con chưa làm câu nào</h2>
          ) : (
            <>
              <p className="tvc-hn-so" data-vung="so-cau-hom-nay"><b>{so.daLam}</b><span>{so.tong !== null ? `/${so.xap}${so.tong} câu` : ' câu'}</span></p>
              <p className="tvc-hn-nhan">{so.tong !== null ? `Con đã làm / ${so.dich}` : 'Con đã làm hôm nay'}</p>
            </>
          )}
          {ti !== null && <div className="tvc-thanh" role="img" aria-label={`Đã làm ${so.daLam} trên ${so.tong} câu`}><i style={{ width: `${ti * 100}%` }} /></div>}
          {so.tong !== null && (
            <p className="tvc-hn-con">
              {so.daLam >= so.tong ? <>Con đã <b>{so.du.replace(/ hôm nay$| của ngày$/, '')}</b>{/ hôm nay$/.test(so.du) ? ' hôm nay' : ' của ngày'}.</> : so.daLam === 0 && (nTq ? nTq.soCau === 0 : true) ? <>Con <b>chưa làm câu nào</b> hôm nay.</> : <>Còn <b>{so.xap}{so.tong - so.daLam} câu</b> nữa là {so.du}.</>}
            </p>
          )}
          {(ghi.length > 0 || hanhTrinh) && (
            <div className="tvc-hn-ghi">
              {ghi.map((g) => <p key={g}>{g}</p>)}
              {hanhTrinh && <p data-vung="hanh-trinh">{hanhTrinh}</p>}
            </div>
          )}
          {(lan.ds.length > 0 || hq) && (
            <ul className="tvc-hn-lan" aria-label="Các lần con học hôm nay" data-vung="lan-hoc-hom-nay">
              {lan.them > 0 && <li><span>Sớm hơn</span><b>{lan.them} lần học</b><span /></li>}
              {lan.ds.map((l) => <li key={l.khoang}><span>{l.khoang}</span><b>{l.cau}</b><span>{l.phut}</span></li>)}
              {hq && (
                <li className="tvc-hn-qua">
                  <span>Hôm qua</span>
                  <b>{hq.soCau} câu{hq.tiLeDung !== null ? ` · đúng ${Math.round(hq.tiLeDung * 100)}%` : ''}</b>
                  <span>{hq.phutHoc !== null ? `${Math.round(hq.phutHoc)} phút` : ''}</span>
                </li>
              )}
            </ul>
          )}
        </div>
        <div>
          {d && (
            <dl className="tvc-ba-so" data-vung="dung-sai-hom-nay">
              <div><dt><i data-mau="xl" aria-hidden="true" />Câu đúng</dt><dd>{d.dung}</dd></div>
              <div><dt><i data-mau="ho" aria-hidden="true" />Câu sai</dt><dd>{d.sai}</dd></div>
              <div><dt>Trung bình</dt><dd>{d.giayTb === null ? <small>chưa đo giờ</small> : <>{Math.round(d.giayTb)} <small>giây/câu</small></>}</dd></div>
            </dl>
          )}
          {d && d.boTrong > 0 && <p className="tvc-phu">Bỏ trống: {d.boTrong} câu</p>}
          {kSanh && (
            <Suspense fallback={<div className="tvc-bac-cho tt-xuong" aria-hidden="true" />}>
              <BacHomNay k={kSanh} />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- 2 · Cần nhắc con ----------------------------------------------------------------
export function CanNhac({ tai, pm, nowMs }: { tai: TaiTq; pm: PhMoi; nowMs: number }) {
  const ds = dongCanNhac(tai.v, pm, nowMs)
  if (!tai.v && !tai.daTai) return <div className="tvc-the tvc-cho tt-xuong" data-thu="2" data-vung="goi-y-dang-tai" aria-hidden="true" />
  // Máy chủ cũ chưa có `/ph/con-tong-quan` và không có lịch ôn / bài tập đang chạy ⇒ không có gì để nói ⇒ khối vắng (không câu "chưa có gì" giả).
  if (!tai.v && !tai.chuLoi && ds.length === 0) return null
  return (
    <section className="tvc-the" aria-labelledby="tvc-nhac" data-vung="goi-y-nhac" data-thu="2">
      <DauThe id="tvc-nhac" bt={<BtChuong co={20} />} mau="hp" tieuDe="Cần nhắc con" phu={ds.length > 0 ? `${ds.length} điều, xếp theo mức cần để ý` : undefined} />
      {tai.chuLoi && <LoiThe chu={`Chưa tải được số liệu đúng, sai của con. ${tai.chuLoi}`} thuLai={tai.thuLai} nut="Thử lại" />}
      {ds.length > 0 ? (
        <ul className="tvc-nhac">
          {ds.map((d) => (
            <li key={d.khoa} data-ma={d.khoa}>
              <span className="ph3-o-bt" data-mau={d.mau} aria-hidden="true"><d.bt co={18} /></span>
              <p><DamSo chu={d.chu} /></p>
            </li>
          ))}
        </ul>
      ) : (
        !tai.chuLoi && <p className="tvc-phu">Hôm nay chưa có điều gì cần nhắc con.</p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- 3 · Nhịp học 14 ngày ----------------------------------------------------------------
const CHU_GIAI: { loai: LoaiO; ten: string }[] = [
  { loai: 'du', ten: 'Đủ mức' }, { loai: 'it', ten: 'Thiếu ít' }, { loai: 'nhieu', ten: 'Thiếu nhiều' }, { loai: 'khong', ten: 'Không làm' }, { loai: 'nay', ten: 'Hôm nay' },
]

export function NhipHoc({ pm, tq, nhip }: { pm: PhMoi; tq: ConTongQuan | null; nhip: TaiNhip }) {
  const nTq = homNayTq(tq)
  const k = nhip.k ? nhipTheoSanh(nhip.k, nTq ? { muc: nTq.canLam, daLam: nTq.daLam } : null) : null
  if (!k) {
    if (nhip.dangTai) return <section id={idPhan('nhip')} data-phan="nhip" className="tvc-the tvc-cho tt-xuong" data-thu="3" aria-label="Đang tải nhịp học của con" />
    return (
      <section id={idPhan('nhip')} data-phan="nhip" className="tvc-the" data-thu="3" aria-labelledby="tvc-nhip" data-vung="nhip-con-loi">
        <DauThe id="tvc-nhip" bt={<BtLich co={20} />} mau="xd" tieuDe="Nhịp học" />
        <LoiThe chu={`Chưa tải được nhịp học của con. ${nhip.loi}`} thuLai={nhip.thuLai} nut="Tải lại nhịp học" />
      </section>
    )
  }
  const ngay = k.ngay.slice(-14)
  const dau = ngay[0]?.ngay ?? k.tu
  const muc = k.homNayMuc?.muc ?? ngay[ngay.length - 1]?.muc ?? null
  const coTuTruoc = k.tu < dau
  return (
    <section id={idPhan('nhip')} data-phan="nhip" className="tvc-the" data-thu="3" aria-labelledby="tvc-nhip" data-vung="nhip-hoc-con">
      <DauThe id="tvc-nhip" bt={<BtLich co={20} />} mau="xd" tieuDe={`Nhịp học ${ngay.length} ngày`}
        phu={`Từ ${thuTuChuoiNgay(dau)} ${ngayChuoiNgan(dau)}${muc !== null ? ` · mức tối thiểu hôm nay ${muc} câu` : ''}`}
        chip={<span className="ph3-chip" data-mau={MAU_NHOM[k.nhom]} data-vung="nhom-nhip">{TEN_NHOM_NHIP[k.nhom]}</span>} />
      {nhip.loi && <LoiThe chu={`Nhịp học đang hiển thị bản đã tải. ${nhip.loi}`} thuLai={nhip.thuLai} nut="Tải lại nhịp học" />}
      <ol className="tvc-dai-ngay" aria-label="Số câu con làm mỗi ngày">
        {ngay.map((x) => {
          const o = oNgay(x, k.homNay)
          return (
            <li key={x.ngay} className="tvc-o-ngay" data-t={o.loai} title={o.chu}>
              <small aria-hidden="true">{o.nhan}</small>
              <b aria-hidden="true">{x.lam}</b>
              <span className="ph3-an">{o.chu}</span>
            </li>
          )
        })}
      </ol>
      <div className="tvc-chu-giai" aria-hidden="true">
        {CHU_GIAI.map((c) => <span key={c.loai}><i data-t={c.loai} />{c.ten}</span>)}
      </div>
      <dl className="tvc-luoi-so" data-vung="so-nhip">
        <div><dt>Ngày đủ mức{coTuTruoc ? ` từ ${ngayChuoiNgan(k.tu)}` : ''}</dt><dd>{k.soNgayDu}/{k.soNgayQua} <small>ngày{k.phanTram !== null ? ` (${k.phanTram}%)` : ''}</small></dd></div>
        <div><dt>Chuỗi đủ mức</dt><dd>{k.chuoiDuGanNhat} <small>ngày liền</small></dd></div>
        <div><dt>Câu còn thiếu</dt><dd>{k.tongCauThieu} <small>câu so với mức</small></dd></div>
      </dl>
      <hr className="tvc-vach" />
      <Suspense fallback={<div className="tvc-bac-cho tvc-bac-cho--lon tt-xuong" aria-hidden="true" />}>
        <BacNhip k={k} />
      </Suspense>
      {typeof k.doTinCay === 'number' && (
        <div className="tvc-hop tvc-tin-cay-hop">
          <div className="tvc-tin-cay"><span>Độ tin cậy của nhóm <b>{Math.min(99, k.doTinCay)}%</b></span><span className="tvc-thanh tvc-thanh--mong" aria-hidden="true"><i style={{ width: `${Math.min(99, k.doTinCay)}%` }} /></span></div>
          {k.canThem && <span className="tvc-phu">Còn tạm: {chuCanThem(k.canThem).replace(/^Cần/, 'cần')}</span>}
        </div>
      )}
      {pm.doCham ? (
        <div className="tvc-hop tvc-hang" data-vung="hang-cham">
          <span>Độ chăm hôm nay: con đang <b>hạng {pm.doCham.hang} trong {pm.doCham.siSo} bạn</b> của lớp.</span>
          <span className="tvc-phu">Xếp theo số câu đã làm hôm nay.</span>
        </div>
      ) : (
        nTq && nTq.daLam === 0 && <p className="tvc-phu" data-vung="hang-cham">Hôm nay con chưa làm câu nào nên chưa có hạng chăm trong lớp.</p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- 4 · Nhận xét của thầy · cảnh báo ----------------------------------------------------------------
export function LoiThay({ loiThay, thuLai }: { loiThay: { ds: NhanXetCa[] | null; chuLoi: string }; thuLai: () => void }) {
  if (loiThay.chuLoi && !loiThay.ds)
    return <section className="tvc-the tvc-loi-thay" data-thu="4" aria-label="Nhận xét của thầy"><LoiThe chu={loiThay.chuLoi} thuLai={thuLai} nut="Thử lại nhận xét" /></section>
  if (!loiThay.ds) return null
  const moi = loiThay.ds[0]
  const ngay = moi ? moi.nopLuc || moi.capNhatLuc : ''
  return (
    <section className="tvc-the tvc-loi-thay" data-thu="4" aria-labelledby="tvc-thay" data-vung="loi-thay-moi">
      <DauThe id="tvc-thay" bt={<BtTinNhan co={20} />} mau="hp" tieuDe="Nhận xét của thầy" phu={moi ? `Thầy Đỗ Đại Học · sau ${moi.tenCa}${ngay ? ` · ${thuNgayVn(ngay)}` : ''}` : undefined} />
      {loiThay.chuLoi && <LoiThe chu={`Nhận xét đang hiển thị bản đã tải. ${loiThay.chuLoi}`} thuLai={thuLai} nut="Thử lại nhận xét" />}
      {moi ? (
        <>
          <blockquote>{chuThay(moi.noiDung)}</blockquote>
          <a className="tvc-lien-ket tt-nhan" href="#loi-thay">Xem tất cả {loiThay.ds.length} nhận xét của thầy<BtPhai co={18} day={2.4} /></a>
        </>
      ) : (
        <p className="tvc-phu">Thầy chưa gửi nhận xét nào cho con.</p>
      )}
    </section>
  )
}

export function CanhBao({ cb, nay, onDaXem }: { cb: CanhBaoThay; nay: number; onDaXem: (id: string) => void }) {
  return (
    <section className="tvc-the tvc-canh-bao" data-thu="2" aria-label="Cảnh báo của thầy" data-vung="canh-bao-thay">
      <div className="tvc-canh-bao-dau"><BtChuong co={18} />Cảnh báo của thầy · {chuGuiLuc(cb)}</div>
      <p><b>{tieuDeCanhBao(cb, 'phuhuynh')}</b></p>
      {cb.loi && <p>{chuThay(cb.loi)}</p>}
      <p>{chuHanNop(cb, nay)}</p>
      <button type="button" className="ph3-nut-vien tt-nhan" onClick={() => onDaXem(cb.id)}>Đã xem cảnh báo</button>
    </section>
  )
}

