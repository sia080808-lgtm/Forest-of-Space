# 0.8.1 계절 배경음: background music for spring, autumn and winter, day and night (summer keeps the existing
# BGM_DAY_FULL / BGM_NIGHT_FULL). Calm, sparse, ink-wash healing mood: pentatonic phrases on soft plucked strings, breathy
# wooden flute and bell tones over a quiet pad, lots of rests. Each track is a 60 s seamless loop (the reverb tail wraps
# around), 48 kHz stereo, written as Ogg Vorbis like the existing drafts.
#  spring: bright major pentatonic, light plucks and a few high bird-like grace notes
#  autumn: minor pentatonic, a slow breathy flute melody with soft plucks underneath
#  winter: very sparse high bells with long reverb, the most silence
#  night versions: an octave lower, half the notes, softer and slower
# Usage: python3 tools/synth-season-bgm.py   (needs ffmpeg)
import numpy as np, subprocess, os, json, hashlib, tempfile, wave
ROOT = os.path.join(os.path.dirname(__file__), '..', 'app/src/main/assets/web/assets/audio')
SR, DUR = 48000, 60.0
N = int(SR * DUR)
t_all = np.arange(N) / SR

def midi(m): return 440 * 2 ** ((m - 69) / 12)

def env(n, a, d):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    tail = np.exp(-np.arange(n) / SR / d); return e * tail

def pluck(f, dur, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    y = sum((0.5 ** k) * bright ** k * np.sin(2 * np.pi * f * (k + 1) * t + k) for k in range(5))
    return y * env(n, .004, dur / 4)

def flute(f, dur, rng):
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 1 + .004 * np.sin(2 * np.pi * 4.6 * t) * np.clip(t / .6, 0, 1)
    ph = 2 * np.cumsum(np.pi * f * vib / SR)
    y = np.sin(ph) + .18 * np.sin(2 * ph) + .06 * np.sin(3 * ph)
    breath = np.convolve(rng.normal(0, 1, n), np.ones(40) / 40, 'same') * .08
    e = np.minimum(1, t / .35) * np.minimum(1, (dur - t) / .6).clip(0, 1)
    return (y + breath) * e

def bell(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (dur / (1 + i))) for i, (r, a) in enumerate([(1, 1), (2.76, .35), (5.4, .15), (8.9, .06)]))
    return y * np.minimum(1, t / .003)

def pad(chord, amp):
    y = np.zeros(N)
    for m in chord:
        f = midi(m)
        for det in (-.12, .12):
            y += np.sin(2 * np.pi * f * (1 + det / 1200) * t_all + det)
    slow = .6 + .4 * np.sin(2 * np.pi * t_all / DUR * 2)       # breathes twice per loop (seamless)
    return y * amp * slow / len(chord)

def place(buf, sig, at, pan):
    i = int(at * SR) % N; n = len(sig)
    idx = (np.arange(n) + i) % N                            # wrap around: seamless loop
    np.add.at(buf[0], idx, sig * (1 - pan) ** .5); np.add.at(buf[1], idx, sig * (1 + pan) ** .5 * .98)

def reverb(buf, secs, mix, seed):
    rng = np.random.default_rng(seed); n = int(secs * SR)
    out = []
    for ch in range(2):
        ir = rng.normal(0, 1, n) * np.exp(-np.arange(n) / SR / (secs / 4)); ir[0] = 0
        ir = np.convolve(ir, np.ones(8) / 8, 'same')                        # soften
        irf = np.zeros(N); irf[:n] = ir
        wet = np.real(np.fft.ifft(np.fft.fft(buf[ch]) * np.fft.fft(irf)))  # circular: tail wraps (seamless)
        wet /= max(1e-9, np.abs(wet).max()); out.append(buf[ch] * (1 - mix) + wet * mix * np.abs(buf[ch]).max())
    return np.array(out)

MAJ = [0, 2, 4, 7, 9]; MIN = [0, 3, 5, 7, 10]
def scale(root, steps, octs): return [root + 12 * o + s for o in range(octs) for s in steps]

