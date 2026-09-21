// TOÀN CẢNH MỘT EM — trang riêng của thầy (Hôm nay v2, bước 5; đề bài prompt-hom-nay-gv-v2.md, bản vẽ docs/ban-ve-hom-nay-v2-2109/3-toan-canh-mot-em-1440.jpg).
// Mở từ ô tra cứu / bấm tên em ở các ô của màn Hôm nay. Nguồn: lệnh thầy CHỈ ĐỌC `/gv/em-toan-canh` (Code 3) qua `lib/em-toan-canh.ts`. Thiếu trường ⇒ ẩn, KHÔNG bịa; chưa có lệnh ⇒ nói thật
// và vẫn hiện tên em từ danh sách lớp + các nút dùng được. Chữ theo docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Clock, Eye, Flame, Info, Shield } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import OTraCuu from '../components/hom-nay/OTraCuu'
import { BanDoDang, DongThoiGian, NhipHoc30, TheHuynh } from '../components/toan-canh/CacKhoi'
import { layToanCanh, moiXemChu, type LoaiSuKien, type SuKienEm, type ToanCanh } from '../lib/em-toan-canh'
import type { KetQuaLenh } from '../lib/goi-lenh-thay'
import '../styles/hom-nay.css' // thẻ số `.hn-so` dùng chung với màn Hôm nay
import '../styles/hom-nay-v2.css'
import '../styles/toan-canh-em.css'

const soThap = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

