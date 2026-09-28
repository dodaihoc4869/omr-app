// ĐOÀN HỘ TỐNG — màn TRONG TRẬN (bản vẽ 2) và TRÙM CÂU CHUNG (bản vẽ 5). Không cuộn từ 360×740: mọi khối cố định chiều cao,
// chỉ riêng thẻ câu được cuộn BÊN TRONG khi đề quá dài.
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Question } from './core'
import { CHIEU, HIEP_TRUM, NL_KY_NANG, CHAN, SO_CAU_RIENG_CHANG, satThuongDon, type HanhDong } from './doan-core'
import { CHU_TRANG_THAI, NHAN_CAU, TIN_HIEU_TRUM, type DoanXem, type GheXem, type KetQuaCau } from './doan-kieu'
import DoanCau, { DeBai, duDapAn } from './DoanCau'
import { cacAnhCuaCau, useAnhSanSang } from './anh-san-sang'
import { CHU_HET_CAU_MOI } from './chu-het-luot'
import { BieuTuong, LinhTamCau, QuaiHinh, ThuHinh, TrumHinh } from './DoanHinh'
import { ChemText } from '../../lib/chem-format'
import { LoiGiaiCauSai } from '../../components/KhoiCauSai'
import Canh2 from './doan2/Canh2'
import BuaTroGiang from './doan2/BuaTroGiang'
import XemLaiChuan from './doan2/XemLaiChuan'
import type { GoiYM3 } from './doan2/kieu2'

export interface CauVuaLam { q: Question; chon: string; ketQua: KetQuaCau | null; /** Chỉ-thêm: hiệp của câu (để biết câu này đã là "câu vừa rồi" chưa). */ hiep?: number }
export interface LoiGiaiTrum { hiep: number; de: Question; answer: string; solution: unknown }
interface Props {
  xem: DoanXem; de?: Question; deTrum?: Question
  conGiay: number; moSauGiay: number
  chon: string; onChon: (v: string) => void; hanhDong: HanhDong; onHanhDong: (h: HanhDong) => void
  yChon: Record<number, 'D' | 'S'>; onYChon: (y: number, v: 'D' | 'S') => void
  onChot: (boTrong: boolean) => void; onChotY: (y: number) => void; onTinHieu: (t: string) => void; onRoi: () => void; onZoom: (src: string) => void
  ban: boolean; dangChot?: boolean; /** Máy chủ báo hôm nay hết câu MỚI (bộ có câu em từng làm lâu rồi) — máy nói thật ở quãng chuẩn bị hiệp 1. */ hetCauMoi?: boolean; loi: string; ketQuaCau?: KetQuaCau | null; cauVuaLam?: CauVuaLam | null; loiGiaiTrum?: LoiGiaiTrum | null
  /** Tiếp sức: xin (khi em chưa chốt) và mở tấm trượt giúp bạn (khi em đã chốt). */
  onXinTiepSuc: (bat: boolean) => void; onMoTiepSuc: (ghe: number) => void; expTiepSuc?: number
  /** GAME HÓA 2.0 (`hoa2-sanh` báo `cheDo2`): giao diện mới theo bản vẽ Moi-DoanTran — cùng lệnh, cùng luồng; vắng ⇒ y hệt bản cũ. */
  cheDo2?: boolean; /** Gợi ý M3 (Bùa Trợ giảng) của câu đang chơi. */ goiY?: GoiYM3 | null; /** Ổ phục kích (câu ôn) còn lại hôm nay; null = chưa biết. */ oPhucKich?: number | null
  /** Chỉ-thêm (Hóa 2.0): có ⇒ quãng nghỉ giữ nguyên lời giải, KHÔNG đồng hồ, tới khi em bấm nút này (`nhanTiep`, mặc định "ĐÁNH TIẾP"). */
  onDanhTiep?: () => void; nhanTiep?: string
}

const phut = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const C = 2 * Math.PI * 17

