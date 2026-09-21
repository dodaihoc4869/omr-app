// ĐOÀN HỘ TỐNG — thẻ câu nền giấy ấm, gọn để màn trận KHÔNG cuộn từ 360×740. Nội dung câu (công thức hoá, bảng, ảnh cắt từ đề)
// dùng lại đúng bộ hiển thị của app (ChemText, BangSoLieu, CauHinh, HinhTaiViTri) — chỉ bố cục là riêng của game.
import type { ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import { tachDongTheoY } from '../../lib/tach-dong-cau'
import { BangSoLieu, CauHinh, HinhTaiViTri } from '../../components/QuestionMedia'
import { LoiGiaiCauSai } from '../../components/KhoiCauSai'
import type { HinhAnh } from '../../data/examContent'
import type { Question } from './core'
import type { KetQuaCau } from './doan-kieu'
import ONhapDapSo from '../../components/ONhapDapSo'

const CHU = ['A', 'B', 'C', 'D'] as const

/** Phần đề (dùng cho cả câu cá nhân lẫn câu chung của trùm). */
export function DeBai({ q, onZoom }: { q: Question; onZoom: (src: string) => void }) {
  const hinh = q.hinhAnh as HinhAnh[]
  return (
    <>
      {q.thanCauImg
        ? <button type="button" onClick={() => onZoom(q.thanCauImg!)} title="Bấm để phóng to"><img src={q.thanCauImg} alt="Đề bài" /></button>
        : <div className="dh-de"><ChemText text={tachDongTheoY(q.text)} /></div>}
      <BangSoLieu table={q.table} />
      {q.imageDataUrl && <CauHinh src={q.imageDataUrl} alt="Hình của câu" onZoom={onZoom} />}
      <HinhTaiViTri hinhAnh={hinh} viTri="sau_de" onZoom={onZoom} nhan="câu của em" />
    </>
  )
}

/** Đã đủ đáp án để chấm chưa (khớp đúng điều kiện của máy chủ). */
export function duDapAn(q: Question, chon: string): boolean {
  return q.phan === 'I' ? /^[ABCD]$/.test(chon) : q.phan === 'II' ? /^[DS]{4}$/.test(chon) : chon.trim().length > 0 && chon.trim().length <= 40
}

export default function DoanCau({ q, chon, onChon, khoa, ketQua, onZoom, dau }: { q: Question; chon: string; onChon: (v: string) => void; khoa: boolean; ketQua?: KetQuaCau | null; onZoom: (src: string) => void; dau: ReactNode }) {
  const hinh = q.hinhAnh as HinhAnh[]
  // Phương án dài hoặc có ảnh → một cột cho dễ đọc; ngắn → lưới 2×2 như bản vẽ.
  const motCot = q.phan === 'I' && (q.choices.some(c => c.length > 34) || (q.choiceImgs ?? []).some(Boolean) || hinh.some(h => /^sau_pa_/.test(h.viTri)))
  const kq = (chu: string) => !ketQua ? undefined : ketQua.answer === chu ? 'dung' : chon === chu ? 'sai' : undefined
  return (
    <section className="dh-giay" aria-label="Câu của em">
      <div className="dh-giay-dau">{dau}</div>
      <DeBai q={q} onZoom={onZoom} />
      {q.phan === 'I' && (
        <div className={`dh-pa ${motCot ? 'dh-pa-mot-cot' : ''}`} role="group" aria-label="Phương án">
          {CHU.map((chu, i) => (
            <button key={chu} type="button" disabled={khoa} aria-pressed={chon === chu} data-kq={kq(chu)} onClick={() => onChon(chu)}>
              <i>{chu}</i>
              <span>{q.choiceImgs?.[i] ? <img src={q.choiceImgs[i]} alt={`Phương án ${chu}`} /> : <ChemText text={q.choices[i] ?? ''} />}
                <HinhTaiViTri hinhAnh={hinh} viTri={`sau_pa_${chu}`} onZoom={onZoom} nhan={`phương án ${chu}`} /></span>
            </button>
          ))}
        </div>
      )}
      {q.phan === 'II' && (
        <div className="dh-y">
          {q.ideas.map((y, i) => {
            const v = chon[i] === 'D' || chon[i] === 'S' ? chon[i] : ''
            const dat = (gt: 'D' | 'S') => { const a = (chon || '----').padEnd(4, '-').split(''); a[i] = gt; onChon(a.join('')) }
            return (
              <div key={i}>
                <span><small>Ý {'abcd'[i]}</small>{q.ideaImgs?.[i] ? <img src={q.ideaImgs[i]} alt={`Ý ${'abcd'[i]}`} /> : <ChemText text={y} />}</span>
                <div className="dh-ds">
                  <button type="button" disabled={khoa} aria-pressed={v === 'D'} onClick={() => dat('D')}>Đúng</button>
                  <button type="button" disabled={khoa} aria-pressed={v === 'S'} onClick={() => dat('S')}>Sai</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {q.phan === 'III' && <ONhapDapSo className="dh-so-khung" inputClassName="dh-so" ariaLabel="Đáp số của em" placeholder="Nhập đáp số" disabled={khoa} value={chon} maxLength={40} onChange={onChon} />}
      <HinhTaiViTri hinhAnh={hinh} viTri="cuoi_cau" onZoom={onZoom} nhan="câu của em" />
      {ketQua && (
        <div className={`dh-ket-qua-cau ${ketQua.correct ? 'dh-dung' : 'dh-sai'}`} role="status">
          <b>{ketQua.correct ? 'Em trả lời đúng.' : 'Chưa đúng — em xem lời giải để sửa câu này.'}</b>
          <details open={!ketQua.correct}>
            <summary>Lời giải</summary>
            <LoiGiaiCauSai hoaHoc c={{ text: q.text, phan: q.phan, dapAnDung: ketQua.answer, loiGiai: ketQua.solution }} />
            <HinhTaiViTri hinhAnh={ketQua.solutionImages ?? []} viTri="sau_loi_giai" nhan="lời giải" onZoom={onZoom} />
          </details>
        </div>
      )}
    </section>
  )
}
