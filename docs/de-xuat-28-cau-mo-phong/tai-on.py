# KIỂM TẢI của luật Ôn/Sửa trong docs/de-xuat-on-sua-0811.md (không phải đo trí nhớ thật: «thật» ở đây dùng CHÍNH công thức của luật).
# Chạy: cd docs/de-xuat-28-cau-mo-phong && python3 -I tai-on.py
# Chu kỳ một bài: 4 ngày Mới (cứ 2 Mới chen 1 Sửa nếu có lỗi) → Ôn n ngày → Sửa đến khi sạch nhóm (lượt 1); nhóm chờ lượt 2 do đề Ôn sau gọi.
# n = max theo ô ⌈số dạng bài cũ của ô có R < MỤC TIÊU / suất ô⌉ (≥ 1). R = 2^(-t/h); đúng: h·(1,5+3(1−R)); sai: max(1; 0,6h).
import random, math
O=['I-B','I-H','I-VD','II-H','II-VD','III-H','III-VD']; W=dict(zip(O,[12,4,2,2,2,3,3])); MUC={o:o.split('-')[1] for o in O}
def R(t,h): return 2**(-t/h)
def chay(tran,muc_tieu,h0,seed,so_bai=15,D_o=4,tran_on=99,uu_tien='thap'):
    r=random.Random(seed); dang={}; nhom=set(); cho2=set(); ngay=0; kq=[]
    def lam(d):
        h,t0=dang[d]; Rt=R(ngay-t0,h); ok=r.random()<tran[MUC[d[1]]]*Rt
        dang[d]=[h*(1.5+3*(1-Rt)) if ok else max(1,0.6*h), ngay]
        if not ok: nhom.add(d); cho2.discard(d)
        elif d in cho2: cho2.discard(d)              # lượt 2 đúng ⇒ sửa xong
        return ok
    def sua_ngay():
        nonlocal ngay
        for o in O:
            for d in sorted([x for x in nhom if x[1]==o],key=lambda x:dang[x][1])[:W[o]]:
                if r.random()<0.9*tran[MUC[o]]: nhom.discard(d); cho2.add(d); dang[d]=[5.0,ngay]
        ngay+=1
    for b in range(so_bai):
        bd=ngay; moi=[(b,o,k) for o in O for k in range(D_o)]
        for d in moi: dang[d]=[h0,ngay]
        s=0
        for m in range(4):
            for d in moi: lam(d)
            ngay+=1
            if m in(1,) and nhom: sua_ngay(); s+=1
        cu=[d for d in dang if d[0]<b] or moi
        n=max([1]+[math.ceil(sum(1 for d in cu if d[1]==o and R(ngay-dang[d][1],dang[d][0])<muc_tieu)/W[o]) for o in O])
        n=min(n,tran_on)
        for _ in range(n):
            for o in O:
                ung=[x for x in cu if x[1]==o]
                if uu_tien=='thap': ung.sort(key=lambda x:R(ngay-dang[x][1],dang[x][0]))
                else: ung.sort(key=lambda x:abs(R(ngay-dang[x][1],dang[x][0])-muc_tieu))   # vừa chạm ngưỡng quên trước
                for d in ung[:W[o]]: lam(d)
            ngay+=1
        v=0
        while nhom and v<30: sua_ngay(); s+=1; v+=1
        hong=sum(1 for d in cu if R(ngay-dang[d][1],dang[d][0])<0.5)/len(cu)
        kq.append((n,s,ngay-bd,hong,len(nhom)))
    return kq
HS={'Khá':{'B':.97,'H':.9,'VD':.75},'Yếu':{'B':.85,'H':.65,'VD':.4}}
print("Ngân sách Ôn cố định mỗi chu kỳ; h0 = 7; 20 lượt/em. «thấp» = R thấp nhất trước; «ngưỡng» = R gần 70 % nhất trước.")
for ten,tran in HS.items():
  for ns in (1,2):
    for ut in ('thap','nguong'):
        kq=[chay(tran,0.7,7,s,tran_on=ns,uu_tien=ut) for s in range(20)]
        def tb(i,j): return sum(k[i][j] for k in kq)/len(kq)
        print(f"{ten:4s} Ôn {ns}/bài, ưu tiên {ut:6s}: bài 9 → Sửa {tb(8,1):4.1f}, chu kỳ {tb(8,2):4.1f} ngày | bài 15 → Sửa {tb(14,1):4.1f}, chu kỳ {tb(14,2):4.1f}, nhóm kẹt {tb(14,4):3.0f}")
print("Đối chứng — KHÔNG giới hạn ngân sách (ôn mọi dạng dưới ngưỡng, số ngày theo ô nghẽn):")
for ten,tran in HS.items():
    for mt in (0.7,0.5):
        kq=[chay(tran,mt,7,s) for s in range(10)]
        print(f"{ten:4s} ngưỡng {mt:.0%}: ngày Ôn bài 9 = {sum(k[8][0] for k in kq)/10:.1f}, bài 15 = {sum(k[14][0] for k in kq)/10:.1f}")
