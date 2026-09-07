// MỘT THẺ CÂU GẬP MỞ — đề, phương án, đáp án đúng, lời giải.
//
// TÁCH RA TỪ `PhieuScreen` (thầy chốt 06/09: "chỗ mục học sinh chọn câu hỏi bài
// thầy sẽ hiển thị giống như ảnh, giống trong các báo cáo"). Trước đó thẻ này
// nằm riêng trong màn báo cáo; tấm trượt Hỏi bài Thầy chỉ hiện được một dòng
// trích đề thô, LaTeX lọt nguyên ra màn hình.
//
// MỘT BỘ DỰNG DUY NHẤT cho cả hai chỗ: báo cáo và tấm trượt hỏi bài nhìn y hệt
// nhau, và sửa một lần là cả hai cùng đúng.
//
// KHÔNG BAO GIỜ LỘ ĐÁP ÁN SỚM: `anLoiGiai` cắt sạch đáp án đúng, dấu đúng/sai
// và lời giải ra khỏi phần dựng — không giấu bằng CSS. Ca chưa công bố điểm mà
// hiện là em nộp trước biết đáp án rồi nhắn cho bạn chưa nộp.
import { useEffect, useRef, useState } from 'react'
import { ChemText } from '../lib/chem-format'
import { TEN_MUC_DO, TEN_PHAN, type MucDo } from '../lib/phan-tich-lam-bai'
import type { CauSaiChiTiet } from '../lib/phieu-du-lieu'

/** Bảng kiểu của thẻ câu. Dùng biến `--p-*` khai ở `styles/tokens.css` nên
 * dán được vào bất kỳ màn nào, không riêng báo cáo. */
export const CSS_THE_CAU = `
.bc-ghi{font-size:12.5px;color:var(--p-nhat);margin-top:6px}
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
.bc-giai-chot{font-family:var(--serif);font-size:14px;font-weight:800;line-height:1.55}
.bc-giai-nhan{display:block;font-family:var(--sans);font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--p-nhat);margin-bottom:2px}
.bc-giai-y{font-size:13px;margin-top:7px;line-height:1.6;color:var(--p-muc)}
.bc-buoc{font-size:13px;margin-top:5px;padding-left:16px;position:relative;line-height:1.6}
.bc-buoc::before{content:'';position:absolute;left:3px;top:9px;width:5px;height:5px;border-radius:50%;background:var(--p-tim)}
/* Ô tick của tấm trượt Hỏi bài Thầy — thẻ câu ở báo cáo không dựng ô này. */
.bc-tick{flex:0 0 auto;width:24px;height:24px;border-radius:7px;border:1.5px solid var(--p-mo);background:none;
  display:grid;place-items:center;padding:0;cursor:pointer}
.bc-tick[aria-checked="true"]{background:var(--p-tim);border-color:var(--p-tim)}
.bc-tick svg{display:block}
/* NHÃN CÂU LẶP — DE-RIENG-TUNG-EM mục 4.4. Nằm CÙNG HÀNG với số thứ tự câu,
   thấy được mà không phải mở thẻ ra. Luôn có CHỮ, không bao giờ chỉ có màu.
   Dựng ở đây chứ không ở từng màn: báo cáo phụ huynh, màn chi tiết ca của thầy
   và màn em xem lại bài dùng chung thẻ này, nên ba chỗ nói giống hệt nhau. */
.bc-lap{flex:0 0 auto;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap;margin-left:6px}
.bc-lap.sai{background:var(--p3-sai);color:var(--p-trang)}
.bc-lap.sua{background:var(--p3-dung);color:var(--p-trang)}
/* ẢNH CỦA CÂU. Nằm gọn trong bề ngang thẻ, không kéo trang cuộn ngang trên
   điện thoại; nền trắng vì ảnh cắt từ PDF hay có nền trong suốt. */
.bc-hinh{display:block;max-width:100%;height:auto;margin:8px 0 0;border-radius:8px;background:var(--p-trang)}
.bc-hinh.than{margin-top:10px}
.bc-hinh.pa{margin:4px 0 0}
@media (prefers-reduced-motion:reduce){.bc-hop,.bc-mui{transition:none}}
`

const KHOA_Y = ['a', 'b', 'c', 'd']
const KHOA_PA = ['A', 'B', 'C', 'D']

