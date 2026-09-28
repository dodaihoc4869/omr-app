// (c) MÀN KẾT THÚC CA — bản vẽ thầy chốt 28/09/2026 (docs/ban-ve-ca-thi-2809, màn c). Chỉ VẼ số đã có: `BaoCaoCaLop` (máy chủ `/gv/bao-cao-ca` hoặc tính ở máy)
// + phần thêm (`ThemBaoCaoCa`). Dải "Công bố điểm" chỉ hiện khi ca ĐÃ ĐÓNG mà chưa công bố (máy chủ `/gv/cong-bo-ca`). Khối nào không có số thật ⇒ ẩn.
import { Eye, FileText } from 'lucide-react'
import type { BaoCaoCaLop } from '../../lib/bao-cao-ca-lop'
import type { ThemBaoCaoCa } from '../../lib/bao-cao-chi-tiet'
import { soVn } from '../../lib/ket-qua-sau-nop'
import './ca-thi.css'

const TEN_PHAN = { I: 'PHẦN I', II: 'PHẦN II', III: 'PHẦN III' } as const
const TEN_PHAN_DAI = { I: 'Phần I · Trắc nghiệm', II: 'Phần II · Đúng–sai', III: 'Phần III · Trả lời ngắn' } as const
const MAU_PHAN = { I: 'c-xd', II: 'c-tim', III: 'c-xl' } as const
const viet = (ten: string): string =>
  ten
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((x) => x[0] ?? '')
    .join('')
    .toUpperCase() || '?'

export interface KetThucCaProps {
  tenCa: string
  /** "09:20 · Thứ Hai 28/09/2026" hoặc rỗng. */
  luc: string
  siSo: number
  phutDe: number | null
  lop: BaoCaoCaLop | null
  them: ThemBaoCaoCa | null
  dangTai: boolean
  loi: string
  /** Ca đóng mà chưa công bố ⇒ có dải công bố. */
  canCongBo: boolean
  dangCongBo: boolean
  onCongBo: () => void
  onXemBaoCao: () => void
  onMoEm: (sbd: string) => void
  emChuaNop: { sbd: string; hoTen: string }[]
}

