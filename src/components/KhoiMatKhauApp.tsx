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
import { goKhoaApp, loadKhoaApp, loadTeacherSecret, saveKhoaApp } from '../lib/exam-db'
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

  useEffect(() => {
    let con = true
    void (async () => {
      const [b, ma] = await Promise.all([loadKhoaApp(), loadTeacherSecret()])
      if (!con) return
      setGhi(b)
      setCoMa(Boolean(ma))
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

  const bamDoi = async () => {
    if (!ghi) return
    if (!hopLeMatKhau(moi)) return setLoi(`Mật khẩu mới phải từ ${TOI_THIEU_KY_TU} ký tự`)
    if (moi !== moi2) return setLoi('Hai lần gõ chưa khớp nhau')
    setDang(true)
    setLoi('')
    try {
      const b = await doiMatKhau(cu, moi, ghi)
      if (!b) return setLoi('Mật khẩu hiện tại không đúng')
      await saveKhoaApp(b)
      setGhi(b)
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
