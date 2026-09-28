// (d) BÁO CÁO CHI TIẾT — bản vẽ thầy chốt 28/09/2026 (docs/ban-ve-ca-thi-2809, màn d). THAY giao diện báo cáo cũ của thầy (khối gập BaoCaoCaLop + trang BaoCaoMotEm)
// bằng MỘT phong cách: hai tab Cả lớp / Từng em. Số liệu: `BaoCaoCaLop` + `ThemBaoCaoCa` (máy chủ `/gv/bao-cao-ca`: hocSinh, maTran, tbCaTruoc, aiDaLo) và `BaoCaoMotEm`
// (bản tính sẵn có ở màn Theo dõi, ghép máy chủ khi thiếu bảng chấm). Nhận xét của thầy: `/gv/nhan-xet-ca-em`.
// IN / LƯU PDF: `window.print()` + `@media print` A4 (ca-thi.css) — vẽ vào cổng `body > .ct-in-goc`, lúc in chỉ vùng này hiện (khung app ẩn), hộp In của trình duyệt có "Lưu PDF".
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Printer, TrendingDown, TrendingUp } from 'lucide-react'
import type { BaoCaoCaLop } from '../../lib/bao-cao-ca-lop'
import type { BaoCaoMotEm } from '../../lib/bao-cao-mot-em'
import { chuPhut, layNhanXetEm, luuNhanXetEm, type ThemBaoCaoCa } from '../../lib/bao-cao-chi-tiet'
import { soVn } from '../../lib/ket-qua-sau-nop'
import './ca-thi.css'

const TEN_PHAN_DAI = { I: 'Phần I · Trắc nghiệm', II: 'Phần II · Đúng–sai', III: 'Phần III · Trả lời ngắn' } as const
const CHU_O: Record<string, string> = { D: 'Đúng', P: 'Đúng một phần', S: 'Sai', B: 'Bỏ trống', N: 'Chưa chấm', '-': 'Không có câu' }

export interface EmTrongBaoCao {
  sbd: string
  hoTen: string
  soLanRoiMan: number
  nopLuc: string
}
export interface BaoCaoChiTietProps {
  maCa: string
  tenCa: string
  lopCa: string
  /** "28/09/2026" */
  ngay: string
  thoiGianPhut: number | null
  siSo: number
  lop: BaoCaoCaLop | null
  them: ThemBaoCaoCa | null
  dangTai: boolean
  dsEm: EmTrongBaoCao[]
  tab: 'lop' | 'em'
  onTab: (t: 'lop' | 'em') => void
  sbdEm: string
  onChonEm: (sbd: string) => void
  emBc: BaoCaoMotEm | null
  onDong: () => void
  onToanCanh?: (sbd: string) => void
  onGiaoRieng?: (sbd: string) => void
  /** Chỉ để test: bỏ cổng (vẽ tại chỗ). */
  khongCong?: boolean
}

function Vong({ diem, co = 140 }: { diem: number; co?: number }) {
  const r = co / 2 - 10
  const cv = 2 * Math.PI * r
  return (
    <div className="ct-vong-diem" role="img" aria-label={`Điểm ${soVn(diem)} trên 10`}>
      <svg viewBox={`0 0 ${co} ${co}`} aria-hidden="true">
        <circle cx={co / 2} cy={co / 2} r={r} fill="none" stroke="var(--gvm-mat-2)" strokeWidth="12" />
        <circle cx={co / 2} cy={co / 2} r={r} fill="none" stroke={diem >= 8 ? 'var(--gvm-xl)' : diem >= 5 ? 'var(--gvm-xd)' : 'var(--gvm-ho)'} strokeWidth="12" strokeLinecap="round" strokeDasharray={cv.toFixed(1)} strokeDashoffset={(cv * (1 - Math.max(0, Math.min(10, diem)) / 10)).toFixed(1)} />
      </svg>
      <div className="giua">
        <div>
          <b className="so">{soVn(diem)}</b>
          <span>trên 10 điểm</span>
        </div>
      </div>
    </div>
  )
}