def track(season, night, seed):
    rng = np.random.default_rng(seed); buf = np.zeros((2, N))
    if season == 'spring':
        root = 62 if not night else 50; notes = scale(root, MAJ, 2); chords = [[root - 12, root - 5, root + 4], [root - 10, root - 3, root + 2]]
        beat = 60 / 66 * (1.5 if night else 1)
    elif season == 'autumn':
        root = 57 if not night else 45; notes = scale(root, MIN, 2); chords = [[root - 12, root - 5, root + 3], [root - 14, root - 7, root]]
        beat = 60 / 58 * (1.5 if night else 1)
    else:
        root = 76 if not night else 64; notes = scale(root, MAJ, 2); chords = [[root - 24, root - 17, root - 8]]
        beat = 60 / 48 * (1.5 if night else 1)
    # pad: one chord per half loop (two chords alternate), very quiet
    for k, ch in enumerate(chords * (2 // len(chords) if len(chords) < 2 else 1)):
        p = pad(ch, .05 if season != 'winter' else .04); half = N // 2
        mask = np.zeros(N); s0 = k * half; mask[s0:s0 + half] = 1
        mask = np.convolve(np.r_[mask[-SR:], mask, mask[:SR]], np.ones(SR) / SR, 'same')[SR:-SR]
        buf += p * mask
    # phrases: a few notes, then rest; density by season / night
    density = {'spring': .55, 'autumn': .45, 'winter': .22}[season] * (.5 if night else 1)
    t = 0.5; last = len(notes) // 2
    while t < DUR - 0.5:
        if rng.random() < density:
            last = int(np.clip(last + rng.choice([-2, -1, 1, 2, 0]), 0, len(notes) - 1)); m = notes[last]; f = midi(m)
            pan = rng.uniform(-.5, .5)
            if season == 'spring':
                place(buf, pluck(f, 2.2) * .22, t, pan)
                if not night and rng.random() < .12: place(buf, pluck(midi(m + 24), .4, .6) * .06, t + beat * .25, -pan)   # bird-like grace
            elif season == 'autumn':
                if rng.random() < .55: place(buf, flute(f, beat * rng.choice([2, 3]), rng) * .16, t, pan * .5)
                else: place(buf, pluck(midi(m - 12), 2.6, .8) * .2, t, pan)
            else:
                place(buf, bell(f, 5.0) * .14, t, pan)
        t += beat * rng.choice([1, 1, 2] if season != 'winter' else [2, 3, 4])
    secs, mix = {'spring': (2.2, .28), 'autumn': (2.8, .32), 'winter': (4.5, .45)}[season]
    buf = reverb(buf, secs, mix, seed + 1)
    buf = buf / max(1e-9, np.abs(buf).max()) * (.42 if night else .5)
    # match the existing music's average level (day about -25 dB, night about -28 dB RMS)
    rms = np.sqrt((buf ** 2).mean()); target = 10 ** ((-28 if night else -25) / 20)
    return buf * min(target / max(rms, 1e-9), .95 / np.abs(buf).max())

with open(os.path.join(ROOT, 'manifest.json')) as fh:
    manifest = json.loads(fh.read())
manifest = [r for r in manifest if not r['file'].startswith('bgm/BGM_SPRING') and not r['file'].startswith('bgm/BGM_AUTUMN') and not r['file'].startswith('bgm/BGM_WINTER')]
for i, season in enumerate(['spring', 'autumn', 'winter']):
    for night in (False, True):
        y = track(season, night, 801 + i * 10 + night)
        name = f"bgm/BGM_{season.upper()}_{'NIGHT' if night else 'DAY'}_FULL.ogg"; dest = os.path.join(ROOT, name)
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp: path = tmp.name
        with wave.open(path, 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y.T * 32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-c:a', 'libvorbis', '-q:a', '3', dest], check=True); os.remove(path)
        with open(dest, 'rb') as fh:
            digest = hashlib.sha256(fh.read()).hexdigest()
        manifest.append({'file': name, 'sha256': digest, 'status': 'synthesized_draft_v0.8.1'})
        print(name, os.path.getsize(dest) // 1024, 'KB')
with open(os.path.join(ROOT, 'manifest.json'), 'w') as fh:
    fh.write(json.dumps(manifest, indent=2))
