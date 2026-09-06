// CÀI ĐẶT → MẬT KHẨU MỞ APP — MATKHAUMOAPP.md mục 4E và 6.
//
// Ba việc: đổi mật khẩu · gỡ mật khẩu · chọn nấc hỏi lại.
//
// Màn xác nhận gỡ NÓI THẲNG hậu quả: gỡ xong mã bí mật quay về dạng chữ thường
// trong máy, tức là quay lại đúng tình trạng trước khi có tính năng này. Không
// tô hồng — thầy phải biết mình vừa bỏ cái gì.
import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { NutChinh, OThongBao } from './DesignSystem'
import { datMaBiMatPhien, docGiuPhien, goKhoaApp, loadKhoaApp, loadTeacherSecret, luuGiuPhien, saveKhoaApp } from '../lib/exam-db'
import { catPhien, donPhien, xoaChiaPhien } from '../lib/khoa-phien'
import { TEN_NAC, TOI_THIEU_KY_TU, doiMatKhau, hopLeMatKhau, moKhoa, type BanGhiKhoa, type NacHoiLai } from '../lib/khoa-app'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }
const O_NHAP: React.CSSProperties = {
  height: 46,
  width: '100%',
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--serif)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  outline: 'none',
}

const NAC: NacHoiLai[] = ['moi_lan_mo', 'sau_15_phut', 'sau_60_phut']

