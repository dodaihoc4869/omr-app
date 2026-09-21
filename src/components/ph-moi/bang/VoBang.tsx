// VỎ BẢNG "MỌI THỨ VỀ CON" KIỂU APPLE (thầy chốt 21/09 16:16; mẫu docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html + ph-e-bang-thua.html): ghép đầu trang + mục lục dính + các khối + thanh đáy.
// KHỐI NÀO MÁY CHỦ KHÔNG TRẢ ⇒ ẨN (mỗi khối tự trả null; mục lục chỉ liệt kê khối có mặt). Xếp cột theo BREAKPOINT bằng React (một cột dưới 900 px theo thứ tự đã chốt; hai cột từ 900 px) — KHÔNG dùng CSS `order`, để thứ tự Tab = thứ tự nhìn.
// Gói tải LƯỜI riêng (ChemText nằm ở TungCau). Bảng chỉ ĐỌC; nút duy nhất là "Giao thêm bài cho con" (ThanhDayAp dùng chung với màn chính).
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import '../../m3'
import '../ph-apple.css'
import '../ph-apple-bang.css'
import type { ViewGiaoThem } from '../../../lib/use-giao-them'
import type { PhMoi } from '../../../lib/ph-moi/du-lieu'
import ThanhDayAp from '../ThanhDayAp'
import { AiLam, coAiLam } from './AiLam'
import { Btvn, coBtvn } from './Btvn'
import { Ca, coCa } from './Ca'
import { Dang, coDang } from './Dang'
import DauTrang, { type MucLuc } from './DauTrang'
import { DieuMung, coDieuMung } from './DieuMung'
import { DongThoiGian, coDongThoiGian } from './DongThoiGian'
import { LichOn, coLichOn } from './LichOn'
import { LoiAi, coLoiAi } from './LoiAi'
import { Nhip14, coNhip14 } from './Nhip14'
import { DoCham, SapCo, coDoCham, coSapCo } from './SapCo'
import { TongQuan, coTongQuan } from './TongQuan'
import { TungCau, coTungCau, useNhomMo } from './TungCau'
import { gomNhomCau, nhomMoSan } from './nhom-cau'
import { conChuaHoc } from './dung-chung'

export interface BangMoiThuProps {
  pm: PhMoi
  sbd: string
  lop: string
  giaoThem: ViewGiaoThem
  onVe: () => void
  /** Cuộn tới khối ngay khi mở (cửa vào cũ của thẻ ca ở màn chính). */
  mucDau?: 'ca-kiem-tra'
}

/** Từ `rongTu` px trở lên ⇒ bố cục hai cột. Máy không có matchMedia (jsdom, render máy chủ) ⇒ một cột. */
function useHaiCot(rongTu = 900): boolean {
  const [hai, setHai] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(`(min-width: ${rongTu}px)`)?.matches)
  useEffect(() => {
    const mq = typeof window !== 'undefined' ? window.matchMedia?.(`(min-width: ${rongTu}px)`) : undefined
    if (!mq) return
    const dat = () => setHai(mq.matches)
    dat()
    mq.addEventListener?.('change', dat)
    return () => mq.removeEventListener?.('change', dat)
  }, [rongTu])
  return hai
}

