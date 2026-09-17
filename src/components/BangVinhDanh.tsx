import { useEffect, useState } from 'react'
import { Crown, Medal, Sparkles, Heart, GraduationCap, Compass } from 'lucide-react'
import { layDiaChiMayChu } from '../lib/dia-chi-may-chu'
import { classroomSpiritImage } from '../lib/anh-than-thu-v2'
import { PETS } from '../game/than-thu-v2/core'
import './BangVinhDanh.css'
import './Banner3OTonVinh.css'

// 1. CÁC CÂU NÓI VỀ ĐỘNG LỰC HỌC TẬP (Ý chí, quyết tâm, chinh phục ước mơ, đỗ đại học)
const CAU_NOI_DONG_LUC = [
  { cau: 'Học tập là hạt giống của tri thức, tri thức là khởi nguồn của thành công và hạnh phúc.', tacGia: 'Danh ngôn giáo dục' },
  { cau: 'Đường đi khó không phải vì ngăn sông cách núi, mà khó vì lòng người ngại núi e sông.', tacGia: 'Nguyễn Bá Học' },
  { cau: 'Thành công không phải là phép màu, nó là kết quả của sự chuẩn bị và kiên trì rèn luyện mỗi ngày.', tacGia: 'Colin Powell' },
  { cau: 'Tương lai thuộc về những ai tin tưởng vào ước mơ và không ngừng nỗ lực biến ước mơ thành hiện thực.', tacGia: 'Eleanor Roosevelt' },
  { cau: 'Dù đi chậm đến đâu, miễn là em không bao giờ dừng lại, cánh cửa giảng đường sẽ rộng mở.', tacGia: 'Khổng Tử' },
  { cau: 'Mỗi bài luyện hôm nay là một viên gạch vững chắc xây đắp tương lai rực rỡ ngày mai.', tacGia: 'Thầy Đỗ Đại Học' },
  { cau: 'Không có áp lực thì không có kim cương. Vượt qua giới hạn để chạm tới đỉnh cao vinh quang.', tacGia: 'Ý chí vươn lên' },
  { cau: 'Tri thức là sức mạnh, sự chăm chỉ là đôi cánh đưa em bay đến bất cứ chân trời ước mơ nào.', tacGia: 'Danh ngôn thế giới' },
  { cau: 'Hôm nay kiên trì chịu khó, ngày mai em sẽ tự hào mỉm cười trước cánh cổng đại học mơ ước.', tacGia: 'Thầy nhắn nhủ' },
  { cau: 'Đừng so sánh mình với ai khác, hãy nỗ lực để hôm nay làm tốt hơn chính mình ngày hôm qua.', tacGia: 'Triết lý học tập' },
  { cau: 'Càng chăm chỉ rèn luyện, em sẽ càng nhận ra may mắn luôn mỉm cười với người nỗ lực hết mình.', tacGia: 'Thomas Jefferson' },
  { cau: 'Mục tiêu lớn lao chỉ thành hình khi em dám bắt đầu từ những bài tập nhỏ mỗi ngày.', tacGia: 'Động lực học tập' },
  { cau: 'Sự kiên trì có thể biến những điều không thể thành có thể. Hãy tin vào năng lực của chính mình!', tacGia: 'Khát vọng trẻ' },
  { cau: 'Chiến thắng vĩ đại nhất của đời người là chiến thắng sự lười biếng của chính bản thân.', tacGia: 'Danh ngôn sống' },
]