export default function KhoiMatKhauApp({ showToast }: { showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void }) {
  const [ghi, setGhi] = useState<BanGhiKhoa | null>(null)
  const [coMa, setCoMa] = useState(false)
  const [mo, setMo] = useState<'' | 'doi' | 'go'>('')
  const [cu, setCu] = useState('')
  const [moi, setMoi] = useState('')
  const [moi2, setMoi2] = useState('')
  const [hien, setHien] = useState(false)
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const [giuPhien, setGiuPhien] = useState(true)

  useEffect(() => {
    let con = true
    void (async () => {
      try {
        const [b, ma, gp] = await Promise.all([loadKhoaApp(), loadTeacherSecret(), docGiuPhien()])
        if (!con) return
        setGhi(b)
        setCoMa(Boolean(ma))
        setGiuPhien(gp)
      } catch {
        // IndexedDB hỏng thì khối này ẩn đi, KHÔNG kéo cả màn Ngân hàng câu hỏi
        // xuống theo — thầy vẫn phải đồng bộ đề được.
      }
    })()
    return () => {
      con = false
    }
  }, [])

  const dong = () => {
    setMo('')
    setCu('')
    setMoi('')
    setMoi2('')
    setLoi('')
  }

  // ĐỔI MẬT KHẨU. Luôn đòi mật khẩu hiện tại.
  const bamDoi = async () => {
    if (!ghi) return
    if (!hopLeMatKhau(moi)) return setLoi(`Mật khẩu mới phải từ ${TOI_THIEU_KY_TU} ký tự`)
    if (moi !== moi2) return setLoi('Hai lần gõ chưa khớp nhau')
    setDang(true)
    setLoi('')
    try {
      // Đổi mật khẩu LUÔN đòi mật khẩu hiện tại. Nhánh miễn hỏi dành cho phiên
      // vào bằng vân tay đã gỡ 06/09 cùng cả tính năng vân tay.
      const b = await doiMatKhau(cu, moi, ghi)
      if (!b) return setLoi('Mật khẩu hiện tại không đúng')
      await saveKhoaApp(b)
      setGhi(b)
      // Đổi mật khẩu ⇒ dọn phiên rồi cất lại (đặc tả mục 2.3 điều 3). Mã bí mật
      // không đổi, nhưng để khoá phiên cũ nằm lại là để một chìa mồ côi.
      const maNay = await loadTeacherSecret()
      await donPhien()
      if (maNay) {
        datMaBiMatPhien(maNay)
        await catPhien(maNay)
      }
      dong()
      showToast('Đã đổi mật khẩu. Mật khẩu cũ không dùng được nữa.', 'success')
    } finally {
      setDang(false)
    }
  }

  const bamGo = async () => {
    if (!ghi) return
    setDang(true)
    setLoi('')
    try {
      const ma = await moKhoa(cu, ghi)
      if (ma === null) return setLoi('Mật khẩu hiện tại không đúng')
      // Dọn phiên TRƯỚC khi gỡ: `donPhien` xoá mã bí mật khỏi bộ nhớ, mà
      // `goKhoaApp` ngay sau đó đặt lại nó — thứ tự này giữ thầy không bị văng.
      await donPhien()
      await goKhoaApp(ma)
      setGhi(null)
      setCoMa(true)
      dong()
      showToast('Đã gỡ mật khẩu. Mã bí mật nay nằm dạng chữ thường trong máy.', 'warn')
    } finally {
      setDang(false)
    }
  }

  const doiNac = async (n: NacHoiLai) => {
    if (!ghi) return
    const b = { ...ghi, hoiLai: n }
    setGhi(b)
    await saveKhoaApp(b)
  }

  /** Bật/tắt giữ đăng nhập. TẮT thì dọn phiên đang có ngay, không đợi tới lần
   * mở sau — thầy tắt là muốn nó hết hiệu lực từ bây giờ. */
  const doiGiuPhien = async (v: boolean) => {
    setGiuPhien(v)
    await luuGiuPhien(v)
    if (v) {
      const ma = await loadTeacherSecret()
      if (ma) await catPhien(ma)
      return
    }
    // Chỉ xoá hai mảnh chìa phiên, KHÔNG xoá mã bí mật khỏi bộ nhớ — thầy đang
    // làm việc dở, tắt một ô gạt không được đá thầy ra màn khoá.
    await xoaChiaPhien()
  }

  /** KHOÁ APP NGAY (mục 4F). Dọn đủ ba thứ rồi tải lại trang: không có phiên
   * nữa nên app dựng lên là hiện màn khoá. */
  const bamKhoaNgay = async () => {
    await donPhien()
    location.reload()
  }

  // Chưa có mã bí mật thì chưa có gì để khoá — không dựng một khối rỗng.
  if (!ghi && !coMa) return null

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
      <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)' }}>
        Mật khẩu mở app
      </div>

      {!ghi ? (
        <div style={NHAN_NHO}>Máy này chưa đặt mật khẩu. Đóng app rồi mở lại để đặt — mã bí mật hiện đang nằm dạng chữ thường trong máy.</div>
      ) : (
        <>
          <div style={NHAN_NHO}>Mã bí mật trong máy này đang được mật khẩu mã hoá. Mật khẩu chỉ của máy này, không đồng bộ sang máy khác.</div>

          {/* GIỮ ĐĂNG NHẬP THEO TAB (GIU-DANG-NHAP-THEO-TAB.md mục 6). */}
          {/* Vùng chạm 44px như nút gạt ở màn Mở ca — 30px là dưới ngưỡng, ngón
            tay trượt ra là nhìn như nút hỏng (thầy báo 06/09). */}
          <div className="flex items-start" style={{ gap: 'var(--k3)' }}>
            <button
              type="button"
              role="switch"
              aria-checked={giuPhien}
              aria-label="Giữ đăng nhập trong tab này"
              onClick={() => void doiGiuPhien(!giuPhien)}
              className="tap-target"
              style={{
                flex: '0 0 auto',
                width: 64,
                minHeight: 44,
                height: 44,
                borderRadius: 'var(--bo-tron)',
                border: 'none',
                padding: 4,
                background: giuPhien ? 'var(--phu-dam)' : 'var(--the-2)',
                display: 'flex',
                justifyContent: giuPhien ? 'flex-end' : 'flex-start',
                alignItems: 'center',
              }}
            >
              <span style={{ width: 32, height: 32, borderRadius: 'var(--bo-tron)', background: giuPhien ? 'var(--muc-nguoc)' : 'var(--nhat)', display: 'block' }} />
            </button>
            <div>
              <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                Giữ đăng nhập trong tab này
              </div>
              <div style={NHAN_NHO}>Tải lại trang không phải nhập lại. Đóng tab thì nhập lại.</div>
              <button
                type="button"
                onClick={() => void bamKhoaNgay()}
                className="tap-target font-bold"
                style={{ minHeight: 40, marginTop: 'var(--k2)', padding: '0 var(--k4)', borderRadius: 'var(--bo-1)', background: 'none', border: '1px solid var(--vien)', color: 'var(--muc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
              >
                Khoá app ngay
              </button>
            </div>
          </div>

          <div>
            <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Hỏi lại mật khẩu khi nào</div>
            <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Hỏi lại mật khẩu khi nào">
              {NAC.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={ghi.hoiLai === n}
                  onClick={() => void doiNac(n)}
                  className="tap-target font-bold"
                  style={{
                    minHeight: 40,
                    padding: '0 var(--k4)',
                    borderRadius: 'var(--bo-tron)',
                    border: 'none',
                    background: ghi.hoiLai === n ? 'var(--phu-dam)' : 'var(--the-2)',
                    color: ghi.hoiLai === n ? 'var(--muc-nguoc)' : 'var(--muc)',
                    fontFamily: 'var(--sans)',
                    fontSize: 'var(--cx-1)',
                  }}
                >
                  {TEN_NAC[n]}
                </button>
              ))}
            </div>
          </div>

          {mo === '' && (
            <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
              <NutChinh variant="phu" onClick={() => setMo('doi')}>
                Đổi mật khẩu
              </NutChinh>
              <button
                type="button"
                onClick={() => setMo('go')}
                className="tap-target font-bold"
                style={{ minHeight: 44, padding: '0 var(--k4)', borderRadius: 'var(--bo-1)', background: 'none', border: '1px solid var(--do)', color: 'var(--do)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
              >
                Gỡ mật khẩu
              </button>
            </div>
          )}

          {mo !== '' && (
            <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
              <div>
                  <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Mật khẩu hiện tại</div>
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...O_NHAP, paddingRight: 46 }} type={hien ? 'text' : 'password'} value={cu} onChange={(e) => setCu(e.target.value)} autoComplete="off" aria-label="Mật khẩu hiện tại" />
                    <button
                      type="button"
                      onClick={() => setHien((v) => !v)}
                      className="tap-target flex items-center justify-center"
                      aria-label={hien ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      style={{ position: 'absolute', right: 0, top: 0, height: 46, width: 46, background: 'none', border: 'none', color: 'var(--nhat)' }}
                    >
                      {hien ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
              </div>

              {mo === 'doi' && (
                <>
                  <div>
                    <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Mật khẩu mới (từ {TOI_THIEU_KY_TU} ký tự)</div>
                    <input style={O_NHAP} type={hien ? 'text' : 'password'} value={moi} onChange={(e) => setMoi(e.target.value)} autoComplete="off" aria-label="Mật khẩu mới" />
                  </div>
                  <div>
                    <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Gõ lại mật khẩu mới</div>
                    <input style={O_NHAP} type={hien ? 'text' : 'password'} value={moi2} onChange={(e) => setMoi2(e.target.value)} autoComplete="off" aria-label="Gõ lại mật khẩu mới" />
                  </div>
                </>
              )}

              {mo === 'go' && (
                <OThongBao tone="cam">
                  Gỡ xong, mã bí mật quay về <b>dạng chữ thường</b> trong máy này — đúng tình trạng trước khi đặt mật khẩu. Ai cầm máy đang mở khoá là đọc được, và gọi được máy chủ từ máy khác.
                </OThongBao>
              )}

              {loi && <OThongBao tone="cam">{loi}</OThongBao>}

              <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
                <NutChinh onClick={() => void (mo === 'doi' ? bamDoi() : bamGo())} disabled={dang || !cu}>
                  {dang ? 'Đang lưu…' : mo === 'doi' ? 'Đổi mật khẩu' : 'Gỡ mật khẩu'}
                </NutChinh>
                <NutChinh variant="phu" onClick={dong}>
                  Huỷ
                </NutChinh>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