/** Ảnh trong thẻ câu. `loading="lazy"` để báo cáo nhiều hình vẫn mở nhanh trên
 * 4G — phụ huynh cuộn tới đâu tải tới đó. */
function Hinh({ src, lop = '', alt = '' }: { src?: string; lop?: string; alt?: string }) {
  if (!src) return null
  return <img className={`bc-hinh${lop ? ` ${lop}` : ''}`} src={src} alt={alt} loading="lazy" />
}

/** Mọi ảnh chèn ở một vị trí trong câu (sau đề, sau từng phương án, cuối câu). */
function HinhTaiViTri({ c, viTri }: { c: CauSaiChiTiet; viTri: string }) {
  const ds = (c.hinh ?? []).filter((h) => h.viTri === viTri)
  if (ds.length === 0) return null
  return (
    <>
      {ds.map((h, i) => (
        <Hinh key={`${viTri}-${i}`} src={h.src} alt={h.alt ?? ''} />
      ))}
    </>
  )
}

export interface TheCauChiTietProps {
  c: CauSaiChiTiet
  /** Số thứ tự trong danh sách. */
  stt: number
  /** Màu số thứ tự — báo cáo dùng đỏ (câu sai), tấm trượt để mặc định. */
  mauSo?: string
  /** Cắt sạch đáp án và lời giải khỏi phần dựng: ca chưa công bố điểm. */
  anLoiGiai?: boolean
  /** Ô tick bên trái. Không truyền = không có ô tick. */
  tick?: { chon: boolean; bat: () => void; nhan: string }
  /** Mở sẵn lời giải ngay khi dựng. Bố cục v3 mở sẵn câu sai ĐẦU TIÊN
   * (`MO_SAN_CAU_SAI_DAU`) và mở hết khi phụ huynh bấm "Mở tất cả". */
  moSanBanDau?: boolean
}

