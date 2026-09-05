// CÀI ĐẶT → MẬT KHẨU MỞ APP — MATKHAUMOAPP.md mục 4E và 6.
//
// Ba việc: đổi mật khẩu · gỡ mật khẩu · chọn nấc hỏi lại.
//
// Màn xác nhận gỡ NÓI THẲNG hậu quả: gỡ xong mã bí mật quay về dạng chữ thường
// trong máy, tức là quay lại đúng tình trạng trước khi có tính năng này. Không
// tô hồng — thầy phải biết mình vừa bỏ cái gì.
import { useEffect, useState } from 'react'
import { Eye, EyeOff, Fingerprint, ScanFace } from 'lucide-react'
import { NutChinh, OThongBao } from './DesignSystem'
import { goKhoaApp, goKhoaVanTay, loadKhoaApp, loadKhoaVanTay, loadTeacherSecret, saveKhoaApp, saveKhoaVanTay } from '../lib/exam-db'
import { TEN_NAC, TOI_THIEU_KY_TU, datMatKhau, doiMatKhau, hopLeMatKhau, moKhoa, type BanGhiKhoa, type NacHoiLai } from '../lib/khoa-app'
import { CAU_LY_DO, batVanTay, coTheDungVanTay, daMoBangVanTay, laKhuonMat, type BanGhiVanTay, type LyDoKhongDung } from '../lib/khoa-van-tay'

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
  const [vanTay, setVanTay] = useState<BanGhiVanTay | null>(null)
  const [lyDoVanTay, setLyDoVanTay] = useState<LyDoKhongDung>('')
  const [dangVanTay, setDangVanTay] = useState(false)
  const [xacNhanGoVanTay, setXacNhanGoVanTay] = useState(false)
  const khuonMat = laKhuonMat()
  const tenSinhTrac = khuonMat ? 'khuôn mặt' : 'vân tay'
  // Vào phiên này bằng vân tay ⇒ đã chứng minh danh tính ⇒ đặt lại mật khẩu
  // KHÔNG cần mật khẩu cũ (mục 4E). Đọc một lần lúc dựng: cờ này chỉ đổi khi
  // mở app, không đổi giữa chừng.
  const [vaoBangVanTay] = useState(() => daMoBangVanTay())

  useEffect(() => {
    let con = true
    void (async () => {
      try {
        const [b, ma, vt, ly] = await Promise.all([loadKhoaApp(), loadTeacherSecret(), loadKhoaVanTay(), coTheDungVanTay()])
        if (!con) return
        setGhi(b)
        setCoMa(Boolean(ma))
        setVanTay(vt)
        setLyDoVanTay(ly)
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

  // ĐỔI MẬT KHẨU. Bản ghi vân tay KHÔNG phải mã hoá lại: nó mã hoá MÃ BÍ MẬT,
  // mà đổi mật khẩu không đổi mã bí mật. Chỉ khi thầy đổi mã bí mật trên Apps
  // Script thì bản ghi vân tay mới lệch — chỗ đó xử lý ở màn Ngân hàng câu hỏi.
  const bamDoi = async () => {
    if (!ghi) return
    if (!hopLeMatKhau(moi)) return setLoi(`Mật khẩu mới phải từ ${TOI_THIEU_KY_TU} ký tự`)
    if (moi !== moi2) return setLoi('Hai lần gõ chưa khớp nhau')
    setDang(true)
    setLoi('')
    try {
      // Vào bằng vân tay thì mã bí mật đã nằm trong bộ nhớ phiên — đặt mật khẩu
      // mới thẳng từ đó, không đòi mật khẩu cũ (mục 4E).
      let b: BanGhiKhoa | null
      if (vaoBangVanTay) {
        const ma = await loadTeacherSecret()
        if (!ma) return setLoi('Phiên này chưa có mã bí mật. Mở lại app rồi thử.')
        b = await datMatKhau(moi, ma, ghi.hoiLai)
      } else {
        b = await doiMatKhau(cu, moi, ghi)
        if (!b) return setLoi('Mật khẩu hiện tại không đúng')
      }
      await saveKhoaApp(b)
      setGhi(b)
      dong()
      showToast('Đã đổi mật khẩu. Mật khẩu cũ không dùng được nữa.', 'success')
    } finally {
      setDang(false)
    }
  }

  // BẬT VÂN TAY (mục 4A). Phải có mã bí mật trong tay mới có gì để mã hoá, nên
  // hoặc phiên này đã mở khoá rồi, hoặc thầy gõ mật khẩu hiện tại ngay đây.
  const bamBatVanTay = async () => {
    setDangVanTay(true)
    setLoi('')
    try {
      let ma = vaoBangVanTay ? await loadTeacherSecret() : ''
      if (!ma) {
        if (!ghi) return setLoi('Đặt mật khẩu mở app trước đã.')
        ma = (await moKhoa(cu, ghi)) || ''
        if (!ma) return setLoi('Mật khẩu hiện tại không đúng')
      }
      const b = await batVanTay(ma)
      await saveKhoaVanTay(b)
      setVanTay(b)
      setCu('')
      showToast(`Đã bật mở app bằng ${tenSinhTrac} trên máy này.`, 'success')
    } catch (e) {
      setLoi(e instanceof Error ? e.message : `Không bật được ${tenSinhTrac}`)
    } finally {
      setDangVanTay(false)
    }
  }

  const bamGoVanTay = async () => {
    await goKhoaVanTay()
    setVanTay(null)
    setXacNhanGoVanTay(false)
    showToast('Đã gỡ. Mở app bằng mật khẩu như trước.', 'warn')
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
      // `goKhoaApp` xoá luôn bản ghi vân tay: mã bí mật đã quay về chữ thường
      // thì cả hai lớp mã hoá đều hết ý nghĩa.
      setVanTay(null)
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

          {/* MỞ BẰNG VÂN TAY / KHUÔN MẶT — MOBANGVANTAY.md mục 6.
              Máy không hỗ trợ thì nêu thẳng lý do, KHÔNG dựng nút bấm vào rồi
              mới báo lỗi (tiêu chí trải nghiệm số 5). */}
          <div style={{ borderTop: '1px solid var(--vien)', paddingTop: 'var(--k3)' }}>
            <div className="flex items-center" style={{ gap: 'var(--k2)', marginBottom: 'var(--k2)' }}>
              <span style={{ color: 'var(--nhat)' }}>{khuonMat ? <ScanFace size={17} /> : <Fingerprint size={17} />}</span>
              <span className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                Mở app bằng {tenSinhTrac}
              </span>
            </div>

            {lyDoVanTay ? (
              <div style={NHAN_NHO}>{CAU_LY_DO[lyDoVanTay]}</div>
            ) : vanTay ? (
              <>
                <div style={NHAN_NHO}>
                  Đã bật trên máy này · bật ngày {new Date(vanTay.taoLuc).toLocaleDateString('vi-VN')} · {vanTay.tenMay}
                </div>
                {xacNhanGoVanTay ? (
                  <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k2)' }}>
                    <OThongBao tone="cam">
                      Gỡ xong, mở app phải gõ mật khẩu như trước. Khoá {tenSinhTrac} vẫn nằm trong máy — muốn sạch hẳn thì thầy xoá nó ở phần Cài đặt của máy.
                    </OThongBao>
                    <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
                      <NutChinh onClick={() => void bamGoVanTay()}>Gỡ</NutChinh>
                      <NutChinh variant="phu" onClick={() => setXacNhanGoVanTay(false)}>
                        Huỷ
                      </NutChinh>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setXacNhanGoVanTay(true)}
                    className="tap-target font-bold"
                    style={{ minHeight: 40, marginTop: 'var(--k2)', padding: '0 var(--k4)', borderRadius: 'var(--bo-1)', background: 'none', border: '1px solid var(--do)', color: 'var(--do)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                  >
                    Gỡ {tenSinhTrac}
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={NHAN_NHO}>
                  Một chạm là vào app, không phải gõ mật khẩu. Khoá do chính {tenSinhTrac} của thầy sinh ra, không nằm trong máy — mật khẩu vẫn giữ làm đường vào thứ hai.
                </div>
                {!vaoBangVanTay && (
                  <div style={{ marginTop: 'var(--k2)' }}>
                    <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Mật khẩu hiện tại</div>
                    <input style={O_NHAP} type="password" value={cu} onChange={(e) => setCu(e.target.value)} autoComplete="off" aria-label="Mật khẩu hiện tại để bật vân tay" />
                  </div>
                )}
                <div style={{ marginTop: 'var(--k2)' }}>
                  <NutChinh variant="phu" onClick={() => void bamBatVanTay()} disabled={dangVanTay || (!vaoBangVanTay && !cu)}>
                    {dangVanTay ? 'Đang bật…' : `Bật ${tenSinhTrac}`}
                  </NutChinh>
                </div>
              </>
            )}
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
              {/* Vào bằng vân tay thì KHÔNG hỏi mật khẩu cũ khi đổi mật khẩu
                  (mục 4E) — vân tay đã chứng minh danh tính rồi. Gỡ mật khẩu
                  thì vẫn hỏi: đó là việc bỏ hẳn lớp mã hoá. */}
              {!(mo === 'doi' && vaoBangVanTay) && (
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
              )}
              {mo === 'doi' && vaoBangVanTay && (
                <div style={NHAN_NHO}>Phiên này vào bằng {tenSinhTrac} nên không cần mật khẩu cũ.</div>
              )}
              {mo === 'doi' && vanTay && !vaoBangVanTay && (
                <div style={NHAN_NHO}>{tenSinhTrac === 'vân tay' ? 'Vân tay' : 'Khuôn mặt'} đang bật, đổi xong vẫn mở bằng {tenSinhTrac} được.</div>
              )}

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
                <NutChinh onClick={() => void (mo === 'doi' ? bamDoi() : bamGo())} disabled={dang || (!cu && !(mo === 'doi' && vaoBangVanTay))}>
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
