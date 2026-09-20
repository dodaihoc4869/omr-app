// MÀN HÔM NAY của thầy (G2, thầy chốt 21/09 — bản vẽ docs/ban-ve-app-giao-vien-2109/1-hom-nay.jpg). Chỉ hiện số do máy chủ trả
// (docs/hop-dong-gv-hom-nay-2109.md); khối nào chưa có ⇒ "đang chờ máy chủ", KHÔNG bịa số. Không kết luận năng lực từ điểm.
import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { cauLyDo, hanhDongCua, layCauToiHan, layHomNay, NHAN_HANH_DONG, ngayDai, phanTram, thuCuaHan, type CauToiHan, type HomNay, type HomNayEm } from '../lib/hom-nay-api'
import '../styles/hom-nay.css'

const CHO = 'đang chờ máy chủ'

function SoLon({ so, mau, tieu, phu, vai }: { so: string; mau?: string; tieu: string; phu: string; vai: 'tertiary' | 'primary' | 'secondary' | 'error' }) {
  return (
    <div className={`hn-so hn-so--${vai}`}>
      <span className="hn-so-tieu">{tieu}</span>
      <span className="hn-so-gia-tri">
        {so}
        {mau && <small>{mau}</small>}
      </span>
      <span className="hn-so-phu">{phu}</span>
    </div>
  )
}

