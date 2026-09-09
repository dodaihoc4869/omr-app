// BÁO CÁO HỌC TẬP — trang phụ huynh mở từ link trong tin nhắn Zalo.
//
// Không phải một màn của app quản lý: không thanh menu, không hộp thư, không mã
// bí mật, không đọc IndexedDB của thầy. Chỉ đúng một việc — lấy báo cáo theo mã
// trong link rồi vẽ ra.
//
// Màu lấy từ nhóm `--p-*` trong tokens.css, nhóm đó CỐ Ý không định nghĩa lại ở
// khối nền tối: báo cáo rời máy thầy, mở trên máy lạ, nên luôn phải là giấy
// trắng mực đen.
//
// Biểu đồ vẽ tay bằng SVG, không thêm thư viện: nhẹ, mở nhanh trên 4G, và không
// phá nguyên tắc chốt công nghệ.
//
// Hoạt ảnh chỉ động vào `transform`, `opacity`, `stroke-dashoffset` và chiều cao
// bằng grid — không thứ nào bắt trình duyệt tính lại bố cục, nên mượt trên máy
// yếu. Máy bật "giảm chuyển động" thì hiện thẳng trạng thái cuối.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { classify } from '../engine/score'
import { chanSoCau, docLinkPhieu } from '../lib/phieu-link'
import { layPhieu } from '../lib/exam-api'
import { loadScriptUrlHoacMacDinh } from '../lib/exam-db'
import { napDong } from '../lib/nap-manh'
import KhungXemPhieu from '../components/KhungXemPhieu'
import { BAN_PHIEU_DOC_DUOC, type PhieuDayDu } from '../lib/phieu-du-lieu'
import PhieuV3 from './PhieuV3'
import TheCauChiTiet from '../components/TheCauChiTiet'
import NutTaiBaiTap from '../components/KhoiBaiLuyen'
import type { ThongTinPhieu } from '../lib/html-phieu'
import type { CauLuyen } from '../lib/bai-tap-pdf'
import { TEN_MUC_DO, TEN_PHAN } from '../lib/phan-tich-lam-bai'
import { ChemText } from '../lib/chem-format'

