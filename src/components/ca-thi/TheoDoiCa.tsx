// (b) THEO DÕI CA — đầu màn theo bản vẽ thầy chốt 28/09/2026 (docs/ban-ve-ca-thi-2809, màn b): tên ca + link + Chép link + đồng hồ vòng; 4 thẻ số màu theo nghĩa
// (Đang làm xanh dương · Đã nộp xanh lục · Chưa vào hổ phách · Cảnh báo hồng) + thanh cả lớp; lưới thẻ từng em có lọc; "Cần thầy xử lý" (khoá bài → Mở khoá sẵn có;
// rời màn; chưa vào); Việc nhanh (Chiếu mã, Kết thúc ca — HỎI LẠI ở hộp xác nhận sẵn có của màn cha). Chỉ VẼ số màn cha đã đếm; mọi lệnh đi qua hàm sẵn có của màn cha.
import { useMemo, useState } from 'react'
import { AlertTriangle, Copy, Lock, MonitorPlay, RefreshCw, Users } from 'lucide-react'
import { soVn } from '../../lib/ket-qua-sau-nop'
import './ca-thi.css'

export type TrangThaiEmTd = 'dang_lam' | 'da_nop' | 'khoa' | 'cho_thi_lai' | 'chua_vao'
export interface EmTheoDoi {
  sbd: string
  hoTen: string
  tt: TrangThaiEmTd
  daLam: number | null
  tongCau: number | null
  soLanRoiMan: number
  tongGiayRoiMan: number
  diem: number | null
}
export interface TheoDoiCaProps {
  tenCa: string
  maCa: string
  link: string
  daChepLink: boolean
  onChepLink: () => void
  /** "08:00 · Thứ Hai 28/09/2026" */
  moLuc: string
  hetHanVao: string
  thoiGianPhut: number
  congBoChu: string
  phamViChu: string
  /** Giây còn lại của em vào muộn nhất đang làm (null = chưa em nào làm). */
  conGiay: number | null
  em: EmTheoDoi[]
  /** null = ca không có danh sách mời (không biết sĩ số) ⇒ ẩn số "Chưa vào". */
  soChuaVao: number | null
  nguongLan: number
  dangTai: boolean
  dangDuyet: string | null
  onLamMoi: () => void
  onMoKhoa: (sbd: string) => void
  onXemEm: (sbd: string) => void
  onChieuMa: () => void
  onKetThuc: () => void
  dangLamNgay: number
}

const TEN_TT: Record<TrangThaiEmTd, string> = { dang_lam: 'Đang làm', da_nop: 'Đã nộp', khoa: 'Bị khoá', cho_thi_lai: 'Chờ thi lại', chua_vao: 'Chưa vào' }
const MAU_TT: Record<TrangThaiEmTd, string> = { dang_lam: 'c-xd', da_nop: 'c-xl', khoa: 'c-ho', cho_thi_lai: 'c-tim', chua_vao: 'c-hp' }
const NHAN_TT: Record<TrangThaiEmTd, string> = { dang_lam: 'n-xd', da_nop: 'n-xl', khoa: 'n-ho', cho_thi_lai: 'n-tim', chua_vao: 'n-hp' }

type Loc = 'tat_ca' | 'canh_bao' | 'chua_vao' | 'da_nop' | 'dang_lam'

