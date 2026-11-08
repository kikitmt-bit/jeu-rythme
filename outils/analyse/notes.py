import numpy as np
SR=22050
y=np.fromfile('/tmp/rythme/morceau.raw',dtype=np.float32)
bpm,ph=np.load('/tmp/rythme/grid.npy'); P=60/bpm; HB=P/2
N=4096; w=np.hanning(N); fq=np.fft.rfftfreq(N,1/SR)
NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
def nm(m): return NAMES[m%12]+str(m//12-1)
def spec_at(t):  # fenêtre qui commence à t
    i=int(t*SR); seg=y[i:i+N]
    if len(seg)<N: seg=np.pad(seg,(0,N-len(seg)))
    return np.abs(np.fft.rfft(seg*w))
def pitchclass_peaks(sp,fmin=180,fmax=2500,k=3):
    m=(fq>fmin)&(fq<fmax); f=fq[m]; s=sp[m]
    from scipy.signal import find_peaks
    pk,pr=find_peaks(s,height=s.max()*0.15,distance=3)
    order=np.argsort(s[pk])[::-1][:k]
    return [(int(round(69+12*np.log2(f[pk[o]]/440))), s[pk[o]]/s.max()) for o in order]
K=int((72-ph)/HB)
out=[]
for k in range(K):
    t=ph+k*HB
    a=spec_at(t+0.015); b=spec_at(t-0.17)
    d=np.maximum(0,a-1.0*b)
    nw=pitchclass_peaks(d,k=2)
    tot=pitchclass_peaks(a,k=4)
    out.append((k,t,nw,tot))
import json
json.dump([(k,t,nw,tot) for k,t,nw,tot in out],open('/tmp/rythme/notes.json','w'))
for k,t,nw,tot in out:
    if 14<=k<=120 or 300<k<330:
        print(f"{k:3d} {t:6.2f} new:"+' '.join(f"{nm(m)}({v:.1f})" for m,v in nw)+"  | "+' '.join(nm(m) for m,v in tot))
