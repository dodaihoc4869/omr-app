# RÚT 28 CÂU «ĐỦ 28 — CHUẨN NHẤT CÓ THỂ» cho các ngày Mới của một bài. Chạy: cd docs/de-xuat-28-cau-mo-phong && python3 -I rut28.py
# Thứ tự ưu tiên: (1) đủ 28 câu/ngày; (2) đúng PHẦN (18 TN · 4 ĐS · 6 TLN); (3) đúng MỨC; (4) câu của chính bài trước câu bù.
# Bước: M = ⌈N/28⌉ → khớp đúng ô → câu thừa của bài lấp suất thiếu theo «giá lệch» nhỏ nhất → suất còn thiếu lấy câu bù (song sinh / kho chung cùng chương) đúng ô,
#       hết bù đúng ô thì bù ô gần nhất → rải đều câu lệch cho M ngày (không dồn ngày cuối).
import math
O=['I-B','I-H','I-VD','II-H','II-VD','III-H','III-VD']; W=dict(zip(O,[12,4,2,2,2,3,3]))
PHAN={o:o.split('-')[0] for o in O}; MUC={'B':0,'H':1,'VD':2}; mu=lambda o:MUC[o.split('-')[1]]
def gia(suat,cau): return abs(mu(suat)-mu(cau)) if PHAN[suat]==PHAN[cau] else 10+abs(mu(suat)-mu(cau))
def lap(kho,bu):
    N=sum(kho.values()); M=math.ceil(N/28); T={o:W[o]*M for o in O}
    lay={(o,o,'bai'):min(kho[o],T[o]) for o in O}
    thua={o:kho[o]-lay[(o,o,'bai')] for o in O}; thieu={o:T[o]-lay[(o,o,'bai')] for o in O}
    def lap_tu(nguon,loai):
        for s,c in sorted(((s,c) for s in O for c in O if s!=c or loai=='bu'),key=lambda p:(gia(*p),O.index(p[0]))):
            k=min(thieu[s],nguon[c])
            if k>0: lay[(s,c,loai)]=lay.get((s,c,loai),0)+k; thieu[s]-=k; nguon[c]-=k
    lap_tu(thua,'bai')                                   # câu thừa của bài trước
    bu=dict(bu); lap_tu(bu,'bu')                         # rồi câu bù (đúng ô trước vì giá 0)
    assert sum(thieu.values())==0, 'thiếu câu: '+str(thieu)
    assert sum(v for (s,c,l),v in lay.items() if l=='bai')==N, 'chưa dùng hết câu của bài'
    # rải đều cho M ngày: mỗi ô suất có đúng W suất/ngày; câu LỆCH đặt trước, mỗi câu vào ngày đang có ít câu lệch cùng loại nhất (rồi ít lệch nhất),
    # sau đó lấp câu đúng ô ⇒ không ngày nào gánh hết câu lệch.
    ngay=[[] for _ in range(M)]; con={(d,s):W[s] for d in range(M) for s in O}
    lech=[(s,c,l) for (s,c,l),k in lay.items() if s!=c for _ in range(k)]
    lech.sort(key=lambda x:(PHAN[x[1]]==PHAN[x[0]], x[0], x[1]))           # lệch PHẦN trước (khó rải nhất)
    for x in lech:
        s,c,l=x
        d=min((d for d in range(M) if con[(d,s)]>0),
              key=lambda d:(sum(1 for y in ngay[d] if PHAN[y[1]]!=PHAN[y[0]]) if PHAN[c]!=PHAN[s] else 0,
                            sum(1 for y in ngay[d] if y[0]!=y[1]), sum(1 for y in ngay[d] if y[2]=='bu'), d))
        ngay[d].append(x); con[(d,s)]-=1
    dung=[(s,c,l) for (s,c,l),k in lay.items() if s==c for _ in range(k)]
    dung.sort(key=lambda x:(x[0], x[2]=='bai'))                                # câu bù đúng ô rải trước, câu bài lấp sau
    for x in dung:
        s=x[0]; d=min((d for d in range(M) if con[(d,s)]>0), key=lambda d:(sum(1 for y in ngay[d] if y[2]=='bu') if x[2]=='bu' else 0, -con[(d,s)], d))
        ngay[d].append(x); con[(d,s)]-=1
    return M,ngay,lay
def in_bai(ten,kho,bu):
    M,ngay,lay=lap(kho,bu); N=sum(kho.values())
    print(f"=== {ten}: {N} câu, kho theo ô {[kho[o] for o in O]} ⇒ M = {M} ngày Mới")
    for d,de in enumerate(ngay):
        assert len(de)==28
        phan={p:sum(1 for x in de if PHAN[x[1]]==p) for p in ('I','II','III')}
        lech=sum(1 for x in de if x[0]!=x[1]); bu_=sum(1 for x in de if x[2]=='bu')
        muc_that={o:sum(1 for x in de if x[1]==o) for o in O}
        print(f"  Ngày {d+1}: 28 câu · Phần I/II/III = {phan['I']}/{phan['II']}/{phan['III']} · đúng ô {28-lech}/28 · câu bù {bu_} · ô thật {[muc_that[o] for o in O]}")
    tl=sum(v for (s,c,l),v in lay.items() if s!=c)
    print(f"  Tổng: lệch ô {tl} suất/{28*M} · câu bù {sum(v for (s,c,l),v in lay.items() if l=='bu')} · chi tiết lệch: "+", ".join(f"{c}→suất {s} ×{v}" for (s,c,l),v in lay.items() if s!=c))
print("Chuẩn mỗi ngày (I-B, I-H, I-VD, II-H, II-VD, III-H, III-VD) =", [W[o] for o in O])
NHIEU={o:999 for o in O}
in_bai("Bài A (dồn Phần I Hiểu — ví dụ giả định)", dict(zip(O,[40,22,10,8,4,7,9])), NHIEU)
in_bai("Bài B (chỉ 6 câu Đúng/Sai; Phần II không có song sinh, kho chung cùng chương còn 4 câu ĐS — giả định)",
       dict(zip(O,[50,20,8,3,3,10,6])), {**NHIEU,'II-H':2,'II-VD':2})
