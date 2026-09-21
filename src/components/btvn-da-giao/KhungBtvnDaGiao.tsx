// MỤC "BÀI TẬP VỀ NHÀ ĐÃ GIAO" — thiết kế lại theo mẫu phác thầy chốt 21/09 18:1x (đề prompt-btvn-da-giao-thiet-ke-lai-2109.md, mẫu docs/ban-ve-btvn-da-giao-2109/mau-phac.html).
// CHỈ ĐỔI PHẦN NHÌN: luật hạn nộp / nộp trễ / thu hồi / giao bài và lệnh `/btvn/sua`, `/btvn/giao` do nơi gọi giữ nguyên (callback). Màn KHÔNG tự tính nhóm em — chỉ đọc số máy chủ.
// Tiền tố lớp CSS `btg-`. Nhớ thẻ mở / thu trong phiên bằng sessionStorage (không có ⇒ trong bộ nhớ).
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ClipboardCheck, RefreshCw, Search, Send } from 'lucide-react'
import ONgayGio24 from '../ONgayGio24'
import { gioDayDu } from '../../lib/ngay-gio-24'
import { baiChoThe, daiCanYNhu, emTheoNhom, locBai, lopCuaCacBai, sapXepThe, type NhomChon, type TheBai } from '../../lib/btvn-da-giao'
import type { NhomBtvn } from '../../lib/nhom-btvn'
import HopBtg from './HopBtg'
import NganEm from './NganEm'
import TheBaiBtg from './TheBai'
import './btg.css'

const KHOA_PHIEN = 'btg-mo-the'
const boNho: { v: Record<string, boolean> } = { v: {} } // chỉ dùng khi KHÔNG có sessionStorage
function docMoTay(): Record<string, boolean> {
  try {
    const r = window.sessionStorage.getItem(KHOA_PHIEN)
    return r ? (JSON.parse(r) as Record<string, boolean>) : {}
  } catch {
    return { ...boNho.v } // không có sessionStorage: nhớ trong bộ nhớ của trang
  }
}
function ghiMoTay(v: Record<string, boolean>) {
  try {
    window.sessionStorage.setItem(KHOA_PHIEN, JSON.stringify(v))
  } catch {
    boNho.v = { ...v }
  }
}

/** Màn ≥ 1100 px ⇒ ngăn danh sách em nằm bên phải; hẹp hơn ⇒ tấm trượt dưới. */
function useManRong(): boolean {
  const truyVan = '(min-width: 1100px)'
  const [rong, setRong] = useState(() => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(truyVan).matches : false))
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const m = window.matchMedia(truyVan)
    const doi = () => setRong(m.matches)
    m.addEventListener?.('change', doi)
    doi()
    return () => m.removeEventListener?.('change', doi)
  }, [])
  return rong
}

type Hop = { kieu: 'doi_han' | 'chi_tiet' | 'bai_lam'; khoa: string } | null

export interface KhungBtvnDaGiaoProps {
  /** Các lần giao đã gộp (`nhomBtvn(theoDoi)`). */
  ds: NhomBtvn[]
  nowMs: number
  dangNap: boolean
  onNap: () => void
  /** Tên cũ khi máy chủ chưa trả `ten` (dòng đường dẫn cũ). */
  tenCu: (t: NhomBtvn) => string
  /** Mã bài đang được cập nhật (khoá nút). */
  dangSua: string
  /** Giá trị mặc định cho ô hạn từ hạn hiện có. */
  hanChoOChon: (hanNop: string) => string
  /** LƯU HẠN — lệnh `/btvn/sua` cũ của nơi gọi; `gio` là chuỗi ô ngày giờ. */
  onLuuHan: (t: NhomBtvn, gio: string) => Promise<void> | void
  /** THU HỒI — nơi gọi mở hộp xác nhận nói rõ hậu quả (luôn qua hộp). */
  onThuHoi: (t: NhomBtvn) => void
  /** "Xem bài làm": khối danh sách + thao tác từng em sẵn có, nơi gọi dựng. */
  dungBaiLam: (t: NhomBtvn) => ReactNode
  onMoToanCanh: (sbd: string) => void
  onGiaoBaiMoi: () => void
  /** Thông báo kết quả thao tác (đã dựng ở nơi gọi). */
  thongBao?: ReactNode
}

