from pathlib import Path
import wave,hashlib,json
import numpy as np
root=Path(__file__).resolve().parents[1]/'app/src/main/assets/web/assets/audio'
manifest=json.loads((root/'manifest.json').read_text());manifest=[r for r in manifest if not r['file'].startswith(('sfx/SFX_STEP_SNOW_','sfx/SFX_SHAKE_SNOW_'))]
qa=[]
for kind,source in [('STEP','SFX_STEP_SOIL_v01.wav'),('SHAKE','SFX_LEAF_BRUSH_v01.wav')]:
 with wave.open(str(root/'sfx'/source)) as f:
  rate=f.getframerate();ch=f.getnchannels();data=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(float).reshape(-1,ch).mean(axis=1)/32768
 for i,speed in enumerate([.88,1,1.09],1):
  y=np.interp(np.arange(0,len(data),speed),np.arange(len(data)),data)
  y=np.convolve(y,np.ones(13 if kind=='STEP' else 7)/(13 if kind=='STEP' else 7),mode='same')
  noise=np.random.default_rng(218+i).normal(0,1,len(y));noise=np.convolve(noise,np.ones(5)/5,mode='same')
  env=np.sin(np.linspace(0,np.pi,len(y)))**1.5;y=y*.65+noise*env*(.009 if kind=='STEP' else .004)
  y*=np.minimum(1,np.arange(len(y))/max(1,rate*.01))*np.minimum(1,np.arange(len(y))[::-1]/max(1,rate*.04));peak=max(.0001,np.max(np.abs(y)));y*=min(1,.22/peak)
  filename=f'sfx/SFX_{kind}_SNOW_v0{i}.wav';dest=root/filename
  with wave.open(str(dest),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((y*32767).astype('<i2').tobytes())
  manifest.append({'file':filename,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'status':'derived_original_local_mix_0.6.6'})
  qa.append({'file':filename,'duration':len(y)/rate,'peak_db':float(20*np.log10(max(.00001,np.max(np.abs(y))))),'source':source})
(root/'manifest.json').write_text(json.dumps(manifest,indent=2));out=Path(__file__).resolve().parents[1]/'docs/qa-0.6.6/audio.json';out.write_text(json.dumps(qa,indent=2))
