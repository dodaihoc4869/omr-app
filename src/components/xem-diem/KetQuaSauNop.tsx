// HS-1 · KẾT QUẢ NGAY SAU NỘP (thầy chốt bản vẽ 21/09: docs/ban-ve-xem-diem-2109/hs-1a/1b/1c). Ba trạng thái theo luật công bố `CongBoDiem`:
//   da_cong_bo → điểm to + ba phần + MỘT nút chính "Xem báo cáo chi tiết";  ca_lop → "Điểm hiện khi cả lớp nộp xong" (đã nộp a/b em);  khong → "Thầy chưa công bố điểm".
// Hai trạng thái sau KHÔNG nhận, KHÔNG vẽ điểm/đáp án/lời giải — kể cả khi màn cha lỡ truyền: nhánh không đọc `diem`/`phan`.
// Chỉ VẼ khối kết quả; luật chấm, luật công bố, đường nộp, cảnh báo rời màn nằm nguyên ở màn cha. Khối "A.I Đỗ Đại Học đã lo" chưa vẽ (thiếu dữ liệu máy chủ ⇒ ẩn, không bịa).
import { FileText } from 'lucide-react'
import type { PhanKetQua, TrangThaiCongBo } from '../../lib/ket-qua-sau-nop'
import { KetQuaSoLon, NutXd, PhanGon, ThanhTrenXd, TrangThaiChuaCoDiem } from './thanh-phan'
import './ket-qua-kinh.css'

/** Một ô "từng câu" (ca thi 28/09): kết quả chấm của CHÍNH em — chỉ truyền khi `kieu === 'da_cong_bo'`. */
export interface OCauKq {
  phan: 'I' | 'II' | 'III'
  so: number
  kq: 'dung' | 'sai' | 'mot_phan' | 'trong'
}
const TEN_PHAN_O = { I: 'Phần I', II: 'Phần II', III: 'Phần III' } as const
const CHU_O = { dung: 'đúng', sai: 'sai', mot_phan: 'đúng một phần', trong: 'bỏ trống' } as const

export interface KetQuaSauNopProps {
  kieu: TrangThaiCongBo
  /** Tên ca (vd "Kiểm tra 45 phút · Ester – lipid"); rỗng ⇒ "Ca kiểm tra". */
  tenCa: string
  /** "09:12 · Thứ Bảy 19/09/2026" (giờ Việt Nam) hoặc rỗng. */
  gioNop: string
  lanThu?: number
  /** Chỉ dùng khi `kieu === 'da_cong_bo'`. */
  diem?: number
  phan?: PhanKetQua[]
  dung?: number
  tong?: number
  lam?: string | null
  de?: string | null
  /** undefined = không có dữ liệu lần trước; null = ca đầu tiên; số = chênh điểm. */
  ss?: number | null
  truoc?: number
  /** Chỉ dùng khi `kieu === 'ca_lop'`. */
  daNop?: number
  daVao?: number
  onXemBaoCao?: () => void
  onVe?: () => void
  /** (ca thi 28/09) Ô từng câu — CHỈ vẽ khi đã công bố. Bấm câu sai/bỏ trống ⇒ `onXemBaoCao` (báo cáo có lời giải của luồng cũ). */
  cau?: OCauKq[]
  /** Chưa công bố: số câu em đã làm / tổng câu (không phải số câu đúng). */
  soDaLam?: number | null
  tongCau?: number
  lam2?: string | null
}

