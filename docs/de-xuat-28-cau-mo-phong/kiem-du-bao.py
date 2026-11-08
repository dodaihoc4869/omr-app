import math, importlib.util, sys
spec=importlib.util.spec_from_file_location('v5','lich28.py'); 
src=open('lich28.py').read().split('HS=[')[0]; ns={}; exec(src,ns)
O,W,MUC,Em,lam_de,so_ngay_moi=ns['O'],ns['W'],ns['MUC'],ns['Em'],ns['lam_de'],ns['so_ngay_moi']
def du_bao(p,kho,dang_o,R=1):
    M=so_ngay_moi(kho); S=0; co_loi=False
    for o in O:
        pc=p[MUC[o]]; q=pc+0.5*(1-pc); cau=kho[o]+(M*W[o]-kho[o])      # cả câu bù
        nhom=dang_o*(1-pc**(cau/dang_o)) + W[o]*R*(1-(pc-0.05))
        co_loi|=nhom>0.3; S=max(S,math.ceil(nhom/q/W[o]))
    giua=(M-1)//2 if co_loi else 0
    return M,R,S+giua,M+R+S+giua
def thuc(p,kho_mau,dang_o,seed):
    em=Em(p,seed,dang_o); em.bai_da=[0,1,2,3,4]; kho=dict(kho_mau); M=so_ngay_moi(kho); m=0; bd=em.ngay
    while m<M:
        lam_de(em,'M',kho,9); m+=1
        if m%2==0 and m<M and em.nhom: lam_de(em,'S',kho,9)
    lam_de(em,'O',kho,9)
    while em.nhom: lam_de(em,'S',kho,9)
    assert sum(kho.values())==0
    return em.ngay-bd
HS=[('Giỏi',{'B':.97,'H':.90,'VD':.80}),('Khá',{'B':.92,'H':.80,'VD':.60}),('Trung bình',{'B':.85,'H':.65,'VD':.40}),('Yếu',{'B':.75,'H':.50,'VD':.25})]
BAI={'56 câu đủ ô':{o:W[o]*2 for o in O},'112 câu đủ ô':{o:W[o]*4 for o in O},
     '100 câu LỆCH ô (40·22·10·8·4·7·9)':dict(zip(O,[40,22,10,8,4,7,9]))}
sai=0; tong=0
for tb,kho in BAI.items():
    print(f"--- bài {tb}: M = {so_ngay_moi(kho)} ngày Mới ({so_ngay_moi(kho)*28-sum(kho.values())} suất bù)")
    for ten,p in HS:
        for dang_o in (2,4):
            ds=sorted(thuc(p,kho,dang_o,s) for s in range(200)); tv=ds[100]; p90=ds[180]
            M,R,S,T=du_bao(p,kho,dang_o); tong+=1; sai+=abs(T-tv)>1
            if dang_o==4: print(f"  {ten:10s} dự báo {T:2d} = M{M}+Ô{R}+S{S} · thực trung vị {tv} (90%: ≤{p90})")
print(f"Dự báo lệch thực quá ±1 ngày: {sai}/{tong} trường hợp")