// 2. CÁC CÂU NÓI VỀ CHA MẸ (Tôn vinh công đức sinh thành, động lực học để đền đáp)
const CAU_NOI_CHA_ME = [
  { cau: 'Đi khắp thế gian không ai tốt bằng Mẹ, gánh nặng cuộc đời không ai khổ bằng Cha.', tacGia: 'Ca dao Việt Nam' },
  { cau: 'Công cha như núi Thái Sơn, nghĩa mẹ như nước trong nguồn chảy ra.', tacGia: 'Ca dao Việt Nam' },
  { cau: 'Cơm cha áo mẹ chữ thầy, gắng công học tập bõ ngày ước ao.', tacGia: 'Lời ru phụ mẫu' },
  { cau: 'Tình thương của cha mẹ là ngọn hải đăng soi sáng từng bước chân con trên đường đời.', tacGia: 'Tình cảm gia đình' },
  { cau: 'Mỗi bước con trưởng thành là gom góp bao giọt mồ hôi và tình thương lặng thầm của cha mẹ.', tacGia: 'Tri ân phụ mẫu' },
  { cau: 'Bàn tay cha mẹ nâng bước con đi, tình yêu cha mẹ chắp cánh mọi ước mơ thành sự thật.', tacGia: 'Tấm lòng phụ mẫu' },
  { cau: 'Không có kỳ quan nào vĩ đại hơn trái tim mẹ, không có điểm tựa nào vững chãi hơn bờ vai cha.', tacGia: 'Ngạn ngữ phương Đông' },
  { cau: 'Chăm ngoan học giỏi và đỗ đạt là món quà thiêng liêng nhất con dành tặng đấng sinh thành.', tacGia: 'Đạo làm con' },
  { cau: 'Con dù lớn vẫn là con của mẹ, đi hết đời lòng mẹ vẫn theo con.', tacGia: 'Chế Lan Viên' },
  { cau: 'Ơn cha nặng lắm ai ơi, nghĩa mẹ bằng trời chín tháng cưu mang.', tacGia: 'Ca dao Việt Nam' },
  { cau: 'Những hy sinh thầm lặng của cha mẹ hôm nay chính là nền móng tương lai rạng rỡ của con.', tacGia: 'Tri ân gia đình' },
  { cau: 'Phía sau sự nỗ lực của con luôn là ánh mắt dõi theo đầy tin yêu và hy vọng của cha mẹ.', tacGia: 'Tâm tình phụ mẫu' },
  { cau: 'Hạnh phúc lớn nhất là thấy cha mẹ mỉm cười tự hào về những bước tiến vững vàng của con.', tacGia: 'Lời tri ân' },
  { cau: 'Tình cha ấm áp như vầng thái dương, lòng mẹ dịu êm như dòng suối mát lành tưới mát tâm hồn.', tacGia: 'Danh ngôn phụ mẫu' },
]

// 3. CÁC CÂU NÓI VỀ THẦY CÔ (Tri ân người lái đò thầm lặng, công lao dạy dỗ)
const CAU_NOI_THAY_CO = [
  { cau: 'Muốn sang thì bắc cầu Kiều, muốn con hay chữ phải yêu kính thầy.', tacGia: 'Ca dao Việt Nam' },
  { cau: 'Nhất tự vi sư, bán tự vi sư. Ơn dạy dỗ suốt đời khắc ghi trong tim.', tacGia: 'Tục ngữ phương Đông' },
  { cau: 'Thầy cô là người thắp lên ngọn lửa đam mê tri thức trong trái tim mỗi thế hệ học trò.', tacGia: 'Danh ngôn giáo dục' },
  { cau: 'Người thầy thực thụ không chỉ dạy kiến thức, mà còn truyền cảm hứng và niềm tin cho học sinh.', tacGia: 'William Arthur Ward' },
  { cau: 'Cảm ơn thầy cô đã lặng thầm đưa từng chuyến đò cập bến tương lai tươi sáng.', tacGia: 'Tri ân người lái đò' },
  { cau: 'Dưới ánh mặt trời rực rỡ, không có nghề nào cao quý hơn nghề dạy học.', tacGia: 'Comenius' },
  { cau: 'Mỗi bài giảng là một chân trời mới, mỗi lời nhắc nhở của thầy là hành trang quý báu trọn đời.', tacGia: 'Kính trọng thầy cô' },
  { cau: 'Tri thức thầy trao là ngọn đuốc sáng, dìu dắt bao ước mơ bay cao vào đời.', tacGia: 'Tri ân nhà giáo' },
  { cau: 'Thời gian dẫu trôi qua, tấm lòng tận tụy và công ơn người thầy vẫn mãi vẹn nguyên trong ký ức.', tacGia: 'Lời tri ân' },
  { cau: 'Thầy cô là người dẫn đường dẫn lối, mở ra cánh cửa tri thức và định hướng tương lai cho em.', tacGia: 'Danh ngôn sư phạm' },
  { cau: 'Người thầy xuất sắc truyền cho học trò niềm tin kiên định vào chính bản thân mình.', tacGia: 'Dan Rather' },
  { cau: 'Một người thầy giỏi giống như ngọn nến, đốt cháy chính mình để soi sáng lối đi cho học trò.', tacGia: 'Mustafa Kemal Atatürk' },
  { cau: 'Cảm ơn người thầy đã luôn kiên nhẫn uốn nắn từng nét chữ, chỉ dạy từng công thức bài học.', tacGia: 'Ghi ơn thầy cô' },
  { cau: 'Không có danh hiệu nào cao quý bằng sự tôn kính và lòng biết ơn của các thế hệ học trò.', tacGia: 'Tri ân người thầy' },
]

