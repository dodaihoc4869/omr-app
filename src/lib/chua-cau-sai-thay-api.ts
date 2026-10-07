export const KHOA_MO_CAU_CAN_CHUA = 'ddh.moCauCanChua'
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { loadTeacherSecret } from './exam-db'
export async function goiChuaThay(
  lenh: string,
  body: Record<string, unknown> = {},
): Promise<Record<string, any>> {
  const [goc, secret] = await Promise.all([
    layDiaChiMayChu(),
    loadTeacherSecret(),
  ])
  if (!goc || !secret) throw new Error('Cần cấu hình kết nối giáo viên.')
  const dk = new AbortController(),
    hen = setTimeout(() => dk.abort(), 20000)
  try {
    const r = await fetch(`${goc}/gv/chua-cau-sai/${lenh}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...body, secret }),
      signal: dk.signal,
    })
    const j = await r.json()
    if (!r.ok || !j.ok)
      throw new Error(
        [j.mo ?? j.error ?? 'Chưa lưu được', ...(j.loiHocLieu ?? [])].join(
          '\n',
        ),
      )
    return j
  } finally {
    clearTimeout(hen)
  }
}