export default function TheoDoiCa(p: TheoDoiCaProps) {
  const [loc, setLoc] = useState<Loc>('tat_ca')
  const dangLam = p.em.filter((e) => e.tt === 'dang_lam')
  const daNop = p.em.filter((e) => e.tt === 'da_nop' || e.tt === 'khoa')
  const biKhoa = p.em.filter((e) => e.tt === 'khoa')
  const roiMan = p.em.filter((e) => e.tt === 'dang_lam' && e.soLanRoiMan > 0)
  const canhBao = p.em.filter((e) => e.tt === 'khoa' || e.soLanRoiMan > 0)
  const chuaVao = p.em.filter((e) => e.tt === 'chua_vao')
  const soChuaVao = p.soChuaVao
  const tong = p.em.filter((e) => e.tt !== 'chua_vao').length + (soChuaVao ?? 0)
  const tbDaLam = useMemo(() => {
    const co = dangLam.filter((e) => e.daLam !== null)
    return co.length ? Math.round(co.reduce((a, e) => a + (e.daLam ?? 0), 0) / co.length) : null
  }, [dangLam])
  const tongCau = p.em.find((e) => e.tongCau)?.tongCau ?? null
  const dsLoc = loc === 'canh_bao' ? canhBao : loc === 'chua_vao' ? chuaVao : loc === 'da_nop' ? daNop : loc === 'dang_lam' ? dangLam : p.em
  const phutCon = p.conGiay === null ? null : Math.max(0, p.conGiay)
  const vongR = 56
  const cv = 2 * Math.PI * vongR
  const tiLeCon = phutCon === null ? 0 : Math.min(1, phutCon / Math.max(1, p.thoiGianPhut * 60))
  const pt = (n: number) => (tong > 0 ? `${((n / tong) * 100).toFixed(1)}%` : '0%')
  const coCanXuLy = biKhoa.length + roiMan.length + (soChuaVao ? 1 : 0)
  return (
    <div className="ct ct-khung" data-vung="theo-doi-ca">
      <div className="ct-td-dau">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ct-song">
              <i />
              Ca đang mở · tự làm mới mỗi 20 giây
            </span>
            <button type="button" className="ct-nut ct-nut-vien ct-nut-nho" onClick={p.onLamMoi} disabled={p.dangTai} aria-label="Làm mới ca kiểm tra">
              <RefreshCw size={16} aria-hidden="true" className={p.dangTai ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>
          <h1>{p.tenCa}</h1>
          <div className="ct-meta">
            <span>
              Mở lúc <b className="so">{p.moLuc || '—'}</b> · Hết giờ vào <b className="so">{p.hetHanVao || 'không giới hạn'}</b> · <b className="so">{p.thoiGianPhut} phút</b>
            </span>
            <span>
              Công bố điểm: <b>{p.congBoChu}</b> · {p.phamViChu}
            </span>
          </div>
          <div className="ct-link">
            <Users size={18} aria-hidden="true" style={{ color: 'var(--gvm-xd)' }} />
            <span className="mono">{p.link.replace(/^https?:\/\//, '')}</span>
            <span className="ct-nhan n-xd mono" style={{ flex: 'none' }}>
              Mã ca {p.maCa}
            </span>
            <button type="button" className="ct-nut ct-nut-tong ct-nut-nho" onClick={p.onChepLink}>
              <Copy size={16} aria-hidden="true" />
              {p.daChepLink ? 'Đã chép' : 'Chép link'}
            </button>
          </div>
        </div>
        <div className="ct-vong" role="img" aria-label={phutCon === null ? 'Chưa em nào đang làm' : `Còn ${Math.ceil(phutCon / 60)} phút của em vào muộn nhất`}>
          <svg viewBox="0 0 132 132" aria-hidden="true">
            <circle cx="66" cy="66" r={vongR} fill="none" stroke="var(--gvm-mat)" strokeWidth="12" />
            <circle cx="66" cy="66" r={vongR} fill="none" stroke="var(--gvm-xd)" strokeWidth="12" strokeLinecap="round" strokeDasharray={cv.toFixed(1)} strokeDashoffset={(cv * (1 - tiLeCon)).toFixed(1)} />
          </svg>
          <div className="giua">
            <div>
              <b className="so">{phutCon === null ? '—' : `${Math.floor(phutCon / 60)}:${String(Math.floor(phutCon % 60)).padStart(2, '0')}`}</b>
              <span>phút còn lại</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ct-luoi-4">
        <div className="ct-so-o c-xd">
          <div className="t">
            <i />
            Đang làm
          </div>
          <div className="lon so">
            {dangLam.length}
            <small>em</small>
          </div>
          <div className="phu so">{tbDaLam !== null && tongCau ? `trung bình đã làm ${tbDaLam}/${tongCau} câu` : 'chưa có số câu đã làm'}</div>
        </div>
        <div className="ct-so-o c-xl">
          <div className="t">
            <i />
            Đã nộp
          </div>
          <div className="lon so">
            {daNop.length}
            <small>em</small>
          </div>
          <div className="phu">{daNop.length > 0 ? `${daNop.filter((e) => e.diem !== null).length} em đã có điểm` : 'chưa em nào nộp'}</div>
        </div>
        <div className="ct-so-o c-hp">
          <div className="t">
            <i />
            Chưa vào
          </div>
          <div className="lon so">
            {soChuaVao ?? '—'}
            {soChuaVao !== null && <small>em</small>}
          </div>
          <div className="phu">{soChuaVao === null ? 'ca mở cho mọi em có link' : `hết giờ vào ${p.hetHanVao || 'không giới hạn'}`}</div>
        </div>
        <div className="ct-so-o c-ho">
          <div className="t">
            <i />
            Cảnh báo
          </div>
          <div className="lon so">
            {canhBao.length}
            <small>em</small>
          </div>
          <div className="phu">
            {biKhoa.length} em bị khoá · {roiMan.length} em rời màn
          </div>
        </div>
      </div>
      {tong > 0 && (
        <div className="ct-tam" style={{ padding: '16px 22px' }}>
          <div className="ct-thanh-lop" role="img" aria-label={`Cả lớp ${tong} em: ${daNop.length} đã nộp, ${dangLam.length - roiMan.length} đang làm, ${roiMan.length} cảnh báo, ${soChuaVao ?? 0} chưa vào`}>
            <span style={{ width: pt(daNop.length), background: 'var(--gvm-xl)' }} />
            <span style={{ width: pt(dangLam.length - roiMan.length), background: 'var(--gvm-xd)' }} />
            <span style={{ width: pt(roiMan.length), background: 'var(--gvm-ho)' }} />
            <span style={{ width: pt(soChuaVao ?? 0), background: 'var(--gvm-hp)' }} />
          </div>
          <div className="ct-chu-thich">
            <span>
              <i style={{ background: 'var(--gvm-xl)' }} />
              Đã nộp {daNop.length}
            </span>
            <span>
              <i style={{ background: 'var(--gvm-xd)' }} />
              Đang làm {dangLam.length - roiMan.length}
            </span>
            <span>
              <i style={{ background: 'var(--gvm-ho)' }} />
              Cảnh báo {roiMan.length}
            </span>
            {soChuaVao !== null && (
              <span>
                <i style={{ background: 'var(--gvm-hp)' }} />
                Chưa vào {soChuaVao}
              </span>
            )}
            <span style={{ marginLeft: 'auto' }}>Cả lớp {tong} em</span>
          </div>
        </div>
      )}

      <div className="ct-td-luoi">
        <div className="ct-tam">
          <div className="ct-tam-dau">
            <h2>Từng em</h2>
            <div className="ct-hang-chip" role="group" aria-label="Lọc em">
              {(
                [
                  ['tat_ca', `Tất cả ${p.em.length}`],
                  ['dang_lam', `Đang làm ${dangLam.length}`],
                  ['canh_bao', `Cảnh báo ${canhBao.length}`],
                  ...(chuaVao.length > 0 ? ([['chua_vao', `Chưa vào ${chuaVao.length}`]] as const) : []),
                  ['da_nop', `Đã nộp ${daNop.length}`],
                ] as const
              ).map(([ma, chu]) => (
                <button key={ma} type="button" className="ct-chip" aria-pressed={loc === ma} onClick={() => setLoc(ma)}>
                  {chu}
                </button>
              ))}
            </div>
          </div>
          {dsLoc.length === 0 ? (
            <p className="ct-ghi">Không em nào ở mục này.</p>
          ) : (
            <div className="ct-o-em">
              {dsLoc.map((e) => (
                <button key={e.sbd} type="button" className={`ct-em ${MAU_TT[e.tt]}${e.tt === 'khoa' ? ' canh' : ''}`} onClick={() => p.onXemEm(e.sbd)} disabled={e.tt === 'chua_vao'}>
                  <div className="h">
                    <span className="ten">{e.hoTen || '(chưa có tên)'}</span>
                    <span className={`ct-nhan ${NHAN_TT[e.tt]}`}>{TEN_TT[e.tt]}</span>
                  </div>
                  <span className="sbd so">SBD {e.sbd}</span>
                  {e.tt !== 'chua_vao' && (
                    <>
                      <div className="tien" aria-hidden="true">
                        <span style={{ width: `${e.daLam !== null && e.tongCau ? Math.min(100, (e.daLam / e.tongCau) * 100) : 0}%` }} />
                      </div>
                      <div className="d so">
                        <span>{e.daLam !== null && e.tongCau ? `${e.daLam}/${e.tongCau} câu` : '—'}</span>
                        <span>{e.diem !== null && e.tt !== 'dang_lam' ? `${soVn(e.diem)} điểm` : e.soLanRoiMan > 0 ? `rời màn ${e.soLanRoiMan} lần` : ''}</span>
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ct-cot-doc">
          <div className="ct-tam">
            <div className="ct-tam-dau">
              <h2>Cần thầy xử lý</h2>
              {coCanXuLy > 0 && <span className="ct-nhan n-ho so">{coCanXuLy}</span>}
            </div>
            <div className="ct-canh-bao">
              {coCanXuLy === 0 && <p className="ct-ghi">Chưa có việc gì cần thầy xử lý.</p>}
              {biKhoa.map((e) => (
                <div key={e.sbd} className="ct-cb c-ho">
                  <div className="bt">
                    <Lock size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <b>{e.hoTen || `SBD ${e.sbd}`} bị khoá bài</b>
                    <p className="so">
                      Rời màn {e.soLanRoiMan} lần, tổng {e.tongGiayRoiMan} giây{e.daLam !== null && e.tongCau ? ` · đã làm ${e.daLam}/${e.tongCau} câu` : ''}.
                    </p>
                    <button type="button" className="ct-nut" onClick={() => p.onMoKhoa(e.sbd)} disabled={p.dangDuyet === e.sbd}>
                      {p.dangDuyet === e.sbd ? 'Đang mở khoá…' : 'Mở khoá cho em'}
                    </button>
                  </div>
                </div>
              ))}
              {roiMan.map((e) => (
                <div key={e.sbd} className="ct-cb c-hp">
                  <div className="bt">
                    <AlertTriangle size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <b>
                      {e.hoTen || `SBD ${e.sbd}`} rời màn {e.soLanRoiMan} lần
                    </b>
                    <p>{e.soLanRoiMan + 1 >= p.nguongLan ? 'Thêm 1 lần nữa là khoá bài.' : `Khoá bài khi rời màn ${p.nguongLan} lần.`}</p>
                    <button type="button" className="ct-nut" onClick={() => p.onXemEm(e.sbd)}>
                      Xem hồ sơ em
                    </button>
                  </div>
                </div>
              ))}
              {soChuaVao ? (
                <div className="ct-cb c-xd">
                  <div className="bt">
                    <Users size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <b className="so">{soChuaVao} em chưa vào</b>
                    <p>{p.hetHanVao ? `Hết giờ vào lúc ${p.hetHanVao}.` : 'Ca không giới hạn giờ vào.'}</p>
                    {chuaVao.length > 0 && (
                      <button type="button" className="ct-nut" onClick={() => setLoc('chua_vao')}>
                        Xem {chuaVao.length} em
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="ct-tam">
            <div className="ct-tam-dau">
              <h2>Việc nhanh</h2>
            </div>
            <div className="ct-hd-nhanh">
              <button type="button" className="ct-nut ct-nut-tong" onClick={p.onChieuMa}>
                <MonitorPlay size={18} aria-hidden="true" />
                Chiếu mã lên bảng
              </button>
              <button type="button" className="ct-nut ct-nut-tong" onClick={p.onChepLink}>
                <Copy size={18} aria-hidden="true" />
                Chép link vào thi
              </button>
            </div>
            <button type="button" className="ct-nut ct-nut-do" style={{ width: '100%', marginTop: 10 }} onClick={p.onKetThuc}>
              <Lock size={18} aria-hidden="true" />
              Kết thúc ca ngay
            </button>
            <p className="ct-ghi so" style={{ marginTop: 8 }}>
              Kết thúc ca: em đang làm bị nộp theo phần đã làm ({p.dangLamNgay} em), em chưa vào không vào được nữa. Máy hỏi lại trước khi làm.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
