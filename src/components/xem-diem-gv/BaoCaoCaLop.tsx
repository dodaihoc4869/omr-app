// BÁO CÁO CẢ LỚP của một ca — Xem điểm bản 2 · GV-1 (bản vẽ docs/ban-ve-xem-diem-2109/gv-1-chi-tiet-ca.html; Boss duyệt build 21/09).
// Chỉ VẼ số đã tính ở lib/bao-cao-ca-lop.ts; dùng bộ thành phần chung `xd-*` của Code 2 (components/xem-diem). Khối nào không có dữ liệu thật thì ẨN, không bịa.
import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react'
import '../m3'
import '../xem-diem/xem-diem.css'
import './xem-diem-gv.css'
import { soVn } from '../../lib/ket-qua-sau-nop'
import { NGUONG_DIEM_THAP, NGUONG_ROI_MAN, type BaoCaoCaLop } from '../../lib/bao-cao-ca-lop'

/** Dưới mức này thì dạng được đánh dấu "cả lớp còn vấp". */
export const NGUONG_DANG_VAP = 60

/** Phần II lưu chuỗi 4 ký tự D/S theo ý a–d: nói ra "a Đ · b S · c Đ · d S" cho dễ đọc. Phần khác giữ nguyên. */
export function chuDapAn(phan: 'I' | 'II' | 'III', dapAn: string): string {
  if (phan !== 'II' || !/^[DS-]{4}$/.test(dapAn)) return dapAn
  return [...dapAn].map((c, i) => `${'abcd'[i]} ${c === 'D' ? 'Đ' : c === 'S' ? 'S' : '–'}`).join(' · ')
}

export const TEN_PHAN_DAY_DU = { I: 'Phần I · Trắc nghiệm', II: 'Phần II · Đúng–sai', III: 'Phần III · Trả lời ngắn' } as const

