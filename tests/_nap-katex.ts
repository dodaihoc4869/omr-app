// KaTeX nay nạp lười (src/lib/chem-format.tsx · napKatex). Trong app, main.tsx tải sẵn trước khi đề hiện;
// trong test thì nạp một lần trước mỗi tệp test để mọi phép kiểm dựng công thức ĐỒNG BỘ như trước.
import { napKatex } from '../src/lib/chem-format'

await napKatex()
