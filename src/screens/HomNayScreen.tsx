// MÀN HÔM NAY của thầy — BẢN 2 (thầy lệnh 21/09; đề bài prompt-hom-nay-gv-v2.md; bản vẽ docs/ban-ve-hom-nay-v2-2109/). Chỉ hiện số do máy chủ trả; khối nào chưa có ⇒ nói thật "đang chờ máy chủ", KHÔNG bịa số.
// Bỏ hẳn: khối "Việc cần theo dõi hôm nay", "Bảng tin của thầy" + ô ngày kiểu máy, "Hoạt động dạy học trong ngày", "Bài đã giao" (gộp vào ô Việc gấp). Chữ theo docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md.
import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { layCauToiHan, layHomNay, ngayDai, phanTram, type CauToiHan, type HomNay } from '../lib/hom-nay-api'
import { layBangTinNgay, type BangTinNgay } from '../lib/hom-nay-v2'
import type { KetQuaLenh } from '../lib/goi-lenh-thay'
import KhoiBoNaoDemQua from '../components/KhoiBoNaoDemQua'
import OTraCuu from '../components/hom-nay/OTraCuu'
import ViecGap from '../components/hom-nay/ViecGap'
import EmCanGiup from '../components/hom-nay/EmCanGiup'
import VinhDanh from '../components/hom-nay/VinhDanh'
import KhungCuon from '../components/hom-nay/KhungCuon'
import '../styles/hom-nay.css'
import '../styles/hom-nay-v2.css'

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
  const moToanCanh = useAppStore((s) => s.moToanCanh)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  const [hom, setHom] = useState<HomNay | null | undefined>(undefined) // undefined = đang tải
  const [cau, setCau] = useState<CauToiHan | null | undefined>(undefined)
  const [tin, setTin] = useState<KetQuaLenh<BangTinNgay> | undefined>(undefined)

  useEffect(() => {
    let con = true
    void layHomNay().then((h) => con && setHom(h))
    void layCauToiHan().then((c) => con && setCau(c))
    void layBangTinNgay().then((t) => con && setTin(t))
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
  const dsTraCuu = useMemo(() => classList.map((h) => ({ sbd: h.sbd, hoTen: h.hoTen, lop: h.lop })), [classList])

  return (
    <div className="gv-page hn2" style={{ fontFamily: 'var(--sans)' }}>
      <header className="hn2-dau">
        <div>
          <h1 className="hn2-chao">Chào thầy Học</h1>
          <p className="hn2-ngay">
            {ngayDai(new Date())}/{new Date().getFullYear()}
            {soEm != null && ` · ${soEm} học sinh`}
            {soLop != null && ` · ${soLop} lớp`}
            {hom?.caDangMo != null && ` · ${hom.caDangMo > 0 ? `${hom.caDangMo} ca kiểm tra đang mở` : 'không có ca kiểm tra nào đang mở'}`}
          </p>
        </div>
        <OTraCuu ds={dsTraCuu} onMoEm={moToanCanh} onMoCa={moChiTietCa} />
      </header>

      <section className="hn-hang-so" aria-label="Số liệu hôm nay">
        <SoLon vai="tertiary" tieu="ĐẠT NHIỆM VỤ HÔM NAY" so={nv ? String(nv.dat) : '—'} mau={nv ? `/${nv.tong}` : undefined} phu={nv ? `${phanTram(nv.dat, nv.tong) ?? 0}%${nv.datHomQua != null && nv.tongHomQua ? ` · hôm qua ${phanTram(nv.datHomQua, nv.tongHomQua) ?? 0}%` : ''}` : cho(nv, 'nhiemVu')} />
        <SoLon vai="primary" tieu="BTVN ĐÚNG NHỊP" so={bt && phanTram(bt.soEmDungNhip, bt.soEmCoLo) != null ? `${phanTram(bt.soEmDungNhip, bt.soEmCoLo)}%` : '—'} phu={bt ? `Bài tập về nhà · ${bt.dangChay.length} bài đang chạy` : cho(bt, 'btvn')} />
        <SoLon vai="secondary" tieu="CÂU CẦN ÔN LẠI" so={cau ? cau.toiHan.toLocaleString('vi-VN') : '—'} phu={cau ? `cả trường · ${cau.moDuoc.toLocaleString('vi-VN')} câu mở được` : cau === undefined ? 'đang tải…' : CHO} />
        <SoLon vai="error" tieu="EM CẦN THẦY GIÚP" so={ty ? String(ty.tong) : '—'} phu={ty ? 'trễ nhịp · tụt bậc · dạng đang yếu' : cho(ty, 'canYTuong')} />
      </section>

      <div className="hn2-luoi-a">
        <ViecGap />

        <EmCanGiup rutGon={ty} dangTaiRutGon={tai} lyDoRutGon={lyDo('canYTuong')} onMoEm={moToanCanh} onMoHoSo={moHoSoEm} />
      </div>

      <div className="hn2-luoi-b">
        <KhoiBoNaoDemQua onMoHoSo={moToanCanh} onGoiLenBang={() => setScreen('goilenbang')} onMoCaiDat={() => setScreen('caidat')} />

        <section className="hn2-the hn2-khung" aria-labelledby="hn2-yeu" data-khoi="dang-yeu">
          <div className="hn2-khung-dau">
            <h2 id="hn2-yeu" className="hn2-tieu-de hn2-tieu-de--1dong" title={dangDuocDung ? `Dạng cả lớp ${dangDuocDung.lop} đang yếu` : 'Dạng cả lớp đang yếu'}>
              {dangDuocDung ? `Dạng cả lớp ${dangDuocDung.lop} đang yếu` : 'Dạng cả lớp đang yếu'}
            </h2>
          </div>
          <KhungCuon nhan="Các dạng cả lớp đang yếu">
            {!hom?.dangYeu && <p className="hn2-trong">{tai ? 'Đang tải…' : `Dạng yếu theo lớp: ${lyDo('dangYeu')}${/[.!]$/.test(lyDo('dangYeu')) ? '' : '.'}`}</p>}
            {dangDuocDung && dangDuocDung.dang.length === 0 && <p className="hn2-trong">Chưa có dạng nào đủ dữ liệu để kết luận cả lớp yếu.</p>}
            {dangDuocDung?.dang.map((d) => (
              <div className="hn-yeu" key={d.ma}>
                <span className="hn-yeu-ten" title={d.ten}>
                  {d.ten}
                </span>
                <span className="hn-yeu-thanh" role="img" aria-label={`${d.soEmYeu} trên ${dangDuocDung.siSo} em`}>
                  <i style={{ width: `${Math.min(100, Math.round((d.soEmYeu / Math.max(1, dangDuocDung.siSo)) * 100))}%` }} />
                </span>
                <span className="hn-yeu-so">
                  {d.soEmYeu}/{dangDuocDung.siSo} em
                </span>
              </div>
            ))}
          </KhungCuon>
          {dangDuocDung && dangDuocDung.dang.length > 0 && (
            <div className="hn2-khung-chan hn2-khung-chan--nut">
              <button type="button" className="hn-nut hn-nut--chinh" onClick={() => setScreen('giaobtvn')}>
                Giao bài tập về nhà theo {dangDuocDung.dang.length} dạng này
              </button>
              <button type="button" className="hn-nut hn-nut--vien" onClick={() => setScreen('examsetup')}>
                Rút đề kiểm tra
              </button>
            </div>
          )}
        </section>

        <section className="hn2-the hn2-the--chua" aria-labelledby="hn2-chua">
          <h2 id="hn2-chua" className="hn2-tieu-de hn2-tieu-de--1dong">
            Buổi chữa tối nay
          </h2>
          <p className="hn2-chua-noi-dung">Kế hoạch buổi chữa nằm ở màn Gọi lên bảng — chọn ca, xếp em và câu rồi mở buổi.</p>
          <button type="button" className="hn2-nut hn2-nut--chinh" onClick={() => setScreen('goilenbang')}>
            Mở buổi chữa
          </button>
        </section>
      </div>

      <VinhDanh onMoEm={moToanCanh} />

      <div className="hn2-cuoi">
        <section className="hn2-the" aria-labelledby="hn2-ca" data-khoi="ca-hom-nay">
          <h2 id="hn2-ca" className="hn2-tieu-de">
            Ca kiểm tra hôm nay
          </h2>
          {tin === undefined && <p className="hn2-trong">Đang tải…</p>}
          {tin && !tin.ok && <p className="hn2-trong">{tin.chu}</p>}
          {tin?.ok && tin.du.caHomNay.length === 0 && <p className="hn2-trong">Hôm nay chưa có ca kiểm tra nào bắt đầu hoặc mở.</p>}
          {tin?.ok &&
            tin.du.caHomNay.slice(0, 3).map((c) => (
              <p className="hn2-cuoi-dong" key={c.ma}>
                <b>{c.ten}</b> · {c.trangThai === 'dong' ? 'đã đóng' : c.trangThai === 'da_xoa' ? 'đã xoá' : 'đang mở'} · {c.daNop}/{c.luot} lượt đã nộp
              </p>
            ))}
          <button type="button" className="hn2-lien-ket" onClick={() => setScreen('lichsuca')}>
            Xem ca kiểm tra
          </button>
        </section>

        <section className="hn2-the" aria-labelledby="hn2-tc" data-khoi="truy-cap">
          <h2 id="hn2-tc" className="hn2-tieu-de">
            Truy cập trực tuyến
          </h2>
          {tin === undefined && <p className="hn2-trong">Đang tải…</p>}
          {tin && !tin.ok && <p className="hn2-trong">{tin.chu}</p>}
          {tin?.ok && !tin.du.truyCap && <p className="hn2-trong">Máy chủ chưa trả số truy cập hôm nay.</p>}
          {tin?.ok && tin.du.truyCap && (
            <>
              <p className="hn2-cuoi-so">{tin.du.truyCap.dangOnline} đang trực tuyến</p>
              <p className="hn2-phu">
                học sinh {tin.du.truyCap.hocSinhOnline} · phụ huynh {tin.du.truyCap.phuHuynhOnline} · hôm nay {tin.du.truyCap.luotHomNay} lượt
              </p>
            </>
          )}
        </section>

        {hom?.doan && (
          <section className="hn2-the" aria-labelledby="hn2-doan" data-khoi="doan">
            <h2 id="hn2-doan" className="hn2-tieu-de">
              Đoàn Hộ Tống · {hom.doan.lop}
            </h2>
            <p className="hn2-cuoi-so">
              Trạm {hom.doan.tram}/{hom.doan.tongTram} · {hom.doan.gopSucHomNay}/{hom.doan.siSo} bạn góp sức
            </p>
            <span className="hn-yeu-thanh hn-yeu-thanh--doan" role="img" aria-label={`Trạm ${hom.doan.tram} trên ${hom.doan.tongTram}`}>
              <i style={{ width: `${Math.round((hom.doan.tram / Math.max(1, hom.doan.tongTram)) * 100)}%` }} />
            </span>
          </section>
        )}
      </div>
    </div>
  )
}