export default function ToanCanhEmScreen() {
  const sbd = useAppStore((s) => s.sbdToanCanh)
  const classList = useAppStore((s) => s.classList)
  const setScreen = useAppStore((s) => s.setScreen)
  const moToanCanh = useAppStore((s) => s.moToanCanh)
  const moHoSoEm = useAppStore((s) => s.moHoSoEm)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  const datSbdGiaoRieng = useAppStore((s) => s.datSbdGiaoRieng)

  const [ket, setKet] = useState<KetQuaLenh<ToanCanh> | undefined>(undefined)
  const [dong, setDong] = useState<SuKienEm[]>([])
  const [conNua, setConNua] = useState('')
  const [loai, setLoai] = useState<LoaiSuKien | ''>('')
  const [dangTaiDong, setDangTaiDong] = useState(false)
  const [dangTaiThem, setDangTaiThem] = useState(false)
  const [loiDong, setLoiDong] = useState('')
  const [nayMs, setNayMs] = useState(() => Date.now())
  // Mỗi lần đổi em/bộ lọc là một "đời" mới; kết quả về muộn của đời cũ bị bỏ (tránh dòng thời gian của em khác chen vào).
  const doi = useRef(0)

  useEffect(() => {
    const d = ++doi.current
    setKet(undefined)
    setDong([])
    setConNua('')
    setLoai('')
    setLoiDong('')
    void layToanCanh(sbd).then((r) => {
      if (d !== doi.current) return
      setNayMs(Date.now())
      setKet(r)
      if (r.ok) {
        setDong(r.du.dong)
        setConNua(r.du.conNua)
      }
    })
    return () => {
      doi.current++
    }
  }, [sbd])

  const loc = useCallback(
    (l: LoaiSuKien | '') => {
      const d = ++doi.current
      setLoai(l)
      setLoiDong('')
      setDangTaiDong(true)
      void layToanCanh(sbd, l ? { loai: [l] } : {}).then((r) => {
        if (d !== doi.current) return
        setDangTaiDong(false)
        if (r.ok) {
          setDong(r.du.dong)
          setConNua(r.du.conNua)
        } else setLoiDong(r.chu)
      })
    },
    [sbd],
  )

  const them = () => {
    if (!conNua) return
    const d = doi.current
    setDangTaiThem(true)
    void layToanCanh(sbd, { truoc: conNua, ...(loai ? { loai: [loai] } : {}) }).then((r) => {
      if (d !== doi.current) return
      setDangTaiThem(false)
      if (r.ok) {
        setDong((cu) => [...cu, ...r.du.dong])
        setConNua(r.du.conNua)
      } else setLoiDong(r.chu)
    })
  }

  const tc = ket?.ok ? ket.du : null
  const hs = classList.find((h) => h.sbd === sbd)
  const hoTen = tc?.em.hoTen || hs?.hoTen || `SBD ${sbd}`
  const lop = tc?.em.lop || hs?.lop || ''
  const namSinh = tc?.em.namSinh || hs?.namSinh || ''
  const dsTraCuu = useMemo(() => classList.map((h) => ({ sbd: h.sbd, hoTen: h.hoTen, lop: h.lop })), [classList])
  // Ca gần nhất của em (để "Cho thi lại" mở đúng ca): ưu tiên mã ca trong điểm ca gần nhất, sau đó việc loại `ca` mới nhất đã tải.
  const maCaGanNhat = tc?.em.diemCaGanNhat?.maCa || dong.find((v) => v.loai === 'ca' && v.maCa)?.maCa || ''
  const giaoRieng = () => {
    datSbdGiaoRieng(sbd) // màn Giao bài mở sẵn chế độ chọn từng em, đã tick em này
    setScreen('giaobtvn')
  }

  return (
    <div className="gv-page tc" style={{ fontFamily: 'var(--sans)' }}>
      <div className="tc-tren">
        <button type="button" className="hn2-lien-ket" onClick={() => setScreen('examhub')}>
          <ArrowLeft size={16} aria-hidden="true" />
          Về Hôm nay
        </button>
        <div className="tc-tim">
          <OTraCuu ds={dsTraCuu} onMoEm={moToanCanh} onMoCa={moChiTietCa} />
        </div>
      </div>

      <header className="hn2-the tc-ho-so" data-khoi="ho-so">
        <span className="tc-chu-cai" aria-hidden="true">
          {hoTen.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? '?'}
        </span>
        <div className="tc-ho-so-giua">
          <h1 className="tc-ten">{hoTen}</h1>
          <div className="tc-nhan">
            <span className="hn2-chip">#{sbd}</span>
            {lop && <span className="hn2-chip">Lớp {lop}</span>}
            {namSinh && <span className="hn2-chip hn2-chip--trung">sinh {namSinh}</span>}
          </div>
          {tc && (
            <div className="tc-nhan">
              {tc.em.thanThu && (
                <span className="hn2-chip">
                  <Shield size={14} aria-hidden="true" />
                  Thần thú: {tc.em.thanThu.ten}
                  {tc.em.thanThu.cap != null && ` · cấp ${tc.em.thanThu.cap}`}
                </span>
              )}
              {tc.em.chuoiNgay != null && (
                <span className="hn2-chip">
                  <Flame size={14} aria-hidden="true" />
                  Chuỗi {tc.em.chuoiNgay} ngày
                </span>
              )}
              {tc.em.hoatDongCuoi && (
                <span className="hn2-chip hn2-chip--tot">
                  <Clock size={14} aria-hidden="true" />
                  Hoạt động cuối: {moiXemChu(tc.em.hoatDongCuoi.luc, nayMs)}
                  {tc.em.hoatDongCuoi.viec && ` · ${tc.em.hoatDongCuoi.viec}`}
                </span>
              )}
              {tc.em.phuHuynhXemCuoi && (
                <span className="hn2-chip hn2-chip--trung">
                  <Eye size={14} aria-hidden="true" />
                  Phụ huynh xem app: {moiXemChu(tc.em.phuHuynhXemCuoi, nayMs)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="tc-hanh-dong">
          <button type="button" className="hn2-nut hn2-nut--chinh" onClick={giaoRieng}>
            Giao bài riêng
          </button>
          {maCaGanNhat && (
            <button type="button" className="hn2-nut hn2-nut--vien" onClick={() => moChiTietCa(maCaGanNhat)}>
              Cho thi lại
            </button>
          )}
          <button type="button" className="hn2-nut hn2-nut--vien" onClick={() => moHoSoEm(sbd)}>
            Xem hồ sơ học sinh
          </button>
        </div>
      </header>

      {tc && (tc.em.diemCaGanNhat || tc.em.expHomNay != null) && (
        <section className="tc-so" aria-label="Số liệu của em">
          {tc.em.diemCaGanNhat && (
            <div className="hn-so hn-so--secondary">
              <span className="hn-so-tieu">ĐIỂM CA KIỂM TRA GẦN NHẤT</span>
              <span className="hn-so-gia-tri">{soThap(tc.em.diemCaGanNhat.diem)}</span>
              {tc.em.diemCaGanNhat.tenCa && <span className="hn-so-phu">{tc.em.diemCaGanNhat.tenCa}</span>}
            </div>
          )}
          {tc.em.expHomNay != null && (
            <div className="hn-so hn-so--tertiary">
              <span className="hn-so-tieu">EXP HÔM NAY</span>
              <span className="hn-so-gia-tri">+{tc.em.expHomNay.toLocaleString('vi-VN')}</span>
              {tc.em.expTong != null && <span className="hn-so-phu">tổng {tc.em.expTong.toLocaleString('vi-VN')}</span>}
            </div>
          )}
        </section>
      )}

      {ket === undefined && <p className="hn2-trong" role="status">Đang tải toàn cảnh của em…</p>}
      {ket && !ket.ok && (
        <p className={`hn2-ghi-chu${ket.loai === 'chua_co_lenh' ? '' : ' hn2-ghi-chu--canh'}`} role={ket.loai === 'chua_co_lenh' ? 'status' : 'alert'}>
          <Info size={16} aria-hidden="true" />
          <span>{ket.chu}</span>
        </p>
      )}

      {tc && (
        <div className="tc-luoi">
          <DongThoiGian dong={dong} loai={loai} dangTai={dangTaiDong} loi={loiDong} conNua={!!conNua} dangTaiThem={dangTaiThem} nayMs={nayMs} onLoc={loc} onThem={them} onMoCa={moChiTietCa} />
          <div className="tc-cot-phai">
            <BanDoDang dang={tc.dang} />
            <NhipHoc30 nhip={tc.nhip30} chuoiNgay={tc.em.chuoiNgay} />
            <TheHuynh luc={tc.em.phuHuynhXemCuoi} nayMs={nayMs} />
          </div>
        </div>
      )}
    </div>
  )
}