function ThanhHiep({ hiep, soHiep, ketThuc, con, giay, hien, onRoi }: { hiep: number; soHiep: number; ketThuc: boolean; con: number; giay: number; hien: boolean; onRoi: () => void }) {
  return (
    <header className="dh-hiep">
      <div className="dh-hiep-dong"><b>HIỆP {hiep}/{soHiep}</b><span>◆ = hiệp trùm{!ketThuc && <> · <button type="button" className="dh-roi" onClick={onRoi} title="Máy sẽ đỡ thay, đội không bị phạt">Rời chuyến</button></>}</span></div>
      <div className="dh-vach" role="img" aria-label={`Đang ở hiệp ${hiep} trên ${soHiep}`}>
        {Array.from({ length: soHiep }, (_, i) => i + 1).map(h => <i key={h} className={`${HIEP_TRUM.includes(h) ? 'dh-trum' : ''} ${ketThuc || h < hiep ? 'dh-xong' : h === hiep ? 'dh-dang' : ''}`} />)}
      </div>
      <div className={`dh-dong-ho ${hien && con <= 10 ? 'dh-gap' : ''}`} role="timer" aria-label={hien ? `Còn ${con} giây` : 'Chưa tính giờ'}>
        <svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="17" /><circle cx="21" cy="21" r="17" strokeDasharray={C} strokeDashoffset={hien ? C * (1 - Math.max(0, Math.min(1, con / giay))) : 0} /></svg>
        <b>{hien ? con : '·'}</b>
      </div>
    </header>
  )
}

// Vị trí thần thú trong cảnh (theo % chiều cao cảnh): em đứng trước, to nhất; bạn đứng sau, nhỏ hơn.
const CHO_BAN = [{ left: '0%', bottom: '44%', height: '46%' }, { left: '54%', bottom: '34%', height: '46%' }, { left: '30%', bottom: '58%', height: '38%' }]
function DoiHinh({ ghe }: { ghe: GheXem[] }) {
  const em = ghe.find(g => g.laEm), ban = ghe.filter(g => !g.laEm)
  return (
    <div className="dh-doi">
      {ban.map((g, i) => <ThuHinh key={g.ghe} pet={g.pet} cap={g.cap} className="dh-noi-2" style={{ ...CHO_BAN[i], aspectRatio: '1', animationDelay: `${i * .4}s` }} />)}
      {em && <ThuHinh pet={em.pet} cap={em.cap} className="dh-noi" style={{ left: '14%', bottom: '0%', height: '66%', aspectRatio: '1' }} />}
    </div>
  )
}

// 28/09 lần 2 (thầy: "chỗ hiển thị đề phải có diện tích lớn nhất"): `ti` = % bề rộng cột CHIẾN TRƯỜNG (kể cả hiệp trùm, khi chiến trường đứng bên phải);
// mặc định 40 ⇒ cột câu 60 %. Khoá lưu mới (…2) để máy đã lưu tỉ lệ cũ cũng nhận mặc định mới.
const KHOA_TI = 'ddh.doan2.tiCot2', TI_MIN = 25, TI_MAX = 70, TI_MAC_DINH = 40
function docTi(): number { try { const v = Number(localStorage.getItem(KHOA_TI)); return v >= TI_MIN && v <= TI_MAX ? v : TI_MAC_DINH } catch { return TI_MAC_DINH } }