// ---------------------------------------------------------------- kiểu chữ số
function soVN(x: number, soLe = 2): string {
  return x.toFixed(soLe).replace('.', ',')
}
function ngayVN(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function ngayNgan(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
function mauDiem(diem: number): string {
  if (diem >= 8) return 'var(--p-xanh)'
  if (diem >= 6.5) return 'var(--p-tim)'
  if (diem >= 5) return 'var(--p-cam)'
  return 'var(--p-do)'
}

import { CSS_BAO_CAO as CSS } from '../lib/css-bao-cao'

// ------------------------------------------------------------------ tiện ích
/** Hiện dần khi cuộn tới. Dùng IntersectionObserver để không phải nghe sự kiện
 * scroll (nghe scroll là giật trên máy yếu). Máy không có API này thì hiện luôn. */
function useHienKhiToi<T extends HTMLElement>(tat: boolean): [React.RefObject<T | null>, boolean] {
  const o = useRef<T | null>(null)
  const [ra, setRa] = useState(tat)
  useEffect(() => {
    if (tat) return setRa(true)
    const el = o.current
    if (!el || typeof IntersectionObserver !== 'function') return setRa(true)
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setRa(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [tat])
  return [o, ra]
}

function Khoi({
  tieu,
  ten,
  ghi,
  noi,
  tat,
  children,
}: {
  tieu?: string
  ten?: string
  ghi?: string
  noi?: boolean
  tat: boolean
  children: React.ReactNode
}) {
  const [o, ra] = useHienKhiToi<HTMLElement>(tat)
  return (
    <section ref={o} className={`bc-the${noi ? ' noi' : ''} bc-vao${ra ? ' ra' : ''}`}>
      {tieu && <div className="bc-tieu">{tieu}</div>}
      {ten && <div className="bc-tieu-lon">{ten}</div>}
      {ghi && <div className="bc-ghi">{ghi}</div>}
      {children}
    </section>
  )
}

function Thanh({ tiLe, mau, hoan, tat }: { tiLe: number; mau: string; hoan: number; tat: boolean }) {
  const [o, ra] = useHienKhiToi<HTMLDivElement>(tat)
  return (
    <div className="bc-ray" ref={o}>
      <div
        className="bc-day"
        style={{ width: ra ? `${Math.max(0, Math.min(100, tiLe * 100))}%` : 0, background: mau, transitionDelay: tat ? '0ms' : `${hoan}ms` }}
      />
    </div>
  )
}

/** Ô số nhỏ. Giá trị null hiện gạch ngang, KHÔNG hiện số 0 giả. */
function OSo({ so, ten }: { so: string | number | null; ten: string }) {
  return (
    <div className="bc-o">
      <div className="bc-o-so">{so === null || so === '' ? '—' : so}</div>
      <div className="bc-o-ten">{ten}</div>
    </div>
  )
}

// ------------------------------------------------------------------ biểu đồ
/** ĐƯỜNG ĐIỂM QUA CÁC CA. Vẽ tay: đường + vùng tô nhạt + chấm, chấm cuối to hơn.
 * Dưới 2 ca thì không vẽ — một điểm không thành xu hướng. */
/** `maCaRieng` = mã những ca ĐỀ RIÊNG TỪNG EM. Chấm mốc của chúng vẽ RỖNG RUỘT
 * kèm chú thích, vì 30% đề là câu em đã gặp nên điểm nhích lên một phần vì gặp
 * lại. Vẽ đặc như ca thường là để phụ huynh đọc ra một cú tiến bộ mạnh hơn sự
 * thật (DE-RIENG-TUNG-EM mục 2, hệ quả hai). */
function DuongTienBo({ ds, tat, maCaRieng }: { ds: { ngay: string; tong: number; maCa?: string }[]; tat: boolean; maCaRieng?: Set<string> }) {
  const [o, ra] = useHienKhiToi<HTMLDivElement>(tat)
  const W = 300
  const H = 108
  const L = 26
  const P = 10
  if (ds.length < 2) return null
  const n = ds.length
  const x = (i: number) => L + ((W - L - P) * i) / (n - 1)
  const y = (v: number) => P + (H - P * 2 - 12) * (1 - Math.max(0, Math.min(10, v)) / 10)
  const duong = ds.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.tong).toFixed(1)}`).join(' ')
  const vung = `${duong} L${x(n - 1).toFixed(1)},${H - 12} L${x(0).toFixed(1)},${H - 12} Z`
  const cuoi = ds[n - 1]
  return (
    <div ref={o} style={{ marginTop: 12 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Điểm qua các ca">
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={L} y1={y(v)} x2={W - P} y2={y(v)} stroke="var(--p-vien)" strokeWidth="1" />
            <text x={L - 6} y={y(v) + 3.5} textAnchor="end" fontSize="9" fill="var(--p-mo)">
              {v}
            </text>
          </g>
        ))}
        <path d={vung} fill="var(--p-tim)" opacity={ra ? 0.1 : 0} style={{ transition: tat ? 'none' : 'opacity .8s ease .3s' }} />
        <path
          d={duong}
          fill="none"
          stroke="var(--p-tim)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={ra ? 0 : 1}
          style={{ transition: tat ? 'none' : 'stroke-dashoffset 1.15s cubic-bezier(.22,.9,.28,1)' }}
        />
        {ds.map((d, i) => {
          const rieng = !!d.maCa && maCaRieng?.has(d.maCa) === true
          return (
            <circle
              key={i}
              cx={x(i)}
              cy={y(d.tong)}
              r={i === n - 1 ? 4.6 : 3}
              fill={rieng ? 'none' : i === n - 1 ? mauDiem(cuoi.tong) : 'var(--p-giay)'}
              stroke={rieng ? mauDiem(d.tong) : i === n - 1 ? 'var(--p-giay)' : 'var(--p-tim)'}
              strokeWidth="2"
              opacity={ra ? 1 : 0}
              style={{ transition: tat ? 'none' : `opacity .35s ease ${400 + i * 70}ms` }}
            >
              {rieng && <title>{`${ngayNgan(d.ngay)}: ${soVN(d.tong)} điểm (bài có câu hỏi lại)`}</title>}
            </circle>
          )
        })}
        {ds.map((d, i) =>
          i === 0 || i === n - 1 || n <= 5 ? (
            <text key={`t${i}`} x={x(i)} y={H - 1} textAnchor="middle" fontSize="9" fill="var(--p-mo)">
              {ngayNgan(d.ngay)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  )
}

/** PHÂN BỐ ĐIỂM CẢ CA, cột của em tô đậm. Chia 10 khoảng 1 điểm. */
function PhanBoLop({ diemLop, cuaEm, tat }: { diemLop: number[]; cuaEm: number; tat: boolean }) {
  const [o, ra] = useHienKhiToi<HTMLDivElement>(tat)
  if (diemLop.length < 5) return null
  const o10 = Array.from({ length: 10 }, () => 0)
  for (const d of diemLop) o10[Math.max(0, Math.min(9, Math.floor(d)))]++
  const cao = Math.max(...o10)
  const oEm = Math.max(0, Math.min(9, Math.floor(cuaEm)))
  const duoi = diemLop.filter((d) => d < cuaEm).length
  const phanTram = Math.round((duoi / diemLop.length) * 100)
  return (
    <div ref={o} style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 96 }}>
        {o10.map((c, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            <div
              style={{
                height: ra ? `${cao ? Math.max(c ? 6 : 2, (c / cao) * 100) : 2}%` : '2%',
                background: i === oEm ? mauDiem(cuaEm) : 'var(--p-chim)',
                borderRadius: '6px 6px 3px 3px',
                transition: tat ? 'none' : `height .8s cubic-bezier(.22,.9,.28,1) ${i * 45}ms`,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
        {o10.map((_, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: i === oEm ? mauDiem(cuaEm) : 'var(--p-mo)', fontWeight: i === oEm ? 700 : 400 }}>
            {i}
          </div>
        ))}
      </div>
      <div className="bc-ghi" style={{ marginTop: 10 }}>
        Trong {diemLop.length} bạn đã nộp, em đứng trên {duoi} bạn ({phanTram}%). Cột đậm là khoảng điểm của em.
      </div>
    </div>
  )
}

/** DẢI THỜI GIAN TỪNG CÂU: mỗi câu một cột, cao theo số giây, đỏ là câu sai. */
import { DaiThoiGian, KhoiViPham } from '../components/KhoiBaoCaoChung'

export default function PhieuScreen({ duCoSan, laCuaEm = false, xinLink }: { duCoSan?: PhieuDayDu; laCuaEm?: boolean; xinLink?: () => Promise<string> } = {}) {
  const [du, setDu] = useState<PhieuDayDu | null | undefined>(duCoSan ?? undefined)
  // Link phiếu bài tập: trang này chỉ việc hiện trọn tài liệu HTML đã dựng.
  const [phieuBt, setPhieuBt] = useState('')
  const [loi, setLoi] = useState('')
  const daChay = useRef(false)

  const tat = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  const nap = useCallback(async () => {
    const { ma, soCau: soCauLink, cheDo } = docLinkPhieu(location.hash)
    if (!ma) {
      setLoi('Link không đúng hoặc bị cắt ngắn khi chuyển tiếp.')
      setDu(null)
      return
    }
    try {
      const url = await loadScriptUrlHoacMacDinh()
      if (!url) throw new Error('Chưa cấu hình được máy chủ')
      const p = (await layPhieu(url, ma)) as PhieuDayDu & { loai?: string }
      // Cùng một lệnh đọc công khai phục vụ hai loại gói: BÁO CÁO gửi phụ huynh
      // và PHIẾU BÀI TẬP. Phân biệt bằng đúng một trường `loai` — thêm lệnh máy
      // chủ thứ hai là thêm một cửa đọc công khai nữa, không đáng.
      if (p && p.loai === 'baitap') {
        const g = p as unknown as { tt: ThongTinPhieu; cau: CauLuyen[] }
        const { dungPhieu } = await napDong(() => import('../lib/html-phieu'))
        // SỐ CÂU LẤY TỪ LINK. Máy chủ cất một bản đủ 40 câu; phụ huynh gửi cho
        // con link kèm `~<số câu>` thì em chỉ nhận bấy nhiêu câu ĐẦU (đã xếp dễ
        // lên khó). Link không ghi số thì lấy trọn như trước.
        const cau = soCauLink ? g.cau.slice(0, chanSoCau(soCauLink)) : g.cau
        const tt = { ...g.tt, ngay: new Date(g.tt.ngay) }
        if (soCauLink && Array.isArray(tt.oBia)) tt.oBia = tt.oBia.map((o) => (o.nhan === 'Số câu' ? { ...o, gia: `${cau.length} câu` } : o))
        // HAI LINK, MỘT PHIẾU: `~20d` là ĐỀ cho em tự làm (không một đáp án nào
        // trong trang), `~20g` là LỜI GIẢI để em dò. Link cũ không ghi chữ
        // cuối thì mở như trước: phiếu ôn gập sẵn lời giải.
        const anGiai = cheDo === 'de'
        if (anGiai) tt.nhanBia = 'Đề luyện theo đúng chỗ em mất điểm'
        else if (soCauLink) tt.nhanBia = 'Lời giải bài luyện của em'
        // NỘP ĐƯỢC (NOP-PHIEU-KHAC-PHUC). Bật ở CẢ bản chỉ đề (bỏ điều kiện
        // `!anGiai` ngày 09/09 — xem ghi chú dài ở `dungPhieu`): bản chỉ đề vẫn
        // mang `dapAn` của từng câu, chỉ giấu bằng CSS, nên chấm được. Trước
        // đây link ĐỀ — đúng cái em nhận để LÀM — là link duy nhất em không bấm
        // chọn được. Cần đủ mã phiếu và SBD; thiếu thứ nào thì phiếu mở ra chỉ
        // đọc như cũ.
        const sbdEm = String((g as { tt?: { oBia?: { nhan: string; gia: string }[] } }).tt?.oBia?.find((o) => o.nhan === 'SBD')?.gia ?? '').trim()
        const nop = ma && sbdEm ? { ma, sbd: sbdEm, url } : null
        setPhieuBt(dungPhieu(tt, cau, { anGiai, nop }))
        return
      }
      // ĐỌC ĐƯỢC CẢ HAI BẢN. Bản 2 là bố cục 10 mục cũ, phụ huynh đã cầm link
      // rồi — mở ra phải ra đúng cái họ từng thấy, không phải bố cục mới với
      // mấy ô trống chỗ dữ liệu bản cũ không có. Bản lạ vẫn từ chối thay vì vẽ
      // thiếu mục.
      if (!p || !(BAN_PHIEU_DOC_DUOC as readonly number[]).includes(Number(p.v))) {
        throw new Error('Báo cáo này thuộc phiên bản khác, Thầy cần gửi lại link mới.')
      }
      setDu(p)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không mở được báo cáo')
      setDu(null)
    }
  }, [])

  useEffect(() => {
    if (duCoSan) {
      setDu(duCoSan)
      return
    }
    if (daChay.current) return
    daChay.current = true
    void nap()
  }, [nap, duCoSan])

  useEffect(() => {
    if (du) document.title = `Báo cáo học tập ${du.hoTen || du.sbd}`
  }, [du])

  const [oDau, raDau] = useHienKhiToi<HTMLDivElement>(tat)

  if (phieuBt) {
    return <iframe title="Phiếu bài tập" srcDoc={phieuBt} style={{ display: 'block', width: '100%', height: '100vh', border: 0 }} />
  }

  if (du === undefined) {
    return (
      <div className="bc" style={{ display: 'grid', placeItems: 'center' }}>
        <style>{CSS}</style>
        <div style={{ color: 'var(--p-nhat)', fontSize: 14 }}>Đang mở báo cáo…</div>
      </div>
    )
  }

  if (du === null) {
    return (
      <div className="bc" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
        <style>{CSS}</style>
        <div style={{ maxWidth: 340, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700 }}>Không mở được báo cáo</div>
          <div style={{ marginTop: 10, color: 'var(--p-nhat)', fontSize: 14, lineHeight: 1.7 }}>
            {loi} Phụ huynh nhắn lại cho Thầy Đỗ Đại Học để nhận link mới.
          </div>
        </div>
      </div>
    )
  }

  // BỐ CỤC BA TẦNG cho gói bản 3 trở lên. Gói bản 2 đi tiếp xuống bố cục cũ
  // NGUYÊN VẸN: phụ huynh đã cầm link đó rồi, dựng lại bằng bố cục mới là mấy
  // mục dữ liệu cũ không có sẽ trống trơn.
  if (Number(du.v) >= 3) return <PhieuV3 du={du} laCuaEm={laCuaEm} xinLink={xinLink} />

  const tk = du.thongKe
  const dung = du.tongSoCau !== null ? du.tongSoCau - du.soCauSai : null
  const chuyenDeCa = [...du.chuyenDeCa].sort((a, b) => b.soSai / Math.max(1, b.soCau) - a.soSai / Math.max(1, a.soCau))
  // Chỉ CA NÀY được biết chắc là ca đề riêng: `hoSoEm` của máy chủ không chở cờ
  // đó cho từng ca cũ, mà bịa ra thì sai. Mỗi báo cáo dựng ở thời điểm ca của
  // nó, nên mốc mới nhất — đúng mốc có điểm bị câu lặp đẩy lên — luôn vẽ đúng.
  const caRieng = new Set(du.deRieng && du.maCa ? [du.maCa] : [])
  const saiTrongCa = chuyenDeCa.filter((c) => c.soSai > 0)
  const yeuTong = [...du.chuyenDeTong].filter((c) => c.soCau >= 4).sort((a, b) => b.tiLeSai - a.tiLeSai)

  return (
    <div className="bc">
      <style>{CSS}</style>
      <div className="bc-trong">
        <header className="bc-dau">
          <div className="bc-dau-noi">
            <div className="bc-hieu">Thầy Đỗ Đại Học</div>
            <div className="bc-ten">Báo cáo học tập{du.hoTen ? ` của ${du.hoTen}` : ''}</div>
            <div className="bc-phu">
              {du.tenCa ? `${du.tenCa} · ` : ''}
              {ngayVN(du.ngay)}
              {du.sbd ? ` · SBD ${du.sbd}` : ''}
            </div>
          </div>
        </header>

        {/* TỔNG QUAN */}
        <section ref={oDau} className={`bc-the noi bc-vao${raDau ? ' ra' : ''}`}>
          <div className="bc-diem-hang bc-diem-dau">
            <VongDiem diem={du.diem} tat={tat} />
            <div className="bc-canh">
              <span className="bc-nhan" style={{ color: mauDiem(du.diem) }}>
                {classify(du.diem)}
              </span>
              {dung !== null && (
                <div className="bc-doi">
                  <span>Số câu đúng</span>
                  <span>
                    {dung}/{du.tongSoCau}
                  </span>
                </div>
              )}
              {/* CA ĐỀ RIÊNG TỪNG EM: mỗi em một bộ câu nên hạng mất nghĩa —
                  so điểm hai em làm hai đề khác nhau là so hai thứ khác nhau
                  (DE-RIENG-TUNG-EM mục 2). */}
              {du.deRieng !== true && du.hang !== null && du.siSo !== null && (
                <div className="bc-doi">
                  <span>Hạng trong ca</span>
                  <span>
                    {du.hang}/{du.siSo}
                  </span>
                </div>
              )}
              {tk?.phutDaDung !== null && tk?.phutDaDung !== undefined && (
                <div className="bc-doi">
                  <span>Thời gian làm</span>
                  <span>
                    {tk.phutDaDung}
                    {tk.phutChoPhep ? `/${tk.phutChoPhep}` : ''} phút
                  </span>
                </div>
              )}
            </div>
          </div>
          {du.diemPhan && (
            <div style={{ marginTop: 16 }}>
              {(['I', 'II', 'III'] as const).map((p, i) => (
                <div className="bc-dong" key={p}>
                  <div className="bc-dtren">
                    <span className="bc-dten">{TEN_PHAN[p]}</span>
                    <span className="bc-dso">
                      {soVN(du.diemPhan![p])}/{soVN(du.tranPhan?.[p] ?? 10)}
                    </span>
                  </div>
                  <Thanh
                    tiLe={du.diemPhan![p] / (du.tranPhan?.[p] || 10)}
                    mau={mauDiem((du.diemPhan![p] / (du.tranPhan?.[p] || 10)) * 10)}
                    hoan={220 + i * 110}
                    tat={tat}
                  />
                </div>
              ))}
            </div>
          )}
          {/* CA ĐỀ RIÊNG TỪNG EM: 30% đề là câu con đã gặp, nên điểm nhích lên
              một phần vì gặp lại chứ không hẳn vì giỏi lên. Giấu chuyện đó là
              để phụ huynh hiểu nhầm về tiến bộ (DE-RIENG-TUNG-EM mục 2). */}
          {(du.dongCauLap || du.deRieng) && (
            <div className="bc-ghi" style={{ marginTop: 12 }}>
              {du.dongCauLap ? `${du.dongCauLap} ` : ''}
              {du.deRieng ? 'Bài này mỗi bạn một bộ câu, nên không xếp hạng trong lớp.' : ''}
            </div>
          )}

          {/* VI PHẠM đứng ngay dưới điểm: phụ huynh mở báo cáo là thấy, không
              phải cuộn hết trang mới gặp. */}
          {du.viPham && <KhoiViPham vp={du.viPham} />}
        </section>

        {/* VỊ TRÍ TRONG LỚP */}
        {du.deRieng !== true && du.diemLop.length >= 5 && (
          <Khoi tieu="Vị trí trong lớp" ten="Cả ca này đứng ở đâu" tat={tat}>
            <PhanBoLop diemLop={du.diemLop} cuaEm={du.diem} tat={tat} />
          </Khoi>
        )}

        {/* TIẾN BỘ */}
        {du.lichSu.length >= 2 && (
          <Khoi tieu="Tiến bộ" ten="Điểm qua các bài đã làm" ghi={laCuaEm ? `${du.lichSu.length} bài em đã làm, cũ nhất bên trái.` : `${du.lichSu.length} bài, cũ nhất bên trái.`} tat={tat}>
            <DuongTienBo ds={du.lichSu} tat={tat} maCaRieng={caRieng} />
            {du.deRieng && du.maCa ? <div className="bc-ghi">Chấm rỗng ruột là bài có câu hỏi lại, điểm không so thẳng với bài thường được.</div> : null}
          </Khoi>
        )}

        {/* CHUYÊN ĐỀ TRONG BÀI NÀY */}
        {saiTrongCa.length > 0 && (
          <Khoi tieu="Bài này" ten="Chuyên đề mất điểm" tat={tat}>
            {saiTrongCa.map((c, i) => (
              <div className="bc-dong" key={c.ten}>
                <div className="bc-dtren">
                  <span className="bc-dten">{c.ten}</span>
                  <span className="bc-dso" style={{ color: 'var(--p-do)' }}>
                    sai {c.soSai}/{c.soCau}
                  </span>
                </div>
                <Thanh tiLe={c.soSai / Math.max(1, c.soCau)} mau="var(--p-do)" hoan={140 + i * 90} tat={tat} />
              </div>
            ))}
          </Khoi>
        )}

        {/* BẢN ĐỒ CHUYÊN ĐỀ TỔNG */}
        {yeuTong.length > 0 && (
          <Khoi
            tieu="Cả quá trình"
            ten="Bản đồ chuyên đề"
            ghi="Cộng dồn mọi bài em đã làm. Mũi tên so với ba bài trước đó."
            tat={tat}
          >
            {yeuTong.slice(0, 8).map((c, i) => (
              <div className="bc-dong" key={c.ten}>
                <div className="bc-dtren">
                  <span className="bc-dten">
                    {c.ten}
                    {c.xuHuong === 'tot' && <span style={{ color: 'var(--p-xanh)' }}> ↑</span>}
                    {c.xuHuong === 'xau' && <span style={{ color: 'var(--p-do)' }}> ↓</span>}
                  </span>
                  <span className="bc-dso" style={{ color: c.tiLeSai > 0.3 ? 'var(--p-do)' : 'var(--p-xanh)' }}>
                    sai {c.soSai}/{c.soCau}
                  </span>
                </div>
                <Thanh tiLe={c.tiLeSai} mau={c.tiLeSai > 0.3 ? 'var(--p-do)' : 'var(--p-xanh)'} hoan={140 + i * 70} tat={tat} />
              </div>
            ))}
          </Khoi>
        )}

        {/* CÁCH LÀM BÀI */}
        {tk && (
          <Khoi tieu="Cách làm bài" ten="Em làm bài như thế nào" tat={tat}>
            <div className="bc-o3">
              <OSo so={tk.giayCauDungTB !== null ? `${tk.giayCauDungTB}s` : null} ten="giây trung bình một câu ĐÚNG" />
              <OSo so={tk.giayCauSaiTB !== null ? `${tk.giayCauSaiTB}s` : null} ten="giây trung bình một câu SAI" />
              <OSo so={tk.soBoTrong} ten="câu bỏ trống" />
            </div>
            <DaiThoiGian cau={du.dai ?? []} tat={tat} />
            {tk.theoMucDo.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="bc-tieu">Sai theo mức độ</div>
                {tk.theoMucDo.map((m, i) => (
                  <div className="bc-dong" key={m.mucDo}>
                    <div className="bc-dtren">
                      <span className="bc-dten">{TEN_MUC_DO[m.mucDo]}</span>
                      <span className="bc-dso">
                        sai {m.sai}/{m.tong}
                      </span>
                    </div>
                    <Thanh tiLe={m.sai / Math.max(1, m.tong)} mau={m.sai / Math.max(1, m.tong) > 0.3 ? 'var(--p-cam)' : 'var(--p-xanh)'} hoan={140 + i * 80} tat={tat} />
                  </div>
                ))}
              </div>
            )}
          </Khoi>
        )}

        {/* NHẬN ĐỊNH + TƯ VẤN */}
        {du.tinHieu.length > 0 && (
          <Khoi tieu="Nhận định" ten={laCuaEm ? 'Thầy Đỗ Đại Học nhắc nhở em' : 'Thầy Đỗ Đại Học nhắc con những điều sau'} tat={tat}>
            {du.tinHieu.map((t) => (
              <div className="bc-tin" key={t.ma}>
                <div className="bc-tin-nhan">{t.nhan}</div>
                <div className="bc-tin-so">{t.soLieu}</div>
                <div className="bc-tin-khuyen">{t.loiKhuyen}</div>
              </div>
            ))}
          </Khoi>
        )}

        {/* CÂU TỪNG SAI, NAY LÀM ĐÚNG — đứng TRƯỚC mục câu sai.
            Em làm đúng thì câu đó không nằm trong mục câu sai, nên không có
            khối riêng này là việc sửa được biến mất khỏi báo cáo. Đây là tin
            tốt duy nhất máy chứng minh được bằng số. */}
        {(du.daSuaDuoc?.length ?? 0) > 0 && (
          <Khoi tieu="Đã sửa được" ten={`${laCuaEm ? 'Em' : 'Con'} đã sửa được ${du.daSuaDuoc!.length} câu từng sai`} ghi="Những câu này bài trước làm sai, bài này làm đúng." tat={tat}>
            <div style={{ marginTop: 6 }}>
              {du.daSuaDuoc!.map((c, i) => (
                <TheCauChiTiet key={`sua-${c.qid}-${i}`} c={c} stt={i + 1} mauSo="var(--p-xanh)" />
              ))}
            </div>
          </Khoi>
        )}

        {/* TỪNG CÂU SAI */}
        {du.cauSai.length > 0 && (
          <Khoi tieu="Chi tiết" ten={`${du.cauSai.length} câu sai`} ghi="Chạm vào từng câu để xem đề, đáp án đúng và lời giải." tat={tat}>
            <div style={{ marginTop: 6 }}>
              {du.cauSai.map((c, i) => (
                <TheCauChiTiet key={`${c.phan}-${c.soCau}`} c={c} stt={i + 1} mauSo="var(--p-do)" />
              ))}
            </div>
          </Khoi>
        )}

        {/* ĐÚC KẾT */}
        {du.ducKet.length > 0 && (
          <Khoi tieu="Chép vào sổ" ten="Đúc kết kiến thức cần nhớ" ghi="Em chép đúng những dòng này vào sổ sửa lỗi, tick khi đã thuộc." tat={tat}>
            {du.ducKet.map((g) => (
              <div className="bc-soan" key={g.chuyenDe}>
                <div className="bc-soan-cd">{g.chuyenDe}</div>
                {([
                  ['Lý thuyết phải thuộc', g.lyThuyet],
                  ['Kỹ năng phải làm được', g.kyNang],
                ] as const).map(([nhan, ds]) =>
                  ds.length === 0 ? null : (
                    <div key={nhan} style={{ marginTop: 10 }}>
                      <div className="bc-tieu" style={{ marginBottom: 2 }}>
                        {nhan}
                      </div>
                      {ds.map((y, i) => (
                        <div className="bc-soan-y" key={i}>
                          <span className="bc-soan-o" />
                          <span>
                            <ChemText text={y} />
                          </span>
                        </div>
                      ))}
                    </div>
                  ),
                )}
              </div>
            ))}
          </Khoi>
        )}

        {/* PHẦN CUỐI — việc cần làm, đề con vừa thi, bài luyện.
            LỖI ĐÃ DÍNH 04-09: cả khối này chỉ hiện khi `vieCanLam` có chữ. Báo
            cáo em tự dựng trên máy mình sau khi nộp KHÔNG có dòng đó (máy em
            không biết thầy muốn giao gì), nên em mất luôn nút xem đề vừa làm;
            thầy mở từ Hồ sơ học sinh cũng thấy cụt. Nay mỗi mục tự quyết định
            có hiện hay không. */}
        {(du.vieCanLam.trim() || (du.deCuaEm && du.deCuaEm.length > 0) || (du.baiTap && du.baiTap.length > 0) || du.linkBaiTap) && (
          <section className="bc-viec">
            {du.vieCanLam.trim() && (
              <>
                <div className="bc-tieu">Việc cần làm</div>
                <div className="bc-viec-chu">{du.vieCanLam}</div>
              </>
            )}
            {du.deCuaEm && du.deCuaEm.length > 0 && <NutXemDeDaLam du={du} laCuaEm={laCuaEm} />}
            {((du.baiTap && du.baiTap.length > 0) || du.linkBaiTap) && <NutTaiBaiTap du={du} laCuaEm={laCuaEm} xinLink={xinLink} />}
          </section>
        )}

        <footer className="bc-chan">
          <div>
            <b>Thầy Đỗ Đại Học</b>
          </div>
          <div>
            {laCuaEm
              ? `Báo cáo riêng của em ${du.hoTen || du.sbd}. Em giữ trong máy, không chuyển tiếp cho người khác.`
              : `Báo cáo riêng của em ${du.hoTen || du.sbd}. Phụ huynh giữ trong máy, không chuyển tiếp cho người khác.`}
          </div>
        </footer>
      </div>
    </div>
  )
}

/** NÚT TẢI PHIẾU BÀI TẬP ngay trong báo cáo.
 *
 * 10 câu đã được thầy rút sẵn và gói vào báo cáo, nên phụ huynh bấm là dựng PDF
 * ngay trên máy mình — không phải chờ thầy gửi thêm file, và không cần gọi thêm
 * lệnh nào lên máy chủ. Bộ vẽ PDF nặng gần 300KB nên nạp động, chỉ khi bấm. */
/** XEM ĐỀ CON VỪA THI, kèm lời giải — đúng thứ em thấy ở màn "đã nộp bài".
 *
 * Mỗi em một bộ câu riêng nên bộ này đi kèm ngay trong báo cáo, không lấy
 * chung đề của ca được. Ca nhiều hình mà gói quá nặng thì lúc gửi đã bỏ trường
 * này ra (giamGoiPhieu) và nút không hiện — thà thiếu nút còn hơn phụ huynh
 * không nhận được báo cáo. */
function NutXemDeDaLam({ du, laCuaEm = false }: { du: PhieuDayDu; laCuaEm?: boolean }) {
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const [html, setHtml] = useState('')
  // XƯNG HÔ THEO NGƯỜI ĐANG ĐỌC. Khối này trước đây KHÔNG nhận `laCuaEm` nên
  // năm chỗ chữ đều xưng kiểu gửi phụ huynh, kể cả khi chính em đang mở báo cáo
  // của mình. Thầy báo 09/09: "phần rút đề của học sinh bị nhầm báo cáo phụ
  // huynh". Đợt vá 08/09 chỉ chữa dòng "việc cần làm" (`doiXungVeEm`), không
  // với tới khối này vì nó không hề biết người đọc là ai.
  const xung = laCuaEm ? 'em' : 'con'
  const XUNG = laCuaEm ? 'Em' : 'Phụ huynh'

  const mo = async () => {
    setDang(true)
    setLoi('')
    try {
      const { dungPhieu: dungTrang } = await napDong(() => import('../lib/html-phieu'))
      const cd = [...new Set((du.deCuaEm ?? []).map((c) => c.chuyenDe).filter(Boolean))]
      setHtml(
        dungTrang(
          {
            hoTen: du.hoTen,
            sbd: du.sbd,
            ngay: du.ngay ? new Date(du.ngay) : new Date(),
            tenChuyenDe: cd.length === 1 ? cd[0] : du.tenCa || 'Hoá học',
            ketQua: `Điểm ${du.diem.toFixed(2).replace('.', ',')}/10`,
            hienDapAn: true,
            nhanBia: `Đề ${xung} vừa làm, kèm lời giải`,
            oBia: [
              { nhan: 'Học sinh', gia: du.hoTen },
              { nhan: 'SBD', gia: du.sbd },
              ...(du.tenCa ? [{ nhan: 'Bài kiểm tra', gia: du.tenCa }] : []),
            ],
          },
          du.deCuaEm ?? [],
        ),
      )
    } catch {
      setLoi(`Máy chưa mở được đề. ${XUNG} thử lại khi có mạng ổn định.`)
    } finally {
      setDang(false)
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => void mo()}
        disabled={dang}
        style={{
          width: '100%',
          minHeight: 46,
          border: '1.5px solid var(--p-tim)',
          borderRadius: 12,
          background: 'var(--p-giay)',
          color: 'var(--p-tim)',
          fontFamily: 'var(--sans)',
          fontSize: 14.5,
          fontWeight: 700,
          cursor: dang ? 'default' : 'pointer',
          opacity: dang ? 0.6 : 1,
        }}
      >
        {dang ? 'Đang dựng đề…' : `Xem đề ${xung} vừa làm (${du.deCuaEm?.length ?? 0} câu) kèm lời giải`}
      </button>
      <div style={{ fontSize: 12, color: 'var(--p-nhat)', marginTop: 7, lineHeight: 1.6 }}>
        Đúng bộ câu máy đã gán riêng cho {xung}. Bấm vào từng câu để xem đáp án và lời giải.
      </div>
      {loi && <div style={{ fontSize: 12.5, color: 'var(--p-do)', marginTop: 6 }}>{loi}</div>}
      {html && <KhungXemPhieu html={html} ten={`Đề ${xung} vừa làm`} dong={() => setHtml('')} />}
    </div>
  )
}

/** Vòng điểm. SỐ VẼ THẲNG, KHÔNG CHẠY LÊN.
 *
 * VÌ SAO BỎ VÒNG CHẠY SỐ (thầy chụp lại 09/09: link gửi phụ huynh
 * `p#iiBopoadsq` in "0,00 trên 10" trong khi ba dòng điểm phần ngay dưới ghi
 * 3,38 · 3,00 · 1,50 và xếp loại ghi "Khá" — tức dữ liệu đúng 7,88).
 *
 * Vòng chạy số cũ đi bằng `requestAnimationFrame`. Trình duyệt DỪNG HẲN rAF khi
 * thẻ không ở trước mặt, mà `so` khởi tạo bằng 0 — nên phiếu mở trong thẻ nền
 * (phụ huynh bấm link trong Zalo rồi chuyển sang việc khác, hay trình duyệt tự
 * mở nền) đứng nguyên ở 0,00. Không phải hiếm: đo được lần này chỉ bằng cách mở
 * link ở thẻ không active.
 *
 * `PhieuV3` đã bỏ vòng chạy số đúng vì lý do này từ 07/09; màn này — màn THẬT SỰ
 * phục vụ link `/p#` gửi phụ huynh — thì chưa. Nay bỏ nốt.
 *
 * Vành tròn vẫn hiện dần bằng transition CSS, và mốc bật nó nay là `setTimeout`
 * chứ không phải rAF, nên thẻ nền cũng về đúng trạng thái cuối.
 *
 * CẤM đưa lại bất kỳ cách hiển thị điểm nào phụ thuộc rAF: số gửi phụ huynh
 * không được phép sai chỉ vì cái thẻ không nằm trước mặt. */
export function VongDiem({ diem, tat }: { diem: number; tat: boolean }) {
  const R = 51
  const C = 2 * Math.PI * R
  const [ra, setRa] = useState(tat)
  const so = diem

  useEffect(() => {
    if (tat) return
    const id = setTimeout(() => setRa(true), 30)
    return () => clearTimeout(id)
  }, [tat])

  return (
    <div className="bc-vong">
      <svg viewBox="0 0 116 116" aria-hidden="true">
        <circle cx="58" cy="58" r={R} fill="none" stroke="var(--p-chim)" strokeWidth="9" />
        <circle
          cx="58"
          cy="58"
          r={R}
          fill="none"
          stroke={mauDiem(diem)}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={ra ? C * (1 - Math.min(1, diem / 10)) : C}
          style={{ transition: tat ? 'none' : 'stroke-dashoffset 1.05s cubic-bezier(.22,.9,.28,1) .1s' }}
        />
      </svg>
      <div className="bc-vong-in">
        <div className="bc-so" style={{ color: mauDiem(diem) }}>
          {soVN(so)}
        </div>
        <div className="bc-tren">trên 10</div>
      </div>
    </div>
  )
}