// 4. CÂU NÓI ĐỒNG HÀNH DÀNH CHO PHỤ HUYNH
const CAU_NOI_DONG_HANH_PH = [
  { cau: 'Sự kiên nhẫn và đồng hành của cha mẹ là món quà vô giá, là bệ phóng vững chắc nhất cho con.', tacGia: 'Tâm lý giáo dục' },
  { cau: 'Khi cha mẹ trao niềm tin và sự thấu hiểu, con trẻ sẽ có thêm muôn phần dũng khí vượt khó.', tacGia: 'Đồng hành cùng con' },
  { cau: 'Dạy con bằng sự bao dung, động viên con bằng niềm tin - tương lai tươi sáng bắt đầu từ mái ấm.', tacGia: 'Danh ngôn giáo dục' },
  { cau: 'Mỗi lời động viên kịp thời của cha mẹ là một hạt mầm tự tin nở hoa trong tâm hồn con.', tacGia: 'Nghệ thuật làm cha mẹ' },
  { cau: 'Đồng hành cùng con không chỉ là chỉ đường, mà là cùng con vượt qua những thử thách đầu đời.', tacGia: 'Chắp cánh ước mơ' },
  { cau: 'Thành công của con không chỉ đo bằng điểm số, mà bằng cả hành trình kiên trì cha mẹ kề bên.', tacGia: 'Tâm sự phụ huynh' },
  { cau: 'Một đứa trẻ được cha mẹ lắng nghe và tin tưởng sẽ luôn biết đứng dậy sau mỗi lần vấp ngã.', tacGia: 'Tâm lý học' },
  { cau: 'Hãy dành cho con tình yêu vô điều kiện và niềm tin trọn vẹn, con sẽ tự tin bay cao bay xa.', tacGia: 'Bệ phóng tương lai' },
  { cau: 'Cha mẹ đồng hành là ngọn đuốc thắp sáng con đường tìm kiếm tri thức và tương lai của con.', tacGia: 'Tri ân phụ mẫu' },
]

// Hàm tính câu theo ngày chuẩn múi giờ Việt Nam (00:01 tự động đổi)
function layCauTheoNgayVN() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const vn = new Date(utc + 3600000 * 7)
  const dayNumber = Math.floor(vn.getTime() / (1000 * 60 * 60 * 24))

  return {
    dongLuc: CAU_NOI_DONG_LUC[dayNumber % CAU_NOI_DONG_LUC.length],
    chaMe: CAU_NOI_CHA_ME[(dayNumber + 5) % CAU_NOI_CHA_ME.length],
    thayCo: CAU_NOI_THAY_CO[(dayNumber + 9) % CAU_NOI_THAY_CO.length],
    dongHanhPh: CAU_NOI_DONG_HANH_PH[(dayNumber + 3) % CAU_NOI_DONG_HANH_PH.length],
  }
}

type Winner = {
  nickname?: string
  rank: number
  name: string
  score: number
  seconds: number | null
  exam: string
  pet: string | null
  level: number
}

export interface BangVinhDanhProps {
  vaiTro?: 'hocsinh' | 'phuhuynh' | 'giaovien'
  hoTen?: string
  sbd?: string
  lop?: string
  tongSoCa?: number
}

