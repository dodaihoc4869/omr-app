// GỌI LÊN BẢNG NGAY TRONG MÀN THEO DÕI CA — đặc tả mục 4.7.
//
// Vì sao đặt ở đây: thầy vừa chấm xong ca, dữ liệu bài làm và ngân hàng có đáp
// án đã nằm sẵn trên màn này. Bắt thầy sang màn khác rồi chọn lại đề, chọn lại
// lớp là ba thao tác thừa giữa giờ ra chơi.
//
// Mỗi dòng ghi RÕ VÌ SAO chọn em này. Thầy nhìn là biết, không phải tin một
// danh sách từ trên trời rơi xuống.
import { useMemo, useState } from 'react'
import { RefreshCw, ClipboardCopy, Check } from 'lucide-react'
import { Nhan, OThongBao, NutChinh, TheNoiDung } from './DesignSystem'
import {
  bangChu,
  dungDuLieuTuCa,
  nhacHieuNhamChung,
  phanCauLenBang,
  tiLeDungLop,
  type LuotDaCham,
  type NganHangCa,
} from '../lib/phan-cau-len-bang'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const TIEU_DE_MUC: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }

export interface KhoiGoiLenBangProps {
  maCa: string
  tenCa: string
  /** Ngân hàng CÓ đáp án của ca (mergeKeepAnswers) — mang theo sao cần chữa. */
  bank: NganHangCa
  luot: LuotDaCham[]
  onCopy?: (ok: boolean) => void
}