export default function DoanTran(p: Props) {
  const khungRef = useRef<HTMLDivElement>(null), [ti, setTi] = useState(docTi)
  const datTi = (v: number) => { const x = Math.min(TI_MAX, Math.max(TI_MIN, v)); setTi(x); try { localStorage.setItem(KHOA_TI, String(Math.round(x))) } catch { /* máy chặn lưu: bỏ qua */ } }
  const { xem } = p, tran = xem.tran!, em = xem.ghe.find(g => g.laEm)!
  // Ảnh của câu tải xong rồi mới dựng thẻ câu (ảnh nạp trễ đẩy lưới đáp án xuống dưới ngón tay — P0 "đáp án bị nhảy"); câu không ảnh ⇒ sẵn sàng ngay.
  const anhCauXong = useAnhSanSang(cacAnhCuaCau(p.de)), anhTrumXong = useAnhSanSang(cacAnhCuaCau(p.deTrum))
  const mo = p.moSauGiay <= 0 && !tran.ketThuc
  const tenQuai = tran.tenQuai[tran.hiep < HIEP_TRUM[0]! ? 0 : 1] ?? 'Tạp Chất'
  const phanTramLinhTam = Math.round(tran.linhTam.hp * 100 / tran.linhTam.toiDa)

  const canh = tran.laTrum ? (
    <div className="dh-canh dh-canh-trum" aria-label={`Trùm ${tran.tenTrum[HIEP_TRUM.indexOf(tran.hiep)] ?? ''}`}>
      <div className="dh-giap">
        <div className="dh-giap-dong">TRÙM · {(tran.tenTrum[HIEP_TRUM.indexOf(tran.hiep)] ?? '').toUpperCase()}<span>GIÁP 4 ĐOẠN</span></div>
        <div className="dh-giap-vach">{[0, 1, 2, 3].map(i => <i key={i} />)}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 46, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrumHinh loai={tran.loaiTrum[HIEP_TRUM.indexOf(tran.hiep)] ?? ''} size={132} className="dh-noi" /></div>
      <div style={{ position: 'absolute', left: 8, right: 8, bottom: 6, display: 'flex', justifyContent: 'space-between' }}>
        {xem.ghe.map((g, i) => <ThuHinh key={g.ghe} pet={g.pet} cap={g.cap} size={56} quayTrai={i >= xem.ghe.length / 2} className="dh-noi-2" style={{ animationDelay: `${i * .3}s` }} />)}
      </div>
      <div className="dh-canh-the" style={{ right: 12, top: 56, color: 'rgb(200,246,255)' }}>Máu Linh Tâm {tran.linhTam.hp}/{tran.linhTam.toiDa}</div>
    </div>
  ) : (
    <div className="dh-canh" aria-label={`Linh Tâm còn ${tran.linhTam.hp} máu, ${tran.quai.length} ${tenQuai} trên sân`}>
      <div className="dh-canh-trang" /><div className="dh-canh-dat" />
      {xem.tiepSuc?.lienKichSanSang && mo && <div className="dh-canh-bieu-ngu">LIÊN KÍCH ×2 SẴN SÀNG</div>}
      <DoiHinh ghe={xem.ghe} />
      <div className="dh-linh-tam-o"><LinhTamCau size={44} /><div className="dh-mau"><i style={{ width: `${phanTramLinhTam}%` }} /></div></div>
      <div className="dh-dich">
        {tran.quai.slice(0, 3).map((q, i) => (
          <div key={q.ma} className="dh-noi-2" style={{ animationDelay: `${i * .5}s` }}>
            <div className="dh-mau"><i style={{ width: `${Math.round(q.hp * 100 / 24)}%` }} /></div>
            <QuaiHinh loai={q.loai} size={i === 0 ? 72 : 58} />
          </div>
        ))}
      </div>
      <div className="dh-canh-the" style={{ left: '20%', bottom: 8, color: 'rgb(200,246,255)', boxShadow: 'inset 0 0 0 1px rgba(127,233,255,.5)' }}>Máu Linh Tâm {tran.linhTam.hp}/{tran.linhTam.toiDa}</div>
      <div className="dh-canh-the" style={{ right: 10, bottom: 8, color: 'rgb(230,255,122)', boxShadow: 'inset 0 0 0 1px rgba(230,255,122,.5)' }}>{tran.quai.length ? `${tenQuai} ×${tran.quai.length}` : 'Sân đã sạch'}</div>
    </div>
  )

  const daiDoi = (
    <div className="dh-dai-doi" aria-label="Đồng đội">
      {xem.ghe.map(g => (
        <div key={g.ghe} className={`dh-the-ban ${g.laEm ? 'dh-la-em' : ''}`} data-tt={g.trangThai}>
          <ThuHinh pet={g.pet} cap={g.cap} size={34} />
          {/* KHÔNG BAO GIỜ có chữ "sai" hay đáp án của bạn ở đây — chỉ trạng thái. */}
          <div><b>{g.laEm ? 'Em' : g.ten}</b><small>{CHU_TRANG_THAI[g.trangThai]}</small></div>
        </div>
      ))}
    </div>
  )

  const v2 = !!p.cheDo2
  // Hóa 2.0 · phòng ≥ 2 người thật giữ nhịp cũ (không bắt bạn chờ) ⇒ em vẫn mở lại được lời giải câu vừa rồi, đồng hồ hiệp vẫn chạy.
  const [xemLai, setXemLai] = useState(false)
  const nhieuNguoi = xem.ghe.filter(g => !g.laMay && !g.roi).length >= 2
  const cauTruoc = p.cauVuaLam && p.cauVuaLam.hiep !== undefined && p.cauVuaLam.hiep < tran.hiep ? p.cauVuaLam : null
  const coXemLai = v2 && mo && nhieuNguoi && !tran.laTrum && !!cauTruoc?.ketQua
  const choTiep = v2 && !mo && !!p.onDanhTiep
  let than: ReactNode
  if (!mo) {
    // Quãng nghỉ giữa hai hiệp: em đọc lại câu vừa làm + lời giải; sau hiệp trùm thì đáp án câu chung.
    const lg = p.loiGiaiTrum
    than = lg && v2 ? (
      <section className="dh-giay dh2-giay-ket" aria-label="Đáp án câu chung">
        <div className="dh-giay-dau"><b className="dh-vien-thuoc dh-tim">ĐÁP ÁN CÂU CHUNG</b><span>hiệp {lg.hiep}</span></div>
        <XemLaiChuan q={lg.de} chon="" dapAn={lg.answer} solution={lg.solution} stt={lg.hiep} onZoom={p.onZoom} />
      </section>
    ) : lg ? (
      <section className="dh-giay" aria-label="Đáp án câu chung">
        <div className="dh-giay-dau"><b className="dh-vien-thuoc dh-tim">ĐÁP ÁN CÂU CHUNG</b><span>hiệp {lg.hiep}</span></div>
        <DeBai q={lg.de} onZoom={p.onZoom} />
        <div className="dh-y">{lg.de.ideas.map((y, i) => <div key={i}><span><small>Ý {'abcd'[i]}</small><ChemText text={y} /></span><em className="dh-xong">{lg.answer[i] === 'D' ? 'Đúng' : 'Sai'}</em></div>)}</div>
        <div className="dh-ket-qua-cau dh-dung"><details><summary>Lời giải</summary><LoiGiaiCauSai hoaHoc c={{ text: lg.de.text, phan: 'II', dapAnDung: lg.answer, loiGiai: lg.solution }} /></details></div>
      </section>
    ) : p.cauVuaLam ? (
      <DoanCau q={p.cauVuaLam.q} chon={p.cauVuaLam.chon} onChon={() => {}} khoa ketQua={p.cauVuaLam.ketQua} onZoom={p.onZoom} dau={<><b className="dh-vien-thuoc">{v2 ? 'CÂU ÔN EM VỪA LÀM' : 'CÂU EM VỪA LÀM'}</b><span>đọc lại trước khi sang hiệp mới</span></>}
        xemLaiChuan={v2 ? { stt: p.cauVuaLam.hiep ?? Math.max(1, tran.hiep - 1) } : undefined} />
    ) : (
      <section className="dh-giay"><div className="dh-de">{tran.hiep === 1 ? 'Cả đội vào vị trí. Mỗi bạn sẽ nhận MỘT câu của riêng mình — làm đúng thì ra đòn, làm sai thì thần thú tự chắn cho Linh Tâm.' : 'Hiệp mới sắp mở.'}</div></section>
    )
  } else if (coXemLai && xemLai) {
    than = (
      <DoanCau q={cauTruoc!.q} chon={cauTruoc!.chon} onChon={() => {}} khoa ketQua={cauTruoc!.ketQua} onZoom={p.onZoom} dau={<><b className="dh-vien-thuoc">CÂU ÔN EM VỪA LÀM</b><span>đồng hồ hiệp này vẫn chạy</span></>}
        xemLaiChuan={{ stt: cauTruoc!.hiep! }} />
    )
  } else if (tran.laTrum) {
    const trum = xem.trum
    than = trum?.coCau && p.deTrum && !anhTrumXong ? (
      <section className="dh-giay" aria-label="Câu chung cả đội"><div className="dh-giay-dau"><b className="dh-vien-thuoc dh-tim">CÂU CHUNG CẢ ĐỘI</b></div><div className="dh-de" role="status">Đang tải hình của câu chung…</div></section>
    ) : !trum?.coCau || !p.deTrum ? (
      <section className="dh-giay"><div className="dh-giay-dau"><b className="dh-vien-thuoc dh-tim">TRÙM</b></div>
        <div className="dh-de">Hiệp này không có câu chung phù hợp với cả đội. Giáp trùm sẽ vỡ theo phong độ ba hiệp vừa rồi: bạn nào tự làm đúng từ 2/3 câu thì phá được đoạn giáp của mình.</div></section>
    ) : (
      <section className="dh-giay" aria-label="Câu chung cả đội">
        <div className="dh-giay-dau"><b className="dh-vien-thuoc dh-tim">CÂU CHUNG CẢ ĐỘI</b><span>{trum.tenDang || 'Hoá học'} · dạng cả lớp đang yếu</span></div>
        <DeBai q={p.deTrum} onZoom={p.onZoom} />
        <div className="dh-y">
          {p.deTrum.ideas.map((y, i) => {
            const giu = xem.ghe[trum.giaoY[i]!], cuaEm = trum.yCuaEm.includes(i), daChot = trum.yDaChot[i]
            return (
              <div key={i} className={cuaEm ? 'dh-y-em' : ''}>
                {giu && <ThuHinh pet={giu.pet} cap={giu.cap} size={34} />}
                <span><small>Ý {'abcd'[i]} · {cuaEm ? 'CỦA EM' : (giu?.ten ?? '').toUpperCase()}</small><ChemText text={y} /></span>
                {cuaEm && !daChot ? (
                  <div className="dh-ds">
                    {/* Chọn / đổi Đúng-Sai KHÔNG khoá theo lệnh đang bay; nút "Chốt ý này" CÓ SẴN (khoá tới khi chọn) — hiện SAU khi chọn thì hàng bị nở ra, đẩy các hàng dưới xuống dưới ngón tay. */}
                    <button type="button" aria-pressed={p.yChon[i] === 'D'} onClick={() => p.onYChon(i, 'D')}>Đúng</button>
                    <button type="button" aria-pressed={p.yChon[i] === 'S'} onClick={() => p.onYChon(i, 'S')}>Sai</button>
                    <button type="button" className="dh-chot-y" disabled={p.ban || !p.yChon[i]} onClick={() => p.onChotY(i)}>Chốt ý này</button>
                  </div>
                ) : <em className={daChot ? 'dh-xong' : 'dh-nghi'}>{daChot ? 'đã chốt' : giu?.laMay || giu?.roi ? 'máy đỡ' : 'đang nghĩ…'}</em>}
              </div>
            )
          })}
        </div>
      </section>
    )
  } else {
    const cau = xem.cau, nhanThe = v2 ? 'CÂU ÔN CỦA EM' : 'CÂU CỦA EM'
    // 2.0: gạch CHỈ áp cho Phần I (máy chủ chỉ gửi gạch khi câu là trắc nghiệm); dải bùa hiện cả khi gợi ý là Kiến thức cốt lõi.
    const gach = v2 && p.de?.phan === 'I' ? p.goiY?.gach : undefined, bua = v2 && p.goiY ? <BuaTroGiang goiY={p.goiY} /> : undefined
    than = !(cau?.het || cau?.rut) && p.de && !anhCauXong ? (
      <section className="dh-giay" aria-label="Câu của em"><div className="dh-giay-dau"><b className="dh-vien-thuoc">{nhanThe}</b></div><div className="dh-de" role="status">Đang tải hình của câu…</div></section>
    ) : cau?.het || cau?.rut || !p.de ? (
      <section className="dh-giay"><div className="dh-giay-dau"><b className="dh-vien-thuoc">{nhanThe}</b></div><div className="dh-de">{cau?.loiNhan ?? 'Đang tải câu của em…'}</div></section>
    ) : (
      <DoanCau q={p.de} chon={p.chon} onChon={p.onChon} khoa={!!p.dangChot || !!cau?.daChot} ketQua={cau?.daChot ? p.ketQuaCau ?? cau.ketQua ?? null : null} onZoom={p.onZoom}
        dau={<><b className="dh-vien-thuoc">{nhanThe}</b><span>{p.de.tenDang || 'Hoá học'}{cau?.nhan ? ` · ${NHAN_CAU[cau.nhan]}` : ''}{cau?.an ? ' · ấn đã sáng' : ''}</span></>}
        gach={gach} bua={bua} xemLaiChuan={v2 ? { stt: tran.hiep } : undefined} />
    )
  }

  const cau = xem.cau, daChot = !!cau?.daChot, chieu = CHIEU[em.pet]!, ts = xem.tiepSuc
  // Câu thuộc dạng em ĐÃ KHẮC PHỤC XONG (ấn sáng) → nút kỹ năng mang tên biến thể ấn, mạnh hơn ×1,25.
  const tenKyNang = cau?.an ? chieu.kyNangAn : chieu.kyNang
  const tenDon = p.hanhDong === 'danh' ? 'Đánh' : p.hanhDong === 'chan' ? 'Chắn' : tenKyNang
  const du = !!p.de && duDapAn(p.de, p.chon), boTrong = !du && p.hanhDong === 'chan'
  const duoi = !mo ? null : tran.laTrum ? (
    <>
      {xem.trum?.coCau && <div className="dh-tin-hieu" role="group" aria-label="Tín hiệu cho đồng đội">{TIN_HIEU_TRUM.map(([ma, chu]) => <button key={ma} type="button" aria-pressed={em.tinHieu === ma} onClick={() => p.onTinHieu(em.tinHieu === ma ? '' : ma)}>{chu}</button>)}</div>}
      <div className="dh-chan-trang">Đúng từ <b>3/4 ý</b> → <span className="dh-chu-vang">VỠ GIÁP TRÙM</span> · cả đội cùng thắng</div>
    </>
  ) : cau?.het ? (
    // 28/09 · HẾT CÂU RIÊNG: máy đã tính em chốt vai giữ khiên — em không phải chờ, vẫn tiếp sức được bạn đang cần.
    <>
      <div className="dh-cho" role="status" data-vung="giu-khien">Em giữ khiên · +{cau.chan ?? CHAN} giáp cho Linh Tâm · máy đã tính em chốt · còn {phut(p.conGiay)}</div>
      {(ts?.banCan ?? []).map(k => <button key={k} type="button" className="dh-nut-vang" style={{ minHeight: 50, fontSize: 15 }} disabled={p.ban} onClick={() => p.onMoTiepSuc(k)}>Tiếp sức cho {xem.ghe[k]?.ten} · bạn ấy đang cần</button>)}
    </>
  ) : daChot ? (
    <>
      <div className="dh-cho">Em đã chốt · còn {phut(p.conGiay)} · {ts?.daGiup ? `em đã tiếp sức${p.expTiepSuc ? ` · +${p.expTiepSuc} EXP tiếp sức` : ''} — bạn làm lại đúng là LIÊN KÍCH ×2` : 'chờ đồng đội ra đòn cùng lúc'}</div>
      {(ts?.banCan ?? []).map(k => <button key={k} type="button" className="dh-nut-vang" style={{ minHeight: 50, fontSize: 15 }} disabled={p.ban} onClick={() => p.onMoTiepSuc(k)}>Tiếp sức cho {xem.ghe[k]?.ten} · bạn ấy đang cần</button>)}
    </>
  ) : (
    <>
      <div className="dh-don" role="group" aria-label="Chọn đòn">
        <button type="button" aria-pressed={p.hanhDong === 'danh'} onClick={() => p.onHanhDong('danh')}>{BieuTuong.danh}<b>Đánh</b><small>đúng → {satThuongDon({ dung: true })} sát thương</small></button>
        <button type="button" aria-pressed={p.hanhDong === 'chan'} onClick={() => p.onHanhDong('chan')}>{BieuTuong.chan}<b>Chắn</b><small>+{CHAN} giáp cho Linh Tâm</small></button>
        <button type="button" aria-pressed={p.hanhDong === 'ky_nang'} disabled={tran.nangLuong < NL_KY_NANG} onClick={() => p.onHanhDong('ky_nang')}>{BieuTuong.ky_nang}<b>{tenKyNang}</b><small>{cau?.an ? `ấn sáng ×1,25 · Năng lượng ${tran.nangLuong}/${NL_KY_NANG}` : `Năng lượng ${tran.nangLuong}/${NL_KY_NANG}`}</small></button>
      </div>
      {ts && !ts.theNhan && !cau?.rut && (ts.conLuotNhan > 0
        ? <button type="button" className="dh-xin" aria-pressed={ts.daXin} disabled={p.ban} onClick={() => p.onXinTiepSuc(!ts.daXin)}>{ts.daXin ? 'Đang chờ bạn tiếp sức… (chạm để thôi)' : `Cần tiếp sức · còn ${ts.conLuotNhan} lần được tiếp sức`}</button>
        : <div className="dh-cho" style={{ fontSize: 12 }}>Em đã dùng hết 2 lần được tiếp sức của chuyến này — câu này em tự làm nhé.</div>)}
      <button type="button" className={v2 ? 'dh-nut-lam dh2-nut-chinh dh2-baloo' : 'dh-nut-lam'} disabled={p.ban || !(du || boTrong) || !!cau?.rut && !boTrong} onClick={() => p.onChot(boTrong)}>
        {v2
          ? (p.dangChot ? 'ĐANG CHỐT…' : p.ban ? 'CHỜ MỘT CHÚT…' : du ? `CHỐT ĐÒN ${tenDon.toUpperCase()}${p.de!.phan === 'I' ? ` · ${p.chon}` : ''}` : boTrong ? 'CHỐT · BỎ TRỐNG + CHẮN' : 'CHỌN ĐÁP ÁN ĐỂ CHỐT ĐÒN')
          : (p.dangChot ? 'Đang chốt…' : p.ban ? 'Chờ một chút…' : du ? `Chốt đòn · ${p.de!.phan === 'I' ? p.chon + ' + ' : ''}${tenDon}` : boTrong ? 'Chốt · bỏ trống + Chắn' : 'Chọn đáp án để chốt đòn')}
      </button>
    </>
  )

  // Hóa 2.0 · bố cục NGANG (docs/ban-ve-ngang-2809, doan2-ngang.css): hai cột bọc `display:contents` ⇒ màn dọc y nguyên; màn ngang thành lưới 7/5
  // (chiến trường trái · câu + đòn + CHỐT ĐÒN phải; hiệp trùm 4 ý dài thì đảo: câu trái, trùm phải). Cờ tắt: không bọc gì.
  // Thanh kéo đổi độ rộng hai cột (thầy 28/09): `--dh2-ti` = % bề rộng cột CHIẾN TRƯỜNG (trái; hiệp trùm thì phải), lưu trên máy em.
  const keoTi = (x: number) => { const r = khungRef.current?.getBoundingClientRect(); if (r && r.width > 0) { const f = (x - r.left) / r.width * 100; datTi(tran.laTrum ? 100 - f : f) } }
  const bocPhai = (x: ReactNode) => v2 ? <div className="dh2-cot dh2-cot-phai" data-vung="cot-phai">{x}</div> : x
  return (
    <div ref={khungRef} className={v2 ? `dh-khung dh2-tran${tran.laTrum ? ' dh2-tran-trum' : ''}` : 'dh-khung'} style={v2 ? { '--dh2-ti': ti } as CSSProperties : undefined}>
      {v2 ? <div className="dh2-cot dh2-cot-trai" data-vung="cot-trai"><Canh2 xem={xem} tran={tran} con={p.conGiay} mo={mo} oPhucKich={p.oPhucKich ?? null} onRoi={p.onRoi} /></div> : <>
        <ThanhHiep hiep={tran.hiep} soHiep={tran.soHiep} ketThuc={tran.ketThuc} con={p.conGiay} giay={tran.giay} hien={mo} onRoi={p.onRoi} />
        {canh}
        {daiDoi}
      </>}
      {v2 && <div className="dh2-keo" role="separator" aria-orientation="vertical" aria-label="Kéo để đổi độ rộng hai cột" aria-valuemin={TI_MIN} aria-valuemax={TI_MAX} aria-valuenow={Math.round(ti)} tabIndex={0}
        onPointerDown={e => e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) keoTi(e.clientX) }}
        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); datTi(ti + (e.key === 'ArrowLeft' ? -5 : 5) * (tran.laTrum ? -1 : 1)) } }}><i /></div>}
      {bocPhai(<>
      {than}
      {/* Thẻ tiếp sức của bạn nằm DƯỚI câu: đặt trên câu thì mỗi lần bạn gửi thẻ (nhịp hỏi 1,5 s) cả lưới đáp án bị đẩy xuống dưới ngón tay em (P0 "đáp án bị nhảy"). */}
      {mo && ts?.theNhan && <div className="dh-the-nhan" role="status"><small>{ts.theNhan.tuLaMay ? 'BẠN ĐỒNG HÀNH' : ts.theNhan.tuTen.toUpperCase()} TIẾP SỨC · {ts.theNhan.tieuDe.toUpperCase()}</small>{ts.theNhan.noiDung}</div>}
      {p.loi && <div className="dh-loi" role="alert">{p.loi}</div>}
      {coXemLai && <button type="button" className="dh-xin" style={{ minHeight: 48 }} aria-pressed={xemLai} onClick={() => setXemLai(x => !x)}>{xemLai ? 'Quay lại câu hiệp này' : 'Xem lại câu vừa rồi'}</button>}
      {!(coXemLai && xemLai) && duoi}
      {choTiep && <button type="button" className="dh-nut-lam dh2-nut-chinh dh2-baloo" data-vung="danh-tiep" style={{ minHeight: 54 }} disabled={p.ban} onClick={p.onDanhTiep}>{p.ban ? 'CHỜ MỘT CHÚT…' : p.nhanTiep ?? 'ĐÁNH TIẾP'}</button>}
      {!mo && !tran.ketThuc && !choTiep && <div className="dh-cho" role="status">{tran.hiep === 1 && !xem.hiepVuaXong ? 'Chuẩn bị lên đường' : `Hiệp ${tran.hiep}${tran.laTrum ? ' · TRÙM' : ''} mở sau`} {Math.max(1, p.moSauGiay)} giây</div>}
      {!mo && !tran.ketThuc && p.hetCauMoi && tran.hiep === 1 && <div className="dh-cho" role="status" data-vung="het-cau-moi">{CHU_HET_CAU_MOI}</div>}
      {!mo && !tran.ketThuc && tran.hiep === 1 && !!xem.soCauThieu && <div className="dh-cho" role="status">Chuyến này em có {Math.max(0, SO_CAU_RIENG_CHANG - xem.soCauThieu)} câu ôn. Hiệp nào em đã ôn xong, em giữ khiên cho đoàn và tiếp sức bạn.</div>}
      </>)}
    </div>
  )
}
