// NÚT TẠO PHIẾU BÀI TẬP PDF cho một em, đặt trong hồ sơ chi tiết của em.
//
// Khác nút "Giao bài tập": giao bài tập tạo một CA trong app cho em làm và chấm
// tự động; nút này ra một TỜ GIẤY thầy tải về, in ra hoặc gửi thẳng qua Zalo cho
// em nào không dùng app.
//
// LẦN SAU KHÁC LẦN TRƯỚC: mã câu đã in ra phiếu được nhớ lại ngay trên máy thầy
// (exam-db: qidRaPhieu). Máy chủ chỉ biết câu em đã NỘP, mà phiếu in ra thì em
// đã cầm rồi dù chưa nộp — thiếu sổ này là lần sau phát lại đúng đề cũ.
//
// jsPDF và font nhúng nặng gần 300KB, nên cả bộ vẽ được NẠP ĐỘNG lúc thầy bấm
// nút: người không dùng tới không phải tải.
import { useEffect, useState } from 'react'
import { OThongBao } from './DesignSystem'
import NutPhieuHtml from './NutPhieuHtml'
import { chonCauLuyen, tenTepBaiTap } from '../lib/bai-tap-pdf'
import { docQidRaPhieu, loadExamSources, loadScriptUrl, loadTeacherSecret, themQidRaPhieu, xoaQidRaPhieu } from '../lib/exam-db'
import { qidDaLam } from '../lib/exam-api'
import type { ChuyenDeEm } from '../lib/exam-api'
import { laYeu } from './HoSoEmView'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

export const SO_CAU_PDF_MAC_DINH = 10
export const SO_CAU_PDF_TOI_DA = 60
export const SO_CAU_PDF_TOI_THIEU = 5
/** Mức chọn nhanh — thầy bấm một cái là xong, khỏi kéo thanh trượt. */
export const MUC_SO_CAU = [10, 20, 30, 40, 50, 60]

