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
import { docMaTuHash } from '../lib/phieu-link'
import { layPhieu } from '../lib/exam-api'
import { loadScriptUrlHoacMacDinh } from '../lib/exam-db'
import { BAN_PHIEU, type CauSaiChiTiet, type PhieuDayDu } from '../lib/phieu-du-lieu'
import { TEN_MUC_DO, TEN_PHAN, type MucDo } from '../lib/phan-tich-lam-bai'
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

const CSS = `
.bc{min-height:100vh;background:var(--p-nen);color:var(--p-muc);font-family:var(--sans);
  -webkit-font-smoothing:antialiased;padding-bottom:56px;line-height:1.55}
.bc *{box-sizing:border-box}
.bc-trong{max-width:560px;margin:0 auto}

.bc-dau{position:relative;overflow:hidden;background:linear-gradient(135deg,var(--p-tim),var(--p-tim-2));
  padding:34px 22px 88px;color:var(--p-trang)}
.bc-dau::before,.bc-dau::after{content:'';position:absolute;width:300px;height:300px;border-radius:50%;
  filter:blur(60px);opacity:.4;will-change:transform}
.bc-dau::before{background:var(--p-trang);top:-150px;left:-100px;animation:bc-troi1 19s ease-in-out infinite}
.bc-dau::after{background:var(--p-tim);bottom:-180px;right:-120px;animation:bc-troi2 23s ease-in-out infinite}
@keyframes bc-troi1{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(60px,36px,0) scale(1.15)}}
@keyframes bc-troi2{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-50px,-32px,0) scale(1.22)}}
.bc-dau-noi{position:relative}
.bc-hieu{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;opacity:.85}
.bc-ten{font-family:var(--serif);font-size:29px;font-weight:700;line-height:1.15;margin-top:10px}
.bc-phu{margin-top:8px;font-size:13px;opacity:.92}

.bc-the{margin:16px 14px 0;background:var(--p-giay);border-radius:20px;padding:20px 18px;border:1px solid var(--p-vien)}
.bc-the.noi{margin-top:-64px;border:none;box-shadow:var(--p-bong)}
.bc-tieu{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--p-nhat)}
.bc-tieu-lon{font-family:var(--serif);font-size:19px;font-weight:700;margin-top:2px}
.bc-ghi{font-size:12.5px;color:var(--p-nhat);margin-top:6px}

.bc-em{font-family:var(--serif);font-size:22px;font-weight:700}
.bc-em-phu{margin-top:4px;font-size:12.5px;color:var(--p-nhat)}
.bc-diem-hang{display:flex;align-items:center;gap:16px;margin-top:16px}
.bc-vong{position:relative;width:116px;height:116px;flex:0 0 auto}
.bc-vong svg{width:116px;height:116px;transform:rotate(-90deg)}
.bc-vong-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.bc-so{font-family:var(--serif);font-size:32px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.bc-tren{font-size:10.5px;color:var(--p-mo);margin-top:3px}
.bc-canh{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.bc-nhan{display:inline-flex;align-items:center;align-self:flex-start;height:27px;padding:0 12px;border-radius:999px;
  font-size:12.5px;font-weight:700;background:var(--p-chim)}
.bc-doi{display:flex;justify-content:space-between;gap:10px;font-size:13px}
.bc-doi>span:first-child{color:var(--p-nhat)}
.bc-doi>span:last-child{font-weight:700;font-variant-numeric:tabular-nums}

.bc-dong{margin-top:13px}
.bc-dong:first-of-type{margin-top:12px}
.bc-dtren{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:13.5px}
.bc-dten{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bc-dso{font-weight:700;font-variant-numeric:tabular-nums;flex:0 0 auto;font-size:12.5px}
.bc-ray{height:8px;border-radius:999px;background:var(--p-chim);margin-top:6px;overflow:hidden}
.bc-day{height:100%;border-radius:999px;width:0;transition:width 1s cubic-bezier(.22,.9,.28,1)}

.bc-o3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.bc-o{background:var(--p-chim);border-radius:12px;padding:11px 8px;text-align:center}
.bc-o-so{font-family:var(--serif);font-size:19px;font-weight:700;font-variant-numeric:tabular-nums}
.bc-o-ten{font-size:10.5px;color:var(--p-nhat);margin-top:3px;line-height:1.35}

.bc-mo{width:100%;text-align:left;background:none;border:none;padding:12px 0;cursor:pointer;color:inherit;
  font:inherit;display:flex;align-items:center;gap:10px;border-top:1px solid var(--p-vien)}
.bc-mo:first-of-type{border-top:none}
.bc-mo-so{flex:0 0 auto;width:30px;height:30px;border-radius:9px;background:var(--p-chim);display:grid;place-items:center;
  font-size:11.5px;font-weight:700}
.bc-mo-giua{flex:1;min-width:0}
.bc-mo-ten{font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bc-mo-phu{font-size:11.5px;color:var(--p-nhat);margin-top:2px}
.bc-mui{flex:0 0 auto;width:9px;height:9px;border-right:2px solid var(--p-mo);border-bottom:2px solid var(--p-mo);
  transform:rotate(45deg);transition:transform .28s ease;margin-right:3px}
.bc-mo[aria-expanded="true"] .bc-mui{transform:rotate(-135deg)}
.bc-hop{display:grid;grid-template-rows:0fr;transition:grid-template-rows .34s cubic-bezier(.22,.9,.28,1)}
.bc-hop.ra{grid-template-rows:1fr}
.bc-hop>div{overflow:hidden;min-height:0}
.bc-hop-in{padding:2px 0 16px}

.bc-de{font-family:var(--serif);font-size:14.5px;line-height:1.65;background:var(--p-chim);border-radius:12px;padding:12px 13px}
.bc-pa{display:flex;gap:9px;align-items:flex-start;padding:8px 11px;border-radius:10px;margin-top:6px;font-size:13.5px;
  line-height:1.55;border:1px solid var(--p-vien)}
.bc-pa-k{flex:0 0 auto;width:21px;height:21px;border-radius:6px;display:grid;place-items:center;font-size:11px;font-weight:700;
  background:var(--p-chim)}
.bc-pa.dung{border-color:var(--p-xanh)}
.bc-pa.chon{border-color:var(--p-do)}
.bc-co{font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:999px;margin-left:6px;white-space:nowrap}
.bc-giai{margin-top:11px;border-left:3px solid var(--p-tim);padding:2px 0 2px 12px}
.bc-giai-chot{font-family:var(--serif);font-size:14px;font-weight:700;line-height:1.55}
.bc-giai-y{font-size:13px;margin-top:7px;line-height:1.6;color:var(--p-muc)}
.bc-buoc{font-size:13px;margin-top:5px;padding-left:16px;position:relative;line-height:1.6}
.bc-buoc::before{content:'';position:absolute;left:3px;top:9px;width:5px;height:5px;border-radius:50%;background:var(--p-tim)}

.bc-tin{border-radius:14px;border:1px solid var(--p-vien);padding:13px 14px;margin-top:10px}
.bc-tin:first-of-type{margin-top:12px}
.bc-tin-nhan{font-family:var(--serif);font-size:15.5px;font-weight:700}
.bc-tin-so{font-size:13px;color:var(--p-nhat);margin-top:5px;line-height:1.6}
.bc-tin-khuyen{font-size:13.5px;margin-top:9px;line-height:1.62;background:var(--p-chim);border-radius:10px;padding:10px 11px}

.bc-soan{margin-top:12px}
.bc-soan-cd{font-size:12px;font-weight:700;color:var(--p-tim);letter-spacing:.02em}
.bc-soan-y{display:flex;gap:9px;font-size:13.5px;line-height:1.62;margin-top:7px}
.bc-soan-o{flex:0 0 auto;width:15px;height:15px;border:1.5px solid var(--p-mo);border-radius:4px;margin-top:3px}

.bc-viec{margin:16px 14px 0;background:var(--p-giay);border-radius:18px;padding:18px 18px 18px 20px;
  border:1px solid var(--p-vien);border-left:4px solid var(--p-tim)}
.bc-viec-chu{font-family:var(--serif);font-size:15.5px;line-height:1.62;margin-top:9px}
.bc-chan{margin:24px 16px 0;text-align:center;color:var(--p-mo);font-size:11.5px;line-height:1.75}
.bc-chan b{color:var(--p-nhat)}

.bc-vao{opacity:0;transform:translate3d(0,18px,0);transition:opacity .6s ease,transform .6s cubic-bezier(.22,.9,.28,1)}
.bc-vao.ra{opacity:1;transform:none}

@media (prefers-reduced-motion:reduce){
  .bc-dau::before,.bc-dau::after{animation:none}
  .bc-vao{transition:none;opacity:1;transform:none}
  .bc-day,.bc-hop,.bc-mui{transition:none}
}
`

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
function DuongTienBo({ ds, tat }: { ds: { ngay: string; tong: number }[]; tat: boolean }) {
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
        {ds.map((d, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(d.tong)}
            r={i === n - 1 ? 4.6 : 3}
            fill={i === n - 1 ? mauDiem(cuoi.tong) : 'var(--p-giay)'}
            stroke={i === n - 1 ? 'var(--p-giay)' : 'var(--p-tim)'}
            strokeWidth="2"
            opacity={ra ? 1 : 0}
            style={{ transition: tat ? 'none' : `opacity .35s ease ${400 + i * 70}ms` }}
          />
        ))}
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
function DaiThoiGian({ cau, tat }: { cau: { giay: number | null; dung: boolean; nhan: string }[]; tat: boolean }) {
  const [o, ra] = useHienKhiToi<HTMLDivElement>(tat)
  const co = cau.filter((c) => c.giay !== null)
  if (co.length < 3) return null
  const cao = Math.max(...co.map((c) => c.giay as number))
  return (
    <div ref={o} style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 76 }}>
        {cau.map((c, i) => (
          <div
            key={i}
            title={`${c.nhan}${c.giay !== null ? ` · ${c.giay} giây` : ''}`}
            style={{
              flex: 1,
              minWidth: 2,
              height: ra ? `${c.giay === null ? 3 : Math.max(5, ((c.giay as number) / cao) * 100)}%` : '3%',
              background: c.dung ? 'var(--p-xanh)' : 'var(--p-do)',
              opacity: c.giay === null ? 0.25 : 1,
              borderRadius: '3px 3px 1px 1px',
              transition: tat ? 'none' : `height .55s cubic-bezier(.22,.9,.28,1) ${Math.min(600, i * 22)}ms`,
            }}
          />
        ))}
      </div>
      <div className="bc-ghi" style={{ marginTop: 8 }}>
        Mỗi cột là một câu theo đúng thứ tự em làm, cao là mất nhiều giây. Cột đỏ là câu sai, cột xanh là câu đúng.
      </div>
    </div>
  )
}

