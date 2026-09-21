// NGĂN DANH SÁCH EM của một bài (đề §1.D): bên phải khi màn ≥ 1100 px, tấm trượt dưới ở màn hẹp. Tab theo nhóm có số đếm; mỗi em một dòng: họ tên · chặng đang ở · số câu đã làm / số câu của em ·
// lần học gần nhất · chip "nộp trễ N giờ". Bấm em ⇒ Toàn cảnh em (đường sẵn có). KHÔNG nhãn năng lực, KHÔNG xếp hạng em với em (sắp theo tên).
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { chuHocGanNhat, chuNopTre, chuTienDoEm, demEmTheoNhom, emTheoNhom, nhanNhomEm, type EmCuaBai, type NhomChon, type NhomEm, type TheBai } from '../../lib/btvn-da-giao'
import './btg.css'

const TAB_NHOM: NhomEm[] = ['chua_mo', 'cham_nhip', 'dung_nhip', 'xong_hom_nay', 'da_nop']

export default function NganEm({
  bai, hocSinh, nhom, q, nowMs, hep, doiNhom, boLoc, dong, onMoToanCanh,
}: {
  bai: TheBai
  hocSinh: readonly EmCuaBai[] | undefined
  nhom: NhomChon
  q: string
  nowMs: number
  /** true ⇒ tấm trượt dưới (màn hẹp). */
  hep: boolean
  doiNhom: (n: NhomChon) => void
  boLoc: () => void
  dong: () => void
  onMoToanCanh: (sbd: string) => void
}) {
  const dem = demEmTheoNhom(hocSinh, q)
  const quaHan = bai.hanMs !== null && bai.hanMs <= nowMs
  const ds = emTheoNhom(hocSinh, nhom, q)
  const goc = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!hep) return
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') dong() }
    document.addEventListener('keydown', phim)
    goc.current?.focus()
    return () => document.removeEventListener('keydown', phim)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hep])
  const tab = (khoa: NhomChon, chu: string, so: number) => (
    <button key={khoa} type="button" role="tab" aria-selected={nhom === khoa} className={`btg-tab${nhom === khoa ? ' btg-tab--chon' : ''}`} onClick={() => doiNhom(khoa)}>
      {chu} <b>{so}</b>
    </button>
  )
  const noiDung = (
    <>
      <div className="btg-ngan-dau">
        <div className="btg-ngan-ten">
          <strong>{bai.ten}</strong>
          <span className="btg-phu">{dem.tatCa} em{q.trim() ? ' khớp ô tìm' : ''}</span>
        </div>
        <button type="button" className="btg-nut-tron" aria-label="Đóng danh sách em" onClick={dong}><X size={18} /></button>
      </div>
      {q.trim() !== '' && (
        <p className="btg-loc-tim">
          Đang lọc theo “{q.trim()}”. <button type="button" className="btg-lien-ket" onClick={boLoc}>Bỏ lọc</button>
        </p>
      )}
      {!dem.coNhom && dem.tatCa > 0 && <p className="btg-phu btg-ghi-chu">Cập nhật máy chủ để xem theo nhóm.</p>}
      {(dem.coNhom || quaHan) && (
        <div role="tablist" aria-label="Nhóm em" className="btg-tab-hang">
          {quaHan && dem.chuaNop > 0 && tab('chua_nop', 'Chưa nộp', dem.chuaNop)}
          {dem.coNhom && dem.canY > 0 && tab('can_y', 'Cần để ý', dem.canY)}
          {dem.coNhom && TAB_NHOM.filter((k) => dem.theo[k] > 0).map((k) => tab(k, nhanNhomEm(k, bai.chiaChang), dem.theo[k]))}
          {tab('tat_ca', 'Tất cả', dem.tatCa)}
        </div>
      )}
      {ds.length === 0 ? (
        <p className="btg-phu btg-ghi-chu">Không có em nào trong nhóm này.</p>
      ) : (
        <ul className="btg-em-ds">
          {ds.map((e) => {
            const tienDo = chuTienDoEm(e)
            const tre = chuNopTre(e.nopTreGio)
            return (
              <li key={e.sbd}>
                <button type="button" className="btg-em" onClick={() => onMoToanCanh(e.sbd)} aria-label={`Xem toàn cảnh ${e.hoTen}`}>
                  <span className="btg-em-ten">{e.hoTen || e.sbd}</span>
                  <span className="btg-em-phu">{[tienDo, e.nhom !== undefined ? chuHocGanNhat(e.hocGanNhat, nowMs) : ''].filter(Boolean).join(' · ')}</span>
                  {nhom === 'tat_ca' && e.nhom && <span className="btg-em-nhom">{nhanNhomEm(e.nhom, bai.chiaChang)}</span>}
                  {tre && <span className="btg-chip-tre">{tre}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
  return hep ? (
    <>
      <button type="button" className="btg-nen-tam" aria-label="Đóng danh sách em" onClick={dong} tabIndex={-1} />
      <aside ref={goc} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Danh sách em của ${bai.ten}`} className="btg-ngan btg-ngan--tam">{noiDung}</aside>
    </>
  ) : (
    <aside role="complementary" aria-label={`Danh sách em của ${bai.ten}`} className="btg-ngan">{noiDung}</aside>
  )
}
