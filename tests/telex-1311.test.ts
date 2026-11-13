// BỘ GÕ TELEX của bàn phím trong app (thầy 13/11 «ép bàn phím xoay ngang»): gõ từng phím ⇒ ra đúng chữ có dấu các từ hay gặp trong lớp Hoá.
import { describe, expect, it } from 'vitest'
import { goTelex, xoaLui } from '../src/lib/telex'

/** Gõ lần lượt từng phím của `phim` vào chuỗi rỗng. */
const go = (phim: string, tu = ''): string => [...phim].reduce(goTelex, tu)

describe('goTelex — mũ, móc, đ', () => {
  it.each([
    ['aa', 'â'], ['aw', 'ă'], ['ee', 'ê'], ['oo', 'ô'], ['ow', 'ơ'], ['uw', 'ư'], ['dd', 'đ'],
    ['thuow', 'thươ'], ['nguoiw', 'ngươi'], ['dduwowc', 'đươc'], ['ruouw', 'rươu'], ['muaw', 'mưa'], ['luuw', 'lưu'], ['hoawc', 'hoăc'],
    ['quawng', 'quăng'], ['quow', 'quơ'], ['dangd', 'đang'], ['nanga', 'nâng'], ['tieue', 'tiêu'], ['aaw', 'ă'], ['awa', 'â'], ['oow', 'ơ'],
  ])('%s ⇒ %s', (phim, ra) => expect(go(phim)).toBe(ra))
})

describe('goTelex — dấu thanh đặt đúng chỗ', () => {
  it.each([
    ['as', 'á'], ['af', 'à'], ['ar', 'ả'], ['ax', 'ã'], ['aj', 'ạ'], ['asz', 'a'], ['asf', 'à'],
    ['hoaf', 'hoà'], ['quar', 'quả'], ['thuyr', 'thuỷ'], ['nghiax', 'nghĩa'], ['dduwowcj', 'được'], ['nguwowif', 'người'], ['nguoiwf', 'người'],
    ['khuya', 'khuya'], ['giangr', 'giảng'], ['quyeenr', 'quyển'], ['khoer', 'khoẻ'], ['hoangf', 'hoàng'], ['toans', 'toán'], ['toasn', 'toán'],
    ['cuar', 'của'], ['muas', 'múa'], ['luwar', 'lửa'], ['muoons', 'muốn'], ['ruowuj', 'rượu'], ['khuyur', 'khuỷu'], ['ngoais', 'ngoái'],
    ['gif', 'gì'], ['gias', 'giá'], ['gieets', 'giết'], ['giuwx', 'giữ'], ['quoocs', 'quốc'], ['huyts', 'huýt'], ['tieesn', 'tiến'], ['thuees', 'thuế'],
  ])('%s ⇒ %s', (phim, ra) => expect(go(phim)).toBe(ra))
})

describe('goTelex — câu và từ hay gặp trong lớp Hoá', () => {
  it.each([
    ['thaayf owi cho em hoir', 'thầy ơi cho em hỏi'],
    ['Thaayf giangr laij giups em', 'Thầy giảng lại giúp em'],
    ['dduwowcj khoong aj', 'được không ạ'],
    ['em chuwa hieeur', 'em chưa hiểu'],
    ['em hieeur rooif aj', 'em hiểu rồi ạ'],
    ['lieen keets coongj hoas trij', 'liên kết cộng hoá trị'],
    ['nguyeen tuwr', 'nguyên tử'],
    ['phanr uwngs', 'phản ứng'],
    ['ddooj aam ddieenj', 'độ âm điện'],
    ['khuaays ddeeuf', 'khuấy đều'],
    ['quyf tims', 'quỳ tím'],
    ['nghiax laf gif', 'nghĩa là gì'],
    ['caau naof ddungs', 'câu nào đúng'],
    ['chaats khuwr', 'chất khử'],
    ['soos oxxi hoas', 'số oxi hoá'],
    ['kim loaij kieemf', 'kim loại kiềm'],
    ['dung dichj', 'dung dịch'],
    ['noongf ddooj mol', 'nồng độ mol'],
    ['khoois luwowngj', 'khối lượng'],
    ['theer tichs', 'thể tích'],
    ['hieeuj suaats', 'hiệu suất'],
    ['baor toanf nguyeen toos', 'bảo toàn nguyên tố'],
    ['ddoongf phaan', 'đồng phân'],
    ['keets tuar trawngs', 'kết tủa trắng'],
    ['bay hoiw', 'bay hơi'],
    ['nuwowcs caats', 'nước cất'],
    ['nhieetj ddooj sooi', 'nhiệt độ sôi'],
    ['phuwowng trinhf', 'phương trình'],
    ['caan bawngf', 'cân bằng'],
    ['Em camr own thaayf', 'Em cảm ơn thầy'],
    ['Dduwowngf truyeenf bij lag', 'Đường truyền bị lag'],
    ['Ddaps ans B ddungs khoong aj', 'Đáp án B đúng không ạ'],
    ['Owr caau 5 em tinhs ra 0,25 mol', 'Ở câu 5 em tính ra 0,25 mol'],
    ['maatj ddooj electron', 'mật độ electron'],
    ['xuaats hieenj bojt khis', 'xuất hiện bọt khí'],
    ['ruwowuj etylic', 'rượu etylic'],
  ])('%s ⇒ %s', (phim, ra) => expect(go(phim)).toBe(ra))

  it('dấu câu, chữ số, dấu cách nối thường và ngắt từ', () => {
    expect(go('gif?')).toBe('gì?'); expect(go('aj!')).toBe('ạ!'); expect(go('roof, dduwowcj.')).toBe('rồ, được.')
    expect(go('a (b) + c = d → e')).toBe('a (b) + c = d → e')
    expect(go('s', 'a ')).toBe('a s') // dấu cách ngắt từ: phím s không bỏ dấu vào từ trước
  })
})

