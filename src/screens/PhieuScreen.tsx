// PHIẾU KẾT QUẢ — trang phụ huynh mở từ link trong tin nhắn Zalo.
//
// Trang này KHÔNG phải một màn của app quản lý: không thanh menu, không hộp
// thư, không gọi máy chủ, không đọc IndexedDB, không mã bí mật. Toàn bộ số liệu
// lấy từ phần sau dấu `#` của chính đường link (lib/phieu-link.ts), nên phiếu
// dựng xong trong máy phụ huynh và mở được cả khi mất mạng.
//
// Màu lấy từ nhóm `--p-*` trong tokens.css — nhóm đó CỐ Ý không định nghĩa lại
// ở khối nền tối: phiếu rời máy thầy, mở trên máy lạ, nên luôn phải là giấy
// trắng mực đen. Máy phụ huynh để nền tối cũng không được đổi màu phiếu.
//
// Hoạt ảnh: chỉ động vào `transform` và `opacity` (GPU lo, không kích hoạt
// layout) nên mượt cả trên máy yếu. Máy bật "giảm chuyển động" thì hiện thẳng
// trạng thái cuối, không nhấp nháy.
import { useEffect, useMemo, useRef, useState } from 'react'
import { classify } from '../engine/score'
import { giaiPhieu, type DuLieuPhieuLink } from '../lib/phieu-link'

const CSS = `
.pk-goc{min-height:100vh;background:var(--p-nen);color:var(--p-muc);font-family:var(--sans);
  -webkit-font-smoothing:antialiased;padding-bottom:48px}
.pk-trong{max-width:520px;margin:0 auto}

/* ----- ĐẦU PHIẾU: dải tím có hai vệt sáng trôi rất chậm ----- */
.pk-dau{position:relative;overflow:hidden;background:linear-gradient(135deg,var(--p-tim),var(--p-tim-2));
  padding:38px 22px 96px;color:var(--p-trang)}
.pk-dau::before,.pk-dau::after{content:'';position:absolute;width:280px;height:280px;border-radius:50%;
  filter:blur(56px);opacity:.42;will-change:transform}
.pk-dau::before{background:var(--p-trang);top:-140px;left:-90px;animation:pk-troi1 17s ease-in-out infinite}
.pk-dau::after{background:var(--p-tim);bottom:-170px;right:-110px;animation:pk-troi2 21s ease-in-out infinite}
@keyframes pk-troi1{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(56px,34px,0) scale(1.14)}}
@keyframes pk-troi2{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-46px,-30px,0) scale(1.2)}}
.pk-noi{position:relative}
.pk-hieu{font-size:11px;font-weight:700;letter-spacing:.19em;text-transform:uppercase;opacity:.86}
.pk-ten-phieu{font-family:var(--serif);font-size:30px;font-weight:700;line-height:1.15;margin-top:8px}
.pk-ca{margin-top:8px;font-size:13px;opacity:.9}

/* ----- THẺ ĐIỂM đè lên dải tím ----- */
.pk-the-diem{margin:-72px 14px 0;background:var(--p-giay);border-radius:22px;padding:22px 20px;
  box-shadow:var(--p-bong);position:relative}
.pk-em{font-family:var(--serif);font-size:23px;font-weight:700;line-height:1.2}
.pk-em-phu{margin-top:5px;font-size:12.5px;color:var(--p-nhat)}
.pk-hang-diem{display:flex;align-items:center;gap:18px;margin-top:18px}
.pk-vong{position:relative;width:118px;height:118px;flex:0 0 auto}
.pk-vong svg{width:118px;height:118px;transform:rotate(-90deg)}
.pk-vong-so{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.pk-so{font-family:var(--serif);font-size:33px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.pk-tren10{font-size:11px;color:var(--p-mo);margin-top:3px}
.pk-canh{flex:1;min-width:0;display:flex;flex-direction:column;gap:9px}
.pk-nhan{display:inline-flex;align-items:center;align-self:flex-start;height:28px;padding:0 12px;
  border-radius:999px;font-size:12.5px;font-weight:700}
.pk-doi{display:flex;justify-content:space-between;font-size:13px;gap:10px}
.pk-doi span:first-child{color:var(--p-nhat)}
.pk-doi span:last-child{font-weight:700;font-variant-numeric:tabular-nums}

/* ----- KHỐI ----- */
.pk-khoi{margin:16px 14px 0;background:var(--p-giay);border-radius:18px;padding:18px 18px 20px;
  border:1px solid var(--p-vien)}
.pk-tieu{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--p-nhat);
  margin-bottom:14px}
.pk-dong{margin-top:14px}
.pk-dong:first-of-type{margin-top:0}
.pk-dong-tren{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:13.5px}
.pk-dong-ten{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-dong-so{font-weight:700;font-variant-numeric:tabular-nums;flex:0 0 auto}
.pk-ray{height:8px;border-radius:999px;background:var(--p-chim);margin-top:7px;overflow:hidden}
.pk-day{height:100%;border-radius:999px;width:0;transition:width 1s cubic-bezier(.22,.9,.28,1)}

/* ----- VIỆC CẦN LÀM ----- */
.pk-viec{margin:16px 14px 0;background:var(--p-giay);border-radius:18px;padding:18px 18px 18px 20px;
  border:1px solid var(--p-vien);border-left:4px solid var(--p-tim)}
.pk-viec-chu{font-family:var(--serif);font-size:15.5px;line-height:1.62;margin-top:10px}

.pk-chan{margin:22px 14px 0;text-align:center;color:var(--p-mo);font-size:11.5px;line-height:1.7}
.pk-chan b{color:var(--p-nhat)}

/* ----- HIỆN DẦN, so le từng khối ----- */
.pk-vao{opacity:0;transform:translate3d(0,16px,0);transition:opacity .62s ease,transform .62s cubic-bezier(.22,.9,.28,1)}
.pk-vao.pk-ra{opacity:1;transform:none}

@media (prefers-reduced-motion:reduce){
  .pk-dau::before,.pk-dau::after{animation:none}
  .pk-vao{transition:none;opacity:1;transform:none}
  .pk-day{transition:none}
}
`