export default function KhoiGoiLenBang({ maCa, tenCa, bank, luot, onCopy }: KhoiGoiLenBangProps) {
  // Số lượt thầy đã bấm gọi. Bắt đầu bằng 1: mở màn ra là thấy ngay lượt đầu,
  // không phải bấm thêm một nút mới có gì để đọc.
  const [soLuot, setSoLuot] = useState(1)
  const [khongNhan, setKhongNhan] = useState<Record<string, string[]>>({})
  const [daCopy, setDaCopy] = useState(false)

  const duLieu = useMemo(() => dungDuLieuTuCa(bank, maCa, luot), [bank, maCa, luot])
  const kq = useMemo(() => phanCauLenBang(duLieu.cau, duLieu.em, maCa, 3, khongNhan), [duLieu, maCa, khongNhan])

  const coMat = duLieu.em.filter((e) => !e.vangMat).length
  const hienLuot = kq.luot.slice(0, soLuot)
  const daHienHet = soLuot >= kq.luot.length
  const conCau = kq.luot.slice(soLuot).reduce((s, l) => s + l.dong.length, 0) + kq.chuaPhan.length

  const doiEm = (qid: string, sbd: string) => setKhongNhan((cu) => ({ ...cu, [qid]: [...(cu[qid] ?? []), sbd] }))

  const copy = () => {
    navigator.clipboard.writeText(bangChu({ ...kq, luot: hienLuot }, tenCa)).then(
      () => {
        setDaCopy(true)
        onCopy?.(true)
      },
      () => onCopy?.(false),
    )
  }

  if (duLieu.cau.length === 0) {
    return (
      <TheNoiDung>
        <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Gọi lên bảng</div>
        <OThongBao tone="cam">Chưa em nào nộp bài trong ca này, chưa có gì để phân câu.</OThongBao>
      </TheNoiDung>
    )
  }

  return (
    <TheNoiDung>
      <div style={TIEU_DE_MUC}>Gọi lên bảng</div>
      <div style={{ ...NHAN_NHO, marginTop: 4 }}>
        {tenCa} · <b style={{ ...SO, color: 'var(--muc)' }}>{coMat}</b> em đã nộp ·{' '}
        <b style={{ ...SO, color: 'var(--muc)' }}>{kq.dangChua.length}</b> câu đáng chữa ·{' '}
        <b style={{ ...SO, color: 'var(--muc)' }}>{kq.chiDoc.length}</b> câu chỉ đọc đáp án
      </div>

      {coMat === 0 && <div style={{ marginTop: 'var(--k3)' }}><OThongBao tone="cam">Chưa em nào nộp bài — không phân được cho ai.</OThongBao></div>}

      {hienLuot.map((l) => (
        <div key={l.luot} style={{ marginTop: 'var(--k4)' }}>
          <div className="font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)', letterSpacing: '.06em' }}>
            LƯỢT {l.luot}
          </div>
          <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k2)' }}>
            {l.dong.map((d) => {
              const nhac = nhacHieuNhamChung(d.cau)
              return (
                <div key={d.cau.qid} style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                  <div className="flex items-start" style={{ gap: 'var(--k2)' }}>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center flex-wrap" style={{ gap: 6 }}>
                        <b style={{ ...SO, fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                          Câu {d.cau.so}
                        </b>
                        <span style={{ ...NHAN_NHO }}>phần {d.cau.phan}</span>
                        {d.cau.sao > 0 && <span style={{ color: 'var(--cam)', letterSpacing: '.05em' }}>{'★'.repeat(d.cau.sao)}</span>}
                        {d.cau.chuyenDe && <Nhan tone="tim">{d.cau.chuyenDe}</Nhan>}
                        <span style={{ ...NHAN_NHO, ...SO }}>
                          lớp đúng {Math.round(tiLeDungLop(d.cau) * 100)}%
                        </span>
                      </span>
                      <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)', marginTop: 4 }}>
                        → <b>{d.hoTen || `SBD ${d.sbd}`}</b> <span style={NHAN_NHO}>({d.viSao})</span>
                      </div>
                      {nhac && (
                        <div style={{ ...NHAN_NHO, color: 'var(--cam)', marginTop: 2 }}>
                          {nhac} — dẫn dắt: "cách này nhiều bạn cũng nghĩ, mình xem vì sao chưa ổn"
                        </div>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => doiEm(d.cau.qid, d.sbd)}
                      className="tap-target shrink-0 inline-flex items-center"
                      style={{ ...NHAN_NHO, gap: 4, color: 'var(--muc)', padding: 6 }}
                      title="Giữ nguyên câu, đổi sang em khác"
                    >
                      <RefreshCw size={14} /> Đổi em khác
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Nút gọi lượt sau CHỈ HIỆN khi còn câu chưa phân. Hết câu thì ẩn hẳn. */}
      {!daHienHet && conCau > 0 && (
        <div style={{ marginTop: 'var(--k4)' }}>
          <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Còn {conCau} câu chưa phân</div>
          <NutChinh variant="phu" onClick={() => setSoLuot((n) => n + 1)}>
            GỌI LƯỢT {soLuot + 1}
          </NutChinh>
        </div>
      )}
      {daHienHet && kq.chuaPhan.length > 0 && (
        <div style={{ marginTop: 'var(--k4)' }}>
          <OThongBao tone="cam">
            Còn {kq.chuaPhan.length} câu đáng chữa mà hết lượt: {kq.chuaPhan.slice(0, 12).map((c) => `Câu ${c.so}`).join(' · ')}
            {kq.chuaPhan.length > 12 ? '…' : ''}
          </OThongBao>
        </div>
      )}

      {kq.chiDoc.length > 0 && (
        <div style={{ marginTop: 'var(--k4)', paddingTop: 'var(--k3)', borderTop: '1px solid var(--vien)' }}>
          <div className="font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)' }}>
            CHỈ ĐỌC ĐÁP ÁN — không cần chữa ({kq.chiDoc.length} câu)
          </div>
          <div style={{ ...NHAN_NHO, ...SO, marginTop: 4 }}>{kq.chiDoc.map((c) => `Câu ${c.so}`).join(' · ')}</div>
        </div>
      )}

      <div style={{ marginTop: 'var(--k4)' }}>
        <NutChinh variant="phu" onClick={copy}>
          <span className="inline-flex items-center gap-2">
            {daCopy ? <Check size={18} /> : <ClipboardCopy size={18} />} {daCopy ? 'Đã copy bảng phân công' : 'Copy bảng phân công'}
          </span>
        </NutChinh>
      </div>
    </TheNoiDung>
  )
}
