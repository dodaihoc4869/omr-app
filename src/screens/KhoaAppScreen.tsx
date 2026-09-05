// MÀN KHOÁ APP QUẢN LÝ — MATKHAUMOAPP.md mục 6.
//
// Ba trạng thái trong một màn, vì cả ba đều là "chưa vào được app":
//   · dat      — lần đầu: máy đã có mã bí mật mà chưa có mật khẩu.
//   · mo       — các lần sau: nhập mật khẩu để giải mã.
//   · quen     — quên mật khẩu: nhập lại MÃ BÍ MẬT rồi đặt mật khẩu mới.
//
// Màn này hiện TRƯỚC khi bất kỳ dữ liệu học sinh nào được vẽ ra — App gọi nó
// thay cho toàn bộ cây màn hình, không phải phủ lên trên. Không có chuyện thấy
// loáng thoáng danh sách lớp rồi mới bị che.
//
// KHÔNG hiện gợi ý mật khẩu, KHÔNG hiện tên thầy: màn này người lạ cầm máy cũng
// nhìn thấy.
import { useEffect, useState } from 'react'
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import LogoDDH from '../components/LogoDDH'
import { NutChinh, OThongBao, TheNoiDung } from '../components/DesignSystem'
import { batKhoaApp, loadTeacherSecret, saveKhoaApp } from '../lib/exam-db'
import { LOI_SAI_MAT_KHAU, TOI_THIEU_KY_TU, conChoGiay, datMatKhau, hopLeMatKhau, moKhoa, sauKhiDung, sauKhiSai, type BanGhiKhoa } from '../lib/khoa-app'

const NHAN: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }
const O_NHAP: React.CSSProperties = {
  height: 52,
  width: '100%',
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--serif)',
  fontSize: 'var(--cx-3)',
  color: 'var(--muc)',
  outline: 'none',
}

export type PhaKhoa = 'dat' | 'mo'

export interface KhoaAppScreenProps {
  pha: PhaKhoa
  /** Bản ghi đã cất — chỉ có ở pha 'mo'. */
  banGhi: BanGhiKhoa | null
  /** Gọi khi đã vào được: App nhận mã bí mật rồi dựng phần còn lại. */
  onMoDuoc: (maBiMat: string) => void
}