export default function BaoCaoChiTiet(p: BaoCaoChiTietProps) {
  const [nhanXet, setNhanXet] = useState('')
  const [nxGoc, setNxGoc] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const [chuLuu, setChuLuu] = useState('')
  useEffect(() => {
    if (p.tab !== 'em' || !p.sbdEm) return
    let huy = false
    setNhanXet('')
    setNxGoc('')
    setChuLuu('')
    void layNhanXetEm(p.maCa, p.sbdEm).then((nd) => {
      if (!huy && nd !== null) {
        setNhanXet(nd)
        setNxGoc(nd)
      }
    })
    return () => {
      huy = true
    }
  }, [p.maCa, p.sbdEm, p.tab])
  useEffect(() => {
    const bo = () => document.body.classList.remove('ct-dang-in')
    window.addEventListener('afterprint', bo)
    return () => {
      window.removeEventListener('afterprint', bo)
      bo()
    }
  }, [])
  const inRa = () => {
    document.body.classList.add('ct-dang-in')
    try {
      window.print()
    } finally {
      setTimeout(() => document.body.classList.remove('ct-dang-in'), 800)
    }
  }
  const luu = async () => {
    setDangLuu(true)
    const loi = await luuNhanXetEm(p.maCa, p.sbdEm, nhanXet)
    setDangLuu(false)
    if (loi) setChuLuu(loi)
    else {
      setNxGoc(nhanXet.trim())
      setChuLuu('Đã lưu nhận xét.')
    }
  }

  const tenEm = (sbd: string) => p.dsEm.find((e) => e.sbd === sbd)?.hoTen || p.them?.hocSinh.find((h) => h.sbd === sbd)?.hoTen || `SBD ${sbd}`
  const hs = p.them?.hocSinh ?? []
  const l = p.lop
  const doiCa = l && l.tb !== null && p.them?.tbCaTruoc !== null && p.them?.tbCaTruoc !== undefined ? l.tb - p.them.tbCaTruoc : null
  const dauIn = (tieuDe: string) => (
    <div className="ct-in-dau">
      <div>
        <b style={{ fontSize: '16pt' }}>{tieuDe}</b>
        <div>Trung tâm luyện thi Hoá — thầy Đỗ Đại Học</div>
      </div>
      <div className="so">
        {p.ngay}
        {p.thoiGianPhut ? ` · ${p.thoiGianPhut} phút` : ''}
      </div>
    </div>
  )

  const trangLop = (
    <div className="ct-bc-trang" data-trang="lop">
      {dauIn(`Báo cáo ca kiểm tra · ${p.tenCa}${p.lopCa ? ` · ${p.lopCa}` : ''}`)}
      {!l && <div className="ct-tam ct-ghi">{p.dangTai ? 'Đang tổng hợp báo cáo…' : 'Chưa em nào có điểm.'}</div>}
      {l && (
        <div className="ct-luoi-4">
          <div className="ct-so-o c-xd">
            <div className="t">
              <i />
              Điểm trung bình
            </div>
            <div className="lon so">
              {l.tb !== null ? soVn(l.tb) : '—'}
              <small>/10</small>
            </div>
            <div className="phu so">
              cao {l.cao !== null ? soVn(l.cao) : '—'} · thấp {l.thap !== null ? soVn(l.thap) : '—'}
            </div>
          </div>
          <div className="ct-so-o c-xl">
            <div className="t">
              <i />
              Đã nộp
            </div>
            <div className="lon so">
              {l.nop}
              <small>/{p.siSo || l.daVao} em</small>
            </div>
            <div className="phu">{l.chuaNop > 0 ? `${l.chuaNop} em chưa nộp` : 'cả lớp đã nộp'}</div>
          </div>
          <div className="ct-so-o c-hp">
            <div className="t">
              <i />
              Thời gian làm
            </div>
            <div className="lon so">
              {l.phutTB ?? '—'}
              <small>phút</small>
            </div>
            <div className="phu">trung bình{p.thoiGianPhut ? ` · ca cho ${p.thoiGianPhut} phút` : ''}</div>
          </div>
          <div className="ct-so-o c-tim">
            <div className="t">
              <i />
              So với ca trước
            </div>
            <div className="lon so">
              {doiCa === null ? '—' : `${doiCa > 0 ? '+' : doiCa < 0 ? '−' : ''}${soVn(Math.abs(doiCa))}`}
              <small>điểm</small>
            </div>
            <div className="phu">
              {doiCa === null ? 'chưa có ca trước đã công bố của lớp' : `trung bình lớp · ${p.them?.caTruoc?.tenCa || 'ca trước'} là ${soVn(p.them!.tbCaTruoc!)}`}
            </div>
          </div>
        </div>
      )}
      {p.them?.maTran && (
        <div className="ct-tam">
          <div className="ct-tam-dau">
            <h2>Bản đồ đúng–sai cả lớp</h2>
            <div className="ct-chu-thich" style={{ margin: 0 }}>
              <span>
                <i className="o-D" />
                Đúng
              </span>
              <span>
                <i className="o-P" />
                Đúng một phần (Phần II)
              </span>
              <span>
                <i className="o-S" />
                Sai
              </span>
              <span>
                <i className="o-B" />
                Bỏ trống
              </span>
            </div>
          </div>
          <p className="ct-ghi" style={{ marginBottom: 10 }}>
            Mỗi hàng một em (điểm cao ở trên), mỗi cột một câu. Cột đỏ dày = câu cả lớp cần chữa.
          </p>
          <div className="ct-nhiet">
            <table aria-label="Bản đồ đúng sai em theo câu">
              <thead>
                <tr>
                  <th />
                  {p.them.maTran.cot.map((c, i) => (
                    <th key={i} className="so" title={`${TEN_PHAN_DAI[c.phan as 'I'] ?? c.phan} · câu ${c.soCau}`}>
                      {i === 0 || p.them!.maTran!.cot[i - 1]!.phan !== c.phan ? `${c.phan}.` : ''}
                      {c.soCau}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.them.maTran.em.map((e) => (
                  <tr key={e.sbd}>
                    <th className="ten">{tenEm(e.sbd)}</th>
                    {e.kq.map((o, i) => (
                      <td key={i} className={`o-${o}`} title={`${tenEm(e.sbd)} · câu ${p.them!.maTran!.cot[i]!.soCau}: ${CHU_O[o]}`} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="ct-kt-luoi">
        <div className="ct-tam">
          <div className="ct-tam-dau">
            <h2>Bảng điểm</h2>
            <span className="ct-ghi ct-khong-in">bấm tên để mở báo cáo từng em</span>
          </div>
          {hs.length === 0 ? (
            <p className="ct-ghi">Chưa có bảng điểm từ máy chủ.</p>
          ) : (
            <div className="ct-bang-wrap">
              <table className="ct-bang">
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Họ tên</th>
                    <th className="so">Điểm</th>
                    <th className="so">Đúng</th>
                    <th className="so">Thời gian</th>
                    <th className="so">So lần trước</th>
                  </tr>
                </thead>
                <tbody>
                  {hs.map((h, i) => (
                    <tr key={h.sbd} className={h.sbd === p.sbdEm ? 'chon' : ''}>
                      <td className="so">{1 + hs.filter((x) => x.tong > h.tong).length}</td>
                      <td>
                        <button
                          type="button"
                          className="lk"
                          onClick={() => {
                            p.onChonEm(h.sbd)
                            p.onTab('em')
                          }}
                          aria-label={`Mở báo cáo của ${tenEm(h.sbd)}`}
                          data-i={i}
                        >
                          {tenEm(h.sbd)}
                        </button>
                      </td>
                      <td className="so">
                        <b>{soVn(h.tong)}</b>
                      </td>
                      <td className="so">{h.dung !== null && h.soCau !== null ? `${h.dung}/${h.soCau}` : '—'}</td>
                      <td className="so">{chuPhut(h.giay)}</td>
                      <td className="so" style={{ color: h.doi === null ? 'var(--gvm-chu-3)' : h.doi > 0 ? 'var(--gvm-xl)' : h.doi < 0 ? 'var(--gvm-ho)' : 'var(--gvm-chu-2)' }}>
                        {h.doi === null ? '—' : `${h.doi > 0 ? '+' : h.doi < 0 ? '−' : ''}${soVn(Math.abs(h.doi))}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="ct-cot-doc">
          <div className="ct-tam">
            <div className="ct-tam-dau">
              <h2>Dạng cả lớp đang vấp</h2>
            </div>
            {!l || l.dang.length === 0 ? (
              <p className="ct-ghi">Chưa có dạng nào quá 30% lớp sai.</p>
            ) : (
              <>
                {l.dang.map((d) => (
                  <div key={d.ten} className={`ct-dang-hang ${d.tiLeDung < 50 ? 'c-ho' : d.tiLeDung < 70 ? 'c-hp' : 'c-xl'}`}>
                    <span>{d.ten}</span>
                    <div className="ct-ray">
                      <span style={{ width: `${Math.max(0, Math.min(100, d.tiLeDung))}%` }} />
                    </div>
                    <b className="so">{Math.round(d.tiLeDung)}%</b>
                  </div>
                ))}
                <p className="ct-ghi" style={{ marginTop: 8 }}>
                  Số = tỉ lệ câu đúng của cả lớp ở dạng đó trong ca.
                </p>
              </>
            )}
          </div>
          {p.them?.aiDaLo && (p.them.aiDaLo.soCauSaiVaoLichOn || p.them.aiDaLo.dangBaiTapKe.length > 0) && (
            <div className="ct-tam">
              <div className="ct-tam-dau">
                <h2>A.I Đỗ Đại Học đã lo</h2>
              </div>
              <div style={{ color: 'var(--gvm-chu-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {p.them.aiDaLo.soCauSaiVaoLichOn ? (
                  <p>
                    · <b className="so">{p.them.aiDaLo.soCauSaiVaoLichOn}</b> câu sai của <b className="so">{p.them.aiDaLo.soEmCoLichOn ?? 0}</b> em đã vào lịch ôn lại.
                  </p>
                ) : null}
                {p.them.aiDaLo.dangBaiTapKe.map((d) => (
                  <p key={d.ten}>
                    · Bài tập về nhà tới ưu tiên dạng <b>{d.ten}</b> ({d.soEm} em).
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const em = p.dsEm.find((e) => e.sbd === p.sbdEm)
  const dongHs = hs.find((h) => h.sbd === p.sbdEm)
  const b = p.emBc
  const hang = dongHs ? 1 + hs.filter((x) => x.tong > dongHs.tong).length : b?.soVoiLop?.hang ?? null
  const trangEm = (
    <div className="ct-bc-trang" data-trang="em">
      {dauIn(`Báo cáo của em · ${p.sbdEm ? tenEm(p.sbdEm) : ''}`)}
      <div className="ct-tam ct-khong-in" style={{ padding: '12px 16px' }}>
        <label className="ct-ghi" htmlFor="ct-chon-em" style={{ fontWeight: 700, color: 'var(--gvm-chu-2)', marginRight: 8 }}>
          Em:
        </label>
        <select id="ct-chon-em" className="ct-chon-em" value={p.sbdEm} onChange={(e) => p.onChonEm(e.target.value)}>
          {!p.sbdEm && <option value="">Chọn em…</option>}
          {(hs.length ? hs.map((h) => h.sbd) : p.dsEm.map((e) => e.sbd)).map((s) => (
            <option key={s} value={s}>
              {tenEm(s)}
            </option>
          ))}
        </select>
      </div>
      {!p.sbdEm ? (
        <div className="ct-tam ct-ghi">Chọn một em để xem báo cáo.</div>
      ) : !b || b.tong === null ? (
        <div className="ct-tam ct-ghi">{b && !b.daNop ? 'Em chưa nộp bài ca này.' : 'Đang tổng hợp báo cáo của em…'}</div>
      ) : (
        <>
          <div className="ct-tam">
            <div className="ct-em-dau">
              <Vong diem={b.tong} />
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800 }}>{tenEm(p.sbdEm)}</h2>
                <p className="ct-ghi">
                  SBD <span className="mono">{p.sbdEm}</span>
                  {p.lopCa ? ` · ${p.lopCa}` : ''}
                  {em?.nopLuc ? ` · nộp lúc ${new Date(em.nopLuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })}` : ''}
                </p>
                <div className="ct-hang-nut" style={{ marginTop: 10 }}>
                  {dongHs && dongHs.doi !== null && (
                    <span className={`ct-nhan ${dongHs.doi >= 0 ? 'n-xl' : 'n-ho'}`}>
                      {dongHs.doi >= 0 ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
                      {dongHs.doi > 0 ? '+' : dongHs.doi < 0 ? '−' : ''}
                      {soVn(Math.abs(dongHs.doi))} điểm so với lần trước ({soVn(dongHs.diemTruoc ?? 0)})
                    </span>
                  )}
                  {b.soVoiLop && (
                    <span className="ct-nhan n-xd">
                      {b.soVoiLop.hieu >= 0 ? '+' : '−'}
                      {soVn(Math.abs(b.soVoiLop.hieu))} so với TB lớp
                    </span>
                  )}
                </div>
              </div>
              <div className="ct-em-so" style={{ minWidth: 0 }}>
                <div>
                  <b className="so">{b.dung !== null && b.tongCau !== null ? `${b.dung}/${b.tongCau}` : '—'}</b>
                  <span>câu đúng</span>
                </div>
                <div>
                  <b className="so">{hang !== null ? `${hang}/${hs.length || b.soVoiLop?.siSo || '—'}` : '—'}</b>
                  <span>hạng trong lớp</span>
                </div>
                <div>
                  <b className="so">{b.chuThoiGian ? b.chuThoiGian.replace(/ \d+ giây$/, '') : '—'}</b>
                  <span>thời gian làm</span>
                </div>
                <div>
                  <b className="so">{em ? `${em.soLanRoiMan} lần` : '—'}</b>
                  <span>rời màn</span>
                </div>
              </div>
            </div>
          </div>
          <div className="ct-em-luoi">
            <div className="ct-tam">
              <div className="ct-tam-dau">
                <h2>Từng câu</h2>
                <div className="ct-chu-thich" style={{ margin: 0 }}>
                  <span>
                    <i className="o-D" />
                    Đúng
                  </span>
                  <span>
                    <i className="o-P" />
                    Đúng một phần
                  </span>
                  <span>
                    <i className="o-S" />
                    Sai
                  </span>
                  <span>
                    <i className="o-B" />
                    Bỏ trống
                  </span>
                </div>
              </div>
              {b.phan.every((x) => x.cau.length === 0) ? (
                <p className="ct-ghi">Chưa có bảng chấm từng câu của em.</p>
              ) : (
                b.phan.map((x) =>
                  x.cau.length === 0 ? null : (
                    <div key={x.ma}>
                      <div className="ct-nhom-phan">
                        {x.ten} · {soVn(x.diem)}/{soVn(x.toiDa)} điểm
                      </div>
                      <div className="ct-o-cau">
                        {x.cau.map((c) => (
                          <div key={c.soCau} className={c.kq} title={`Câu ${c.soCau}`} aria-label={`Câu ${c.soCau}: ${c.kq === 'dung' ? 'đúng' : c.kq === 'sai' ? 'sai' : c.kq === 'mot_phan' ? 'đúng một phần' : 'bỏ trống'}`}>
                            {c.soCau}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
            <div className="ct-tam">
              <div className="ct-tam-dau">
                <h2>Theo dạng bài</h2>
              </div>
              {b.dang.length === 0 ? (
                <p className="ct-ghi">Chưa có dạng của các câu trong ca.</p>
              ) : (
                <>
                  {b.dang.map((d) => (
                    <div key={d.ten} className={`ct-dang-hang ${d.canOn ? 'c-ho' : 'c-xl'}`}>
                      <span>{d.ten}</span>
                      <div className="ct-ray">
                        <span style={{ width: `${(d.dung / d.tong) * 100}%` }} />
                      </div>
                      <b className="so">
                        {d.dung}/{d.tong}
                      </b>
                    </div>
                  ))}
                  <p className="ct-ghi" style={{ marginTop: 6 }}>
                    Số = câu đúng / câu của dạng trong ca.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="ct-em-luoi">
            <div className="ct-tam">
              <div className="ct-tam-dau">
                <h2>Câu cần xem lại</h2>
                <span className="ct-ghi">sai trước · đúng nhưng làm lâu sau</span>
              </div>
              {b.cauXemLai.length === 0 ? (
                <p className="ct-ghi">Không có câu nào cần xem lại.</p>
              ) : (
                <div className="ct-xem-lai">
                  {b.cauXemLai.map((c) => (
                    <div key={c.qid} className="ct-xl">
                      <div className="h">
                        <span>
                          <b style={{ color: 'var(--gvm-chu)' }}>
                            Câu {c.soCau} · {TEN_PHAN_DAI[c.phan]}
                          </b>
                          {c.dang ? ` · ${c.dang}` : ''}
                        </span>
                        <span className="so">
                          {c.giay !== null ? `${c.giay} giây` : ''}
                          {c.tbGiayLop !== null ? ` · lớp TB ${Math.round(c.tbGiayLop)} giây` : ''}
                        </span>
                      </div>
                      {c.de && <p>{c.de.length > 220 ? `${c.de.slice(0, 220)}…` : c.de}</p>}
                      <div className="ct-hang-chip">
                        {c.loai === 'sai' ? (
                          <span className="ct-nhan n-ho">Em chọn {c.dapAnChon || 'bỏ trống'}</span>
                        ) : (
                          <span className="ct-nhan n-hp">Đúng nhưng làm lâu</span>
                        )}
                        {c.dapAnDung && <span className="ct-nhan n-xl">Đáp án đúng {c.dapAnDung}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="ct-tam ct-nhan-xet">
              <div className="ct-tam-dau">
                <h2>Nhận xét của thầy</h2>
              </div>
              <textarea aria-label="Nhận xét của thầy" value={nhanXet} maxLength={2000} onChange={(e) => setNhanXet(e.target.value)} placeholder="Viết vài dòng cho em và phụ huynh…" />
              <div className="ct-hang-nut ct-khong-in" style={{ marginTop: 8, alignItems: 'center' }}>
                <button type="button" className="ct-nut ct-nut-tong ct-nut-nho" onClick={luu} disabled={dangLuu || nhanXet.trim() === nxGoc}>
                  {dangLuu ? 'Đang lưu…' : 'Lưu nhận xét'}
                </button>
                <span className="ct-ghi">{chuLuu || 'Nhận xét in kèm bản PDF.'}</span>
              </div>
              {(p.onToanCanh || p.onGiaoRieng) && (
                <div className="ct-hang-nut ct-khong-in" style={{ marginTop: 12 }}>
                  {p.onToanCanh && (
                    <button type="button" className="ct-nut ct-nut-vien ct-nut-nho" onClick={() => p.onToanCanh!(p.sbdEm)}>
                      Toàn cảnh em
                    </button>
                  )}
                  {p.onGiaoRieng && (
                    <button type="button" className="ct-nut ct-nut-vien ct-nut-nho" onClick={() => p.onGiaoRieng!(p.sbdEm)}>
                      Giao bài riêng
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )

  const noiDung = (
    <div className="ct-in-goc">
      <div className="ct ct-phu-man" role="dialog" aria-modal="true" aria-label="Báo cáo chi tiết" data-vung="bao-cao-chi-tiet">
        <div className="ct-khung">
          <div className="ct-dau ct-khong-in">
            <div>
              <div className="ct-duong">
                Ca kiểm tra › {p.tenCa}
                {p.lopCa ? ` · ${p.lopCa}` : ''} › Báo cáo
              </div>
              <h1>Báo cáo chi tiết</h1>
            </div>
            <div className="ct-hang-nut" style={{ alignItems: 'center' }}>
              <div className="ct-phan-doan" role="tablist" aria-label="Loại báo cáo">
                <button type="button" role="tab" aria-selected={p.tab === 'lop'} onClick={() => p.onTab('lop')}>
                  Cả lớp
                </button>
                <button type="button" role="tab" aria-selected={p.tab === 'em'} onClick={() => p.onTab('em')}>
                  Từng em
                </button>
              </div>
              <button type="button" className="ct-nut ct-nut-chinh" onClick={inRa}>
                <Printer size={18} aria-hidden="true" />
                In / Lưu PDF
              </button>
              <button type="button" className="ct-nut ct-nut-vien" onClick={p.onDong}>
                <ArrowLeft size={18} aria-hidden="true" />
                Đóng
              </button>
            </div>
          </div>
          {p.tab === 'lop' ? trangLop : trangEm}
        </div>
      </div>
    </div>
  )
  return p.khongCong || typeof document === 'undefined' ? noiDung : createPortal(noiDung, document.body)
}