// ------------------------------------------------------------- một câu sai
function TheCauSai({ c, stt }: { c: CauSaiChiTiet; stt: number }) {
  const [mo, setMo] = useState(false)
  const nhanPhan = TEN_PHAN[c.phan] ?? c.phan
  const khoaY = ['a', 'b', 'c', 'd']
  return (
    <div>
      <button className="bc-mo" aria-expanded={mo} onClick={() => setMo((v) => !v)}>
        <span className="bc-mo-so" style={{ color: 'var(--p-do)' }}>
          {stt}
        </span>
        <span className="bc-mo-giua">
          <span className="bc-mo-ten">
            {nhanPhan}, câu {c.soCau}
          </span>
          <span className="bc-mo-phu">
            {c.chuyenDe || 'chưa phân loại'}
            {c.mucDo ? ` · ${TEN_MUC_DO[c.mucDo as MucDo] ?? c.mucDo}` : ''}
            {c.giay !== null ? ` · ${c.giay} giây` : ''}
          </span>
        </span>
        <span className="bc-mui" />
      </button>
      <div className={`bc-hop${mo ? ' ra' : ''}`}>
        <div>
          <div className="bc-hop-in">
            <div className="bc-de">
              <ChemText text={c.de} />
              {c.coHinh && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--p-nhat)', fontFamily: 'var(--sans)' }}>
                  Câu này có hình trong đề. Báo cáo không kèm hình, em xem lại trong bài Thầy chữa trên lớp.
                </div>
              )}
            </div>

            {c.luaChon && c.phan === 'I' && (
              <div style={{ marginTop: 8 }}>
                {c.luaChon.map((pa, i) => {
                  const k = ['A', 'B', 'C', 'D'][i]
                  const laDung = k === c.dapAnDung
                  const emChon = k === c.dapAnChon
                  return (
                    <div key={k} className={`bc-pa${laDung ? ' dung' : ''}${emChon && !laDung ? ' chon' : ''}`}>
                      <span className="bc-pa-k" style={{ color: laDung ? 'var(--p-xanh)' : emChon ? 'var(--p-do)' : 'var(--p-nhat)' }}>
                        {k}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <ChemText text={pa} />
                        {laDung && (
                          <span className="bc-co" style={{ background: 'var(--p-xanh)', color: 'var(--p-trang)' }}>
                            đáp án đúng
                          </span>
                        )}
                        {emChon && !laDung && (
                          <span className="bc-co" style={{ background: 'var(--p-do)', color: 'var(--p-trang)' }}>
                            em chọn
                          </span>
                        )}
                      </span>
                    </div>
                  )
                })}
                {!c.dapAnChon && (
                  <div className="bc-ghi" style={{ marginTop: 7, color: 'var(--p-do)' }}>
                    Em bỏ trống câu này.
                  </div>
                )}
              </div>
            )}

            {c.luaChon && c.phan === 'II' && (
              <div style={{ marginTop: 8 }}>
                {c.luaChon.map((y, i) => {
                  const dung = c.dapAnDung[i]
                  const chon = c.dapAnChon[i]
                  const khop = dung === chon
                  return (
                    <div key={i} className={`bc-pa${khop ? ' dung' : ' chon'}`}>
                      <span className="bc-pa-k" style={{ color: khop ? 'var(--p-xanh)' : 'var(--p-do)' }}>
                        {khoaY[i]}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <ChemText text={y} />
                        <span className="bc-co" style={{ background: 'var(--p-chim)', color: 'var(--p-nhat)' }}>
                          đúng: {dung === 'D' ? 'Đúng' : 'Sai'} · em: {chon === 'D' ? 'Đúng' : chon === 'S' ? 'Sai' : 'bỏ trống'}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {c.phan === 'III' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="bc-pa dung" style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, color: 'var(--p-nhat)' }}>Đáp án đúng</span>
                  <b style={{ marginLeft: 6 }}>{c.dapAnDung}</b>
                </div>
                <div className="bc-pa chon" style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, color: 'var(--p-nhat)' }}>Em điền</span>
                  <b style={{ marginLeft: 6 }}>{c.dapAnChon || 'bỏ trống'}</b>
                </div>
              </div>
            )}

            {(c.chot || c.lyDo || c.buoc) && (
              <div className="bc-giai">
                {c.chot && (
                  <div className="bc-giai-chot">
                    <ChemText text={c.chot} />
                  </div>
                )}
                {c.lyDo?.map((l) => (
                  <div key={l.khoa} className="bc-giai-y">
                    <b style={{ color: l.dung ? 'var(--p-xanh)' : 'var(--p-do)' }}>{l.khoa}.</b> <ChemText text={l.ly} />
                  </div>
                ))}
                {c.buoc?.map((b, i) => (
                  <div key={i} className="bc-buoc">
                    <ChemText text={b} />
                  </div>
                ))}
                {c.ketQua && (
                  <div className="bc-giai-y" style={{ fontWeight: 700 }}>
                    Kết quả: <ChemText text={c.ketQua} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------- màn hình
export default function PhieuScreen() {
  const [du, setDu] = useState<PhieuDayDu | null | undefined>(undefined)
  const [loi, setLoi] = useState('')
  const daChay = useRef(false)

  const tat = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  const nap = useCallback(async () => {
    const ma = docMaTuHash(location.hash)
    if (!ma) {
      setLoi('Link không đúng hoặc bị cắt ngắn khi chuyển tiếp.')
      setDu(null)
      return
    }
    try {
      const url = await loadScriptUrlHoacMacDinh()
      if (!url) throw new Error('Chưa cấu hình được máy chủ')
      const p = (await layPhieu(url, ma)) as PhieuDayDu
      if (!p || Number(p.v) !== BAN_PHIEU) throw new Error('Báo cáo này thuộc phiên bản khác, Thầy cần gửi lại link mới.')
      setDu(p)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không mở được báo cáo')
      setDu(null)
    }
  }, [])

  useEffect(() => {
    if (daChay.current) return
    daChay.current = true
    void nap()
  }, [nap])

  useEffect(() => {
    if (du) document.title = `Báo cáo học tập ${du.hoTen || du.sbd}`
  }, [du])

  const [oDau, raDau] = useHienKhiToi<HTMLDivElement>(tat)

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

  const tk = du.thongKe
  const dung = du.tongSoCau !== null ? du.tongSoCau - du.soCauSai : null
  const chuyenDeCa = [...du.chuyenDeCa].sort((a, b) => b.soSai / Math.max(1, b.soCau) - a.soSai / Math.max(1, a.soCau))
  const saiTrongCa = chuyenDeCa.filter((c) => c.soSai > 0)
  const yeuTong = [...du.chuyenDeTong].filter((c) => c.soCau >= 4).sort((a, b) => b.tiLeSai - a.tiLeSai)

  return (
    <div className="bc">
      <style>{CSS}</style>
      <div className="bc-trong">
        <header className="bc-dau">
          <div className="bc-dau-noi">
            <div className="bc-hieu">Thầy Đỗ Đại Học</div>
            <div className="bc-ten">Báo cáo học tập</div>
            <div className="bc-phu">
              {du.tenCa ? `${du.tenCa} · ` : ''}
              {ngayVN(du.ngay)}
            </div>
          </div>
        </header>

        {/* TỔNG QUAN */}
        <section ref={oDau} className={`bc-the noi bc-vao${raDau ? ' ra' : ''}`}>
          <div className="bc-em">{du.hoTen || `SBD ${du.sbd}`}</div>
          <div className="bc-em-phu">
            {du.sbd ? `SBD ${du.sbd}` : ''}
            {du.lop ? ` · Lớp ${du.lop}` : ''}
          </div>
          <div className="bc-diem-hang">
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
              {du.hang !== null && du.siSo !== null && (
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
                    <span className="bc-dso">{soVN(du.diemPhan![p])}/10</span>
                  </div>
                  <Thanh tiLe={du.diemPhan![p] / 10} mau={mauDiem(du.diemPhan![p])} hoan={220 + i * 110} tat={tat} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* VỊ TRÍ TRONG LỚP */}
        {du.diemLop.length >= 5 && (
          <Khoi tieu="Vị trí trong lớp" ten="Cả ca này đứng ở đâu" tat={tat}>
            <PhanBoLop diemLop={du.diemLop} cuaEm={du.diem} tat={tat} />
          </Khoi>
        )}

        {/* TIẾN BỘ */}
        {du.lichSu.length >= 2 && (
          <Khoi tieu="Tiến bộ" ten="Điểm qua các bài đã làm" ghi={`${du.lichSu.length} bài, cũ nhất bên trái.`} tat={tat}>
            <DuongTienBo ds={du.lichSu} tat={tat} />
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
          <Khoi tieu="Nhận định" ten="Thầy thấy gì, anh/chị nhắc con gì" tat={tat}>
            {du.tinHieu.map((t) => (
              <div className="bc-tin" key={t.ma}>
                <div className="bc-tin-nhan">{t.nhan}</div>
                <div className="bc-tin-so">{t.soLieu}</div>
                <div className="bc-tin-khuyen">{t.loiKhuyen}</div>
              </div>
            ))}
          </Khoi>
        )}

        {/* TỪNG CÂU SAI */}
        {du.cauSai.length > 0 && (
          <Khoi tieu="Chi tiết" ten={`${du.cauSai.length} câu sai`} ghi="Chạm vào từng câu để xem đề, đáp án đúng và lời giải." tat={tat}>
            <div style={{ marginTop: 6 }}>
              {du.cauSai.map((c, i) => (
                <TheCauSai key={`${c.phan}-${c.soCau}`} c={c} stt={i + 1} />
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

        {du.vieCanLam.trim() && (
          <section className="bc-viec">
            <div className="bc-tieu">Việc cần làm</div>
            <div className="bc-viec-chu">{du.vieCanLam}</div>
            {du.baiTap && du.baiTap.length > 0 && <NutTaiBaiTap du={du} />}
          </section>
        )}

        <footer className="bc-chan">
          <div>
            <b>Thầy Đỗ Đại Học</b>
          </div>
          <div>Báo cáo riêng của em {du.hoTen || du.sbd}. Phụ huynh giữ trong máy, không chuyển tiếp cho người khác.</div>
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
function NutTaiBaiTap({ du }: { du: PhieuDayDu }) {
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const tai = async () => {
    setDang(true)
    setLoi('')
    try {
      const [{ veBaiTapPdf }, { tenTepBaiTap }] = await Promise.all([import('../lib/ve-bai-tap-pdf'), import('../lib/bai-tap-pdf')])
      const doc = veBaiTapPdf({
        hoTen: du.hoTen,
        sbd: du.sbd,
        lop: du.lop,
        ngay: new Date(),
        chuyenDe: du.chuyenDeCa,
        cau: du.baiTap ?? [],
        lapLai: 0,
      })
      doc.save(tenTepBaiTap(du.hoTen, du.sbd))
    } catch {
      setLoi('Máy chưa tải được phiếu. Phụ huynh thử lại khi có mạng ổn định.')
    } finally {
      setDang(false)
    }
  }
  return (
    <div style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => void tai()}
        disabled={dang}
        style={{
          width: '100%',
          minHeight: 46,
          border: 'none',
          borderRadius: 12,
          background: 'var(--p-tim)',
          color: 'var(--p-trang)',
          fontFamily: 'var(--sans)',
          fontSize: 14.5,
          fontWeight: 700,
          cursor: dang ? 'default' : 'pointer',
          opacity: dang ? 0.6 : 1,
        }}
      >
        {dang ? 'Đang dựng phiếu…' : `Tải phiếu bài tập ${du.baiTap?.length ?? 0} câu kèm lời giải`}
      </button>
      <div style={{ fontSize: 12, color: 'var(--p-nhat)', marginTop: 7, lineHeight: 1.6 }}>
        Thầy đã chọn sẵn theo đúng chuyên đề em mất điểm ở bài này, xếp từ dễ lên khó. Lời giải nằm ở trang cuối, em làm hết rồi mới lật.
      </div>
      {loi && <div style={{ fontSize: 12.5, color: 'var(--p-do)', marginTop: 6 }}>{loi}</div>}
    </div>
  )
}

/** Vòng điểm có số chạy lên. Tách riêng để phần đếm số không dựng lại cả trang. */
function VongDiem({ diem, tat }: { diem: number; tat: boolean }) {
  const R = 51
  const C = 2 * Math.PI * R
  const [ra, setRa] = useState(tat)
  const [so, setSo] = useState(tat ? diem : 0)

  useEffect(() => {
    if (tat) return
    let id = 0
    const t0 = performance.now()
    const buoc = (t: number) => {
      const k = Math.min(1, (t - t0) / 950)
      setSo(diem * (1 - Math.pow(1 - k, 3)))
      if (k < 1) id = requestAnimationFrame(buoc)
    }
    const r = requestAnimationFrame(() => {
      setRa(true)
      id = requestAnimationFrame(buoc)
    })
    return () => {
      cancelAnimationFrame(r)
      cancelAnimationFrame(id)
    }
  }, [diem, tat])

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