export default function NutBaiTapPdf({
  sbd,
  hoTen,
  chuyenDe,
  showToast,
}: {
  sbd: string
  hoTen: string
  /** Giữ trong kiểu để nơi gọi không phải sửa; bìa phiếu không in lớp. */
  lop?: string
  chuyenDe: ChuyenDeEm[]
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
}) {
  const [soCau, setSoCau] = useState(SO_CAU_PDF_MAC_DINH)
  const [daRa, setDaRa] = useState(0)
  const [ketQua, setKetQua] = useState<{ soCau: number; lapLai: number; thieu: number; ten: string } | null>(null)

  useEffect(() => {
    let con = true
    void docQidRaPhieu(sbd).then((ds) => con && setDaRa(ds.length))
    return () => {
      con = false
    }
  }, [sbd])

  // Chuyên đề để luyện: ưu tiên chuyên đề ĐỦ DỮ LIỆU và đang yếu (laYeu dùng
  // chung một ngưỡng với bảng mạnh–yếu, hai chỗ không được nói khác nhau).
  const yeu = chuyenDe.filter((c) => laYeu(c))
  const dungDe = (yeu.length > 0 ? yeu : [...chuyenDe].filter((c) => c.soSai > 0).sort((a, b) => b.tiLeSai - a.tiLeSai).slice(0, 2)).map((c) => ({
    ten: c.ten,
    tiLeSai: c.tiLeSai,
  }))

  // Rút câu rồi trả GÓI phiếu cho hai nút Xem / Copy link. Không dựng HTML ở
  // đây: hai nút cần cùng một bộ câu, dựng hai lần là ra hai bộ khác nhau.
  const dungGoi = async () => {
    setKetQua(null)
    try {
      const nguon = await loadExamSources()
      if (nguon.length === 0) throw new Error('Máy này chưa có đề nào. Vào Ngân hàng câu hỏi bấm Đồng bộ trước.')

      // Hai nguồn "câu em đã gặp": máy chủ biết câu em đã NỘP, máy thầy nhớ câu
      // đã IN RA PHIẾU. Thiếu vế nào cũng phát lại câu cũ.
      let daNop: string[] = []
      try {
        const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
        if (url.trim() && mat.trim()) daNop = await qidDaLam(url.trim(), mat.trim(), sbd)
      } catch {
        daNop = []
      }
      const daInRa = await docQidRaPhieu(sbd)
      const tranh = [...new Set([...daNop, ...daInRa])]

      const kq = chonCauLuyen(nguon, { chuyenDe: dungDe, qidDaLam: tranh, soCau })
      if (kq.cau.length === 0) {
        throw new Error(
          dungDe.length > 0
            ? `Kho đề chưa có câu nào thuộc ${dungDe.map((c) => c.ten).join(', ')} (câu có hình không đưa vào phiếu in).`
            : 'Kho đề chưa có câu nào dùng được cho phiếu in.',
        )
      }

      const nhomYeu = (yeu.length > 0 ? yeu : chuyenDe).filter((c) => c.soSai > 0)
      const tt = {
        hoTen,
        sbd,
        ngay: new Date(),
        tenChuyenDe: dungDe[0]?.ten || nhomYeu[0]?.ten || 'Hoá học',
        ketQua: nhomYeu.length > 0 ? `Sai ${nhomYeu.reduce((n, c) => n + c.soSai, 0)}/${nhomYeu.reduce((n, c) => n + c.soCau, 0)} câu` : '',
        hienDapAn: false,
      }
      await themQidRaPhieu(sbd, kq.cau.map((c) => c.id))
      setDaRa((n) => n + kq.cau.length)
      setKetQua({ soCau: kq.cau.length, lapLai: kq.lapLai, thieu: kq.thieu, ten: tenTepBaiTap(hoTen, sbd) })
      return { tt, cau: kq.cau, sbd }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tạo được phiếu bài tập', 'error')
      return null
    }
  }

  const quenLichSu = async () => {
    await xoaQidRaPhieu(sbd)
    setDaRa(0)
    showToast('Đã xoá lịch sử phiếu của em này. Lần sau được phép lấy lại câu cũ.', 'success')
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
      <div>
        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Số câu trong phiếu</div>
        <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
          {MUC_SO_CAU.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSoCau(n)}
              className="tap-target font-bold"
              style={{
                minHeight: 40,
                padding: '0 var(--k4)',
                borderRadius: 'var(--bo-tron)',
                border: 'none',
                background: soCau === n ? 'var(--phu-dam)' : 'var(--the-2)',
                color: soCau === n ? 'var(--muc-nguoc)' : 'var(--muc)',
                fontFamily: 'var(--sans)',
                fontSize: 'var(--cx-2)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <input
          type="range"
          min={SO_CAU_PDF_TOI_THIEU}
          max={SO_CAU_PDF_TOI_DA}
          step={1}
          value={soCau}
          onChange={(e) => setSoCau(Number(e.target.value))}
          aria-label="Số câu trong phiếu"
          style={{ width: '100%', marginTop: 'var(--k3)', accentColor: 'var(--phu-dam)' }}
        />
        <div style={NHAN_NHO}>
          Đang chọn <b style={{ color: 'var(--muc)' }}>{soCau} câu</b> · tối đa {SO_CAU_PDF_TOI_DA}
        </div>
      </div>

      <NutPhieuHtml dungGoi={dungGoi} nhanXem={`Xem phiếu ${soCau} câu`} showToast={showToast} />

      <div style={NHAN_NHO}>
        {dungDe.length > 0
          ? `Rút từ kho đề theo chuyên đề em đang yếu: ${dungDe.map((c) => c.ten).join(', ')}. Xếp từ dễ lên khó.`
          : 'Em chưa đủ dữ liệu để chọn chuyên đề yếu — phiếu sẽ rút từ cả kho đề.'}
      </div>

      {daRa > 0 && (
        <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
          <span style={NHAN_NHO}>Đã in {daRa} câu cho em này, phiếu sau tự tránh những câu đó.</span>
          <button
            type="button"
            onClick={() => void quenLichSu()}
            className="tap-target"
            style={{ ...NHAN_NHO, textDecoration: 'underline', background: 'none', border: 'none', flex: '0 0 auto' }}
          >
            Cho phép lấy lại
          </button>
        </div>
      )}

      {ketQua && (
        <OThongBao tone={ketQua.thieu > 0 || ketQua.lapLai > 0 ? 'cam' : 'xanh'}>
          {`Phiếu ${ketQua.soCau} câu kèm lời giải.`}
          {ketQua.lapLai > 0 && ` Trong đó ${ketQua.lapLai} câu em đã gặp (kho hết câu mới).`}
          {ketQua.thieu > 0 && ` Còn thiếu ${ketQua.thieu} câu so với ${soCau} câu đã chọn.`}
        </OThongBao>
      )}
    </div>
  )
}
