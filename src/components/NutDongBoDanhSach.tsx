// NÚT ĐỒNG BỘ DANH SÁCH HỌC SINH — cùng hình dáng, cùng ba trạng thái với nút
// Đồng bộ kho đề (NutDongBo.tsx), để thầy không phải học hai kiểu thao tác.
//
// Khác một điểm: kho đề nằm sẵn trên máy chủ nên bấm là kéo về; danh sách học
// sinh thì nằm trong FILE của thầy, nên bấm là mở hộp chọn file, đọc rồi ĐẨY
// LÊN máy chủ. Đẩy xong, số báo danh nào không có trong danh sách sẽ không vào
// thi được nữa — nên nút này báo rõ số em đã nạp, không báo chung chung.
import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { docFileDanhSach } from '../lib/danh-sach-hs'
import { napDanhSachLop } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'

type TrangThai = { kieu: 'nghi' } | { kieu: 'chay' } | { kieu: 'xong'; chu: string } | { kieu: 'loi'; chu: string }

export default function NutDongBoDanhSach({
  onXong,
  className = '',
}: {
  onXong?: (soEm: number) => void
  className?: string
}) {
  const [tt, setTt] = useState<TrangThai>({ kieu: 'nghi' })
  const oFile = useRef<HTMLInputElement | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const bao = (next: TrangThai) => {
    setTt(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setTt({ kieu: 'nghi' }), next.kieu === 'loi' ? 5000 : 3000)
  }

  const nap = async (file: File) => {
    setTt({ kieu: 'chay' })
    try {
      const [url, secret] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim() || !secret.trim()) return bao({ kieu: 'loi', chu: 'Chưa cấu hình máy chủ' })

      const doc = await docFileDanhSach(file)
      if (doc.items.length === 0) return bao({ kieu: 'loi', chu: 'File không có em nào đủ 3 cột' })

      const kq = await napDanhSachLop(url.trim(), secret.trim(), doc.items.map((e) => ({ ...e, lop: '' })))
      onXong?.(kq.soDong)

      // Dòng hỏng KHÔNG được im lặng: em nào không lên danh sách là em đó đứng
      // ngoài phòng thi. Báo đúng số dòng để thầy mở file sửa.
      const canh: string[] = []
      if (doc.boQua.length) canh.push(`${doc.boQua.length} dòng thiếu cột`)
      if (doc.trung.length) canh.push(`${doc.trung.length} SBD trùng`)
      bao(canh.length ? { kieu: 'loi', chu: `${kq.soDong} em · ${canh.join(', ')}` } : { kieu: 'xong', chu: `${kq.soDong} em` })
    } catch (e) {
      bao({
        kieu: 'loi',
        chu: e instanceof Error ? (/fetch/i.test(e.message) ? 'Mất mạng' : e.message.slice(0, 46)) : 'Lỗi nạp danh sách',
      })
    }
  }

  const mau =
    tt.kieu === 'xong'
      ? { nen: 'var(--xanh-nen)', chu: 'var(--xanh)' }
      : tt.kieu === 'loi'
        ? { nen: 'var(--do-nen)', chu: 'var(--do)' }
        : { nen: 'var(--the-2)', chu: 'var(--muc)' }
  const nhan = tt.kieu === 'chay' ? 'Đang nạp…' : tt.kieu === 'nghi' ? 'Đồng bộ danh sách' : tt.chu

  return (
    <>
      <input
        ref={oFile}
        type="file"
        accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = '' // chọn lại đúng file đó lần nữa vẫn chạy
          if (f) void nap(f)
        }}
      />
      <button
        type="button"
        onClick={() => oFile.current?.click()}
        disabled={tt.kieu === 'chay'}
        aria-live="polite"
        aria-label={tt.kieu === 'nghi' ? 'Chọn file danh sách học sinh để đồng bộ' : nhan}
        className={`tap-target inline-flex items-center justify-center font-bold whitespace-nowrap ${className}`}
        style={{
          gap: 'var(--k2)',
          height: 40,
          minHeight: 40,
          padding: '0 var(--k4) 0 var(--k3)',
          borderRadius: 'var(--bo-tron)',
          background: mau.nen,
          color: mau.chu,
          fontFamily: 'var(--sans)',
          fontSize: 'var(--cx-1)',
          border: '1.5px solid transparent',
          transitionProperty: 'background-color, color, transform',
          transitionDuration: 'var(--nhanh)',
          transform: tt.kieu === 'chay' ? 'scale(.98)' : 'scale(1)',
        }}
      >
        {tt.kieu === 'xong' ? <Check size={16} /> : tt.kieu === 'loi' ? <AlertCircle size={16} /> : <RefreshCw size={16} className={tt.kieu === 'chay' ? 'animate-spin' : ''} />}
        <span>{nhan}</span>
      </button>
    </>
  )
}