export default function BangVinhDanh({
  vaiTro,
  hoTen,
  sbd,
  lop,
  tongSoCa = 0,
}: BangVinhDanhProps = {}) {
  const [data, setData] = useState<{ day: string; live?: boolean; winners: Winner[] } | null>(null)
  const quotes = layCauTheoNgayVN()

  useEffect(() => {
    let alive = true
    let busy = false
    const load = async () => {
      if (busy || document.hidden) return
      busy = true
      const c = new AbortController()
      const t = setTimeout(() => c.abort(), 15000)
      try {
        const url = await layDiaChiMayChu()
        const r = await fetch(`${url}/daily-honors`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
          signal: c.signal,
        })
        const d = await r.json()
        if (alive && d.ok) setData(d)
      } catch {
      } finally {
        busy = false
        clearTimeout(t)
      }
    }
    void load()
    const t = setInterval(() => void load(), 30000)
    const focus = () => void load()
    window.addEventListener('focus', focus)
    return () => {
      alive = false
      clearInterval(t)
      window.removeEventListener('focus', focus)
    }
  }, [])

  const hasQuotes = vaiTro === 'hocsinh' || vaiTro === 'phuhuynh'

  return (
    <section className="honors" aria-label="Bảng vinh danh học sinh">
      <div className={hasQuotes ? 'honors-split-2col' : ''}>
        {/* CỘT 1: BẢNG VINH DANH (PODIUM TOP 1, 2, 3) */}
        <div className={hasQuotes ? 'honors-col-left flex flex-col justify-between' : ''}>
          <header className="honors-heading">
            <div>
              <span className="honors-eyebrow">
                <Sparkles size={13} className="text-[#fbbc04]" /> DẤU ẤN MỖI NGÀY
              </span>
              <h2>Bảng vinh danh</h2>
              <p>
                Kết quả ngày {data?.day ? data.day.split('-').reverse().join('/') : 'hôm nay'} ·{' '}
                {data?.live ? 'Vinh danh hôm nay · Chốt lúc 00:01' : 'Đã chốt lúc 00:01'}
              </p>
            </div>
            <Crown className="honors-crown" size={24} />
          </header>

          {data && data.winners.length > 0 ? (
            <div className="honors-podium">
              {data.winners.map((w) => (
                <WinnerCard key={w.rank} winner={w} />
              ))}
            </div>
          ) : (
            <p className="honors-empty">Ngày này chưa có kết quả kiểm tra đủ điều kiện vinh danh.</p>
          )}
        </div>

        {/* CỘT 2: 3 Ô TÔN VINH (THU NHỎ 1 NỬA - CHUYỂN ĐỘNG ÁNH MÀU GOOGLE KHÁC NHAU) */}
        {hasQuotes && (
          <div className="honors-col-quotes">
            {vaiTro === 'hocsinh' ? (
              <>
                {/* HỌC SINH - Ô 1: ĐỘNG LỰC HỌC TẬP (Google Blue Luminous) */}
                <div className="honors-quote-card google-box-blue rounded-xl border-2 p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="honors-quote-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100/90 dark:bg-blue-950/90 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        <Compass size={11} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Động Lực Học Tập</span>
                      </div>
                      <span className="honors-quote-subtag text-[9px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 google-pulse-dot" />
                        00:01 mỗi ngày
                      </span>
                    </div>
                    <p className="honors-quote-body text-[11px] sm:text-xs font-medium text-slate-800 dark:text-slate-100 italic leading-snug mt-1 line-clamp-2">
                      "{quotes.dongLuc.cau}"
                    </p>
                  </div>
                  <div className="honors-quote-foot mt-1 pt-1 border-t border-blue-100/80 dark:border-blue-900/40 flex items-center justify-between text-[9.5px]">
                    <span className="text-blue-700/80 dark:text-blue-300/80 font-medium">Ý chí & mục tiêu</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">— {quotes.dongLuc.tacGia}</span>
                  </div>
                </div>

                {/* HỌC SINH - Ô 2 (Ở GIỮA): CÔNG ƠN CHA MẸ (Google Red / Rose Luminous) */}
                <div className="honors-quote-card google-box-red rounded-xl border-2 p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="honors-quote-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100/90 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                        <Heart size={11} className="text-rose-600 dark:text-rose-400 shrink-0" fill="currentColor" />
                        <span>Ơn Nghĩa Sinh Thành</span>
                      </div>
                      <span className="honors-quote-subtag text-[9px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 google-pulse-dot" />
                        Công cha mẹ
                      </span>
                    </div>
                    <p className="honors-quote-body text-[11px] sm:text-xs font-medium text-slate-800 dark:text-slate-100 italic leading-snug mt-1 line-clamp-2">
                      "{quotes.chaMe.cau}"
                    </p>
                  </div>
                  <div className="honors-quote-foot mt-1 pt-1 border-t border-rose-100/80 dark:border-rose-900/40 flex items-center justify-between text-[9.5px]">
                    <span className="text-rose-700/80 dark:text-rose-300/80 font-medium">Tri ân phụ mẫu</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">— {quotes.chaMe.tacGia}</span>
                  </div>
                </div>

                {/* HỌC SINH - Ô 3: TRI ÂN THẦY CÔ (Google Amber / Green Luminous) */}
                <div className="honors-quote-card google-box-amber rounded-xl border-2 p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="honors-quote-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 dark:bg-amber-950/90 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                        <GraduationCap size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Tri Ân Thầy Cô</span>
                      </div>
                      <span className="honors-quote-subtag text-[9px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 google-pulse-dot" />
                        Người lái đò
                      </span>
                    </div>
                    <p className="honors-quote-body text-[11px] sm:text-xs font-medium text-slate-800 dark:text-slate-100 italic leading-snug mt-1 line-clamp-2">
                      "{quotes.thayCo.cau}"
                    </p>
                  </div>
                  <div className="honors-quote-foot mt-1 pt-1 border-t border-amber-100/80 dark:border-amber-900/40 flex items-center justify-between text-[9.5px]">
                    <span className="text-amber-700/80 dark:text-amber-300/80 font-medium">Kính thầy trọng đạo</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">— {quotes.thayCo.tacGia}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* PHỤ HUYNH - Ô 1: THÔNG TIN PHỤ HUYNH & HỌC SINH (Google Blue Luminous) */}
                <div className="honors-quote-card google-box-blue rounded-xl border-2 p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="honors-quote-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100/90 dark:bg-blue-950/90 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        <Sparkles size={11} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Đồng Hành Cùng Con</span>
                      </div>
                      {sbd && (
                        <span className="honors-quote-subtag text-[9.5px] font-mono font-bold text-blue-600 dark:text-blue-400">
                          SBD: {sbd} {lop ? `· ${lop}` : ''}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <div className="honors-parent-title text-[11.5px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                        Chào Quý Phụ huynh{' '}
                        <span className="text-blue-600 dark:text-blue-400">của em {hoTen || 'học sinh'}!</span>
                      </div>
                      <p className="honors-parent-sub text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        Xem kết quả thi & tạo bài luyện khắc phục lỗi sai cho con.
                      </p>
                    </div>
                  </div>
                  <div className="honors-quote-foot mt-1 pt-1 border-t border-blue-100/80 dark:border-blue-900/40 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 dark:text-slate-400">Tổng số ca thi:</span>
                    <span className="honors-ca-pill px-2 py-0.2 rounded-md bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-black">
                      {tongSoCa} ca
                    </span>
                  </div>
                </div>

                {/* PHỤ HUYNH - Ô 2 (Ở GIỮA): LỜI TRI ÂN CHA MẸ (Google Red / Rose Luminous) */}
                <div className="honors-quote-card google-box-red rounded-xl border-2 p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="honors-quote-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100/90 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                        <Heart size={11} className="text-rose-600 dark:text-rose-400 shrink-0" fill="currentColor" />
                        <span>Lời Tri Ân Cha Mẹ</span>
                      </div>
                      <span className="honors-quote-subtag text-[9px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 google-pulse-dot" />
                        00:01 mỗi ngày
                      </span>
                    </div>
                    <p className="honors-quote-body text-[11px] sm:text-xs font-medium text-slate-800 dark:text-slate-100 italic leading-snug mt-1 line-clamp-2">
                      "{quotes.chaMe.cau}"
                    </p>
                  </div>
                  <div className="honors-quote-foot mt-1 pt-1 border-t border-rose-100/80 dark:border-rose-900/40 flex items-center justify-between text-[9.5px]">
                    <span className="text-rose-700/80 dark:text-rose-300/80 font-medium">Tình thương gia đình</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">— {quotes.chaMe.tacGia}</span>
                  </div>
                </div>

                {/* PHỤ HUYNH - Ô 3: ĐỒNG HÀNH CÙNG CON (Google Amber / Green Luminous) */}
                <div className="honors-quote-card google-box-amber rounded-xl border-2 p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="honors-quote-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 dark:bg-amber-950/90 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                        <Sparkles size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Đồng Hành Cùng Con</span>
                      </div>
                      <span className="honors-quote-subtag text-[9px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 google-pulse-dot" />
                        Bệ phóng tương lai
                      </span>
                    </div>
                    <p className="honors-quote-body text-[11px] sm:text-xs font-medium text-slate-800 dark:text-slate-100 italic leading-snug mt-1 line-clamp-2">
                      "{quotes.dongHanhPh.cau}"
                    </p>
                  </div>
                  <div className="honors-quote-foot mt-1 pt-1 border-t border-amber-100/80 dark:border-amber-900/40 flex items-center justify-between text-[9.5px]">
                    <span className="text-amber-700/80 dark:text-amber-300/80 font-medium">Chắp cánh ước mơ</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">— {quotes.dongHanhPh.tacGia}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function WinnerCard({ winner: w }: { winner: Winner }) {
  const [image, setImage] = useState('')
  const pet = PETS.findIndex((p) => p.id === w.pet)
  useEffect(() => {
    let active = true
    if (pet >= 0) {
      void classroomSpiritImage(pet, w.level)
        .then((src) => {
          if (active) setImage(src)
        })
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [pet, w.level])

  const isTop1 = w.rank === 1
  return (
    <article className={`honors-card honors-rank-${w.rank} ${isTop1 ? 'honors-top1-glow' : ''}`}>
      {isTop1 && (
        <>
          <div className="honors-top1-radiance" aria-hidden="true" />
          <div className="honors-sparkle honors-sparkle-1" aria-hidden="true">✦</div>
          <div className="honors-sparkle honors-sparkle-2" aria-hidden="true">✦</div>
          <div className="honors-sparkle honors-sparkle-3" aria-hidden="true">✦</div>
          <div className="honors-sparkle honors-sparkle-4" aria-hidden="true">✦</div>
        </>
      )}
      <div className="honors-rank">
        {isTop1 ? <Crown size={14} className="honors-crown-spin" /> : <Medal size={14} />}
        <span>TOP {w.rank}</span>
      </div>
      <h3 className="honors-name">{w.name}</h3>
      <div className="honors-spirit">
        {image ? (
          <img
            src={image}
            alt={w.nickname || PETS[pet]?.name || 'Thần thú của học sinh'}
            className={isTop1 ? 'honors-spirit-top1-animated' : 'honors-spirit-normal'}
          />
        ) : (
          <Crown size={isTop1 ? 50 : 40} className={isTop1 ? 'text-amber-400 animate-pulse' : ''} />
        )}
        <div className={`honors-spirit-shadow ${isTop1 ? 'honors-shadow-top1-animated' : ''}`} />
      </div>
      <div className="honors-score">
        {w.score.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
        <span>/10</span>
      </div>
      <p className="honors-praise">Thầy khen em đạt {w.score.toLocaleString('vi-VN')} điểm!</p>
      <p className="honors-pet">{pet >= 0 ? `${w.nickname || PETS[pet].name} · Cấp ${w.level}` : 'Chưa chọn thần thú'}</p>
      <div className="honors-foot">
        {w.seconds === null
          ? 'Chưa có thời gian hợp lệ'
          : `${Math.floor(w.seconds / 60)} phút ${w.seconds % 60} giây`}
        <span>{w.exam}</span>
      </div>
    </article>
  )
}
