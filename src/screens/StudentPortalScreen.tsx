import { useState, Suspense } from 'react';
import Game from '../game/than-thu-v2/Game';

import Spirit2D from '../game/than-thu-v2/Spirit2D';
import { Shield, Map, Zap, Star, ChevronRight, CheckCircle2, XCircle, Lightbulb, Beaker } from 'lucide-react';
import '../styles/game-ui.css'; // We will create this

export default function StudentPortalScreen() {
  const [activeMode, setActiveMode] = useState<'portal' | 'home' | 'doan' | 'demo'>('portal');

  if (false) {
    return <GameQuestionDemo onBack={() => setActiveMode('portal')} />;
  }
  if (activeMode === 'home' || activeMode === 'doan') {
    return (
      <Suspense fallback={<div className="p-10 text-center">Đang tải game...</div>}>
        <Game sbd="SBD_TEST" token="" manDau={activeMode} onDong={() => setActiveMode('portal')} />
      </Suspense>
    );
  }
  if (false) {
    return <GameQuestionDemo onBack={() => setActiveMode('portal')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-10">
      {/* HEADER: Thông tin Học sinh & Chỉ số */}
      <div className="bg-white px-6 py-8 shadow-sm rounded-b-[2.5rem] mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -left-4 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
              <Spirit2D index={2} level={12} compact={true} motion="idle" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Nguyễn Văn A</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-amber-600">Cấp 12</span>
                <span className="text-xs text-slate-400 ml-1">• Tân Binh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh Tiến Trình (EXP & Thể lực) */}
        <div className="space-y-4">
          {/* Thanh EXP */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-blue-700">Kinh nghiệm (EXP)</span>
              <span className="text-slate-500">1,240 / 1,420</span>
            </div>
            <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: '85%' }}></div>
            </div>
          </div>
          
          {/* Thanh Thể Lực (Lượt làm bài) */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-emerald-700 flex items-center gap-1"><Zap className="w-3 h-3" /> Thể lực hôm nay</span>
              <span className="text-slate-500">24 / 40 câu</span>
            </div>
            <div className="h-3 w-full bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000 ease-out" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY: Chọn Chế Độ Chơi */}
      <div className="px-6 space-y-5 flex-1 flex flex-col justify-center">
        <h2 className="text-lg font-bold text-slate-700 mb-2 px-1">Chế độ chơi</h2>
        
        {/* CARD 1: Bát Linh Đảo */}
        <button 
          onClick={() => setActiveMode('home')}
          className="group relative w-full text-left bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-lg shadow-emerald-200 overflow-hidden hover:scale-[1.02] transition-transform duration-300 active:scale-95"
        >
          <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <Map className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4">
              <Map className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Bát Linh Đảo</h3>
            <p className="text-emerald-50 text-sm font-medium leading-relaxed max-w-[80%]">
              Khám phá vùng đất mới. Hoàn thành 16 câu hỏi mới hôm nay để mở khóa sương mù!
            </p>
            <div className="mt-5 flex items-center text-white font-semibold text-sm">
              <span>Bắt đầu thám hiểm</span>
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>

        {/* CARD 2: Đoàn Hộ Tống */}
        <button 
          onClick={() => setActiveMode('doan')}
          className="group relative w-full text-left bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 shadow-lg shadow-amber-200 overflow-hidden hover:scale-[1.02] transition-transform duration-300 active:scale-95"
        >
          <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <Shield className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Đoàn Hộ Tống</h3>
            <p className="text-amber-50 text-sm font-medium leading-relaxed max-w-[80%]">
              Bảo vệ xe hàng! Đánh bại 8 quái vật (ôn lại câu sai cũ) đang phục kích phía trước.
            </p>
            <div className="mt-5 flex items-center text-white font-semibold text-sm">
              <span>Nhận nhiệm vụ</span>
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// DEMO MÀN HÌNH LÀM BÀI VÀ LỜI GIẢI ĐẸP MẮT (M3 CỦA GOOGLE)
// ---------------------------------------------------------
function GameQuestionDemo({ onBack }: { onBack: () => void }) {
  const [answered, setAnswered] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* App Bar */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 shadow-sm sticky top-0 z-20">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div className="flex-1">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }}></div>
          </div>
          <p className="text-xs text-center text-slate-500 mt-1 font-medium">Câu 5 / 12</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:max-w-3xl lg:mx-auto w-full">
        {/* Khung Câu Hỏi */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg tracking-wide uppercase">Cọ sát</span>
            <span className="text-sm font-medium text-slate-400">Hóa Học 12</span>
          </div>
          <h2 className="text-xl text-slate-800 font-medium leading-relaxed">
            Hòa tan hoàn toàn 2,4 gam Mg vào dung dịch HNO3 loãng, giả sử phản ứng chỉ sinh ra khí NO (sản phẩm khử duy nhất). Thể tích khí NO (ở đktc) thu được là bao nhiêu?
          </h2>
        </div>

        {/* Các đáp án */}
        <div className="space-y-3 mb-8">
          {[
            { id: 'A', text: '1,4874 lít', isCorrect: false },
            { id: 'B', text: '2,24 lít', isCorrect: false },
            { id: 'C', text: '1,4933 lít', isCorrect: true, selected: true },
            { id: 'D', text: '0,896 lít', isCorrect: false }
          ].map((ans) => {
            const isSelected = ans.selected && answered;
            const isRight = ans.isCorrect && answered;
            const isWrong = isSelected && !ans.isCorrect;
            
            let bgClass = "bg-white hover:bg-slate-50 hover:border-slate-300 border-slate-200";
            let textClass = "text-slate-700";
            let icon = null;

            if (answered) {
              if (isRight) {
                bgClass = "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500";
                textClass = "text-emerald-800 font-semibold";
                icon = <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
              } else if (isWrong) {
                bgClass = "bg-red-50 border-red-500 ring-1 ring-red-500";
                textClass = "text-red-800 font-semibold";
                icon = <XCircle className="w-6 h-6 text-red-500" />;
              } else {
                bgClass = "bg-white border-slate-200 opacity-60";
              }
            }

            return (
              <button 
                key={ans.id}
                onClick={() => !answered && setAnswered(true)}
                disabled={answered}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 shadow-sm ${bgClass}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${answered && (isRight || isWrong) ? 'bg-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                  {ans.id}
                </div>
                <span className={`text-lg flex-1 ${textClass}`}>{ans.text}</span>
                {icon}
              </button>
            )
          })}
        </div>

        {/* Khung Giải Thích Chuẩn (Hiện ra khi đã chọn) */}
        {answered && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-900">Giải thích chi tiết</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 1. Kiến thức cốt lõi */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Beaker className="w-4 h-4" /> Kiến thức cốt lõi
                </h4>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-slate-700 leading-relaxed">
                  Định luật bảo toàn electron: Tổng số mol electron nhường bằng tổng số mol electron nhận.
                  <br/><br/>
                  <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm">Mg → Mg²⁺ + 2e</span>
                  <br/>
                  <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-sm mt-1 inline-block">N⁺⁵ + 3e → N⁺² (NO)</span>
                </div>
              </div>

              {/* 2. Giải từng bước */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Giải từng bước</h4>
                <div className="space-y-4 text-slate-700">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">1</div>
                    <div className="pt-1">
                      <p className="font-medium">Tính số mol Mg:</p>
                      <p className="text-slate-600 mt-1">n(Mg) = 2,4 / 24 = 0,1 (mol)</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">2</div>
                    <div className="pt-1">
                      <p className="font-medium">Bảo toàn electron:</p>
                      <p className="text-slate-600 mt-1">2 × n(Mg) = 3 × n(NO)</p>
                      <p className="text-slate-600 mt-1">2 × 0,1 = 3 × n(NO) ⇒ n(NO) = 0,2 / 3 (mol)</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">3</div>
                    <div className="pt-1">
                      <p className="font-medium">Tính thể tích khí NO (ở đktc 25°C, 1 bar - SGK Mới):</p>
                      <p className="text-slate-600 mt-1 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        V = (0,2 / 3) × 24,79 ≈ 1,6526 lít (Nếu đề cũ dùng 22,4 thì V = 1,4933 lít)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Phân tích các đáp án nhiễu */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Tại sao các ý khác sai?</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 bg-red-50/50 p-3 rounded-xl border border-red-100">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700"><strong>Ý A:</strong> Học sinh nhầm lẫn tỉ lệ mol electron, lấy 2 × n(Mg) = 2 × n(NO).</span>
                  </li>
                  <li className="flex items-start gap-2 bg-red-50/50 p-3 rounded-xl border border-red-100">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700"><strong>Ý B:</strong> Học sinh quên chia cho 3 (ảo tưởng Mg hóa trị 3 hoặc khí hóa trị 2).</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      {answered && (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-20">
          <button 
            onClick={() => setAnswered(false)}
            className="w-full lg:max-w-3xl lg:mx-auto block bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-2xl shadow-md transition-colors"
          >
            Tiếp tục hành trình
          </button>
        </div>
      )}
    </div>
  )
}
