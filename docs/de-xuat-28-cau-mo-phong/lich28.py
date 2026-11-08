# v5 — ĐÚNG ĐỊNH NGHĨA CỦA THẦY. Chu kỳ một bài (từng em) =
#   M ngày Mới  : làm HẾT câu mới của bài, mỗi ngày 28 câu đúng ma trận;
#   R ngày Ôn   : đề kiểm tra ôn tập 28 câu phủ TOÀN BỘ bài cũ (mỗi bài cũ ≥ 1 câu/chu kỳ) — R = max(1, ⌈số bài đã học / 28⌉);
#   S ngày Sửa  : tới khi HẾT nhóm lỗi của chu kỳ (nhóm = cùng bài + cùng dạng + cùng ô; đúng câu song sinh ⇒ cả nhóm xong; sai 3 lần ⇒ thầy chữa).
# Xếp: sau mỗi 2 ngày Mới là 1 ngày Sửa (nếu có lỗi); Ôn đặt sau ngày Mới cuối; cuối chu kỳ Sửa đến khi sạch. Bài kế bắt đầu khi chu kỳ đóng.
import math, random, sys
O=['I-B','I-H','I-VD','II-H','II-VD','III-H','III-VD']; W=dict(zip(O,[12,4,2,2,2,3,3])); MUC={o:o.split('-')[1] for o in O}
def so_ngay_moi(kho): return max(math.ceil(sum(kho.values())/28), max(math.ceil(kho[o]/W[o]) for o in O if kho[o]))
class Em:
    def __init__(s,p,seed,dang_o):
        s.p={o:p[MUC[o]] for o in O}; s.q={o:s.p[o]+0.5*(1-s.p[o]) for o in O}
        s.r=random.Random(seed); s.nhom={}; s.ngay=0; s.chuoi=''; s.dang_o=dang_o; s.thay=0; s.loi=0; s.bai_da=[]
def lam_de(em,t,kho,bai):
    de=[]
    if t=='M':
        for o in O:
            lay=min(W[o],kho[o]); kho[o]-=lay; de+=[('moi',o,bai)]*lay+[('bu',o,bai)]*(W[o]-lay)
    elif t=='S':
        for o in O:
            ds=sorted([k for k,n in em.nhom.items() if n['o']==o],key=lambda k:em.nhom[k]['tu'])[:W[o]]
            de+=[('sua',o,k) for k in ds]+[('cc',o,None)]*(W[o]-len(ds))
    else:
        cu=em.bai_da or [bai]
        for o in O: de+=[('on',o,cu[(i+hash(o))%len(cu)]) for i in range(W[o])]
    assert len(de)==28 and all(sum(1 for x in de if x[1]==o)==W[o] for o in O)
    for k,o,x in de:
        if k=='sua':
            n=em.nhom[x]
            if em.r.random()<em.q[o]: del em.nhom[x]
            else:
                n['sai']+=1
                if n['sai']>=3: em.thay+=n['so']; del em.nhom[x]
        elif k=='cc': pass
        else:
            ok=em.r.random()<(em.p[o]-(0.05 if k=='on' else 0))
            if not ok:
                d=(x,o,em.r.randrange(em.dang_o)); n=em.nhom.setdefault(d,{'o':o,'tu':em.ngay,'sai':0,'so':0}); n['so']+=1; em.loi+=1
    em.ngay+=1; em.chuoi+=t
def mot_bai(em,N,bai):
    kho={o:W[o]*N//28 for o in O}; M=so_ngay_moi(kho); R=max(1,math.ceil(len(em.bai_da)/28)) if em.bai_da else 1
    bd=em.ngay; m=0
    while m<M:
        lam_de(em,'M',kho,bai); m+=1
        if m%2==0 and m<M and em.nhom: lam_de(em,'S',kho,bai)
    for _ in range(R): lam_de(em,'O',kho,bai)
    while em.nhom: lam_de(em,'S',kho,bai)
    em.bai_da.append(bai); return em.ngay-bd, M, R
def du_bao(p,N,dang_o,so_bai_cu):
    """Công thức máy tính TRƯỚC cho từng em (kỳ vọng): nhóm lỗi theo ô = số dạng của ô có ít nhất 1 câu sai."""
    M=math.ceil(N/28); R=1 if so_bai_cu==0 else max(1,math.ceil(so_bai_cu/28)); S=0
    for o in O:
        pc=p[MUC[o]]; q=pc+0.5*(1-pc); cau_o=W[o]*N//28; moi_dang=cau_o/dang_o
        nhom=dang_o*(1-pc**moi_dang) + dang_o*(1-(pc-0.05)**(W[o]*R/dang_o))*0   # nhóm từ câu mới
        nhom+=W[o]*R*(1-(pc-0.05))                                                 # lỗi ôn (mỗi câu ôn sai ~ một nhóm riêng)
        lan=nhom/(q)                                                               # lượt cần (kỳ vọng hình học)
        S=max(S,math.ceil(lan/W[o]))
    return M,R,S,M+R+S
HS=[('Giỏi',{'B':.97,'H':.90,'VD':.80}),('Khá',{'B':.92,'H':.80,'VD':.60}),('Trung bình',{'B':.85,'H':.65,'VD':.40}),('Yếu',{'B':.75,'H':.50,'VD':.25})]
for N in (56,112,168):
  for dang_o in (2,4):
    print(f"--- bài {N} câu, {dang_o*7} dạng/bài (thầy chọn bài mỗi 7 ngày):")
    for ten,p in HS:
        kq=[]
        for s in range(1,31):
            em=Em(p,s,dang_o); ds=[mot_bai(em,N,b) for b in range(10)]
            kq.append((ds,em.ngay,em.thay,em.loi))
        chu_ky=sorted(sum(d[0] for d in k[0][2:])/8 for k in kq); tb=chu_ky[15]; xau=chu_ky[28]
        thay=sum(k[2] for k in kq)/30; loi=sum(k[3] for k in kq)/30
        db=du_bao(p,N,dang_o,5)
        tre=tb-7
        print(f"  {ten:10s} chu kỳ thực {tb:4.1f} ngày (95%: ≤{xau:4.1f}) · máy dự báo {db[3]} = M{db[0]}+Ô{db[1]}+S{db[2]} · chậm lớp {max(0,tre):3.1f} ngày/bài · {thay/max(loi,1):.0%} lỗi chuyển thầy")
