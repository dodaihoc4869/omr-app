// VÙNG 4 — nút Vào thi: M3 extended FAB ở góc dưới phải. Tonal (KHÔNG phải nút
// nổi bật — màn chỉ có một nút filled là "Làm ngay"). Khi có ca đang mở cho lớp
// của em: đổi sang tertiary + chấm nhịp. Luật vào thi/mã ca nằm nguyên ở
// PhongVaoThi; nút này chỉ gọi `onVaoThi`.
import { PencilLine } from 'lucide-react'

export default function NutVaoThi({ caDangMo = false, onVaoThi }: { caDangMo?: boolean; onVaoThi: () => void }) {
  return (
    <button
      type="button"
      className="bnv-fab"
      data-ca-mo={caDangMo ? 'true' : 'false'}
      onClick={onVaoThi}
    >
      {caDangMo ? <span className="bnv-fab-cham" aria-hidden="true" /> : <PencilLine size={22} aria-hidden="true" />}
      <span>{caDangMo ? 'Vào thi · ca đang mở' : 'Vào thi'}</span>
    </button>
  )
}