export default function KetQuaSauNop(p: KetQuaSauNopProps) {
  const ten = p.tenCa.trim() || 'Ca kiểm tra'
  const coDiem = p.kieu === 'da_cong_bo' && typeof p.diem === 'number' && Array.isArray(p.phan) && typeof p.dung === 'number' && typeof p.tong === 'number'
  return (
    <div className="m3 xd kq-kinh" data-vung="ket-qua-sau-nop" data-trang-thai={p.kieu}>
      <ThanhTrenXd ten="Kết quả kiểm tra" phu={ten} onQuayLai={p.onVe} quayLai="Quay lại" />
      <main className="xd-khung">
        <p className="xd-muc__mo-ta">
          Em đã nộp bài{p.gioNop ? ` lúc ${p.gioNop}` : ''}
          {p.lanThu && p.lanThu > 1 ? ` · lần ${p.lanThu}` : ''}
        </p>
        {coDiem ? (
          <>
            <KetQuaSoLon diem={p.diem!} dung={p.dung!} tong={p.tong!} lam={p.lam} de={p.de} ss={p.ss} truoc={p.truoc} />
            {p.phan!.length > 0 && (
              <section className="xd-muc" aria-labelledby="xd-h-3p">
                <div className="xd-muc__dau">
                  <h2 id="xd-h-3p">Ba phần của bài</h2>
                </div>
                <div className="xd-phan-ds">
                  {p.phan!.map((x) => (
                    <PhanGon key={x.ma} p={x} />
                  ))}
                </div>
              </section>
            )}
            {coDiem && p.cau && p.cau.length > 0 && (
              <section className="kq-the" aria-labelledby="kq-h-cau">
                <h3 id="kq-h-cau">
                  Từng câu{p.onXemBaoCao && p.cau.some((c) => c.kq === 'sai' || c.kq === 'trong') ? <span style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--k-chu2)' }}> · bấm câu đỏ xem lời giải</span> : null}
                </h3>
                {(['I', 'II', 'III'] as const).map((ph) => {
                  const ds = p.cau!.filter((c) => c.phan === ph)
                  if (ds.length === 0) return null
                  return (
                    <div key={ph}>
                      <div className="kq-nhom">{TEN_PHAN_O[ph]}</div>
                      <div className="kq-cau">
                        {ds.map((c) =>
                          (c.kq === 'sai' || c.kq === 'trong') && p.onXemBaoCao ? (
                            <button key={c.so} type="button" className={c.kq} onClick={p.onXemBaoCao} aria-label={`Câu ${c.so} ${TEN_PHAN_O[ph]}: ${CHU_O[c.kq]} — xem lời giải`}>
                              {c.so}
                            </button>
                          ) : (
                            <span key={c.so} className={c.kq} role="img" aria-label={`Câu ${c.so} ${TEN_PHAN_O[ph]}: ${CHU_O[c.kq]}`}>
                              {c.so}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )
                })}
              </section>
            )}
            {coDiem && p.cau && p.cau.some((c) => c.kq === 'sai' || c.kq === 'trong') && (
              <section className="kq-the" aria-labelledby="kq-h-ai">
                <h3 id="kq-h-ai">A.I Đỗ Đại Học đã lo cho em</h3>
                <div className="kq-ai">
                  <div>
                    <i />
                    <span>
                      <b className="xd-so">{p.cau.filter((c) => c.kq === 'sai' || c.kq === 'trong').length} câu sai hoặc bỏ trống</b> sẽ vào hàng ôn lại của em, bắt đầu từ ngày mai.
                    </span>
                  </div>
                </div>
              </section>
            )}
            {(p.onXemBaoCao || p.onVe) && (
              <div className="xd-nut-hang">
                {p.onXemBaoCao && (
                  <NutXd rong bieuTuong={<FileText className="xd-i" aria-hidden="true" />} onClick={p.onXemBaoCao}>
                    Xem báo cáo chi tiết
                  </NutXd>
                )}
                {p.onVe && (
                  <NutXd kieu={p.onXemBaoCao ? 'chu' : 'chinh'} rong onClick={p.onVe}>
                    Về bảng nhiệm vụ
                  </NutXd>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <section className="kq-the kq-da-nop" aria-label="Em đã nộp bài">
              <h2>Em đã nộp bài</h2>
              {typeof p.soDaLam === 'number' && typeof p.tongCau === 'number' && p.tongCau > 0 && (
                <div className="kq-3" style={{ width: '100%', marginTop: 6 }}>
                  <div>
                    <b>
                      {p.soDaLam}/{p.tongCau}
                    </b>
                    <span>câu đã làm</span>
                  </div>
                  <div>
                    <b>{p.gioNop.split(' · ')[0] || '—'}</b>
                    <span>giờ nộp</span>
                  </div>
                  <div>
                    <b>{p.lam2 ? p.lam2.replace(/ \d+ giây$/, '') : '—'}</b>
                    <span>làm bài</span>
                  </div>
                </div>
              )}
            </section>
            <TrangThaiChuaCoDiem kieu={p.kieu === 'ca_lop' ? 'ca_lop' : 'khong'} nop={p.daNop} si={p.daVao} luc={p.gioNop.split(' · ')[0]} />
            {p.onVe && (
              <div className="xd-nut-hang">
                <NutXd rong onClick={p.onVe}>
                  Về bảng nhiệm vụ
                </NutXd>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
