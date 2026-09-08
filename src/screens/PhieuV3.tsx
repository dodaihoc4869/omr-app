// BÁO CÁO GỬI PHỤ HUYNH — BỐ CỤC V3 (PHIEU-PHU-HUYNH-V3.md).
//
// Bản cũ có 10 mục trôi liền nhau và "việc cần làm" nằm ở mục thứ 10 — thứ
// quyết định kết quả nằm đúng chỗ ít người cuộn tới nhất. V3 gom thành BA TẦNG,
// ranh giới hiện ra thành CHỮ chứ không phải chỉ là khoảng cách:
//
//   dải tối   điểm, tên em, đường tiến bộ, nút Vi phạm
//   PHẦN 1    VIỆC CẦN LÀM      — tối nay làm gì, và phiếu luyện
//   PHẦN 2    ĐIỀU GÌ ĐÃ ĐỔI    — dạng đã chắc, dạng rơi lại, cách làm bài
//   PHẦN 3    TỪNG CÂU SAI      — lời giải, câu bỏ trống, đúc kết, cách tính điểm
//
// BỎ HẲN VÒNG ĐIỂM CHẠY SỐ của bản cũ. Nó chạy bằng requestAnimationFrame, mà
// trình duyệt dừng vòng đó khi thẻ không ở trước mặt — đo được 07/09: phiếu mở
// trong thẻ nền hiện "0,00 trên 10" trong khi dữ liệu là 5,75. Số bây giờ vẽ
// thẳng, 78px, không hoạt ảnh nào.
//
// HAI MÀU MANG NGHĨA và chỉ hai: `--p3-dung`, `--p3-sai`. Cấm dùng màu một mình
// để chỉ trạng thái — mỗi chỗ tô màu phải có chữ đi kèm.
import { useMemo, useState } from 'react'
import { classify } from '../engine/score'
import type { PhieuDayDu } from '../lib/phieu-du-lieu'
import { cauHinhPhieu, duocHienHang, NGUONG_LOP_CUNG_SAI } from '../lib/cau-hinh-phieu'
import TheCauChiTiet from '../components/TheCauChiTiet'
import NutTaiBaiTap from '../components/KhoiBaiLuyen'
import { DaiThoiGian, KhoiViPham, ngayNgan, soVN } from '../components/KhoiBaoCaoChung'
import { TEN_PHAN } from '../lib/phan-tich-lam-bai'

