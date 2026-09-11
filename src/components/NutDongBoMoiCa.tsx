// ĐỒNG BỘ LẠI PHIẾU MỌI CA — nút bấm được từ BẤT KỲ MÁY NÀO.
//
// Thầy chốt 08/09: "bạn phải cho máy nào cũng được và đồng bộ cho tất cả các
// máy bấm". Trước đây việc này chỉ chạy được qua cầu nối `window.__ddh` — tức
// là chỉ chạy được ở cái máy có người ngồi gõ lệnh. Nay là một nút trong app.
//
// VIỆC NÓ LÀM, theo đúng thứ tự:
//   1. Tải lại kho đề (dựng phiếu bằng kho cũ là chép lại đúng cái sai cũ).
//   2. Dựng lại phiếu cho TỪNG CA, TUẦN TỰ. Chạy song song là bắn hàng trăm
//      lượt gọi vào Apps Script cùng lúc rồi ăn hạn mức.
//
// MÃ PHIẾU CŨ ĐƯỢC GIỮ NGUYÊN, nên link đã gửi phụ huynh vẫn sống. Phiếu dựng
// lại là để bổ sung những thứ bản cũ chưa có — trong đó có `linkBaiTap`, thứ
// quyết định phiếu khắc phục có nộp được hay không.
import { useState } from 'react'
import { NutChinh, OThongBao, TheNoiDung } from './DesignSystem'
import { danhSachCa } from '../lib/exam-api'
import { taoPhieuCaCa } from '../lib/phieu-ca-ca'
import { dongBoNganHang } from '../lib/exam-sync'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'

const SO: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-0)', color: 'var(--nhat)' }

export interface DongCa {
  maCa: string
  tenCa: string
  soEm: number
  soPhieuMoi: number
  loi: string
}

export default function NutDongBoMoiCa() {
  const [dang, setDang] = useState(false)
  const [tien, setTien] = useState('')
  const [hoi, setHoi] = useState(false)
  const [loi, setLoi] = useState('')
  const [xong, setXong] = useState<{ ca: DongCa[]; tongEm: number; tongPhieuMoi: number; caLoi: number } | null>(null)

  const chay = async () => {
    setHoi(false)
    setDang(true)
    setLoi('')
    setXong(null)
    try {
      const url = (await loadScriptUrl()).trim()
      const mat = (await loadTeacherSecret()).trim()
      if (!url) throw new Error('Chưa cấu hình địa chỉ máy chủ — vào Ngân hàng câu hỏi → Cấu hình')
      if (!mat) throw new Error('Chưa nhập mã bí mật — vào Ngân hàng câu hỏi → Cấu hình')

      setTien('đang tải lại kho đề…')
      await dongBoNganHang(url, mat, true)

      const ds = (await danhSachCa(url, mat)).filter((c) => c.trangThai !== 'da_xoa')
      const goc = `${location.origin}${import.meta.env.BASE_URL}`
      const ra: DongCa[] = []
      let tongEm = 0
      let tongPhieuMoi = 0
      let caLoi = 0
      for (let i = 0; i < ds.length; i++) {
        const c = ds[i]
        setTien(`ca ${i + 1}/${ds.length} · ${c.tenCa || c.maCa}`)
        try {
          const kq = await taoPhieuCaCa(url, mat, c.maCa, goc, () => {}, true)
          ra.push({ maCa: c.maCa, tenCa: c.tenCa, soEm: kq.dong.length, soPhieuMoi: kq.soMoi, loi: '' })
          tongEm += kq.dong.length
          tongPhieuMoi += kq.soMoi
        } catch (e) {
          caLoi += 1
          ra.push({ maCa: c.maCa, tenCa: c.tenCa, soEm: 0, soPhieuMoi: 0, loi: e instanceof Error ? e.message : String(e) })
        }
      }
      setXong({ ca: ra, tongEm, tongPhieuMoi, caLoi })
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không đồng bộ được')
    } finally {
      setDang(false)
      setTien('')
    }
  }

  return (
    <TheNoiDung>
      <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', color: 'var(--muc)' }}>
        Đồng bộ lại phiếu mọi ca
      </div>
      <div style={{ ...NHAN_NHO, marginTop: 4, lineHeight: 1.6 }}>
        Tải lại kho đề rồi dựng lại phiếu cho từng ca. <b>Mã phiếu cũ giữ nguyên</b>, link đã gửi phụ huynh vẫn mở được. Chạy được ở bất kỳ máy nào đã nhập mã bí mật.
      </div>
      <div style={{ ...NHAN_NHO, marginTop: 4, lineHeight: 1.6 }}>
        Chạy cái này khi phiếu khắc phục trong báo cáo <b>không có nút Nộp bài</b>: nút đó cần mã bài tập, mà phiếu dựng bằng bản app cũ chưa có mã.
      </div>

      {!hoi && !dang && (
        <div style={{ marginTop: 'var(--k3)' }}>
          <NutChinh onClick={() => setHoi(true)}>Đồng bộ lại phiếu mọi ca</NutChinh>
        </div>
      )}

      {hoi && (
        <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
          <OThongBao tone="cam">
            Chạy lâu, mỗi ca vài chục giây, lớp nhiều ca thì mất mươi phút. <b>Đừng đóng tab</b> và đừng chạy khi đang có ca thi mở.
          </OThongBao>
          <div className="flex" style={{ gap: 'var(--k2)' }}>
            <NutChinh variant="phu" onClick={() => setHoi(false)}>
              Huỷ
            </NutChinh>
            <NutChinh onClick={() => void chay()}>Chạy ngay</NutChinh>
          </div>
        </div>
      )}

      {dang && (
        <div style={{ marginTop: 'var(--k3)' }}>
          <OThongBao tone="cam">Đang chạy — {tien || 'chuẩn bị…'}</OThongBao>
        </div>
      )}

      {loi !== '' && (
        <div style={{ marginTop: 'var(--k3)' }}>
          <OThongBao tone="do">{loi}</OThongBao>
        </div>
      )}

      {xong && (
        <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
          <OThongBao tone={xong.caLoi > 0 ? 'cam' : 'xanh'}>
            Xong <b style={SO}>{xong.ca.length}</b> ca · <b style={SO}>{xong.tongEm}</b> em · dựng mới <b style={SO}>{xong.tongPhieuMoi}</b> phiếu
            {xong.caLoi > 0 ? (
              <>
                {' '}
                · <b style={SO}>{xong.caLoi}</b> ca lỗi
              </>
            ) : (
              ''
            )}
          </OThongBao>
          {/* CA LỖI LIỆT KÊ RA HẾT, kèm lý do. Gộp thành một con số là thầy
              tưởng xong cả mà thật ra vài ca vẫn cũ. */}
          {xong.ca
            .filter((c) => c.loi !== '')
            .map((c) => (
              <div key={`loi-${c.maCa}`} style={{ ...NHAN_NHO, color: 'var(--do)' }}>
                <b style={SO}>{c.maCa}</b> {c.tenCa ? `· ${c.tenCa}` : ''} — {c.loi}
              </div>
            ))}
        </div>
      )}
    </TheNoiDung>
  )
}
