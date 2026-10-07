import { lazy, Suspense, useEffect, useState } from 'react'
import { apiCoChua } from '../../lib/chua-cau-sai-api'
import { docTokenHs } from '../../lib/loi-giai-api'
import KhungChua from './KhungChua'
const Man = lazy(() => import('./ManChuaCauSai'))
export default function NutChuaTungBuoc({ qid }: { qid: string }) {
  const token = docTokenHs(),
    [co, setCo] = useState(false),
    [mo, setMo] = useState(false)
  useEffect(() => {
    let song = true
    if (token)
      void apiCoChua(token).then((x) => {
        if (song) setCo(x)
      })
    return () => {
      song = false
    }
  }, [token])
  if (!co || !token) return null
  return (
    <>
      <button type="button" className="lg-nut" onClick={() => setMo(true)}>
        Chữa câu sai từng bước
      </button>
      {mo && (
        <KhungChua onDong={() => setMo(false)}>
          <Suspense fallback={<div role="status">Đang mở bước chữa…</div>}>
            <Man token={token} qid={qid} onVe={() => setMo(false)} />
          </Suspense>
        </KhungChua>
      )}
    </>
  )
}
