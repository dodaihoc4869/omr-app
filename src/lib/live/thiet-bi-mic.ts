// THIẾT BỊ MIC của máy thầy (tách khỏi thay.ts 11/11 cho gọn tệp): liệt kê mic vào + tìm thiết bị THẬT đứng sau mục «mặc định».
const BO_DAU = /^(Default|Mặc định)\s*-\s*/i

/** Mic vào của máy. Bỏ mục «Communications»; Windows liệt kê cùng một mic hai lần — «Default - <tên>» (mã `default`) và đích danh: giữ cả hai nhưng gọi rõ
 *  mục mặc định là «Mặc định của máy — <tên>». */
export async function dsMic(): Promise<{ id: string; ten: string }[]> {
  try {
    const ds = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput' && d.deviceId !== 'communications')
    return ds.map((d, i) => ({ id: d.deviceId, ten: d.deviceId === 'default' ? `Mặc định của máy${d.label ? ` — ${d.label.replace(BO_DAU, '')}` : ''}` : d.label || `Mic ${i + 1}` }))
  } catch { return [] }
}

/** THẾ THÂN MỤC MẶC ĐỊNH (thầy 11/11, máy thật: mục «Default - Microphone (BOYALINK)» ra luồng câm, mục đích danh của chính mic ấy có tín hiệu): mã thiết bị
 *  THẬT đứng sau mục mặc định — cùng `groupId`, không thì trùng nhãn (`nhanDangMo` = nhãn của luồng mặc định đang mở, dùng khi danh sách chưa có nhãn).
 *  Không tìm được ⇒ null. */
export async function timTheMacDinh(nhanDangMo: string): Promise<string | null> {
  try {
    const ds = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput')
    const md = ds.filter((d) => d.deviceId === 'default')[0]
    const that = ds.filter((d) => !!d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications')
    const nhan = (md?.label || nhanDangMo || '').replace(BO_DAU, '')
    const k = (md?.groupId ? that.filter((d) => d.groupId === md.groupId)[0] : undefined) ?? (nhan ? that.filter((d) => d.label === nhan)[0] : undefined)
    return k?.deviceId ?? null
  } catch { return null }
}