function soVN(x: number, soLe = 2): string {
  return x.toFixed(soLe).replace('.', ',')
}

function ngayVN(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** Màu theo xếp loại — cùng thang với ảnh phiếu để hai thứ không đá nhau. */
function mauXepLoai(diem: number): string {
  if (diem >= 8) return 'var(--p-xanh)'
  if (diem >= 6.5) return 'var(--p-tim)'
  if (diem >= 5) return 'var(--p-cam)'
  return 'var(--p-do)'
}

/** Đếm số chạy lên. Dùng thời gian thật chứ không cộng dồn theo khung hình:
 * máy yếu bỏ khung thì vẫn dừng đúng lúc và đúng số. */
function useDemLen(dich: number, chay: boolean, ms = 950): number {
  const [v, setV] = useState(chay ? 0 : dich)
  useEffect(() => {
    if (!chay) {
      setV(dich)
      return
    }
    let id = 0
    const t0 = performance.now()
    const buoc = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      setV(dich * (1 - Math.pow(1 - k, 3)))
      if (k < 1) id = requestAnimationFrame(buoc)
    }
    id = requestAnimationFrame(buoc)
    return () => cancelAnimationFrame(id)
  }, [dich, chay, ms])
  return v
}

const R = 52
const CHU_VI = 2 * Math.PI * R