function OMatKhau({ gia, dat, nhan, tuDong }: { gia: string; dat: (v: string) => void; nhan: string; tuDong?: boolean }) {
  const [hien, setHien] = useState(false)
  return (
    <div>
      <div style={{ ...NHAN, marginBottom: 'var(--k2)' }}>{nhan}</div>
      <div style={{ position: 'relative' }}>
        <input
          className="tap-target"
          style={{ ...O_NHAP, paddingRight: 52 }}
          type={hien ? 'text' : 'password'}
          value={gia}
          autoFocus={tuDong}
          autoComplete="off"
          onChange={(e) => dat(e.target.value)}
          aria-label={nhan}
        />
        <button
          type="button"
          onClick={() => setHien((v) => !v)}
          className="tap-target flex items-center justify-center"
          aria-label={hien ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          style={{ position: 'absolute', right: 0, top: 0, height: 52, width: 52, background: 'none', border: 'none', color: 'var(--nhat)' }}
        >
          {hien ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}

export default function KhoaAppScreen({ pha, banGhi, onMoDuoc }: KhoaAppScreenProps) {
  const [che, setChe] = useState<'dat' | 'mo' | 'quen'>(pha)
  const [mk, setMk] = useState('')
  const [mk2, setMk2] = useState('')
  const [maBiMatGo, setMaBiMatGo] = useState('')
  const [loi, setLoi] = useState('')
  const [dang, setDang] = useState(false)
  const [choGiay, setChoGiay] = useState(() => (banGhi ? conChoGiay(banGhi) : 0))
  const [ghi, setGhi] = useState<BanGhiKhoa | null>(banGhi)

  // Đồng hồ đếm ngược lúc bị chờ. Mốc chờ nằm trong IndexedDB nên tải lại trang
  // không xoá được — đồng hồ này chỉ là phần nhìn thấy của nó.
  useEffect(() => {
    if (choGiay <= 0) return
    const t = window.setInterval(() => {
      setChoGiay((n) => (n > 1 ? n - 1 : 0))
    }, 1000)
    return () => window.clearInterval(t)
  }, [choGiay])

  const datMoi = async (maBiMat: string) => {
    if (!hopLeMatKhau(mk)) return setLoi(`Mật khẩu phải từ ${TOI_THIEU_KY_TU} ký tự`)
    if (mk !== mk2) return setLoi('Hai lần gõ chưa khớp nhau')
    setDang(true)
    setLoi('')
    try {
      const b = await datMatKhau(mk, maBiMat, ghi?.hoiLai)
      await batKhoaApp(b, maBiMat)
      onMoDuoc(maBiMat)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không đặt được mật khẩu')
    } finally {
      setDang(false)
    }
  }

  const bamDat = async () => {
    const ma = await loadTeacherSecret()
    if (!ma) return setLoi('Máy này chưa có mã bí mật. Vào Ngân hàng câu hỏi nhập mã bí mật trước.')
    await datMoi(ma)
  }

  const bamMo = async () => {
    if (!ghi || dang) return
    if (choGiay > 0) return
    setDang(true)
    setLoi('')
    try {
      const ma = await moKhoa(mk, ghi)
      if (ma === null) {
        const sau = sauKhiSai(ghi)
        setGhi(sau)
        await saveKhoaApp(sau)
        setChoGiay(conChoGiay(sau))
        setLoi(LOI_SAI_MAT_KHAU)
        setMk('')
        return
      }
      const sau = sauKhiDung(ghi)
      setGhi(sau)
      await saveKhoaApp(sau)
      onMoDuoc(ma)
    } finally {
      setDang(false)
    }
  }

  // QUÊN MẬT KHẨU: mã bí mật là khoá gốc. Thầy luôn lấy lại được nó từ Thuộc
  // tính tập lệnh của Apps Script, nên không có ngõ cụt — và cũng không cần một
  // cửa sau nào khác.
  const bamQuen = async () => {
    const ma = maBiMatGo.trim()
    if (!ma) return setLoi('Nhập mã bí mật để đặt lại mật khẩu')
    if (!hopLeMatKhau(mk)) return setLoi(`Mật khẩu mới phải từ ${TOI_THIEU_KY_TU} ký tự`)
    if (mk !== mk2) return setLoi('Hai lần gõ chưa khớp nhau')
    setDang(true)
    setLoi('')
    try {
      const b = await datMatKhau(mk, ma, ghi?.hoiLai)
      await batKhoaApp(b, ma)
      onMoDuoc(ma)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không đặt lại được mật khẩu')
    } finally {
      setDang(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--nen)', color: 'var(--muc)', fontFamily: 'var(--serif)' }}>
      <div className="w-full" style={{ maxWidth: 400 }}>
        <TheNoiDung>
          <div className="text-center" style={{ marginBottom: 'var(--k6)' }}>
            <div className="flex justify-center" style={{ color: 'var(--muc)', marginBottom: 'var(--k3)' }}>
              <LogoDDH size={44} />
            </div>
            <div className="font-bold" style={{ fontSize: 'var(--cx-5)', letterSpacing: '.28em' }}>
              ĐỖ ĐẠI HỌC
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: 'var(--k4)' }}>
            {che === 'dat' && (
              <>
                <div className="font-bold" style={{ fontSize: 'var(--cx-3)' }}>
                  Đặt mật khẩu mở app
                </div>
                <OMatKhau gia={mk} dat={setMk} nhan={`Mật khẩu mới (từ ${TOI_THIEU_KY_TU} ký tự)`} tuDong />
                <OMatKhau gia={mk2} dat={setMk2} nhan="Gõ lại mật khẩu" />
                <NutChinh onClick={() => void bamDat()} disabled={dang}>
                  {dang ? 'Đang đặt…' : 'Đặt mật khẩu'}
                </NutChinh>
                <div style={NHAN}>
                  Mật khẩu này khoá mã bí mật ngay trong máy, không gửi đi đâu. Quên mật khẩu thì nhập lại mã bí mật để đặt mật khẩu mới.
                </div>
              </>
            )}

            {che === 'mo' && (
              <>
                <OMatKhau gia={mk} dat={setMk} nhan="Mật khẩu mở app" tuDong />
                {choGiay > 0 ? (
                  <OThongBao tone="cam">
                    Nhập sai nhiều lần. Thử lại sau <b style={{ fontVariantNumeric: 'tabular-nums' }}>{choGiay}</b> giây.
                  </OThongBao>
                ) : (
                  <NutChinh onClick={() => void bamMo()} disabled={dang || !mk}>
                    {dang ? (
                      <span className="inline-flex items-center" style={{ gap: 6 }}>
                        <Loader2 size={16} className="animate-spin" /> Đang mở…
                      </span>
                    ) : (
                      'Mở app'
                    )}
                  </NutChinh>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setChe('quen')
                    setLoi('')
                    setMk('')
                    setMk2('')
                  }}
                  className="tap-target inline-flex items-center justify-center"
                  style={{ ...NHAN, gap: 6, background: 'none', border: 'none', textDecoration: 'underline' }}
                >
                  <KeyRound size={15} /> Quên mật khẩu
                </button>
              </>
            )}

            {che === 'quen' && (
              <>
                <div className="font-bold" style={{ fontSize: 'var(--cx-3)' }}>
                  Đặt lại bằng mã bí mật
                </div>
                <div>
                  <div style={{ ...NHAN, marginBottom: 'var(--k2)' }}>Mã bí mật (lấy ở Thuộc tính tập lệnh của Apps Script)</div>
                  <input
                    className="tap-target"
                    style={O_NHAP}
                    value={maBiMatGo}
                    autoComplete="off"
                    onChange={(e) => setMaBiMatGo(e.target.value)}
                    aria-label="Mã bí mật"
                  />
                </div>
                <OMatKhau gia={mk} dat={setMk} nhan={`Mật khẩu mới (từ ${TOI_THIEU_KY_TU} ký tự)`} />
                <OMatKhau gia={mk2} dat={setMk2} nhan="Gõ lại mật khẩu mới" />
                <NutChinh onClick={() => void bamQuen()} disabled={dang}>
                  {dang ? 'Đang đặt…' : 'Đặt mật khẩu mới'}
                </NutChinh>
                <button
                  type="button"
                  onClick={() => {
                    setChe('mo')
                    setLoi('')
                    setMk('')
                    setMk2('')
                  }}
                  className="tap-target"
                  style={{ ...NHAN, background: 'none', border: 'none', textDecoration: 'underline' }}
                >
                  Quay lại nhập mật khẩu
                </button>
              </>
            )}

            {loi && <OThongBao tone="cam">{loi}</OThongBao>}
          </div>
        </TheNoiDung>
      </div>
    </div>
  )
}