function TongQuan({ bc, phutDe }: { bc: BaoCaoCaLop; phutDe: number }) {
  return (
    <section className="xd-the gv-tq" aria-label="Điểm của cả lớp" data-khoi="tong-quan-lop">
      <dl className="gv-so">
        <div>
          <dt>Điểm trung bình</dt>
          <dd className="xd-so">
            {bc.tb == null ? '—' : soVn(bc.tb)}
            {bc.tb != null && <small>trên 10</small>}
          </dd>
        </div>
        <div>
          <dt>Điểm cao nhất</dt>
          <dd className="xd-so">{bc.cao == null ? '—' : soVn(bc.cao)}</dd>
        </div>
        <div>
          <dt>Điểm thấp nhất</dt>
          <dd className="xd-so">{bc.thap == null ? '—' : soVn(bc.thap)}</dd>
        </div>
        {bc.phutTB != null && (
          <div>
            <dt>Thời gian làm trung bình</dt>
            <dd className="xd-so">
              {bc.phutTB}
              <small>phút{phutDe > 0 ? ` (ca cho ${phutDe} phút)` : ''}</small>
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}

function PhoDiem({ bc }: { bc: BaoCaoCaLop }) {
  const max = Math.max(1, ...bc.pho.map((b) => b.soEm))
  const nhieuNhat = bc.pho.reduce((a, b) => (b.soEm > a.soEm ? b : a), bc.pho[0])
  return (
    <section className="xd-the" aria-labelledby="bc-pho" data-khoi="pho-diem">
      <div className="xd-muc__dau">
        <h3 id="bc-pho">Phổ điểm của lớp</h3>
        <p>Số em ở mỗi khoảng điểm</p>
      </div>
      <div className="xd-cot gv-cot" role="img" aria-label={`Phổ điểm: ${bc.pho.map((b) => `từ ${b.nhan} điểm có ${b.soEm} em`).join(', ')}`}>
        {bc.pho.map((b) => (
          <div key={b.nhan} data-nhieu-nhat={b === nhieuNhat && b.soEm > 0 ? 'true' : undefined}>
            <small>{b.soEm}</small>
            <i style={{ height: `${Math.max(4, Math.round((b.soEm / max) * 96))}px` }} />
            <small className="gv-cot__nhan">{b.nhan}</small>
          </div>
        ))}
      </div>
      <p className="xd-muc__mo-ta gv-cot__chu">
        Điểm trên thang 10.{nhieuNhat && nhieuNhat.soEm > 0 ? ` Nhiều em nhất ở khoảng ${nhieuNhat.nhan} điểm (${nhieuNhat.soEm} em).` : ''}
      </p>
    </section>
  )
}

function BaPhan({ bc }: { bc: BaoCaoCaLop }) {
  if (bc.baPhan.length === 0) return null
  return (
    <section className="xd-muc" aria-labelledby="bc-ba-phan" data-khoi="ba-phan-lop">
      <div className="xd-muc__dau">
        <h3 id="bc-ba-phan">Ba phần của bài (trung bình cả lớp)</h3>
      </div>
      <div className="xd-phan-ds">
        {bc.baPhan.map((p) => {
          const dem = `trung bình đúng ${Math.round(p.dungTB)}/${p.tong} câu`
          return (
            <div className="xd-phan" key={p.ma}>
              <div className="xd-phan__nut">
                <span className="xd-phan__ten">{TEN_PHAN_DAY_DU[p.ma]}</span>
                <span className="xd-phan__diem xd-so">
                  {soVn(p.diemTB)}
                  <small>/{soVn(p.toiDa)} điểm</small>
                </span>
                <span className="xd-phan__thanh" role="img" aria-label={dem}>
                  <i style={{ width: `${p.toiDa > 0 ? Math.min(100, (p.diemTB / p.toiDa) * 100) : 0}%` }} />
                </span>
                <span className="xd-phan__dem xd-so">{dem}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function DangVap({ bc }: { bc: BaoCaoCaLop }) {
  return (
    <section className="xd-muc" aria-labelledby="bc-dang" data-khoi="dang-lop-vap">
      <div className="xd-muc__dau">
        <h3 id="bc-dang">Dạng cả lớp đang vấp</h3>
        {bc.dang.length > 0 && <p>Đúng ít nhất xếp trước</p>}
      </div>
      {bc.dang.length === 0 ? (
        <p className="xd-muc__mo-ta" role="status">
          {bc.coBangCham ? 'Chưa có dạng nào đủ ba lượt câu để nói cả lớp đang vấp.' : 'Chưa tính được: máy này chưa có đáp án của ca nên không chấm lại từng câu.'}
        </p>
      ) : (
        <>
          <p className="xd-muc__mo-ta">Tính trên số câu của dạng đó trong ca này, của mọi em đã nộp.</p>
          <ul className="xd-dang-ds">
            {bc.dang.map((d) => (
              <li key={d.ten} className={`xd-dang${d.tiLeDung < NGUONG_DANG_VAP ? ' xd-dang--vap' : ''}`}>
                <div className="xd-dang__ten">
                  <span>{d.ten}</span>
                  {d.tiLeDung < NGUONG_DANG_VAP && <span className="xd-chip xd-chip--cho">Cả lớp còn vấp</span>}
                </div>
                <div className="xd-dang__hang">
                  <span className="xd-dang__dem">
                    Cả lớp đúng <b>{d.tiLeDung}%</b> số câu · <b>{d.soEmSai}/{d.soEmLam}</b> em sai ít nhất một câu
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function CauSai({ bc }: { bc: BaoCaoCaLop }) {
  if (bc.cauSai.length === 0) return null
  return (
    <section className="xd-muc" aria-labelledby="bc-cau" data-khoi="cau-sai-nhieu">
      <div className="xd-muc__dau">
        <h3 id="bc-cau">Câu cả lớp sai nhiều nhất</h3>
        <p>{bc.cauSai.length} câu</p>
      </div>
      <div className="xd-cau-ds">
        {bc.cauSai.map((c) => (
          <article className="xd-cau" key={c.qid}>
            <div className="xd-cau__dau">
              <h4 className="xd-cau__ten">
                Câu {c.soCau} · Phần {c.phan}
                {c.dang && <small>{c.dang}</small>}
              </h4>
              <span className="xd-chip xd-chip--luu-y xd-so">
                Sai {c.soSai}/{c.soLam} em ({c.tiLeSai}%)
              </span>
            </div>
            <div className="xd-cau__tra-loi">
              <div className="xd-tl xd-tl--dung">
                <b>Đáp án đúng</b>
                <span>{c.dapAnDung ? chuDapAn(c.phan, c.dapAnDung) : '—'}</span>
              </div>
              {c.dapAnSaiNhieu && (
                <div className="xd-tl xd-tl--em">
                  <b>Nhiều em chọn</b>
                  <span>
                    {chuDapAn(c.phan, c.dapAnSaiNhieu.dapAn)} ({c.dapAnSaiNhieu.soEm} em)
                  </span>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function EmCanYY({ bc, onMoEm }: { bc: BaoCaoCaLop; onMoEm: (sbd: string) => void }) {
  return (
    <section className="xd-muc" aria-labelledby="bc-em" data-khoi="em-can-de-y">
      <div className="xd-muc__dau">
        <h3 id="bc-em">Em cần thầy để ý</h3>
        {bc.emCanYY.length > 0 && <p>{bc.emCanYY.length} em</p>}
      </div>
      {bc.emCanYY.length === 0 ? (
        <p className="xd-muc__mo-ta" role="status">
          Không có em nào điểm dưới {NGUONG_DIEM_THAP} hoặc rời màn làm bài từ {NGUONG_ROI_MAN} lần trở lên.
        </p>
      ) : (
        <ul className="xd-ca-ds">
          {bc.emCanYY.map((e) => (
            <li key={e.sbd}>
              <button type="button" className="xd-ca xd-ca--khoa gv-em-can" onClick={() => onMoEm(e.sbd)} aria-label={`${e.hoTen || `SBD ${e.sbd}`} — mở báo cáo của em trong ca`}>
                <div className="xd-ca__ten-o">
                  <h4 className="xd-ca__ten">{e.hoTen || `SBD ${e.sbd}`}</h4>
                  <p className="xd-ca__ngay">{[e.lop, `SBD ${e.sbd}`].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="xd-ca__diem">
                  <div>
                    <b className="gv-em-can__mo">Báo cáo</b>
                    <small>của em</small>
                  </div>
                  <ChevronRight className="xd-i xd-i--l" aria-hidden="true" />
                </div>
                <div className="xd-ca__chi">
                  {e.lyDo.map((l) => (
                    <span key={l} className="xd-chip xd-chip--cho xd-so">
                      {l}
                    </span>
                  ))}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="xd-muc__mo-ta">Mốc cố định: điểm dưới {NGUONG_DIEM_THAP}, hoặc rời màn làm bài từ {NGUONG_ROI_MAN} lần trở lên. Đây là dữ kiện, không phải kết luận về em.</p>
    </section>
  )
}

/** PHẦN NẶNG của khối — chỉ được dựng khi thầy MỞ khối (hoặc ca đã đóng). `tinh` chạy lại chỉ khi `khoa` đổi (ca, số em nộp, tổng điểm, tổng lần rời màn, có đáp án hay chưa):
 * màn Theo dõi ca tự làm mới liên tục trong giờ kiểm tra, không được chấm/gom lại 44 em × 28 câu mỗi lần. */
function NoiDungBaoCao({ tinh, khoa, phutDe, onMoEm }: { tinh: () => BaoCaoCaLop; khoa: string; phutDe: number; onMoEm: (sbd: string) => void }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `tinh` đổi định danh mỗi lần vẽ; chỉ `khoa` quyết định có tính lại hay không
  const bc = useMemo(tinh, [khoa])
  return <NoiDungVe bc={bc} phutDe={phutDe} onMoEm={onMoEm} />
}

/** Bản LẤY TỪ MÁY CHỦ (`/gv/bao-cao-ca`): máy chủ có kho câu nên có cả dạng vấp / câu sai nhiều khi máy thầy chưa có đáp án. Hỏi khi mở khối và khi `khoa` đổi (có bài nộp mới); lần hỏi lại giữ bản cũ trên màn
 * (không nhấp nháy). Không có lệnh / lỗi ⇒ RƠI VỀ số tính ở máy (`tinh`) — thầy không thấy khác biệt ngoài các khối có thêm số. */
function NoiDungBaoCaoMayChu({ layMayChu, tinh, khoa, phutDe, onMoEm }: { layMayChu: () => Promise<BaoCaoCaLop | null>; tinh: () => BaoCaoCaLop; khoa: string; phutDe: number; onMoEm: (sbd: string) => void }) {
  const [bc, setBc] = useState<BaoCaoCaLop | null>(null)
  useEffect(() => {
    let huy = false
    void layMayChu()
      .then((r) => r ?? tinh())
      .catch(() => tinh())
      .then((r) => {
        if (!huy) setBc(r)
      })
    return () => {
      huy = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ `khoa` quyết định có hỏi lại hay không
  }, [khoa])
  if (!bc) return <p id="bc-noi-dung" className="xd-muc__mo-ta" role="status">Đang lấy báo cáo của cả lớp…</p>
  return <NoiDungVe bc={bc} phutDe={phutDe} onMoEm={onMoEm} />
}

function NoiDungVe({ bc, phutDe, onMoEm }: { bc: BaoCaoCaLop; phutDe: number; onMoEm: (sbd: string) => void }) {
  return (
    <div id="bc-noi-dung" className="gv-bc-noi-dung">
      <TongQuan bc={bc} phutDe={phutDe} />
      <div className="gv-luoi">
        <PhoDiem bc={bc} />
        <BaPhan bc={bc} />
        <DangVap bc={bc} />
        <CauSai bc={bc} />
      </div>
      <EmCanYY bc={bc} onMoEm={onMoEm} />
    </div>
  )
}

/** Khối "Báo cáo cả lớp" của màn Chi tiết ca. Chỉ dựng khi đã có ít nhất một bài nộp có điểm.
 * `moSan`: ca đã đóng ⇒ mở sẵn; ca đang mở thì gập lại (thầy đang coi danh sách em), chỉ còn một dòng tóm tắt lấy từ `tomTat` (rẻ). */
export default function BaoCaoCaLopKhoi({ tomTat, tinh, khoa, phutDe, moSan, onMoEm, layMayChu }: { tomTat: { nop: number; tb: number | null }; tinh: () => BaoCaoCaLop; khoa: string; phutDe: number; moSan: boolean; layMayChu?: () => Promise<BaoCaoCaLop | null>; onMoEm: (sbd: string) => void }) {
  const [mo, setMo] = useState(moSan)
  if (tomTat.nop === 0) return null
  return (
    <section className="m3 xd xd-gv" aria-labelledby="bc-lop" data-khoi="bao-cao-ca-lop">
      <h2 id="bc-lop" className="gv-bc-dau">
        <button type="button" className="gv-bc-nut" aria-expanded={mo} aria-controls={mo ? 'bc-noi-dung' : undefined} onClick={() => setMo((v) => !v)}>
          <span className="gv-bc-nut__ten">Báo cáo cả lớp</span>
          {!mo && tomTat.tb != null && (
            <span className="gv-bc-nut__tom xd-so">
              Điểm trung bình {soVn(tomTat.tb)} · {tomTat.nop} em đã nộp
            </span>
          )}
          {mo ? <ChevronUp className="xd-i xd-i--l gv-bc-nut__mui" aria-hidden="true" /> : <ChevronDown className="xd-i xd-i--l gv-bc-nut__mui" aria-hidden="true" />}
        </button>
      </h2>
      {mo && (layMayChu ? <NoiDungBaoCaoMayChu layMayChu={layMayChu} tinh={tinh} khoa={khoa} phutDe={phutDe} onMoEm={onMoEm} /> : <NoiDungBaoCao tinh={tinh} khoa={khoa} phutDe={phutDe} onMoEm={onMoEm} />)}
    </section>
  )
}