export default function KetThucCa(p: KetThucCaProps) {
  const l = p.lop
  const maxPho = l ? Math.max(1, ...l.pho.map((k) => k.soEm)) : 1
  const nhieuNhat = l && l.pho.length ? l.pho.reduce((a, k) => (k.soEm > a.soEm ? k : a), l.pho[0]!) : null
  return (
    <div className="ct ct-khung" data-vung="ket-thuc-ca">
      <div className="ct-dau">
        <div>
          <div className="ct-duong">Ca kiểm tra › {p.tenCa}</div>
          <h1>Ca đã kết thúc</h1>
          <p className="so">
            {p.luc ? `${p.luc} · ` : ''}
            {l ? `${l.nop} trên ${p.siSo || l.daVao} em đã nộp` : p.dangTai ? 'Đang tổng hợp kết quả…' : ''}
          </p>
        </div>
        <div className="ct-hang-nut">
          <button type="button" className="ct-nut ct-nut-vien" onClick={p.onXemBaoCao}>
            <FileText size={18} aria-hidden="true" />
            Xem báo cáo chi tiết
          </button>
        </div>
      </div>

      {p.canCongBo && (
        <div className="ct-cong-bo" role="region" aria-label="Công bố điểm">
          <div>
            <b>Điểm chưa hiện cho học sinh.</b>
            <div style={{ fontSize: 14, marginTop: 2 }}>Ca chọn "Thầy công bố sau". Xem xong thì công bố — em và phụ huynh thấy ngay, câu sai vào lịch ôn lại.</div>
          </div>
          <button type="button" className="ct-nut ct-nut-chinh" onClick={p.onCongBo} disabled={p.dangCongBo}>
            <Eye size={18} aria-hidden="true" />
            {p.dangCongBo ? 'Đang công bố…' : `Công bố điểm cho ${l?.nop ?? ''} em`.replace('  ', ' ')}
          </button>
        </div>
      )}

      {p.loi && !l && <div className="ct-tam ct-ghi">{p.loi}</div>}
      {!l && !p.loi && <div className="ct-tam ct-ghi">{p.dangTai ? 'Đang tổng hợp kết quả của lớp…' : 'Chưa em nào có điểm.'}</div>}

      {l && (
        <>
          <div className="ct-kt-hero">
            <div className="ct-diem-to">
              <div className="nho">Điểm trung bình cả lớp</div>
              <div className="so-lon so">
                {l.tb !== null ? soVn(l.tb) : '—'}
                <small>trên 10</small>
              </div>
              <div className="ba">
                <div>
                  <b className="so">{l.cao !== null ? soVn(l.cao) : '—'}</b>
                  <span>cao nhất</span>
                </div>
                <div>
                  <b className="so">{l.thap !== null ? soVn(l.thap) : '—'}</b>
                  <span>thấp nhất</span>
                </div>
                <div>
                  <b className="so">{l.phutTB !== null ? `${l.phutTB} phút` : '—'}</b>
                  <span>làm trung bình{p.phutDe ? ` (ca ${p.phutDe})` : ''}</span>
                </div>
              </div>
            </div>
            <div className="ct-tam">
              <div className="ct-tam-dau">
                <h2>Phổ điểm</h2>
                {nhieuNhat && nhieuNhat.soEm > 0 && (
                  <span className="ct-ghi">
                    nhiều nhất: {nhieuNhat.nhan} điểm ({nhieuNhat.soEm} em)
                  </span>
                )}
              </div>
              <div className="ct-pho" role="img" aria-label={`Phổ điểm của lớp: ${l.pho.map((k) => `${k.nhan} điểm ${k.soEm} em`).join(', ')}`}>
                {l.pho.map((k, i) => (
                  <div key={k.nhan} className={`cot ${i < 2 ? 'c-ho' : i < 3 ? 'c-hp' : i < 5 ? 'c-xd' : 'c-xl'}`}>
                    <i style={{ height: `${(k.soEm / maxPho) * 100}%` }}>{k.soEm > 0 && <b className="so">{k.soEm}</b>}</i>
                    <span className="so">{k.nhan}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ct-kt-luoi">
            <div className="ct-tam">
              <div className="ct-tam-dau">
                <h2>Câu cả lớp sai nhiều nhất</h2>
              </div>
              {l.cauSai.length === 0 ? (
                <p className="ct-ghi">{l.coBangCham ? 'Không câu nào quá 30% lớp sai.' : 'Chưa có bảng chấm từng câu của ca này.'}</p>
              ) : (
                <div className="ct-cau-sai">
                  {l.cauSai.slice(0, 6).map((c) => (
                    <div key={c.qid} className="ct-cs">
                      <div className="c">
                        <div>
                          <b className="so">{c.soCau}</b>
                          <span>{TEN_PHAN[c.phan]}</span>
                        </div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="ten">{c.dang || 'Dạng chưa đặt tên'}</div>
                        <div className="phu">
                          {c.dapAnDung ? `Đáp án đúng ${c.dapAnDung}` : 'Chưa có đáp án đúng'}
                          {c.dapAnSaiNhieu ? ` · nhiều em chọn ${c.dapAnSaiNhieu.dapAn} (${c.dapAnSaiNhieu.soEm} em)` : ''}
                        </div>
                      </div>
                      <div className="ti so">
                        {c.soSai}/{c.soLam}
                        <small>em sai</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="ct-cot-doc">
              <div className="ct-tam">
                <div className="ct-tam-dau">
                  <h2>Em cần thầy để ý</h2>
                </div>
                <div className="ct-chu-y">
                  {l.emCanYY.length === 0 && p.emChuaNop.length === 0 && <p className="ct-ghi">Không em nào điểm dưới 5 hay tụt mạnh so với lần trước.</p>}
                  {l.emCanYY.map((e) => {
                    const d = p.them?.hocSinh.find((h) => h.sbd === e.sbd)
                    return (
                      <button key={e.sbd} type="button" className={`ct-cy ${d && d.tong < 5 ? 'c-ho' : 'c-hp'}`} onClick={() => p.onMoEm(e.sbd)}>
                        <div className="av">{viet(e.hoTen)}</div>
                        <div className="tt">
                          <b>{e.hoTen || `SBD ${e.sbd}`}</b>
                          <span>{e.lyDo.join(' · ')}</span>
                        </div>
                        {d && <div className="d so">{soVn(d.tong)}</div>}
                      </button>
                    )
                  })}
                  {p.emChuaNop.length > 0 && (
                    <div className="ct-cy c-xam" style={{ cursor: 'default' }}>
                      <div className="av">+{p.emChuaNop.length}</div>
                      <div className="tt">
                        <b>{p.emChuaNop.length} em chưa nộp</b>
                        <span>{p.emChuaNop.slice(0, 4).map((e) => e.hoTen || `SBD ${e.sbd}`).join(' · ')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {l.baPhan.length > 0 && (
                <div className="ct-tam">
                  <div className="ct-tam-dau">
                    <h2>Ba phần của bài</h2>
                    <span className="ct-ghi">trung bình cả lớp</span>
                  </div>
                  <div className="ct-ba-phan">
                    {l.baPhan.map((b) => (
                      <div key={b.ma} className={`ct-bp ${MAU_PHAN[b.ma]}`}>
                        <div className="h">
                          <b>{TEN_PHAN_DAI[b.ma]}</b>
                          <span className="so">
                            {soVn(b.diemTB)} / {soVn(b.toiDa)} điểm · đúng {soVn(b.dungTB)}/{b.tong} câu
                          </span>
                        </div>
                        <div className="ct-ray">
                          <span style={{ width: `${b.toiDa > 0 ? Math.min(100, (b.diemTB / b.toiDa) * 100) : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
