// NGUỒN DỮ LIỆU DÙNG CHUNG của màn Giao chiến dịch và hộp Chỉnh sửa chiến dịch (thầy 28/09): Kho đề trên máy + danh sách em.
import { useEffect, useMemo, useState } from 'react'
import type { TeacherExamSource } from '../../data/examContent'
import { useAppStore } from '../../store/appStore'
import { docDsEm } from './api'
import { khoiCuaLop, type EmLop } from './ChonEmGiao'

/**
 * Ngân hàng đề trên máy này — ĐỦ mọi tờ, tách theo phần y như màn Mở ca (thầy 28/09: "chưa hiển thị đầy đủ đề kho đề").
 * KHÔNG khử trùng cả kho ở đây: khử trước khi chọn làm tờ trùng hết câu BIẾN MẤT khỏi cây. Câu trùng giữa các tờ ĐÃ TÍCH do máy chủ bỏ.
 * `null` = đang đọc; `[]` = máy chưa có kho (hoặc đọc lỗi).
 */
export function useKhoDe(): TeacherExamSource[] | null {
  const [kho, setKho] = useState<TeacherExamSource[] | null>(null)
  useEffect(() => {
    let huy = false
    void (async () => {
      try {
        const [{ loadExamSources }, { tachNhieuTheoPhan }] = await Promise.all([import('../../lib/exam-db'), import('../../lib/tach-phan-de')])
        const ds = tachNhieuTheoPhan(await loadExamSources())
        if (!huy) setKho(ds)
      } catch {
        /* không đọc được kho: tờ hiện bằng mã, không có số câu */
        if (!huy) setKho([])
      }
    })()
    return () => {
      huy = true
    }
  }, [])
  return kho
}

/**
 * Danh sách học sinh cho bộ chọn Khối › Lớp › Em: ƯU TIÊN máy chủ (`ds-em`, cùng bảng máy chủ dùng khi giao) —
 * máy thầy chưa nạp "Danh sách lớp" vẫn chọn được. Máy chủ không trả lời ⇒ danh sách trên máy; cả hai rỗng ⇒ `[]`.
 */
export function useDsEmGiao(): EmLop[] {
  const classList = useAppStore((s) => s.classList) as { sbd?: string; hoTen?: string; lop?: string }[] | undefined
  const [emMayChu, setEmMayChu] = useState<{ sbd: string; hoTen: string; khoi?: string; lop?: string; tenLop?: string }[] | null>(null)
  useEffect(() => {
    let huy = false
    void docDsEm().then((r) => {
      if (!huy && r.ok && Array.isArray(r.du.em) && r.du.em.length > 0) setEmMayChu(r.du.em)
    }).catch(() => {})
    return () => {
      huy = true
    }
  }, [])
  return useMemo<EmLop[]>(
    () =>
      emMayChu
        ? emMayChu.map((e) => {
            const khoi = String(e.khoi ?? e.lop ?? '').trim()
            return { sbd: e.sbd, hoTen: e.hoTen, khoi: khoiCuaLop(khoi), tenLop: String(e.tenLop ?? '').trim() || khoi }
          }).filter((e) => e.sbd && e.tenLop)
        : (classList ?? [])
            .map((r) => {
              const lop = String(r.lop ?? '').trim()
              return { sbd: String(r.sbd ?? '').trim(), hoTen: String(r.hoTen ?? '').trim(), khoi: khoiCuaLop(lop), tenLop: lop }
            })
            .filter((e) => e.sbd && e.tenLop),
    [emMayChu, classList],
  )
}