export default function PhieuScreen() {
  const [du, setDu] = useState<DuLieuPhieuLink | null | undefined>(undefined)
  const [ra, setRa] = useState(false)
  const daDoc = useRef(false)

  const dongYen = useMemo(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useEffect(() => {
    if (daDoc.current) return
    daDoc.current = true
    void giaiPhieu(location.hash).then((d) => {
      setDu(d)
      // Đợi một khung hình rồi mới bật hoạt ảnh, để trình duyệt kịp ghi nhận
      // trạng thái đầu — bật ngay trong cùng khung thì không có gì để chuyển.
      requestAnimationFrame(() => requestAnimationFrame(() => setRa(true)))
    })
  }, [])

  const diem = du?.diem ?? 0
  const chay = ra && !dongYen
  const soChay = useDemLen(diem, chay)

  useEffect(() => {
    if (!du) return
    document.title = `Phiếu kết quả ${du.hoTen || du.sbd}`
  }, [du])

  if (du === undefined) {
    return (
      <div className="pk-goc" style={{ display: 'grid', placeItems: 'center' }}>
        <style>{CSS}</style>
        <div style={{ color: 'var(--p-nhat)', fontSize: 14 }}>Đang mở phiếu…</div>
      </div>
    )
  }

  // Link hỏng thì NÓI THẲNG là hỏng. Dựng phiếu với phần dữ liệu đọc được là
  // đưa cho phụ huynh một tờ phiếu sai số.
  if (du === null) {
    return (
      <div className="pk-goc" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
        <style>{CSS}</style>
        <div style={{ maxWidth: 340, textAlign: 'center', lineHeight: 1.7 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700 }}>Link phiếu không đọc được</div>
          <div style={{ marginTop: 10, color: 'var(--p-nhat)', fontSize: 14 }}>
            Link có thể bị cắt ngắn khi chuyển tiếp. Anh/chị nhắn lại cho Thầy Đỗ Đại Học để nhận link mới.
          </div>
        </div>
      </div>
    )
  }

  const xep = classify(diem)
  const mau = mauXepLoai(diem)
  const dung = du.tongSoCau ? du.tongSoCau - du.soCauSai : null
  const keo = (i: number): React.CSSProperties => ({ transitionDelay: dongYen ? '0ms' : `${90 + i * 85}ms` })
  const cls = `pk-vao${ra ? ' pk-ra' : ''}`
  const sai = du.chuyenDe.filter((c) => c.soSai > 0).sort((a, b) => b.soSai / Math.max(1, b.soCau) - a.soSai / Math.max(1, a.soCau))

  const phan: { ten: string; diem: number }[] = du.diemPhan
    ? [
        { ten: 'Phần I, trắc nghiệm', diem: du.diemPhan.I },
        { ten: 'Phần II, đúng/sai', diem: du.diemPhan.II },
        { ten: 'Phần III, trả lời ngắn', diem: du.diemPhan.III },
      ]
    : []

  return (
    <div className="pk-goc">
      <style>{CSS}</style>
      <div className="pk-trong">
        <header className="pk-dau">
          <div className="pk-noi">
            <div className="pk-hieu">Thầy Đỗ Đại Học</div>
            <div className="pk-ten-phieu">Phiếu kết quả</div>
            <div className="pk-ca">
              {du.tenCa ? `${du.tenCa} · ` : ''}
              {ngayVN(du.ngay)}
            </div>
          </div>
        </header>

        <section className={`pk-the-diem ${cls}`} style={keo(0)}>
          <div className="pk-em">{du.hoTen || `SBD ${du.sbd}`}</div>
          <div className="pk-em-phu">
            {du.sbd ? `SBD ${du.sbd}` : ''}
            {du.lop ? ` · Lớp ${du.lop}` : ''}
          </div>

          <div className="pk-hang-diem">
            <div className="pk-vong">
              <svg viewBox="0 0 118 118" aria-hidden="true">
                <circle cx="59" cy="59" r={R} fill="none" stroke="var(--p-chim)" strokeWidth="9" />
                <circle
                  cx="59"
                  cy="59"
                  r={R}
                  fill="none"
                  stroke={mau}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={CHU_VI}
                  strokeDashoffset={ra || dongYen ? CHU_VI * (1 - Math.min(1, diem / 10)) : CHU_VI}
                  style={{ transition: dongYen ? 'none' : 'stroke-dashoffset 1.05s cubic-bezier(.22,.9,.28,1) .12s' }}
                />
              </svg>
              <div className="pk-vong-so">
                <div className="pk-so" style={{ color: mau }}>
                  {soVN(chay ? soChay : diem)}
                </div>
                <div className="pk-tren10">trên 10</div>
              </div>
            </div>

            <div className="pk-canh">
              <span className="pk-nhan" style={{ background: 'var(--p-chim)', color: mau }}>
                {xep}
              </span>
              {dung !== null && (
                <div className="pk-doi">
                  <span>Số câu đúng</span>
                  <span>
                    {dung}/{du.tongSoCau}
                  </span>
                </div>
              )}
              {du.hang !== null && du.siSo !== null && (
                <div className="pk-doi">
                  <span>Hạng trong ca</span>
                  <span>
                    {du.hang}/{du.siSo}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {phan.length > 0 && (
          <section className={`pk-khoi ${cls}`} style={keo(1)}>
            <div className="pk-tieu">Điểm từng phần</div>
            {phan.map((p, i) => (
              <div className="pk-dong" key={p.ten}>
                <div className="pk-dong-tren">
                  <span className="pk-dong-ten">{p.ten}</span>
                  <span className="pk-dong-so">{soVN(p.diem)}/10</span>
                </div>
                <div className="pk-ray">
                  <div
                    className="pk-day"
                    style={{
                      width: ra || dongYen ? `${Math.max(0, Math.min(100, p.diem * 10))}%` : 0,
                      background: mauXepLoai(p.diem),
                      transitionDelay: dongYen ? '0ms' : `${320 + i * 110}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        {sai.length > 0 && (
          <section className={`pk-khoi ${cls}`} style={keo(2)}>
            <div className="pk-tieu">Chuyên đề mất điểm</div>
            {sai.map((c, i) => (
              <div className="pk-dong" key={c.ten}>
                <div className="pk-dong-tren">
                  <span className="pk-dong-ten">{c.ten}</span>
                  <span className="pk-dong-so" style={{ color: 'var(--p-do)' }}>
                    sai {c.soSai}/{c.soCau}
                  </span>
                </div>
                <div className="pk-ray">
                  <div
                    className="pk-day"
                    style={{
                      width: ra || dongYen ? `${Math.max(0, Math.min(100, (c.soSai / Math.max(1, c.soCau)) * 100))}%` : 0,
                      background: 'var(--p-do)',
                      transitionDelay: dongYen ? '0ms' : `${420 + i * 110}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        {du.vieCanLam.trim() && (
          <section className={`pk-viec ${cls}`} style={keo(3)}>
            <div className="pk-tieu">Việc cần làm</div>
            <div className="pk-viec-chu">{du.vieCanLam}</div>
          </section>
        )}

        <footer className={`pk-chan ${cls}`} style={keo(4)}>
          <div>
            <b>Thầy Đỗ Đại Học</b>
          </div>
          <div>Phiếu riêng của em {du.hoTen || du.sbd}, anh/chị giữ trong máy, không chuyển tiếp.</div>
        </footer>
      </div>
    </div>
  )
}