export default function TheCauChiTiet({ c, stt, mauSo, anLoiGiai = false, tick, moSanBanDau = false }: TheCauChiTietProps) {
  const [mo, setMo] = useState(moSanBanDau)
  // Phụ huynh bấm "Mở tất cả" thì mọi thẻ mở theo; bấm lần nữa thì gập lại.
  // Chỉ nghe khi giá trị ĐỔI, để thẻ phụ huynh tự mở tay không bị đóng sập.
  const moTruoc = useRef(moSanBanDau)
  useEffect(() => {
    if (moTruoc.current !== moSanBanDau) {
      moTruoc.current = moSanBanDau
      setMo(moSanBanDau)
    }
  }, [moSanBanDau])
  const nhanPhan = TEN_PHAN[c.phan] ?? c.phan
  const coAnh = Boolean(c.anhThanCau || c.hinh?.length || c.anhLuaChon?.some(Boolean))
  const coGiai = !anLoiGiai && (c.chot || c.lyDo || c.buoc)
  return (
    <div style={tick ? { display: 'flex', alignItems: 'flex-start', gap: 10 } : undefined}>
      {tick && (
        <button
          type="button"
          role="checkbox"
          aria-checked={tick.chon}
          aria-label={tick.nhan}
          className="bc-tick tap-target"
          style={{ marginTop: 15 }}
          onClick={tick.bat}
        >
          {tick.chon && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--p-trang)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </button>
      )}
      <div style={tick ? { flex: 1, minWidth: 0 } : undefined}>
        <button className="bc-mo" aria-expanded={mo} onClick={() => setMo((v) => !v)}>
          <span className="bc-mo-so" style={mauSo ? { color: mauSo } : undefined}>
            {stt}
          </span>
          <span className="bc-mo-giua">
            <span className="bc-mo-ten">
              {nhanPhan}, câu {c.soCau}
              {/* CHỈ câu lặp mới có nhãn. Câu mới làm đúng thì không có gì để
                  "sửa", gắn nhãn vào là nói sai chuyện đã xảy ra. */}
              {c.laCauLap === true &&
                (c.daSuaDuoc === true ? (
                  <span className="bc-lap sua">Đã sửa được</span>
                ) : typeof c.soLanSai === 'number' ? (
                  <span className="bc-lap sai">Sai lần thứ {c.soLanSai}</span>
                ) : null)}
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
                {/* Ảnh cắt cả thân câu LÀ đề bài — có nó thì không in `de` nữa,
                    đúng như màn làm bài của học sinh. */}
                {c.anhThanCau ? <Hinh src={c.anhThanCau} lop="than" alt="Đề bài" /> : <ChemText text={c.de} />}
                <HinhTaiViTri c={c} viTri="sau_de" />
                {/* Dòng này CHỈ còn khi câu có hình mà gói phiếu đã phải bỏ ảnh
                    ra vì quá cỡ (`giamGoiPhieu`). Còn ảnh thì nói "không kèm
                    hình" là nói sai chuyện đang xảy ra. */}
                {c.coHinh && !coAnh && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--p-nhat)', fontFamily: 'var(--sans)' }}>
                    Câu này có hình trong đề. Bản báo cáo này quá nặng nên không kèm được hình, em xem lại trong bài Thầy chữa trên lớp.
                  </div>
                )}
              </div>

              {c.luaChon && c.phan === 'I' && (
                <div style={{ marginTop: 8 }}>
                  {c.luaChon.map((pa, i) => {
                    const k = KHOA_PA[i]
                    const laDung = !anLoiGiai && k === c.dapAnDung
                    const emChon = k === c.dapAnChon
                    return (
                      <div key={k} className={`bc-pa${laDung ? ' dung' : ''}${emChon && !laDung && !anLoiGiai ? ' chon' : ''}`}>
                        <span className="bc-pa-k" style={{ color: laDung ? 'var(--p-xanh)' : emChon && !anLoiGiai ? 'var(--p-do)' : 'var(--p-nhat)' }}>
                          {k}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          {c.anhLuaChon?.[i] ? <Hinh src={c.anhLuaChon[i]} lop="pa" alt={`Phương án ${k}`} /> : <ChemText text={pa} />}
                          <HinhTaiViTri c={c} viTri={`sau_pa_${k}`} />
                          {laDung && (
                            <span className="bc-co" style={{ background: 'var(--p-xanh)', color: 'var(--p-trang)' }}>
                              đáp án đúng
                            </span>
                          )}
                          {emChon && (laDung ? false : true) && (
                            <span className="bc-co" style={{ background: anLoiGiai ? 'var(--p-chim)' : 'var(--p-do)', color: anLoiGiai ? 'var(--p-nhat)' : 'var(--p-trang)' }}>
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
                      <div key={i} className={`bc-pa${anLoiGiai ? '' : khop ? ' dung' : ' chon'}`}>
                        <span className="bc-pa-k" style={{ color: anLoiGiai ? 'var(--p-nhat)' : khop ? 'var(--p-xanh)' : 'var(--p-do)' }}>
                          {KHOA_Y[i]}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          {c.anhLuaChon?.[i] ? <Hinh src={c.anhLuaChon[i]} lop="pa" alt={`Ý ${KHOA_Y[i]}`} /> : <ChemText text={y} />}
                          <HinhTaiViTri c={c} viTri={`sau_y_${KHOA_Y[i]}`} />
                          <span className="bc-co" style={{ background: 'var(--p-chim)', color: 'var(--p-nhat)' }}>
                            {anLoiGiai ? `em: ${chon === 'D' ? 'Đúng' : chon === 'S' ? 'Sai' : 'bỏ trống'}` : `đúng: ${dung === 'D' ? 'Đúng' : 'Sai'} · em: ${chon === 'D' ? 'Đúng' : chon === 'S' ? 'Sai' : 'bỏ trống'}`}
                          </span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {c.phan === 'III' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {!anLoiGiai && (
                    <div className="bc-pa dung" style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, color: 'var(--p-nhat)' }}>Đáp án đúng</span>
                      <b style={{ marginLeft: 6 }}>{c.dapAnDung}</b>
                    </div>
                  )}
                  <div className={anLoiGiai ? 'bc-pa' : 'bc-pa chon'} style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: 'var(--p-nhat)' }}>Em điền</span>
                    <b style={{ marginLeft: 6 }}>{c.dapAnChon || 'bỏ trống'}</b>
                  </div>
                </div>
              )}

              {coGiai && (
                <div className="bc-giai">
                  {c.chot && (
                    <div className="bc-giai-chot">
                      <span className="bc-giai-nhan">Kiến thức cốt lõi</span>
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

              {anLoiGiai && (
                <div className="bc-ghi">Ca này chưa công bố điểm nên chưa hiện đáp án. Em cứ tick câu nào thấy vướng.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