export default function KhungBtvnDaGiao(p: KhungBtvnDaGiaoProps) {
  const { ds, nowMs } = p
  const rong = useManRong()
  const [lop, setLop] = useState('')
  const [q, setQ] = useState('')
  const [moTay, setMoTay] = useState<Record<string, boolean>>(docMoTay)
  const [ngan, setNgan] = useState<{ khoa: string; nhom: NhomChon } | null>(null)
  const [hop, setHop] = useState<Hop>(null)
  const [hanNhap, setHanNhap] = useState('')

  const bai = useMemo(() => sapXepThe(ds.map((t) => baiChoThe(t, p.tenCu))), [ds, p.tenCu])
  const tuKhoa = useMemo(() => new Map(ds.map((t) => [t.maBtvn, t])), [ds])
  const emCua = useCallback((khoa: string) => tuKhoa.get(khoa)?.hocSinh, [tuKhoa])
  const lopDs = useMemo(() => lopCuaCacBai(bai), [bai])
  const theoLop = useMemo(() => (lop ? bai.filter((b) => b.tenLop.split(' · ').includes(lop)) : bai), [bai, lop])
  const dai = useMemo(() => daiCanYNhu(theoLop, nowMs), [theoLop, nowMs])
  const hienThi = useMemo(() => locBai(bai, emCua, lop, q), [bai, emCua, lop, q])
  const baiNgan: TheBai | undefined = ngan ? bai.find((b) => b.khoa === ngan.khoa) : undefined

  const laMo = (b: TheBai, i: number) => moTay[b.khoa] ?? i === 0
  const doiMo = (b: TheBai, i: number) => setMoTay((c) => { const v = { ...c, [b.khoa]: !laMo(b, i) }; ghiMoTay(v); return v })
  const moNgan = (b: TheBai, nhom: NhomChon) => { setNgan({ khoa: b.khoa, nhom }); setMoTay((c) => { const v = { ...c, [b.khoa]: true }; ghiMoTay(v); return v }) }
  // Gõ chỉ LỌC danh sách bài; KHÔNG mở ngăn mỗi ký tự (màn hẹp: tấm trượt sẽ cướp tiêu điểm và che ô tìm, không gõ được ký tự thứ hai). Ngăn mở khi thầy nhấn Enter hoặc bấm một kết quả.
  const timEm = (v: string) => setQ(v)
  const ketQuaTim = useMemo(() => {
    if (q.trim() === '') return { ds: [] as { bai: TheBai; em: { sbd: string; hoTen: string } }[], them: 0 }
    const tat = hienThi.flatMap(({ bai: b }) => emTheoNhom(emCua(b.khoa), 'tat_ca', q).map((em) => ({ bai: b, em })))
    return { ds: tat.slice(0, 6), them: Math.max(0, tat.length - 6) }
  }, [hienThi, emCua, q])
  const moKetQua = (b: TheBai) => moNgan(b, 'tat_ca')
  // Ngăn đang mở mà bài biến mất (đổi lớp, thu hồi): đóng.
  useEffect(() => { if (ngan && !baiNgan) setNgan(null) }, [ngan, baiNgan])
  const bai1 = (khoa: string) => tuKhoa.get(khoa)

  const dongHop = () => setHop(null)
  const tHop = hop ? bai1(hop.khoa) : undefined
  const moDoiHan = (b: TheBai) => { const t = bai1(b.khoa); if (!t) return; setHanNhap(p.hanChoOChon(t.hanNop)); setHop({ kieu: 'doi_han', khoa: b.khoa }) }

  const rongNgan = rong && ngan && baiNgan
  const tatCaThieuNhom = bai.length > 0 && bai.every((b) => b.nhom === null) // máy chủ chưa trả số nhóm cho bài nào: nói MỘT lần ở đầu, không lặp ở mọi thẻ
  const coBai = ds.length > 0

  return (
    <section className="btg" aria-label="Bài tập về nhà đã giao">
      <header className="btg-dau">
        <div>
          <h2 className="btg-tieu-de">Bài tập về nhà đã giao</h2>
          <p className="btg-phu">Bài cần để ý nhất đứng đầu và mở sẵn. Bấm một đoạn của thanh để xem đúng nhóm em đó.</p>
        </div>
        <button type="button" className="btg-nut" onClick={p.onNap} disabled={p.dangNap}>
          <RefreshCw size={16} className={p.dangNap ? 'btg-quay' : undefined} /> Cập nhật dữ liệu
        </button>
      </header>

      {p.thongBao}

      {!coBai ? (
        p.dangNap ? (
          <p className="btg-phu" role="status">Đang tải danh sách bài…</p>
        ) : (
          <div className="btg-rong">
            <ClipboardCheck size={28} aria-hidden="true" />
            <h3>Chưa có bài tập về nhà nào</h3>
            <p className="btg-phu">Chuyển sang mục “Giao bài mới” để giao bài cho học sinh.</p>
            <button type="button" className="btg-nut btg-nut--chinh" onClick={p.onGiaoBaiMoi}><Send size={16} /> Giao bài mới ngay</button>
          </div>
        )
      ) : (
        <>
          <div className="btg-loc" role="search">
            {lopDs.length > 0 && (
              <div className="btg-chip-hang" role="group" aria-label="Lọc theo lớp">
                <button type="button" className={`btg-chip${lop === '' ? ' btg-chip--chon' : ''}`} aria-pressed={lop === ''} onClick={() => setLop('')}>Tất cả lớp</button>
                {lopDs.map((l) => (
                  <button key={l} type="button" className={`btg-chip${lop === l ? ' btg-chip--chon' : ''}`} aria-pressed={lop === l} onClick={() => setLop(lop === l ? '' : l)}>{l}</button>
                ))}
              </div>
            )}
            <label className="btg-tim">
              <Search size={16} aria-hidden="true" />
              <span className="btg-an-chu">Tìm học sinh theo tên hoặc số báo danh</span>
              <input type="search" value={q} placeholder="Tìm tên hoặc số báo danh" onChange={(e) => timEm(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && ketQuaTim.ds[0]) { e.preventDefault(); moKetQua(ketQuaTim.ds[0].bai) } }} />
            </label>
          </div>

          {q.trim() !== '' && (
            <div className="btg-ket-qua" role="region" aria-label="Kết quả tìm học sinh">
              {ketQuaTim.ds.length === 0 ? (
                <p className="btg-phu" role="status">Không có học sinh nào khớp “{q.trim()}”.</p>
              ) : (
                <>
                  <p className="btg-phu">Nhấn Enter hoặc bấm một dòng để mở danh sách em của bài.</p>
                  <ul className="btg-ket-qua-ds">
                    {ketQuaTim.ds.map(({ bai: b, em }) => (
                      <li key={`${b.khoa}|${em.sbd}`}>
                        <button type="button" className="btg-ket-qua-muc" onClick={() => moKetQua(b)}>
                          <b>{em.hoTen || em.sbd}</b> <span className="btg-phu">{b.ten}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {ketQuaTim.them > 0 && <p className="btg-phu">và {ketQuaTim.them} em khác — gõ thêm để thu hẹp.</p>}
                </>
              )}
            </div>
          )}

          {tatCaThieuNhom && <p className="btg-phu btg-thieu-nhom" role="status">Chưa có số theo nhóm — bấm “Cập nhật dữ liệu” để tải lại.</p>}
          {(dai.chuaMo || dai.chamNhip || dai.chuaNopQuaHan || dai.hanGanNhat) && (
            <div className="btg-dai" role="group" aria-label="Cần thầy để ý">
              {dai.chuaMo && <div className="btg-o btg-o--cam"><small>Em chưa mở bài</small><b>{dai.chuaMo.em}</b> em · {dai.chuaMo.bai} bài</div>}
              {dai.chamNhip && <div className="btg-o btg-o--cam"><small>Em chậm nhịp</small><b>{dai.chamNhip.em}</b> em · {dai.chamNhip.bai} bài</div>}
              {dai.chuaNopQuaHan && <div className="btg-o btg-o--cam"><small>Em chưa nộp quá hạn</small><b>{dai.chuaNopQuaHan.em}</b> em · {dai.chuaNopQuaHan.bai} bài</div>}
              {dai.hanGanNhat && <div className={`btg-o${dai.hanGanNhat.cam ? ' btg-o--cam' : ''}`}><small>Hạn gần nhất</small><b>{dai.hanGanNhat.chu.replace(/^còn /, '')}</b><span className="btg-o-phu">{dai.hanGanNhat.ten}</span></div>}
            </div>
          )}
          {dai.moiBaiDungNhip && <p className="btg-dai-xanh" role="status">Mọi bài đang đúng nhịp.</p>}

          <div className={`btg-luoi${rongNgan ? ' btg-luoi--ngan' : ''}`}>
            <div className="btg-ds">
              {hienThi.length === 0 ? (
                <p className="btg-phu" role="status">Không có bài nào khớp bộ lọc.</p>
              ) : (
                hienThi.map(({ bai: b }) => {
                  const i = bai.findIndex((x) => x.khoa === b.khoa)
                  return (
                    <TheBaiBtg
                      key={b.khoa}
                      bai={b}
                      nowMs={nowMs}
                      mo={laMo(b, i)}
                      doiMo={() => doiMo(b, i)}
                      ghiChuThieuNhom={!tatCaThieuNhom}
                      dangSua={p.dangSua === b.khoa}
                      moNgan={(n) => moNgan(b, n)}
                      hd={{ doiHan: () => moDoiHan(b), xemBaiLam: () => setHop({ kieu: 'bai_lam', khoa: b.khoa }), chiTiet: () => setHop({ kieu: 'chi_tiet', khoa: b.khoa }), thuHoi: () => { const t = bai1(b.khoa); if (t) p.onThuHoi(t) } }}
                    />
                  )
                })
              )}
            </div>
            {ngan && baiNgan && (
              <NganEm
                bai={baiNgan}
                hocSinh={emCua(baiNgan.khoa)}
                nhom={ngan.nhom}
                q={q}
                nowMs={nowMs}
                hep={!rong}
                doiNhom={(n) => setNgan({ khoa: ngan.khoa, nhom: n })}
                boLoc={() => setQ('')}
                dong={() => setNgan(null)}
                onMoToanCanh={p.onMoToanCanh}
              />
            )}
          </div>
        </>
      )}

      {hop?.kieu === 'doi_han' && tHop && (
        <HopBtg tieuDe="Đổi hạn nộp" dong={dongHop}>
          {p.thongBao}
          <p className="btg-phu">{bai.find((b) => b.khoa === tHop.maBtvn)?.ten ?? tHop.maBtvn}</p>
          <ONgayGio24 nhan="Hạn nộp mới" value={hanNhap} onChange={setHanNhap} nhanh khongQuaKhu />
          <div className="btg-hop-chan">
            <button type="button" className="btg-nut" onClick={dongHop}>Huỷ</button>
            <button type="button" className="btg-nut btg-nut--chinh" disabled={p.dangSua === tHop.maBtvn || !hanNhap} onClick={async () => { await p.onLuuHan(tHop, hanNhap); dongHop() }}>Lưu hạn</button>
          </div>
        </HopBtg>
      )}
      {hop?.kieu === 'chi_tiet' && tHop && (
        <HopBtg tieuDe="Chi tiết bài" dong={dongHop}>
          {bai.find((b) => b.khoa === tHop.maBtvn)?.caNhan && (
            <p className="btg-phu">
              Cá nhân hoá · {bai.find((b) => b.khoa === tHop.maBtvn)?.soCauLoi ?? 0} câu cốt lõi. Điểm mỗi em tính trên số câu của em; so cả lớp CHỈ trên câu cốt lõi.
            </p>
          )}
          <dl className="btg-chi-tiet">
            <dt>Tên bài</dt><dd>{bai.find((b) => b.khoa === tHop.maBtvn)?.ten}</dd>
            <dt>Mã bài</dt><dd>{tHop.baiGoc?.map((x) => x.maBtvn).join(', ') || tHop.maBtvn}</dd>
            <dt>Ca</dt><dd>{tHop.maCa}</dd>
            <dt>Tờ đề</dt><dd>{p.tenCu(tHop)}</dd>
            <dt>Số câu</dt><dd>{tHop.soCau}{bai.find((b) => b.khoa === tHop.maBtvn)?.soCauLoi ? ` (${bai.find((b) => b.khoa === tHop.maBtvn)?.soCauLoi} câu lõi)` : ''}</dd>
            <dt>Sĩ số</dt><dd>{tHop.tong} em, đã nộp {tHop.daNop}</dd>
            <dt>Giao lúc</dt><dd>{gioDayDu(tHop.giaoLuc)}</dd>
            <dt>Hạn nộp</dt><dd>{gioDayDu(tHop.hanNop)}</dd>
          </dl>
        </HopBtg>
      )}
      {hop?.kieu === 'bai_lam' && tHop && (
        <HopBtg tieuDe={`Bài làm · ${bai.find((b) => b.khoa === tHop.maBtvn)?.ten ?? ''}`} dong={dongHop} rong>
          {p.thongBao}
          {p.dungBaiLam(tHop)}
        </HopBtg>
      )}
    </section>
  )
}