export default function HomNayScreen() {
  const classList = useAppStore((s) => s.classList)
  const setScreen = useAppStore((s) => s.setScreen)
  const moHoSoEm = useAppStore((s) => s.moHoSoEm)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  const showToast = useAppStore((s) => s.showToast)
  const [hom, setHom] = useState<HomNay | null | undefined>(undefined) // undefined = đang tải
  const [cau, setCau] = useState<CauToiHan | null | undefined>(undefined)
  const [tim, setTim] = useState('')

  useEffect(() => {
    let con = true
    void layHomNay().then((h) => con && setHom(h))
    void layCauToiHan().then((c) => con && setCau(c))
    return () => {
      con = false
    }
  }, [])

  const soEm = hom?.soEm ?? (classList.length || null)
  const soLop = hom?.soLop ?? (classList.length ? new Set(classList.map((h) => h.lop).filter(Boolean)).size : null)
  const tai = hom === undefined
  // Máy chủ ĐÃ trả lời nhưng khối đó không tính được thì nó kèm lý do (`lyDoThieu`) — hiện đúng lý do ấy, không nói "đang chờ" như thể chưa có lệnh.
  const lyDo = (khoi: 'nhiemVu' | 'btvn' | 'canYTuong' | 'dangYeu' | 'doan') => hom?.lyDoThieu?.[khoi] || CHO
  const cho = (v: unknown, khoi: 'nhiemVu' | 'btvn' | 'canYTuong' | 'dangYeu' | 'doan') => (tai ? 'đang tải…' : v == null ? lyDo(khoi) : '')

  const nv = hom?.nhiemVu
  const bt = hom?.btvn
  const ty = hom?.canYTuong
  const dangDuocDung = useMemo(() => hom?.dangYeu?.[0] ?? null, [hom])

  const timKiem = () => {
    const q = tim.trim()
    if (!q) return
    if (/^\d{6}$/.test(q)) return moChiTietCa(q)
    const theoSbd = classList.find((h) => h.sbd === q)
    const theoTen = classList.find((h) => h.hoTen.toLowerCase().includes(q.toLowerCase()))
    const em = theoSbd ?? theoTen
    if (em) return moHoSoEm(em.sbd)
    showToast(`Không tìm thấy "${q}" trong danh sách lớp`, 'warn')
  }

  const lamHanhDong = (e: HomNayEm) => {
    if (hanhDongCua(e) === 'dua_vao_buoi_chua') setScreen('goilenbang')
    else moHoSoEm(e.sbd)
  }

  return (
    <div className="gv-page hn" style={{ fontFamily: 'var(--sans)' }}>
      <header className="hn-dau">
        <div>
          <h1 className="hn-chao">Chào thầy Học</h1>
          <p className="hn-ngay">
            {ngayDai(new Date())}
            {soEm != null && ` · ${soEm} học sinh`}
            {soLop != null && ` · ${soLop} lớp`}
          </p>
        </div>
        <div className="hn-dau-phai">
          <label className="hn-tim">
            <Search size={20} aria-hidden="true" />
            <input value={tim} onChange={(e) => setTim(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && timKiem()} placeholder="Tìm học sinh, ca thi, mã đề…" aria-label="Tìm học sinh hoặc mã ca" />
          </label>
          <span className={`hn-chip${hom?.caDangMo ? ' hn-chip--dang-mo' : ''}`}>{hom?.caDangMo == null ? CHO : hom.caDangMo > 0 ? `${hom.caDangMo} ca đang mở` : 'Không có ca nào đang mở'}</span>
        </div>
      </header>

      <section className="hn-hang-so" aria-label="Số liệu hôm nay">
        <SoLon vai="tertiary" tieu="ĐẠT NHIỆM VỤ HÔM NAY" so={nv ? String(nv.dat) : '—'} mau={nv ? `/${nv.tong}` : undefined} phu={nv ? `${phanTram(nv.dat, nv.tong) ?? 0}%${nv.datHomQua != null && nv.tongHomQua ? ` · hôm qua ${phanTram(nv.datHomQua, nv.tongHomQua)}%` : ''}` : cho(nv, 'nhiemVu')} />
        <SoLon vai="primary" tieu="BTVN ĐÚNG NHỊP" so={bt && phanTram(bt.soEmDungNhip, bt.soEmCoLo) != null ? `${phanTram(bt.soEmDungNhip, bt.soEmCoLo)}%` : '—'} phu={bt ? `${bt.dangChay.length} bài đang chạy` : cho(bt, 'btvn')} />
        <SoLon vai="secondary" tieu="CÂU TỚI HẠN ÔN" so={cau ? cau.toiHan.toLocaleString('vi-VN') : '—'} phu={cau ? `cả trường · ${cau.moDuoc.toLocaleString('vi-VN')} mở được` : cau === undefined ? 'đang tải…' : CHO} />
        <SoLon vai="error" tieu="EM CẦN THẦY ĐỂ Ý" so={ty ? String(ty.tong) : '—'} phu={ty ? 'trễ nhịp ≥ 3 ngày, tụt bậc hoặc dạng đang yếu' : cho(ty, 'canYTuong')} />
      </section>

      <div className="hn-luoi">
        <div className="hn-cot">
          <section className="hn-the" aria-labelledby="hn-can-y">
            <div className="hn-the-dau">
              <h2 id="hn-can-y">CẦN THẦY ĐỂ Ý HÔM NAY</h2>
              {ty && ty.tong > ty.ds.length && (
                <button type="button" className="hn-lien-ket" onClick={() => setScreen('hocsinh')}>
                  Xem cả {ty.tong} em
                </button>
              )}
            </div>
            {!ty && <p className="hn-trong">{tai ? 'Đang tải…' : `Danh sách em cần để ý: ${lyDo('canYTuong')}${/[.!]$/.test(lyDo('canYTuong')) ? '' : '.'}`}</p>}
            {ty && ty.ds.length === 0 && <p className="hn-trong">Hôm nay không có em nào cần thầy để ý.</p>}
            {ty?.ds.map((e) => (
              <div className="hn-em" key={e.sbd}>
                <span className="hn-em-chu" aria-hidden="true">
                  {e.hoTen.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? '?'}
                </span>
                <div className="hn-em-thong-tin">
                  <span className="hn-em-ten">
                    {e.hoTen} <span className="hn-em-lop">· {e.lop}</span>
                  </span>
                  <span className="hn-em-ly-do">{cauLyDo(e)}</span>
                </div>
                <button type="button" className="hn-nut hn-nut--vien" onClick={() => lamHanhDong(e)}>
                  {NHAN_HANH_DONG[hanhDongCua(e)]}
                </button>
              </div>
            ))}
          </section>

          <section className="hn-the" aria-labelledby="hn-btvn">
            <div className="hn-the-dau">
              <h2 id="hn-btvn">BÀI TẬP VỀ NHÀ ĐANG CHẠY · CHIA LÔ THEO HẠN NỘP</h2>
              <button type="button" className="hn-lien-ket" onClick={() => setScreen('giaobtvn')}>
                Giao bài mới
              </button>
            </div>
            {!bt && <p className="hn-trong">{tai ? 'Đang tải…' : `BTVN đang chạy: ${lyDo('btvn')}${/[.!]$/.test(lyDo('btvn')) ? '' : '.'}`}</p>}
            {bt && bt.dangChay.length === 0 && <p className="hn-trong">Chưa có bài tập về nhà nào đang chạy.</p>}
            {bt?.dangChay.map((b) => {
              const kip = phanTram(b.soEmKip, b.soEm)
              return (
                <div className="hn-btvn" key={b.ma}>
                  <span className="hn-btvn-ten">
                    {b.ten} · {b.lop}
                  </span>
                  <span className="hn-lo" aria-label={`Lô ${b.loHienTai} trên ${b.tongLo}`}>
                    {Array.from({ length: b.tongLo }, (_, i) => (
                      <i key={i} className={i < b.loHienTai ? 'da' : ''} />
                    ))}
                  </span>
                  <span className="hn-btvn-lo">
                    lô {b.loHienTai}/{b.tongLo}
                  </span>
                  <span className="hn-btvn-kip">{kip == null ? '' : `${kip}% kịp`}</span>
                  <span className="hn-btvn-han">{b.han ? `hạn ${thuCuaHan(b.han)}` : ''}</span>
                </div>
              )
            })}
          </section>
        </div>

        <div className="hn-cot">
          <section className="hn-the hn-the--chua" aria-labelledby="hn-chua">
            <h2 id="hn-chua">BUỔI CHỮA TỐI NAY</h2>
            <p className="hn-chua-noi-dung">Kế hoạch buổi chữa nằm ở màn Gọi lên bảng — chọn ca, xếp em và câu rồi mở buổi.</p>
            <button type="button" className="hn-nut hn-nut--chinh" onClick={() => setScreen('goilenbang')}>
              Mở Gọi lên bảng
            </button>
          </section>

          <section className="hn-the" aria-labelledby="hn-yeu">
            <h2 id="hn-yeu">{dangDuocDung ? `DẠNG CẢ LỚP ${dangDuocDung.lop} ĐANG YẾU` : 'DẠNG CẢ LỚP ĐANG YẾU'}</h2>
            {!hom?.dangYeu && <p className="hn-trong">{tai ? 'Đang tải…' : `Dạng yếu theo lớp: ${lyDo('dangYeu')}${/[.!]$/.test(lyDo('dangYeu')) ? '' : '.'}`}</p>}
            {dangDuocDung && dangDuocDung.dang.length === 0 && <p className="hn-trong">Chưa có dạng nào đủ dữ liệu để kết luận cả lớp yếu.</p>}
            {dangDuocDung?.dang.map((d) => (
              <div className="hn-yeu" key={d.ma}>
                <span className="hn-yeu-ten">{d.ten}</span>
                <span className="hn-yeu-thanh" role="img" aria-label={`${d.soEmYeu} trên ${dangDuocDung.siSo} em`}>
                  <i style={{ width: `${Math.min(100, Math.round((d.soEmYeu / Math.max(1, dangDuocDung.siSo)) * 100))}%` }} />
                </span>
                <span className="hn-yeu-so">
                  {d.soEmYeu}/{dangDuocDung.siSo} em
                </span>
              </div>
            ))}
            {dangDuocDung && dangDuocDung.dang.length > 0 && (
              <div className="hn-hang-nut">
                <button type="button" className="hn-nut hn-nut--chinh" onClick={() => setScreen('giaobtvn')}>
                  Giao BTVN theo {dangDuocDung.dang.length} dạng này
                </button>
                <button type="button" className="hn-nut hn-nut--vien" onClick={() => setScreen('examsetup')}>
                  Rút đề kiểm tra
                </button>
              </div>
            )}
          </section>

          {hom?.doan && (
            <section className="hn-the" aria-labelledby="hn-doan">
              <h2 id="hn-doan">ĐOÀN HỘ TỐNG · {hom.doan.lop}</h2>
              <p className="hn-doan-dong">
                Trạm {hom.doan.tram}/{hom.doan.tongTram} · hôm nay {hom.doan.gopSucHomNay}/{hom.doan.siSo} bạn góp sức
              </p>
              <span className="hn-yeu-thanh hn-yeu-thanh--doan" role="img" aria-label={`Trạm ${hom.doan.tram} trên ${hom.doan.tongTram}`}>
                <i style={{ width: `${Math.round((hom.doan.tram / Math.max(1, hom.doan.tongTram)) * 100)}%` }} />
              </span>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