export default function BangMoiThu({ pm, sbd, lop, giaoThem, onVe, mucDau }: BangMoiThuProps) {
  const haiCot = useHaiCot()
  const chuaHoc = conChuaHoc(pm)
  const nhom = useMemo(() => gomNhomCau(pm), [pm])
  const nm = useNhomMo(useMemo(() => nhomMoSan(nhom), [nhom]))
  const [lanBay, setLanBay] = useState<string | null>(null)
  // Bấm một lần ngồi học ở dòng thời gian ⇒ mở + cuộn tới nhóm câu của lần đó (chọn lại cùng lần vẫn chạy: hạ về null rồi đặt lại).
  const chonMoc = useCallback(
    (id: string) => {
      nm.batMo(id)
      setLanBay(null)
      queueMicrotask(() => setLanBay(id))
    },
    [nm],
  )
  useEffect(() => {
    if (mucDau === 'ca-kiem-tra') document.getElementById('muc-ca')?.scrollIntoView?.({ block: 'start' })
  }, [mucDau])

  const ten = pm.hoTen
  const muc: MucLuc[] = [
    coTongQuan(pm) && { id: 'muc-tong-quan', ten: 'Tổng quan' },
    coDongThoiGian(pm) && { id: 'muc-thoi-gian', ten: 'Dòng thời gian' },
    coCa(pm) && { id: 'muc-ca', ten: 'Ca kiểm tra' },
    coDang(pm) && { id: 'muc-dang', ten: 'Điểm mạnh · cần luyện' },
    coTungCau(pm) && { id: 'muc-cau', ten: `Từng câu (${pm.cau!.length})` },
    coBtvn(pm) && { id: 'muc-btvn', ten: 'Bài tập về nhà' },
    coLichOn(pm) && { id: 'muc-on', ten: 'Lịch ôn lại' },
    coNhip14(pm) && { id: 'muc-14', ten: '14 ngày' },
    coLoiAi(pm) && { id: 'muc-loi', ten: 'Lời A.I Đỗ Đại Học' },
  ].filter((x): x is MucLuc => !!x)

  const tq = coTongQuan(pm) ? <TongQuan key="tq" pm={pm} now={pm.serverNow ?? undefined} /> : null
  const mung = coDieuMung(pm) ? <DieuMung key="mung" pm={pm} /> : null
  const ai = coAiLam(pm) ? <AiLam key="ai" pm={pm} /> : null
  const tg = coDongThoiGian(pm) ? <DongThoiGian key="tg" pm={pm} nhom={nhom} onChonMoc={chonMoc} /> : null
  const ca = coCa(pm) ? <Ca key="ca" pm={pm} /> : null
  const dang = coDang(pm) ? <Dang key="dang" pm={pm} /> : null
  const cau = coTungCau(pm) ? <TungCau key="cau" pm={pm} nhom={nhom} sbd={sbd} nhomMo={nm.mo} batMo={nm.batMo} dongMo={nm.dongMo} lanBay={lanBay} /> : null
  const btvn = coBtvn(pm) ? <Btvn key="btvn" pm={pm} /> : null
  const on = coLichOn(pm) ? <LichOn key="on" pm={pm} chuaHoc={chuaHoc} /> : null
  const n14 = coNhip14(pm) ? <Nhip14 key="n14" pm={pm} chuaHoc={chuaHoc} /> : null
  const loi = coLoiAi(pm) ? <LoiAi key="loi" pm={pm} /> : null
  const sap = coSapCo(pm) ? <SapCo key="sap" pm={pm} chuaHoc={chuaHoc} /> : null
  const cham = coDoCham(pm) ? <DoCham key="cham" pm={pm} /> : null

  const cot = (k: string, ...ds: ReactNode[]) => (
    <div className="phm-cot" key={k}>
      {ds}
    </div>
  )
  return (
    <div className="m3 phm-goc phm-ap" data-vung="bang-moi-thu">
      <DauTrang ten={ten} lop={lop} muc={muc} onVe={onVe} />
      <main className="phm-man">
        {haiCot ? (
          <>
            <div className="phm-hang">
              {cot('a1', tq, tg)}
              {cot('a2', mung, ai, ca)}
            </div>
            {dang}
            <div className="phm-hang">
              {cot('b1', cau)}
              {cot('b2', btvn, on, n14, loi, sap, cham)}
            </div>
          </>
        ) : (
          <>
            {tq}
            {mung}
            {ai}
            {tg}
            {ca}
            {dang}
            {cau}
            {btvn}
            {on}
            {n14}
            {loi}
            {sap}
            {cham}
          </>
        )}
      </main>
      <ThanhDayAp giaoThem={giaoThem} />
    </div>
  )
}