export const CSS_V3 = `
.v3{background:var(--p3-nen);color:var(--p-muc);min-height:100vh;font-family:var(--sans);line-height:1.55;padding-bottom:56px}
.v3 *{box-sizing:border-box}
.v3-trong{max-width:600px;margin:0 auto}

.v3-hero{background:var(--p3-hero);color:var(--p-trang);padding:26px 20px 24px}
.v3-hero-ten{font-family:var(--serif);font-size:22px;font-weight:600;line-height:1.2}
.v3-hero-ca{font-size:12.5px;opacity:.72;margin-top:5px}
.v3-diem{display:flex;align-items:baseline;gap:12px;margin-top:18px;flex-wrap:wrap}
.v3-so{font-family:var(--serif);font-size:78px;font-weight:600;line-height:.95;font-variant-numeric:tabular-nums}
.v3-tren{font-size:14px;opacity:.72}
.v3-loai{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.9}
.v3-dem{font-size:12.5px;opacity:.78;margin-top:10px;line-height:1.7}
.v3-spark{margin-top:16px}

.v3-tang{padding:0 16px}
.v3-nhan{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--p-nhat);
  margin:30px 0 10px;padding-top:18px;border-top:1px solid var(--p-vien)}
.v3-tang:first-of-type .v3-nhan{border-top:none;padding-top:22px;margin-top:0}

.v3-the{background:var(--p-giay);border:1px solid var(--p-vien);border-radius:16px;padding:16px;margin-bottom:12px}
.v3-the h3{margin:0 0 8px;font-family:var(--serif);font-size:17px;font-weight:600}
.v3-dong{display:flex;gap:10px;font-size:13.5px;margin-top:8px}
.v3-dong b{flex:0 0 62px;color:var(--p-nhat);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.04em;padding-top:2px}

.v3-chua{border-left:3px solid var(--p3-sai);padding-left:12px;margin-top:12px}
.v3-chua-d{display:flex;justify-content:space-between;gap:12px;font-size:13px;padding:5px 0;border-bottom:1px dashed var(--p-vien)}
.v3-chua-d:last-child{border-bottom:none}
.v3-chua-d span:last-child{flex:0 0 auto;color:var(--p-nhat);font-variant-numeric:tabular-nums}
.v3-chua-thieu{color:var(--p-nhat)}

.v3-dang{display:flex;justify-content:space-between;gap:12px;font-size:13.5px;padding:7px 0;border-bottom:1px solid var(--p-vien)}
.v3-dang:last-child{border-bottom:none}
.v3-dang-so{flex:0 0 auto;font-variant-numeric:tabular-nums;font-weight:700}

.v3-gap{border:1px solid var(--p-vien);border-radius:14px;background:var(--p-giay);margin-bottom:10px;overflow:hidden}
.v3-gap>summary{cursor:pointer;list-style:none;padding:13px 15px;font-size:13.5px;font-weight:600;display:flex;
  align-items:center;justify-content:space-between;gap:10px}
.v3-gap>summary::-webkit-details-marker{display:none}
.v3-gap>summary::after{content:'';width:8px;height:8px;border-right:2px solid var(--p-mo);border-bottom:2px solid var(--p-mo);
  transform:rotate(45deg);flex:0 0 auto;transition:transform .2s ease}
.v3-gap[open]>summary::after{transform:rotate(-135deg)}
.v3-gap-in{padding:0 15px 15px}

.v3-chip{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:6px;
  vertical-align:middle}
.v3-chip.bay{background:var(--p3-sai);color:var(--p-trang)}
.v3-chip.mo{background:var(--p-chim);color:var(--p-nhat)}
.v3-chip.sua{background:var(--p3-dung);color:var(--p-trang)}

/* KHỐI "ĐÃ SỬA ĐƯỢC" — tin tốt duy nhất trong báo cáo mà máy chứng minh được
   bằng số. Đứng NGAY TRÊN mục Từng câu sai, không chôn xuống cuối. */
.v3-sua{border:1px solid var(--p3-dung);border-radius:14px;background:var(--p-giay);padding:13px 15px;margin-bottom:10px}
.v3-sua h3{margin:0 0 6px;font-size:14px}
.v3-sua ul{margin:0;padding-left:18px;font-size:13px;line-height:1.75}

.v3-tinh{font-size:12.5px;color:var(--p-nhat);margin-top:10px;line-height:1.7}
@media (prefers-reduced-motion:reduce){.v3-gap>summary::after{transition:none}}
`

function TangNhan({ so, ten }: { so: number; ten: string }) {
  return (
    <div className="v3-nhan">
      Phần {so} · {ten}
    </div>
  )
}

/** Đường tiến bộ 6 bài gần nhất. ÍT HƠN 2 BÀI THÌ KHÔNG VẼ — một đoạn thẳng nối
 * một điểm với chính nó không nói lên điều gì, chỉ chiếm chỗ. */
/** Đường tiến bộ. `maCaRieng` = mã những ca ĐỀ RIÊNG TỪNG EM: chấm mốc của
 * chúng vẽ RỖNG RUỘT kèm chú thích, vì 30% đề là câu em đã gặp nên điểm nhích
 * lên một phần vì gặp lại. Vẽ đặc như ca thường là để phụ huynh đọc ra một cú
 * tiến bộ mạnh hơn sự thật (DE-RIENG-TUNG-EM mục 2, hệ quả hai). */
function Spark({ ds, maCaRieng }: { ds: { ngay: string; tong: number; maCa: string }[]; maCaRieng?: Set<string> }) {
  const lay = ds.slice(-6)
  if (lay.length < 2) return null
  const W = 260
  const H = 46
  const b = 6
  const x = (i: number) => b + (i * (W - 2 * b)) / (lay.length - 1)
  const y = (v: number) => H - b - (Math.max(0, Math.min(10, v)) / 10) * (H - 2 * b)
  const d = lay.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.tong).toFixed(1)}`).join(' ')
  const cuoi = lay.length - 1
  return (
    <svg className="v3-spark" viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Điểm ${lay.length} bài gần nhất: ${lay.map((p) => soVN(p.tong)).join(', ')}`}>
      <path d={d} fill="none" stroke="var(--p-trang)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
      {lay.map((p, i) => {
        const rieng = maCaRieng?.has(p.maCa) === true
        const r = i === cuoi ? 5.5 : 3
        return (
          <g key={`${p.ngay}-${i}`}>
            <circle
              cx={x(i)}
              cy={y(p.tong)}
              r={r}
              fill={rieng ? 'none' : 'var(--p-trang)'}
              stroke={rieng ? 'var(--p-trang)' : 'none'}
              strokeWidth={rieng ? 1.6 : 0}
              opacity={i === cuoi ? 1 : 0.55}
            >
              <title>{`${ngayNgan(p.ngay)}: ${soVN(p.tong)} điểm${rieng ? ' (bài có câu hỏi lại)' : ''}`}</title>
            </circle>
            {i === cuoi && <circle cx={x(i)} cy={y(p.tong)} r="8.5" fill="none" stroke="var(--p-trang)" strokeWidth="1.5" opacity=".5" />}
          </g>
        )
      })}
    </svg>
  )
}

