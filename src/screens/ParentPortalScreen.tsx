import { LoiChao } from '../components/bat-linh/DongHanh'
// APP PHỤ HUYNH — TRÙNG TU 28/09 (thầy: "Trùng tu toàn bộ app phụ huynh, app phụ huynh không có giao bài cho con nữa chỉ xem được báo cáo mọi thứ về con";
// bản vẽ đã chốt https://claude.ai/artifact/2HShm51xEiuVKcTAUpfeFT). Lệnh mới này THAY quyết định 27/09 "bỏ hẳn app phụ huynh" (màn "đã ngừng" theo công tắc Game Hoá 2.0 đã gỡ):
// app phụ huynh chạy lại, CHỈ XEM — không nút giao bài, không lệnh ghi nào của phụ huynh.
// Tệp này chỉ còn ĐĂNG NHẬP (liên kết riêng ?ph=<pass> hoặc số báo danh của con, như cũ) rồi giao cho `components/ph-v3/AppPhuHuynh` (Hôm nay · Tiến bộ · Ca kiểm tra — bản vẽ tối giản thầy chốt 09/10).
import { useEffect, useState } from 'react'
import { datPassPhuHuynh } from '../lib/mom-api'
import { docPass, nhanPassTuDiaChi, xacDinhPhuHuynh, xoaPass } from '../lib/ph-token'
import { LogoDoc } from '../components/LogoVai'
import AppPhuHuynh from '../components/ph-v3/AppPhuHuynh'
import { tenTheoSbd } from '../lib/exam-api'
import { loadScriptUrl } from '../lib/exam-db'
import { nhoVaiDaDung } from '../lib/vai-tro'
import { datManifestTheoVai } from '../lib/pwa-install'
import '../components/m3'
import '../components/ph-v3/ph-v3.css'

const SBD_STORAGE_KEY = 'omr_ph_sbd'

export default function ParentPortalScreen() {
  const [sbdInput, setSbdInput] = useState('')
  const [sbdHienTai, setSbdHienTai] = useState<string | null>(null)
  const [hoTenCon, setHoTenCon] = useState('')
  const [lopCon, setLopCon] = useState('')
  const [scriptUrl, setScriptUrl] = useState('')
  const [dangTai, setDangTai] = useState(false)
  const [thongBaoLoi, setThongBaoLoi] = useState('')

  useEffect(() => {
    loadScriptUrl().then(async (u) => {
      setScriptUrl(u)
      // LIÊN KẾT RIÊNG CỦA CON (?ph=<pass>, giai đoạn mềm): nhận + xoá khỏi địa chỉ, xác định con bằng token; lỗi thì hiện câu của máy chủ
      // và cho nhập SBD như cũ. Không có liên kết mà máy đã nhớ pass thì dùng lại pass đó.
      const pass = nhanPassTuDiaChi() || docPass()
      if (pass) {
        const kq = await xacDinhPhuHuynh(pass)
        if (kq.ok) {
          datPassPhuHuynh(pass)
          void dangNhapPhuHuynh(kq.sbd, u, { hoTen: kq.hoTen, lop: kq.lop })
          return
        }
        xoaPass()
        datPassPhuHuynh('')
        setThongBaoLoi(kq.error)
      }
      const sbdLuu = localStorage.getItem(SBD_STORAGE_KEY)
      if (sbdLuu && sbdLuu.trim()) {
        void dangNhapPhuHuynh(sbdLuu.trim(), u)
      }
    })
  }, [])

  useEffect(() => {
    nhoVaiDaDung('ph')
    try {
      datManifestTheoVai('ph')
      document.title = 'ĐĐH Phụ Huynh'
      const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
      if (meta) meta.setAttribute('content', 'ĐĐH Phụ Huynh')
    } catch {
      // máy chặn đổi tiêu đề: màn vẫn chạy đúng
    }
  }, [])

  async function dangNhapPhuHuynh(sbd: string, urlParam?: string, conBiet?: { hoTen: string; lop: string }) {
    const sbdSach = sbd.trim()
    if (!sbdSach) {
      setThongBaoLoi('Nhập số báo danh của con.')
      return
    }
    setDangTai(true)
    setThongBaoLoi('')
    const url = urlParam || scriptUrl
    try {
      let ten = conBiet?.hoTen ?? ''
      let lop = conBiet?.lop ?? ''
      if (url && !conBiet) {
        try {
          const info = await tenTheoSbd(url, '', sbdSach)
          if (info && info.hoTen) {
            ten = info.hoTen
            lop = info.lop || ''
          }
        } catch {
          // mạng chậm: bỏ qua tra tên, màn chính lấy tên từ máy chủ sau
        }
      }
      setSbdHienTai(sbdSach)
      setHoTenCon(ten || `Học sinh SBD ${sbdSach}`)
      setLopCon(lop)
      localStorage.setItem(SBD_STORAGE_KEY, sbdSach)
    } catch (e) {
      setThongBaoLoi(e instanceof Error ? e.message : 'Không đăng nhập được')
    } finally {
      setDangTai(false)
    }
  }

  const dangXuat = () => {
    localStorage.removeItem(SBD_STORAGE_KEY)
    xoaPass()
    datPassPhuHuynh('')
    setSbdHienTai(null)
    setHoTenCon('')
    setLopCon('')
    setSbdInput('')
    if (typeof location !== 'undefined' && location.hash) history.replaceState(null, '', location.pathname + location.search)
  }

  if (sbdHienTai) {
    return (
      <div className="m3">
        <AppPhuHuynh sbd={sbdHienTai} hoTen={hoTenCon} lop={lopCon} onDoiSbd={dangXuat} />
      </div>
    )
  }

  // CHƯA ĐĂNG NHẬP: một ô duy nhất — số báo danh của con.
  return (
    <div className="m3">
      <div className="ph3">
        <main className="ph3-vao"><section className="gd-cong-gioi-thieu"><h1>Cùng con nhìn thấy tiến bộ</h1><p>Theo dõi nhịp học, kết quả đã công bố và lời thầy trong một nơi.</p></section>
          <div className="ph3-vao__the">
            <LogoDoc vai="ph" size={48} tieuDe />
            <LoiChao vai="ph" />
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void dangNhapPhuHuynh(sbdInput)
              }}
            >
              <label htmlFor="ph3-sbd">Số báo danh của con</label>
              <input
                id="ph3-sbd"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={sbdInput}
                onChange={(e) => setSbdInput(e.target.value)}
                placeholder="Ví dụ: 12001, 12002…"
                autoFocus
              />
              {thongBaoLoi && <p className="ph3-vao__loi" role="alert">{thongBaoLoi}</p>}
              <button type="submit" className="m3-nut-chinh ph3-vao__nut" disabled={!sbdInput.trim() || dangTai}>
                {dangTai ? 'Đang tra cứu dữ liệu của con…' : 'Vào xem kết quả của con'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
