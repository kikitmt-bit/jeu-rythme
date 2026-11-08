import numpy as np
SR=22050; HOP=256; NFFT=2048
y=np.fromfile('/tmp/rythme/morceau.raw',dtype=np.float32)
def stft(y):
    w=np.hanning(NFFT); n=1+(len(y)-NFFT)//HOP
    idx=np.arange(NFFT)[None,:]+HOP*np.arange(n)[:,None]
    return np.abs(np.fft.rfft(y[idx]*w,axis=1))
S=stft(y)                       # frames x bins
FT=HOP/SR
freqs=np.fft.rfftfreq(NFFT,1/SR)
times=np.arange(S.shape[0])*FT + NFFT/2/SR
logS=np.log1p(100*S)
flux=np.maximum(0,np.diff(logS,axis=0)).sum(1); flux=np.concatenate([[0],flux])
# lissage + normalisation locale
from scipy.ndimage import uniform_filter1d
onset=flux-uniform_filter1d(flux,int(0.5/FT)); onset=np.maximum(onset,0); onset/=onset.max()
