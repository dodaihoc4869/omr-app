# HẠN CHUNG CẢ LỚP (thầy 09/11). Chạy: cd docs/de-xuat-28-cau-mo-phong && python3 -I han-chung.py
# Lớp 53 em (năng lực a rải đều 0..1 — GIẢ ĐỊNH), bài 112 câu đủ ô (M = 4), 10 bài liên tiếp, thầy giao bài kế đúng ngày hết hạn chung.
# Khung T ngày giống nhau cả lớp: M ngày Mới (cứ 2 Mới chen 1 Sửa nếu có lỗi) → ngày còn lại: Sửa đến khi sạch, phần dư là Ôn; mỗi em ÍT NHẤT 1 ngày Ôn.
# Hạn chung T = M + 1 + S ở phân vị P của lớp (S từng em = công thức dự báo, có tính nhóm lỗi đang mang sang). Lỗi chưa sửa xong lúc hết hạn ⇒ mang sang khung sau, ưu tiên trước.
import math, random
src=open('lich28.py').read().split('HS=[')[0]; ns={}; exec(src,ns)
O,W,MUC,Em,lam_de,so_ngay_moi=ns['O'],ns['W'],ns['MUC'],ns['Em'],ns['lam_de'],ns['so_ngay_moi']
def S_du_bao(em,kho,dang_o=4,R=1):
    M=so_ngay_moi(kho); S=0; co=False
    for o in O:
        pc=em.p[o]; q=em.q[o]; cau=M*W[o]
        ton=sum(1 for n in list(em.nhom.values())+list(em.mang.values()) if n['o']==o)
        nh=dang_o*(1-pc**(cau/dang_o))+W[o]*R*(1-(pc-0.05))+ton
        co|=nh>0.3; S=max(S,math.ceil(nh/q/W[o]))
    return S+((M-1)//2 if co else 0)
def mot_lop(P,seed,so_bai=10,N=112):
    r=random.Random(seed)
    lop=[]
    for i in range(53):
        a=(i+0.5)/53; e=Em({'B':.75+.22*a,'H':.5+.4*a,'VD':.25+.55*a},seed*100+i,4); e.a=a; lop.append(e)
    kq=[]
    for b in range(so_bai):
        kho={o:W[o]*N//28 for o in O}; M=so_ngay_moi(kho)
        for e in lop: e.nhom.update(e.mang); e.mang={}
        Ss=sorted(S_du_bao(e,kho) for e in lop)
        T=M+1+Ss[min(52,math.ceil(P*53)-1)]
        sach=0; on_gioi=[]; on_yeu=[]; sua_yeu=[]
        for e in lop:
            k=dict(kho); m=0; seq=''
            for d in range(T):
                con=T-d
                # cần bao nhiêu ngày Sửa cho nhóm đang có (theo ô nghẽn), +1 dự phòng cho lỗi lộ ra ở ngày Ôn
                can=max([math.ceil(sum(1 for n in e.nhom.values() if n['o']==o)/(W[o]*e.q[o])) for o in O]+[0])
                if m<M: t='S' if (seq.endswith('MM') and e.nhom) else 'M'
                elif seq.count('O')==0: t='O'                         # mỗi em ít nhất 1 ngày Ôn, đặt ngay sau câu mới
                else: t='S' if e.nhom else 'O'                        # Sửa đến sạch; sạch rồi mới Ôn thêm (em giỏi)
                if t=='M': m+=1
                lam_de(e,t,k,b); seq+=t
            assert sum(k.values())==0, 'chưa hết câu mới'
            if not any(isinstance(kk,tuple) and len(kk)==3 and kk[0]==b for kk in e.nhom): sach+=1
            e.mang.update(e.nhom); e.nhom={}; e.bai_da.append(b)
            (on_gioi if e.a>0.75 else on_yeu if e.a<0.25 else []).append(seq.count('O'))
            if e.a<0.25: sua_yeu.append(seq.count('S'))
        mang=[len(e.mang) for e in lop]
        kq.append((T,sach,sum(on_gioi)/len(on_gioi),sum(on_yeu)/len(on_yeu),sum(sua_yeu)/len(sua_yeu),max(mang)))
    return kq
for P in (0.5,0.8,0.9,1.0):
    ds=[mot_lop(P,s) for s in range(3)]
    T=[k[0] for d in ds for k in d[2:]]; sach=[k[1] for d in ds for k in d[2:]]
    og=sum(k[2] for d in ds for k in d[2:])/len(T); oy=sum(k[3] for d in ds for k in d[2:])/len(T); sy=sum(k[4] for d in ds for k in d[2:])/len(T)
    mm=max(k[5] for d in ds for k in d)
    print(f"Hạn chung theo phân vị {int(P*100):3d}%: T = {min(T)}–{max(T)} ngày/bài · xong sạch lỗi trong hạn {min(sach)}–{max(sach)}/53 em · "
          f"ngày Ôn: em giỏi {og:.1f}, em yếu {oy:.1f} · ngày Sửa em yếu {sy:.1f} · nhóm lỗi mang sang tối đa {mm}")
