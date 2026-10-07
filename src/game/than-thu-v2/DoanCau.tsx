// ĐOÀN HỘ TỐNG — thẻ câu nền giấy ấm, gọn để màn trận KHÔNG cuộn từ 360×740. Nội dung câu (công thức hoá, bảng, ảnh cắt từ đề)
// dùng lại đúng bộ hiển thị của app (ChemText, BangSoLieu, CauHinh, HinhTaiViTri) — chỉ bố cục là riêng của game.
import { chuPhuongAn } from '../../lib/anh-phuong-an'
import { SoExpCau, useCheDoHieuUng } from '../../components/exp-cau/ExpCau'
import { expCauGame } from '../../lib/hieu-ung-exp-cau'
import type { ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import { chiSoRo, chiSoRoSau } from '../../lib/chi-so-ro'
import { tachDongTheoY } from '../../lib/tach-dong-cau'
import { BangSoLieu, CauHinh, HinhTaiViTri } from '../../components/QuestionMedia'
import { LoiGiaiCauSai } from '../../components/KhoiCauSai'
import type { HinhAnh } from '../../data/examContent'
import type { Question } from './core'
import type { KetQuaCau } from './doan-kieu'
import OSoTraLoi from '../../components/OSoTraLoi'
import XemLaiChuan from './doan2/XemLaiChuan'
import TheBuocSai2 from './doan2/TheBuocSai2'
import TheTram2 from './doan2/TheTram2'

const CHU = ['A', 'B', 'C', 'D'] as const

/** Phần đề (dùng cho cả câu cá nhân lẫn câu chung của trùm). */
export function DeBai({ q, onZoom }: { q: Question; onZoom: (src: string) => void }) {
  const hinh = q.hinhAnh as HinhAnh[]
  return (
    <>
      {q.thanCauImg
        ? <button type="button" onClick={() => onZoom(q.thanCauImg!)} title="Phóng to đề bài"><img decoding="async" loading="lazy" width={960} height={540} src={q.thanCauImg} alt="Đề bài" /></button>
        : <div className="dh-de"><ChemText text={tachDongTheoY(chiSoRo(q.text))} /></div>}
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

/** Chỉ-thêm cho GAME HÓA 2.0 (vắng ⇒ thẻ câu y hệt bản cũ):
 *  - `gach`: phương án SAI máy chủ đã gạch (Bùa Trợ giảng) — ô tối "cháy thành tro", KHÔNG bấm được;
 *  - `bua`: dải Bùa Trợ giảng đặt ngay dưới đầu thẻ, trước đề;
 *  - `xemLaiChuan`: đã có kết quả ⇒ thay cả thẻ bằng khối xem lại CHUẨN của app (`TheCau` xem_lai + `chuanHoaLoiGiaiCau`), số trên đầu thẻ = `stt`. */
/** `cuoi` (OMNI 3, 05/10): phần thêm đặt TRONG thẻ câu, sau phương án/ô đáp số (chip "Chưa chắc") — không chiếm hàng dưới thẻ, nên thẻ câu
 *  và các nút đòn giữ đúng bố cục đang chạy (thầy 05/10: "app của học sinh giữ nguyên mọi thứ giao diện"). */
export interface DoanCau2 { gach?: readonly string[]; bua?: ReactNode; xemLaiChuan?: { stt: number }; cuoi?: ReactNode; /** CẨN THẬN (c) (chỉ-thêm): ghi lựa chọn ở thẻ "Sai vì bước nào?" (chỉ có khi OMNI bật); vắng ⇒ không thẻ. */ onBuocSai?: (qid: string, ma: string) => Promise<void> }

export default function DoanCau({ q, chon, onChon, khoa, ketQua, onZoom, dau, gach, bua, xemLaiChuan, cuoi, onBuocSai }: { q: Question; chon: string; onChon: (v: string) => void; khoa: boolean; ketQua?: KetQuaCau | null; onZoom: (src: string) => void; dau: ReactNode } & DoanCau2) {
  const hinh = q.hinhAnh as HinhAnh[]
  // Luật v4 (29/09): "+N EXP" bay sang thần thú — số máy chủ (`expCau`; máy chủ cũ: `reward`); câu sai / có trợ giúp / có Bùa Trợ giảng ⇒ không hiệu ứng.
  const cheDo = useCheDoHieuUng()
  // CẨN THẬN (c): thẻ nằm TRONG thẻ câu nhưng NGOÀI hộp kết quả (hộp ấy có nền sáng riêng); chỉ khi có `ketQua.buocSai` và nơi gọi đưa `onBuocSai`.
  const theBuocSai = ketQua?.buocSai && onBuocSai ? <TheBuocSai2 key={ketQua.buocSai.qid} lua={ketQua.buocSai.lua} onChon={ma => onBuocSai(ketQua.buocSai!.qid, ma)} /> : null
  // TRẠM HỒI PHỤC (06/10): em đi một mình và vừa sai câu thứ ba liền ⇒ thẻ Trạm ngay dưới kết quả (cùng chỗ với thẻ "Sai vì bước nào?"); vắng `ketQua.tram` ⇒ không thẻ.
  const theTram = ketQua?.tram ? <TheTram2 key={ketQua.tram.qid} tram={ketQua.tram.du} qid={ketQua.tram.qid} /> : null
  const expBay = ketQua ? expCauGame({ correct: ketQua.correct, assisted: ketQua.assisted, coTroGiup: (gach?.length ?? 0) > 0, reward: ketQua.reward, expCau: ketQua.expCau }) : 0
  if (xemLaiChuan && ketQua) return (
    <section className="dh-giay dh2-giay-ket" aria-label="Kết quả câu của em">
      <div className="dh-giay-dau">{dau}</div>
      <div className={`dh-ket-qua-cau ${ketQua.correct ? 'dh-dung' : 'dh-sai'}`} role="status"><b>{ketQua.correct ? 'Em trả lời đúng.' : 'Chưa đúng — em xem lời giải để sửa câu này.'}</b>{ketQua.loiNhan && <small data-khoi="omni-loi-nhan">{ketQua.loiNhan}</small>}{expBay > 0 && <SoExpCau exp={expBay} cheDo={cheDo} vaoThu="dong" />}</div>
      {theBuocSai}
      {theTram}
      <XemLaiChuan q={q} chon={chon} dapAn={ketQua.answer} solution={ketQua.solution} solutionImages={ketQua.solutionImages} stt={xemLaiChuan.stt} onZoom={onZoom} />
    </section>
  )
  // Phương án dài hoặc có ảnh → một cột cho dễ đọc; ngắn → lưới 2×2 như bản vẽ.
  const motCot = q.phan === 'I' && (q.choices.some(c => c.length > 34) || (q.choiceImgs ?? []).some(Boolean) || hinh.some(h => /^sau_pa_/.test(h.viTri)))
  const kq = (chu: string) => !ketQua ? undefined : ketQua.answer === chu ? 'dung' : chon === chu ? 'sai' : undefined
  return (
    <section className="dh-giay" aria-label="Câu của em">
      <div className="dh-giay-dau">{dau}</div>
      {bua}
      <DeBai q={q} onZoom={onZoom} />
      {q.phan === 'I' && (
        <div className={`dh-pa ${motCot ? 'dh-pa-mot-cot' : ''}`} role="group" aria-label="Phương án">
          {CHU.map((chu, i) => {
            const chay = !!gach?.includes(chu) // Bùa Trợ giảng đã gạch: tro tàn, không chọn được
            return (
              <button key={chu} type="button" disabled={khoa || chay} aria-pressed={chon === chu} data-kq={kq(chu)} className={chay ? 'dh2-chay' : undefined} onClick={() => { if (!chay) onChon(chu) }}>
                <i>{chu}</i>
                <span>{q.choiceImgs?.[i] ? <img decoding="async" loading="lazy" width={480} height={270} src={q.choiceImgs[i]} alt={`Phương án ${chu}`} /> : <ChemText text={chiSoRo(chuPhuongAn(q.choices[i] ?? '', hinh.some(h => h.viTri === `sau_pa_${chu}`)))} />}
                  <HinhTaiViTri hinhAnh={hinh} viTri={`sau_pa_${chu}`} onZoom={onZoom} nhan={`phương án ${chu}`} /></span>
                {chay && <span className="dh2-an"> (đã cháy thành tro — phương án sai, không chọn được)</span>}
              </button>
            )
          })}
        </div>
      )}
      {q.phan === 'II' && (
        <div className="dh-y">
          {q.ideas.map((y, i) => {
            const v = chon[i] === 'D' || chon[i] === 'S' ? chon[i] : ''
            const dat = (gt: 'D' | 'S') => { const a = (chon || '----').padEnd(4, '-').split(''); a[i] = gt; onChon(a.join('')) }
            return (
              <div key={i}>
                <span><small>Ý {'abcd'[i]}</small>{q.ideaImgs?.[i] ? <img decoding="async" loading="lazy" width={480} height={270} src={q.ideaImgs[i]} alt={`Ý ${'abcd'[i]}`} /> : <ChemText text={chiSoRo(y)} />}</span>
                <div className="dh-ds">
                  <button type="button" disabled={khoa} aria-pressed={v === 'D'} onClick={() => dat('D')}>Đúng</button>
                  <button type="button" disabled={khoa} aria-pressed={v === 'S'} onClick={() => dat('S')}>Sai</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {q.phan === 'III' && <OSoTraLoi className="dh-so-khung" inputClassName="dh-so" ariaLabel="Đáp số của em" placeholder="Nhập đáp số" disabled={khoa} value={chon} maxLength={40} onChange={onChon} />}
      <HinhTaiViTri hinhAnh={hinh} viTri="cuoi_cau" onZoom={onZoom} nhan="câu của em" />
      {cuoi}
      {ketQua && (
        <div className={`dh-ket-qua-cau ${ketQua.correct ? 'dh-dung' : 'dh-sai'}`} role="status">
          <b>{ketQua.correct ? 'Em trả lời đúng.' : 'Chưa đúng — em xem lời giải để sửa câu này.'}</b>
          {ketQua.loiNhan && <small data-khoi="omni-loi-nhan">{ketQua.loiNhan}</small>}
          {expBay > 0 && <SoExpCau exp={expBay} cheDo={cheDo} vaoThu="dong" />}
          <details open={!ketQua.correct}>
            <summary>Lời giải</summary>
            <LoiGiaiCauSai hoaHoc c={{ text: chiSoRo(q.text), phan: q.phan, dapAnDung: ketQua.answer, loiGiai: chiSoRoSau(ketQua.solution) }} qid={q.qid} nguon="doan" />
            <HinhTaiViTri hinhAnh={ketQua.solutionImages ?? []} viTri="sau_loi_giai" nhan="lời giải" onZoom={onZoom} />
          </details>
        </div>
      )}
      {theBuocSai}
      {theTram}
    </section>
  )
}