export default function PhieuV3({ du, laCuaEm = false, xinLink }: { du: PhieuDayDu; laCuaEm?: boolean; xinLink?: () => Promise<string> }) {
  const ch = useMemo(() => cauHinhPhieu(du.cauHinh), [du.cauHinh])
  const hienHang = duocHienHang(ch, du.deRieng)
  const [moHet, setMoHet] = useState(false)

  const soDung = du.tongSoCau !== null ? du.tongSoCau - du.soCauSai : null
  const boTrong = du.cauSai.filter((c) => !String(c.dapAnChon ?? '').trim())
  const chac = du.chuyenDeCa.filter((c) => c.soCau > 0 && c.soSai === 0)
  const roi = du.chuyenDeCa.filter((c) => c.soSai > 0).sort((a, b) => b.soSai / b.soCau - a.soSai / a.soCau)
  const xung = laCuaEm ? 'em' : 'con'
  // Chỉ CA NÀY được biết chắc là ca đề riêng: `hoSoEm` của máy chủ không chở cờ
  // đó cho từng ca cũ, mà bịa ra thì sai. Mỗi báo cáo dựng ở thời điểm ca của
  // nó, nên mốc mới nhất — đúng mốc có điểm bị câu lặp đẩy lên — luôn được vẽ
  // đúng. Ca cũ vẽ như ca thường vì đó là tất cả những gì máy biết.
  const caRieng = useMemo(() => new Set(du.deRieng && du.maCa ? [du.maCa] : []), [du.deRieng, du.maCa])
  const daSua = du.daSuaDuoc ?? []

  return (
    <div className="v3">
      <style>{CSS_V3}</style>

      {/* DẢI TỐI — điểm là thứ đầu tiên đọc được, không phải thứ tự cuộn tới. */}
      <div className="v3-hero">
        <div className="v3-trong">
          <div className="v3-hero-ten">{du.hoTen || `SBD ${du.sbd}`}</div>
          <div className="v3-hero-ca">
            {du.tenCa || `Ca ${du.maCa}`} · {ngayNgan(du.ngay)} · SBD {du.sbd}
            {hienHang && du.hang && du.siSo ? ` · hạng ${du.hang}/${du.siSo}` : ''}
          </div>
          <div className="v3-diem">
            <span className="v3-so">{soVN(du.diem)}</span>
            <span className="v3-tren">trên 10</span>
            <span className="v3-loai">{classify(du.diem)}</span>
          </div>
          <div className="v3-dem">
            {soDung !== null && du.tongSoCau !== null ? `Đúng ${soDung}/${du.tongSoCau} câu` : `Sai ${du.soCauSai} câu`}
            {du.soCauSai > 0 ? ` · sai ${du.soCauSai} câu` : ''}
            {boTrong.length > 0 ? ` · bỏ trống ${boTrong.length} câu` : ''}
          </div>
          {du.dongCauLap ? <div className="v3-dem">{du.dongCauLap}</div> : null}
          <Spark ds={du.lichSu.map((c) => ({ ngay: c.ngay, tong: c.tong, maCa: c.maCa }))} maCaRieng={caRieng} />
          {du.deRieng && <div className="v3-hero-ca" style={{ marginTop: 6 }}>Bài này mỗi bạn một bộ câu, nên không xếp hạng trong lớp.</div>}
          {du.viPham && (
            <div style={{ marginTop: 14 }}>
              <KhoiViPham vp={du.viPham} />
            </div>
          )}
        </div>
      </div>

      <div className="v3-trong">
        {/* ------------------------------------------------ PHẦN 1 */}
        <div className="v3-tang">
          <TangNhan so={1} ten="Việc cần làm" />

          {du.vieCanLam.trim() && (
            <div className="v3-the">
              <h3>Tối nay 15 phút</h3>
              <div style={{ fontSize: 13.5, whiteSpace: 'pre-wrap' }}>{du.vieCanLam.trim()}</div>
            </div>
          )}

          {((du.baiTap && du.baiTap.length > 0) || du.linkBaiTap) && (
            <div className="v3-the">
              <h3>Phiếu luyện đúng chỗ {xung} mất điểm</h3>

              {/* BẢNG ĐỐI CHIẾU: câu nào sai thì phiếu kèm mấy câu chữa. Tổng
                  các dòng PHẢI bằng số câu ở thanh kéo bên dưới. */}
              {du.poolChua && du.poolChua.length > 0 && (
                <div className="v3-chua">
                  {du.poolChua.map((p) => (
                    <div key={`${p.phan}-${p.soCau}`} className="v3-chua-d">
                      <span>
                        {TEN_PHAN[p.phan] ?? p.phan} câu {p.soCau}
                        {p.tenDang ? ` · ${p.tenDang}` : ''}
                      </span>
                      <span>{p.qid.length} câu</span>
                    </div>
                  ))}
                  {/* Câu sai KHÔNG có câu chữa vẫn phải có dòng kèm lý do — im
                      lặng bỏ qua là thầy tưởng phiếu đã chữa hết. */}
                  {(du.thieuChuaChiTiet ?? []).map((t) => (
                    <div key={`thieu-${t.phan}-${t.soCau}`} className="v3-chua-d v3-chua-thieu">
                      <span>
                        {TEN_PHAN[t.phan] ?? t.phan} câu {t.soCau}
                        {t.tenDang ? ` · ${t.tenDang}` : ''}
                      </span>
                      <span>{t.vi}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* KHỐI RÚT BÀI GIỮ NGUYÊN của bản cũ — cùng một component, không
                  phải bản chép. Thầy chốt 07/09: "giữ nguyên mục rút bài trong
                  phiếu mới đầy đủ như trong phiếu cũ". */}
              <NutTaiBaiTap du={du} laCuaEm={laCuaEm} xinLink={xinLink} />
            </div>
          )}
        </div>

        {/* ------------------------------------------------ PHẦN 2 */}
        <div className="v3-tang">
          <TangNhan so={2} ten="Điều gì đã đổi" />

          {roi.length > 0 && (
            <div className="v3-the">
              <h3>Dạng {xung} rơi lại</h3>
              {roi.map((c) => (
                <div key={c.ten} className="v3-dang">
                  <span>{c.ten}</span>
                  <span className="v3-dang-so" style={{ color: 'var(--p3-sai)' }}>
                    sai {c.soSai}/{c.soCau}
                  </span>
                </div>
              ))}
            </div>
          )}

          {du.thongKe && (
            <div className="v3-the">
              <h3>Thời gian làm bài</h3>
              <DaiThoiGian cau={du.dai} tat />
            </div>
          )}

          {chac.length > 0 && (
            <details className="v3-gap">
              <summary>
                Dạng {xung} đang chắc <span className="v3-chip mo">{chac.length} chuyên đề</span>
              </summary>
              <div className="v3-gap-in">
                {chac.map((c) => (
                  <div key={c.ten} className="v3-dang">
                    <span>{c.ten}</span>
                    <span className="v3-dang-so" style={{ color: 'var(--p3-dung)' }}>
                      đúng {c.soCau}/{c.soCau}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {du.tinHieu.length > 0 && (
            <details className="v3-gap">
              <summary>Cách {xung} làm bài</summary>
              <div className="v3-gap-in">
                {du.tinHieu.map((t) => (
                  <div key={t.ma} style={{ fontSize: 13.5, marginTop: 10 }}>
                    <b>{t.nhan}. </b>
                    {t.soLieu} {t.loiKhuyen}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* ------------------------------------------------ PHẦN 3 */}
        <div className="v3-tang">
          <TangNhan so={3} ten="Từng câu sai" />

          {/* TIN TỐT ĐỨNG TRƯỚC. Câu em từng sai mà nay làm đúng KHÔNG nằm
              trong mục câu sai (em có sai đâu), nên nếu không có khối riêng
              này thì việc sửa được biến mất khỏi báo cáo. */}
          {daSua.length > 0 && (
            <div className="v3-sua">
              <h3>
                {xung === 'em' ? 'Em' : 'Con'} đã sửa được {daSua.length} câu từng sai
              </h3>
              <ul>
                {daSua.map((c) => (
                  <li key={c.qid}>
                    Câu {c.soCau} phần {c.phan}
                    {c.chuyenDe ? ` · ${c.chuyenDe}` : ''}
                    <span className="v3-chip sua">Đã sửa được</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {du.cauSai.length === 0 ? (
            <div className="v3-the">
              <div style={{ fontSize: 13.5 }}>Bài này {xung} không sai câu nào.</div>
            </div>
          ) : (
            <div className="v3-the">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h3 style={{ margin: 0 }}>{du.cauSai.length} câu sai</h3>
                <button
                  type="button"
                  onClick={() => setMoHet((v) => !v)}
                  style={{ background: 'none', border: '1px solid var(--p-vien)', borderRadius: 999, padding: '5px 12px', fontSize: 12.5, color: 'var(--p-nhat)', font: 'inherit', cursor: 'pointer' }}
                >
                  {moHet ? 'Gập lại' : 'Mở tất cả'}
                </button>
              </div>
              {du.cauSai.map((c, i) => (
                <div key={`${c.qid}-${i}`}>
                  {/* Câu cả lớp cùng chọn một phương án sai là BẪY CỦA ĐỀ, không
                      phải lỗi riêng của em. Nói ra bằng số thật, không bằng
                      phần trăm làm tròn. */}
                  {/* Nhãn "sai lần thứ N" nằm TRONG thẻ câu (`TheCauChiTiet`),
                      không dựng lại ở đây: ba chỗ hiện nhãn phải cùng một bản. */}
                  {typeof c.tiLeLopSai === 'number' && c.tiLeLopSai >= NGUONG_LOP_CUNG_SAI && c.soLopSai && c.siSoLop ? (
                    <div style={{ fontSize: 12, marginTop: 10 }}>
                      <span className="v3-chip bay">
                        {c.soLopSai}/{c.siSoLop} bạn cùng sai
                      </span>
                    </div>
                  ) : null}
                  <TheCauChiTiet c={c} stt={i + 1} anLoiGiai={!ch.HIEN_LOI_GIAI_DAY_DU} moSanBanDau={moHet || (i === 0 && ch.MO_SAN_CAU_SAI_DAU)} />
                  {c.lichSuChuyenDe && c.lichSuChuyenDe.soCau > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--p-nhat)', margin: '2px 0 8px 40px' }}>
                      Cả năm {xung} làm {c.lichSuChuyenDe.soCau} câu {c.chuyenDe || 'dạng này'}, sai {c.lichSuChuyenDe.soSai}.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {boTrong.length > 0 && (
            <details className="v3-gap">
              <summary>
                {boTrong.length} câu {xung} bỏ trống
              </summary>
              <div className="v3-gap-in">
                <div style={{ fontSize: 13 }}>
                  {boTrong.map((c) => `${TEN_PHAN[c.phan] ?? c.phan} câu ${c.soCau}`).join(' · ')}
                </div>
              </div>
            </details>
          )}

          {du.ducKet.length > 0 && (
            <details className="v3-gap">
              <summary>Đúc kết chép vào sổ</summary>
              <div className="v3-gap-in">
                {du.ducKet.map((d) => (
                  <div key={d.chuyenDe} style={{ fontSize: 13.5, marginTop: 10 }}>
                    <b>{d.chuyenDe}</b>
                    {d.lyThuyet.length > 0 && <div style={{ marginTop: 4 }}>Phải thuộc: {d.lyThuyet.join(' · ')}</div>}
                    {d.kyNang.length > 0 && <div style={{ marginTop: 4 }}>Phải làm được: {d.kyNang.join(' · ')}</div>}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* CÁCH TÍNH ĐIỂM — điều phụ huynh bối rối nhất là "không có thông tin
              nào về việc làm sao ra được điểm đó". Dòng này tính lại từ bảng
              chấm, không lấy lại con số đang cần kiểm. */}
          {du.cachTinhDiem && <div className="v3-tinh">{du.cachTinhDiem}</div>}
        </div>
      </div>
    </div>
  )
}