describe('goTelex — công thức hoá học và từ không phải tiếng Việt', () => {
  it('phím HOA không bao giờ biến đổi: công thức gõ chữ hoa ra nguyên vẹn', () => {
    for (const ct of ['CH3COONa', 'CH3COOH', 'HCOOH', 'CuSO4', 'BaSO4', 'NaF', 'CaF2', 'NaOH', 'H2SO4', 'Fe2O3', 'C2H5OH', 'RCOOR', 'HOOC', 'KMnO4', 'AgNO3']) expect(go(ct)).toBe(ct)
  })
  it('chữ hoa có dấu: phím biến đổi gõ thường, chữ bị đổi giữ nguyên hoa / thường', () => {
    expect(go('Dd')).toBe('Đ'); expect(go('Ddooj')).toBe('Độ'); expect(go('Aam')).toBe('Âm'); expect(go('Ow')).toBe('Ơ'); expect(go('Uwf')).toBe('Ừ')
    expect(go('As')).toBe('Á'); expect(go('Ass')).toBe('As'); expect(go('Arr')).toBe('Ar') // kí hiệu As, Ar: gõ lại phím dấu để hoàn tác
  })
  it('công thức gõ thường: chữ dính sau chữ số / ngoặc đóng không biến đổi', () => {
    expect(go('ch3cooh')).toBe('ch3cooh'); expect(go('c2h5oh')).toBe('c2h5oh'); expect(go('h2o')).toBe('h2o'); expect(go('ca(oh)2')).toBe('ca(oh)2'); expect(go('fe2(so4)3')).toBe('fe2(so4)3')
  })
  it('từ không có nguyên âm, phụ âm đầu / cuối lạ ⇒ nối thường', () => {
    expect(go('ss')).toBe('ss'); expect(go('pH')).toBe('pH'); expect(go('tw')).toBe('tw'); expect(go('zz')).toBe('zz'); expect(go('class')).toBe('class'); expect(go('show')).toBe('show')
    expect(go('wow')).toBe('wow'); expect(go('hello')).toBe('hello'); expect(go('lag')).toBe('lag'); expect(go('ok')).toBe('ok'); expect(go('mol')).toBe('mol'); expect(go('electron')).toBe('electron')
  })
  it('từ mượn viết liền của môn Hoá: ơ, ư, đ sát cuối từ', () => {
    expect(go('bazow')).toBe('bazơ'); expect(go('nitow')).toBe('nitơ'); expect(go('glucozow')).toBe('glucozơ'); expect(go('saccarozow')).toBe('saccarozơ')
    expect(go('hiddro')).toBe('hiđro'); expect(go('anddehit')).toBe('anđehit'); expect(go('bazoww')).toBe('bazow'); expect(go('hiddd')).toBe('hidd')
    expect(go('axxit')).toBe('axit'); expect(go('oxxit')).toBe('oxit'); expect(go('esste')).toBe('este'); expect(go('sunffat')).toBe('sunfat')
  })
})

describe('goTelex — gõ lại cùng phím thì hoàn tác', () => {
  it.each([
    ['aaa', 'aa'], ['eee', 'ee'], ['ooo', 'oo'], ['ddd', 'dd'], ['oww', 'ow'], ['uww', 'uw'], ['aww', 'aw'], ['ass', 'as'], ['aff', 'af'], ['arr', 'ar'], ['axx', 'ax'], ['ajj', 'aj'],
    ['uoww', 'uow'], ['xooong', 'xoong'], ['COOO'.toLowerCase(), 'coo'], ['tooi', 'tôi'], ['asss', 'ass'], ['dddd', 'ddd'],
  ])('%s ⇒ %s', (phim, ra) => expect(go(phim)).toBe(ra))
  it('z xoá dấu thanh; từ chưa có dấu thì z là chữ z', () => {
    expect(go('hoirz')).toBe('hoi'); expect(go('dduwowcjz')).toBe('đươc'); expect(go('az')).toBe('az')
  })
})

describe('xoaLui', () => {
  it('xoá một ký tự; chữ có dấu (kể cả dấu rời) và ký tự ngoài mặt phẳng cơ bản tính là một', () => {
    expect(xoaLui('được')).toBe('đượ'); expect(xoaLui('ạ')).toBe(''); expect(xoaLui('')).toBe(''); expect(xoaLui('ab ')).toBe('ab')
    expect(xoaLui('a' + 'ế')).toBe('a'); expect(xoaLui('a\u{1F525}')).toBe('a')
  })
  it('xoá rồi gõ tiếp vẫn ra đúng dấu', () => {
    expect(go('c', xoaLui('được'))).toBe('được'); expect(go('i', xoaLui(go('nguwowif')))).toBe('người'); expect(go('r', xoaLui('hỏi'))).toBe('hor')
  })
})
