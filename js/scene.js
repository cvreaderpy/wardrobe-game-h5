/* 衣间小日子 — 2.5D 店铺舞台、全身顾客、过肩店主 */
(function () {
  var D = window.GAME_DATA;
  var Scene = {};
  var soundOn = true;
  var audioCtx = null;
  var SOUND_KEY = 'yijian_xiaorizi_sound';
  var audio = {
    unlocked: false,
    musicPlaying: false,
    musicTimer: null,
    nextBeat: 0,
    beat: 0,
    mood: 'day',
    bus: null,
    filter: null,
    noiseBuf: null,
    vinyl: null,
    ambienceNodes: [],
    ambienceKey: '',
    sceneWeather: 'sunny',
    sceneSeason: 'spring',
    birdTimer: null,
    hidden: false
  };

  try {
    soundOn = localStorage.getItem(SOUND_KEY) !== '0';
  } catch (e) {
    soundOn = true;
  }

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hex(color) {
    return D.COLOR_HEX[color] || '#D8C9B8';
  }

  function itemById(id) {
    return D.ITEMS_BY_ID[id] || null;
  }

  function pickOutfit(outfit, cat) {
    var found = null;
    (outfit || []).forEach(function (id) {
      var it = itemById(id);
      if (it && it.cat === cat && !found) { found = it; }
    });
    return found;
  }

  function pickOutfits(outfit, cat) {
    var out = [];
    (outfit || []).forEach(function (id) {
      var it = itemById(id);
      if (it && it.cat === cat) { out.push(it); }
    });
    return out;
  }

  function inventoryColors(s) {
    var out = [];
    if (s && s.inventory) {
      var map = s.inventory.shelf || s.inventory;
      Object.keys(map).forEach(function (id) {
        if (map[id] && map[id].qty > 0 && D.ITEMS_BY_ID[id]) {
          out.push(D.ITEMS_BY_ID[id]);
        }
      });
    }
    if (!out.length) {
      out = D.STARTING_INVENTORY.slice(0, 4).map(itemById).filter(Boolean);
    }
    return out;
  }

  /* ---------------- 轻音效 ---------------- */

  function getCtx() {
    if (!soundOn) { return null; }
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) { return null; }
      if (!audioCtx) { audioCtx = new Ctor(); }
      if (audioCtx.state === 'suspended' && audioCtx.resume) { audioCtx.resume(); }
      return audioCtx;
    } catch (e) {
      return null;
    }
  }

  function toneAt(freq, duration, type, volume, start, dest, attack) {
    var ctx = getCtx();
    if (!ctx) { return; }
    try {
      var at = Math.max(ctx.currentTime, start || 0);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(volume || 0.04, at + (attack || 0.012));
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      osc.connect(gain);
      gain.connect(dest || ctx.destination);
      osc.start(at);
      osc.stop(at + duration + 0.02);
    } catch (e) {}
  }

  function tone(freq, duration, type, volume, delay) {
    var ctx = getCtx();
    if (!ctx) { return; }
    toneAt(freq, duration, type, volume, ctx.currentTime + (delay || 0));
  }

  function noiseBuffer(ctx) {
    if (audio.noiseBuf && audio.noiseBuf.sampleRate === ctx.sampleRate) { return audio.noiseBuf; }
    var len = Math.floor(ctx.sampleRate * 2);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) { data[i] = Math.random() * 2 - 1; }
    audio.noiseBuf = buf;
    return buf;
  }

  function noiseAt(duration, volume, start, type, freq, dest) {
    var ctx = getCtx();
    if (!ctx) { return; }
    try {
      var at = Math.max(ctx.currentTime, start || 0);
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      var f = ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 1200;
      f.Q.value = 0.7;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(volume || 0.012, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      src.connect(f);
      f.connect(gain);
      gain.connect(dest || ctx.destination);
      src.start(at);
      src.stop(at + duration + 0.03);
    } catch (e) {}
  }

  Scene.play = function (name) {
    if (!soundOn) { return; }
    if (name === 'bell') {
      tone(880, 0.18, 'sine', 0.035, 0);
      tone(1320, 0.22, 'sine', 0.025, 0.06);
    } else if (name === 'pop') {
      tone(620, 0.08, 'triangle', 0.025, 0);
    } else if (name === 'water') {
      tone(520, 0.12, 'sine', 0.02, 0);
      tone(700, 0.16, 'sine', 0.018, 0.08);
    } else if (name === 'coin') {
      tone(980, 0.1, 'triangle', 0.035, 0);
      tone(1480, 0.22, 'triangle', 0.025, 0.08);
    } else if (name === 'stamp') {
      tone(150, 0.12, 'square', 0.03, 0);
      tone(90, 0.16, 'sine', 0.025, 0.03);
    } else if (name === 'heart') {
      tone(740, 0.1, 'sine', 0.02, 0);
      tone(1040, 0.14, 'sine', 0.018, 0.06);
    } else if (name === 'page') {
      tone(420, 0.06, 'sine', 0.018, 0);
    } else if (name === 'cloth') {
      tone(340, 0.09, 'triangle', 0.02, 0);
      tone(480, 0.08, 'triangle', 0.015, 0.03);
    } else if (name === 'meow') {
      tone(540, 0.14, 'sine', 0.018, 0);
      tone(760, 0.2, 'sine', 0.015, 0.09);
    } else if (name === 'purr') {
      tone(96, 0.32, 'triangle', 0.018, 0);
      tone(120, 0.26, 'triangle', 0.014, 0.12);
      tone(88, 0.3, 'sine', 0.012, 0.24);
    } else if (name === 'sip') {
      tone(640, 0.1, 'sine', 0.012, 0);
      tone(880, 0.14, 'sine', 0.009, 0.07);
      noiseAt(0.05, 0.003, 0.02, 'highpass', 2600);
    } else if (name === 'crunch') {
      noiseAt(0.07, 0.010, 0, 'bandpass', 2200);
      noiseAt(0.06, 0.008, 0.09, 'bandpass', 2800);
      tone(320, 0.05, 'triangle', 0.006, 0.01);
    } else if (name === 'woof') {
      tone(240, 0.1, 'square', 0.020, 0);
      tone(180, 0.14, 'sine', 0.018, 0.06);
      noiseAt(0.05, 0.006, 0, 'bandpass', 900);
    } else if (name === 'hanger') {
      tone(1220, 0.055, 'triangle', 0.016, 0);
      tone(1760, 0.045, 'sine', 0.011, 0.025);
      noiseAt(0.045, 0.005, 0, 'highpass', 3200);
    } else if (name === 'curtain') {
      noiseAt(0.28, 0.010, 0, 'bandpass', 760);
      tone(220, 0.2, 'sine', 0.008, 0);
      tone(330, 0.16, 'sine', 0.005, 0.06);
    } else if (name === 'receipt') {
      noiseAt(0.08, 0.008, 0, 'highpass', 2400);
      noiseAt(0.07, 0.006, 0.11, 'highpass', 2800);
      tone(940, 0.04, 'triangle', 0.008, 0.02);
    } else if (name === 'footstep') {
      tone(118, 0.075, 'sine', 0.014, 0);
      tone(96, 0.09, 'sine', 0.010, 0.085);
    } else if (name === 'chime') {
      tone(1046, 0.16, 'sine', 0.018, 0);
      tone(1568, 0.22, 'sine', 0.012, 0.07);
    } else if (name === 'paper') {
      noiseAt(0.1, 0.006, 0, 'bandpass', 1800);
    }
  };


  /* ---------------- 程序化 BGM / 环境声 ---------------- */

  var MUSIC_BPM = 72;
  var MUSIC_BEAT = 60 / MUSIC_BPM;
  var MUSIC_PROG = [
    { bass: 38, pad: [50, 54, 57, 61] }, // Dmaj7
    { bass: 35, pad: [47, 50, 54, 57] }, // Bm7
    { bass: 31, pad: [43, 47, 50, 54] }, // Gmaj7
    { bass: 33, pad: [45, 49, 52, 55] }  // A7
  ];
  var MUSIC_PENT = [62, 64, 66, 69, 71, 74, 76, 78];
  var MUSIC_MEL = [
    [0, 2, 4, 2], [1, 3, 1, 0], [2, 4, 3, 2], [0, 1, 2, 3],
    [4, 2, 1, 2], [3, 1, 0, 1], [2, 3, 4, 2], [1, 0, 2, 1]
  ];

  function midiToFreq(n) {
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  function ensureMusicBus() {
    var ctx = getCtx();
    if (!ctx) { return null; }
    if (!audio.bus) {
      audio.bus = ctx.createGain();
      audio.bus.gain.value = 0.0001;
      audio.filter = ctx.createBiquadFilter();
      audio.filter.type = 'lowpass';
      audio.filter.frequency.value = 2600;
      audio.bus.connect(audio.filter);
      audio.filter.connect(ctx.destination);
    }
    return { ctx: ctx, bus: audio.bus };
  }

  function startVinyl(ctx, bus) {
    if (audio.vinyl) { return; }
    try {
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      src.loop = true;
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1700;
      var g = ctx.createGain();
      g.gain.value = 0.0022;
      src.connect(f);
      f.connect(g);
      g.connect(bus);
      src.start();
      audio.vinyl = { src: src, gain: g };
    } catch (e) {}
  }

  function stopVinyl() {
    if (!audio.vinyl) { return; }
    try { audio.vinyl.src.stop(); } catch (e) {}
    try { audio.vinyl.src.disconnect(); } catch (e) {}
    audio.vinyl = null;
  }

  function musicBeat(step, when) {
    var ctx = getCtx();
    if (!ctx || !audio.bus) { return; }
    var bar = Math.floor(step / 4) % 8;
    var beat = step % 4;
    var chord = MUSIC_PROG[bar % MUSIC_PROG.length];

    if (beat === 0) {
      for (var i = 0; i < chord.pad.length; i++) {
        toneAt(midiToFreq(chord.pad[i]), MUSIC_BEAT * 3.65, 'sine', 0.010, when, audio.bus, 0.5);
      }
      toneAt(midiToFreq(chord.bass), MUSIC_BEAT * 3.4, 'sine', 0.016, when, audio.bus, 0.06);
    }

    var idx = MUSIC_MEL[bar][beat];
    if (idx >= 0) {
      var freq = midiToFreq(MUSIC_PENT[idx]);
      toneAt(freq, MUSIC_BEAT * 0.48, 'triangle', audio.mood === 'chat' ? 0.009 : 0.013, when, audio.bus, 0.012);
      if (beat === 2 && bar % 2 === 0) {
        toneAt(freq * 2, MUSIC_BEAT * 0.34, 'sine', 0.0045, when + 0.04, audio.bus, 0.01);
      }
    }
    if (beat % 2 === 1 && audio.mood !== 'evening') {
      noiseAt(0.045, 0.0035, when, 'highpass', 5200, audio.bus);
    }
  }

  function scheduleMusic() {
    if (!audio.musicPlaying) { return; }
    var ctx = getCtx();
    if (!ctx) { audio.musicPlaying = false; return; }
    if (audio.nextBeat < ctx.currentTime - 0.15) {
      audio.nextBeat = ctx.currentTime + 0.12;
      audio.beat = 0;
    }
    while (audio.nextBeat < ctx.currentTime + 0.9) {
      musicBeat(audio.beat, audio.nextBeat);
      audio.beat = (audio.beat + 1) % 32;
      audio.nextBeat += MUSIC_BEAT;
    }
    audio.musicTimer = setTimeout(scheduleMusic, 240);
  }

  Scene.startMusic = function () {
    if (!soundOn || audio.hidden) { return false; }
    var m = ensureMusicBus();
    if (!m) { return false; }
    m.bus.gain.cancelScheduledValues(m.ctx.currentTime);
    m.bus.gain.setTargetAtTime(audio.mood === 'chat' ? 0.55 : 0.9, m.ctx.currentTime, 0.6);
    if (audio.musicPlaying) { return true; }
    audio.musicPlaying = true;
    audio.beat = 0;
    audio.nextBeat = m.ctx.currentTime + 0.12;
    startVinyl(m.ctx, m.bus);
    scheduleMusic();
    return true;
  };

  Scene.stopMusic = function () {
    audio.musicPlaying = false;
    if (audio.musicTimer) { clearTimeout(audio.musicTimer); audio.musicTimer = null; }
    var ctx = getCtx();
    if (ctx && audio.bus) {
      audio.bus.gain.cancelScheduledValues(ctx.currentTime);
      audio.bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.18);
    }
    stopVinyl();
  };

  Scene.isMusicPlaying = function () { return audio.musicPlaying; };

  Scene.audioState = function () {
    return {
      unlocked: audio.unlocked,
      music: audio.musicPlaying,
      mood: audio.mood,
      ambience: audio.ambienceKey,
      weather: audio.sceneWeather,
      season: audio.sceneSeason,
      hidden: audio.hidden
    };
  };

  Scene.setMusicMood = function (mood) {
    audio.mood = mood || 'day';
    var ctx = getCtx();
    if (!ctx || !audio.bus) { return; }
    var cutoff = audio.mood === 'evening' ? 1450 : audio.mood === 'chat' ? 1900 : 2600;
    audio.filter.frequency.setTargetAtTime(cutoff, ctx.currentTime, 0.6);
    if (audio.musicPlaying) {
      audio.bus.gain.setTargetAtTime(audio.mood === 'chat' ? 0.55 : 0.9, ctx.currentTime, 0.5);
    }
  };

  function stopAmbience() {
    if (audio.birdTimer) { clearTimeout(audio.birdTimer); audio.birdTimer = null; }
    var ctx = getCtx();
    for (var i = 0; i < audio.ambienceNodes.length; i++) {
      var n = audio.ambienceNodes[i];
      try {
        if (ctx) { n.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15); }
        n.src.stop((ctx ? ctx.currentTime : 0) + 0.45);
      } catch (e) {}
    }
    audio.ambienceNodes = [];
    audio.ambienceKey = '';
  }

  function ambienceLoop(type, freq, volume) {
    var ctx = getCtx();
    if (!ctx) { return; }
    try {
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      src.loop = true;
      var f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = 0.55;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.setTargetAtTime(volume, ctx.currentTime, 0.7);
      src.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      src.start();
      audio.ambienceNodes.push({ src: src, gain: g });
    } catch (e) {}
  }

  function birdChirp() {
    var ctx = getCtx();
    if (!ctx) { return; }
    var base = 1900 + Math.random() * 900;
    for (var i = 0; i < 3; i++) {
      toneAt(base * (1 + i * 0.05), 0.075, 'sine', 0.0055, ctx.currentTime + i * 0.11, null, 0.008);
    }
  }

  function scheduleBirds() {
    if (audio.birdTimer) { clearTimeout(audio.birdTimer); audio.birdTimer = null; }
    if (!soundOn || !audio.unlocked || audio.hidden) { return; }
    audio.birdTimer = setTimeout(function () {
      audio.birdTimer = null;
      if (!soundOn || !audio.unlocked || audio.hidden) { return; }
      birdChirp();
      scheduleBirds();
    }, 4200 + Math.random() * 5200);
  }

  Scene.setAmbience = function (weather, season) {
    weather = weather || 'sunny';
    season = season || 'spring';
    audio.sceneWeather = weather;
    audio.sceneSeason = season;
    var key = weather + '|' + season;
    if (key === audio.ambienceKey) { return; }
    stopAmbience();
    if (!soundOn || !audio.unlocked || audio.hidden) { return; }
    var rainy = weather === 'rain' || weather === 'thunder' || weather === 'downpour';
    var snowy = weather === 'snow' || weather === 'cold' || weather === 'coldwave';
    if (rainy) {
      ambienceLoop('lowpass', 1300, 0.011);
      ambienceLoop('highpass', 500, 0.0035);
    } else if (snowy) {
      ambienceLoop('lowpass', 480, 0.006);
    } else if (season === 'autumn') {
      ambienceLoop('bandpass', 700, 0.004);
    }
    if (!rainy && !snowy && (season === 'spring' || season === 'summer')) {
      scheduleBirds();
    }
    audio.ambienceKey = key;
  };

  Scene.unlockAudio = function () {
    audio.unlocked = true;
    var ctx = getCtx();
    if (!ctx) { return false; }
    if (soundOn && !audio.hidden) {
      Scene.startMusic();
      Scene.setAmbience(audio.sceneWeather, audio.sceneSeason);
    }
    return true;
  };

  Scene.pauseAudio = function () {
    audio.hidden = true;
    Scene.stopMusic();
    stopAmbience();
    if (audioCtx && audioCtx.state === 'running' && audioCtx.suspend) {
      try { audioCtx.suspend(); } catch (e) {}
    }
  };

  Scene.resumeAudio = function () {
    audio.hidden = false;
    var ctx = getCtx();
    if (ctx && ctx.state === 'suspended' && ctx.resume) {
      try { ctx.resume(); } catch (e) {}
    }
    if (soundOn && audio.unlocked) {
      Scene.startMusic();
      Scene.setAmbience(audio.sceneWeather, audio.sceneSeason);
    }
  };

  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { Scene.pauseAudio(); } else { Scene.resumeAudio(); }
    });
  }

  Scene.isSoundOn = function () { return soundOn; };

  Scene.toggleSound = function () {
    if (soundOn) {
      Scene.stopMusic();
      stopAmbience();
    }
    soundOn = !soundOn;
    try { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); } catch (e) {}
    if (soundOn) {
      audio.unlocked = true;
      getCtx();
      Scene.startMusic();
      Scene.setAmbience(audio.sceneWeather, audio.sceneSeason);
      Scene.play('pop');
    }
    return soundOn;
  };

  /* ---------------- 店铺背景 ---------------- */

  function weatherArt(cfg, x, y) {
    var id = cfg && cfg.weather ? cfg.weather : 'sunny';
    if (id === 'rain') {
      return '<g transform="translate(' + x + ',' + y + ')" class="shop2-rain">' +
        '<path d="M16 20 Q16 8 28 8 Q32 -2 46 3 Q60 2 60 15 Q72 16 72 26 L16 26 Q6 26 8 21 Q10 20 16 20 Z" fill="#FFFDF8" opacity=".9"/>' +
        '<path d="M20 32 L17 44 M34 32 L31 46 M48 32 L45 44 M62 32 L59 44" stroke="#6B7F95" stroke-width="2.2" stroke-linecap="round"/>' +
        '</g>';
    }
    if (id === 'cloudy' || id === 'cold') {
      return '<g transform="translate(' + x + ',' + y + ')">' +
        '<path d="M16 24 Q16 12 28 12 Q32 2 46 7 Q60 6 60 19 Q72 20 72 30 L16 30 Q6 30 8 25 Q10 24 16 24 Z" fill="#FFFDF8" opacity=".9"/>' +
        (id === 'cold' ? '<path d="M42 38 L42 54 M34 46 L50 46 M37 41 L47 51 M47 41 L37 51" stroke="#8FB6C8" stroke-width="2" stroke-linecap="round"/>' : '') +
        '</g>';
    }
    return '<g transform="translate(' + x + ',' + y + ')">' +
      '<circle cx="42" cy="20" r="10" fill="#E3B23C"/>' +
      '<path d="M42 2 L42 7 M26 20 L31 20 M53 20 L58 20 M31 9 L35 13 M53 27 L49 23" stroke="#E3B23C" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M8 30 Q18 25 28 30" stroke="#FFFDF8" stroke-width="2.5" fill="none" opacity=".7"/>' +
      '</g>';
  }

  function miniItemSvg(item, x, y, size) {
    if (!item) { return ''; }
    x = x == null ? 143 : x;
    y = y == null ? 107 : y;
    size = size || 42;
    if (window.UI && typeof UI.itemSvg === 'function') {
      var art = UI.itemSvg(item);
      if (art.indexOf('<svg ') >= 0) {
        return art.replace('<svg ', '<svg x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" ');
      }
      var src = art.match(/src="([^"]+)"/);
      if (src) {
        return '<image href="' + src[1] + '" x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" preserveAspectRatio="xMidYMid meet"/>';
      }
    }
    return '<rect x="' + (x + 5) + '" y="' + (y + 5) + '" width="' + (size - 10) + '" height="' + (size - 8) + '" rx="4" fill="' + hex(item.color) + '" stroke="#5B4636" stroke-width="1.5"/>';
  }

  function backSvg(s, key) {
    var cfg = s ? Engine.getDayConfig(s.day) : D.DAYS[0];
    var weather = D.WEATHER[cfg.weather] || D.WEATHER.sunny;
    var windowList = [];
    if (s && Array.isArray(s.windowItems)) {
      windowList = s.windowItems.map(itemById).filter(Boolean).slice(0, 3);
    } else if (s && s.windowItem) {
      windowList = [itemById(s.windowItem)].filter(Boolean);
    }
    var windowArt = '';
    if (windowList.length === 1) {
      windowArt = miniItemSvg(windowList[0], 143, 107, 42);
    } else if (windowList.length === 2) {
      windowArt = miniItemSvg(windowList[0], 126, 110, 36) + miniItemSvg(windowList[1], 164, 110, 36);
    } else if (windowList.length >= 3) {
      windowArt = miniItemSvg(windowList[0], 118, 112, 32) + miniItemSvg(windowList[1], 148, 112, 32) + miniItemSvg(windowList[2], 178, 112, 32);
    }
    var windowLabel = windowList.length ? '今日橱窗' + (windowList.length > 1 ? ' ×' + windowList.length : '') : '橱窗待布置';
    var marketing = s ? (s.pendingMarketing || s.marketing || 'none') : 'none';
    var evening = key === 'settle';

    var poster = '';
    if (marketing === 'note') {
      poster = '<g transform="translate(250,54) rotate(-2)">' +
        '<rect width="42" height="34" rx="3" fill="#FFF9EF" stroke="#5B4636" stroke-width="1.8"/>' +
        '<rect x="6" y="6" width="30" height="6" rx="2" fill="#C97B63"/>' +
        '<rect x="6" y="16" width="24" height="2.5" rx="1" fill="#D8C9B8"/>' +
        '<rect x="6" y="22" width="28" height="2.5" rx="1" fill="#D8C9B8"/>' +
        '<circle cx="30" cy="28" r="2.4" fill="#E3B23C"/>' +
        '</g>';
    } else if (marketing === 'live') {
      poster = '<g transform="translate(250,54)">' +
        '<rect width="42" height="34" rx="3" fill="#FFF9EF" stroke="#5B4636" stroke-width="1.8"/>' +
        '<circle cx="21" cy="14" r="7" fill="#D99A9A" stroke="#5B4636" stroke-width="1.2"/>' +
        '<rect x="10" y="24" width="22" height="3" rx="1.5" fill="#E3B23C"/>' +
        '<circle cx="6" cy="6" r="2.2" fill="#C97B63"><animate attributeName="opacity" values="1;.3;1" dur="1.6s" repeatCount="indefinite"/></circle>' +
        '</g>';
    } else if (marketing === 'flyer') {
      poster = '<g transform="translate(252,56) rotate(2)">' +
        '<rect width="38" height="30" rx="2" fill="#FFF9EF" stroke="#5B4636" stroke-width="1.8"/>' +
        '<rect x="6" y="6" width="26" height="4" rx="2" fill="#8A9A7B"/>' +
        '<rect x="6" y="14" width="20" height="2.5" rx="1" fill="#D8C9B8"/>' +
        '<rect x="6" y="20" width="24" height="2.5" rx="1" fill="#D8C9B8"/>' +
        '</g>';
    }

    return '<svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="s2wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7EDDF"/><stop offset="1" stop-color="#EAD9C3"/></linearGradient>' +
      '<linearGradient id="s2sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (evening ? '#E9B98F' : '#CFE3E8') + '"/><stop offset="1" stop-color="' + (evening ? '#F2D3B8' : '#EAF2F0') + '"/></linearGradient>' +
      '<linearGradient id="s2floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7B48F"/><stop offset="1" stop-color="#B98B65"/></linearGradient>' +
      '<radialGradient id="s2lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE1A3" stop-opacity=".7"/><stop offset="1" stop-color="#FFE1A3" stop-opacity="0"/></radialGradient>' +
      '<pattern id="s2dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#D8C3A8" opacity=".45"/></pattern>' +
      '</defs>' +
      '<rect width="480" height="300" fill="url(#s2wall)"/>' +
      '<rect width="480" height="300" fill="url(#s2dots)"/>' +
      '<rect y="222" width="480" height="78" fill="url(#s2floor)"/>' +
      '<path d="M0 232 L480 232 M0 250 L480 250 M0 272 L480 272" stroke="#A87D59" stroke-width="1.2" opacity=".28"/>' +
      '<path d="M0 222 L480 222" stroke="#8C674B" stroke-width="2.5" opacity=".35"/>' +
      '<path d="M70 0 L70 222 M182 0 L182 222 M294 0 L294 222 M406 0 L406 222" stroke="#E6D5BF" stroke-width="1.6" opacity=".55"/>' +

      // 门
      '<g>' +
      '<rect x="10" y="86" width="64" height="150" rx="4" fill="#C9A57E" stroke="#5B4636" stroke-width="2.6"/>' +
      '<rect x="17" y="94" width="50" height="96" rx="3" fill="#DCEBEF" stroke="#5B4636" stroke-width="2"/>' +
      '<path d="M42 94 L42 190" stroke="#5B4636" stroke-width="1.2" opacity=".4"/>' +
      '<circle cx="58" cy="152" r="2.6" fill="#E3B23C" stroke="#5B4636" stroke-width="1"/>' +
      '<path d="M42 86 L42 80" stroke="#5B4636" stroke-width="1.8"/>' +
      '<path d="M35 80 Q42 70 49 80" fill="none" stroke="#E3B23C" stroke-width="2.2"/>' +
      '<text x="42" y="206" text-anchor="middle" font-size="7" fill="#FFF9EF" font-family="sans-serif">OPEN</text>' +
      '</g>' +

      // 橱窗
      '<g>' +
      '<rect x="84" y="46" width="160" height="152" rx="5" fill="url(#s2sky)" stroke="#5B4636" stroke-width="2.6"/>' +
      weatherArt(cfg, 96, 56) +
      '<path d="M90 186 L90 148 L106 148 L106 162 L120 162 L120 138 L138 138 L138 186 M154 186 L154 152 L170 152 L170 176 L184 176 L184 162 L198 162 L198 186 M212 186 L212 144 L228 144 L228 170 L240 170 L240 186" fill="#B8CDD0" opacity=".55"/>' +
      '<path d="M84 186 L244 186 M164 46 L164 198" stroke="#5B4636" stroke-width="1.8" opacity=".6"/>' +
      '<rect x="79" y="198" width="170" height="7" rx="3" fill="#B98D69" stroke="#5B4636" stroke-width="1.8"/>' +
      '<rect x="118" y="170" width="34" height="7" rx="2" fill="#FFFFFF" stroke="#5B4636" stroke-width="1.2" transform="rotate(-2 135 173)"/>' +
      '<rect x="156" y="169" width="28" height="7" rx="2" fill="#EBDCC8" stroke="#5B4636" stroke-width="1.2" transform="rotate(2 170 172)"/>' +
      '<rect x="188" y="170" width="24" height="7" rx="2" fill="#8A9A7B" stroke="#5B4636" stroke-width="1.2"/>' +
      windowArt +
      '<text x="164" y="214" text-anchor="middle" font-size="7" fill="#6B4F3A" font-family="sans-serif">' + windowLabel + '</text>' +
      '</g>' +

      // 墙面隔板与画框
      poster +
      '<g>' +
      '<rect x="312" y="48" width="110" height="9" rx="2" fill="#6B4F3A" stroke="#5B4636" stroke-width="1.8"/>' +
      '<rect x="322" y="27" width="20" height="21" rx="2" fill="#8A9A7B" opacity=".85"/>' +
      '<rect x="350" y="32" width="14" height="16" rx="2" fill="#C97B63" opacity=".8"/>' +
      '<path d="M374 48 Q374 28 388 24 Q384 38 380 48" fill="#8A9A7B" stroke="#5B4636" stroke-width="1.2"/>' +
      '<rect x="390" y="32" width="12" height="16" rx="2" fill="#E3B23C" opacity=".8"/>' +
      '</g>' +
      '<g transform="translate(312,70) rotate(-1)">' +
      '<rect width="44" height="34" rx="2" fill="#FFF9EF" stroke="#5B4636" stroke-width="1.8"/>' +
      '<rect x="6" y="6" width="32" height="6" rx="2" fill="#C97B63" opacity=".8"/>' +
      '<rect x="6" y="16" width="22" height="2.5" rx="1" fill="#D8C9B8"/>' +
      '<rect x="6" y="22" width="27" height="2.5" rx="1" fill="#D8C9B8"/>' +
      '</g>' +

      // 吊灯
      '<path d="M362 0 L362 28" stroke="#5B4636" stroke-width="1.8"/>' +
      '<path d="M348 28 L376 28 L371 44 L353 44 Z" fill="#E3B23C" stroke="#5B4636" stroke-width="1.8"/>' +
      '<circle cx="362" cy="46" r="30" class="shop2-lamp-glow" fill="url(#s2lamp)"/>' +
      '<circle cx="362" cy="44" r="3" fill="#FFF3CE"/>' +

      // 地毯与窗光
      '<ellipse cx="244" cy="266" rx="172" ry="22" fill="#C97B63" opacity=".16"/>' +
      '<ellipse cx="244" cy="266" rx="146" ry="16" fill="none" stroke="#C97B63" stroke-width="1.8" opacity=".24"/>' +
      '<path d="M84 196 L232 300 L122 300 L30 210 Z" fill="#FFF3CE" opacity=".12"/>' +
      (evening ? '<rect width="480" height="300" fill="#C97B63" opacity=".12"/>' : '') +
      '</svg>';
  }

  function midSvg(s) {
    var inv = inventoryColors(s);
    var c1 = hex(inv[0] && inv[0].color);
    var c2 = hex(inv[1] && inv[1].color);
    var c3 = hex(inv[2] && inv[2].color);
    var pricing = s ? (s.pricing || 'standard') : 'standard';
    var pricingLabel = pricing === 'budget' ? '平价' : pricing === 'premium' ? '高端' : '正常';

    return '<svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="s2mirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6F1F2"/><stop offset=".55" stop-color="#CFE3E6"/><stop offset="1" stop-color="#F5FAF8"/></linearGradient>' +
      '<linearGradient id="s2wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9A57E"/><stop offset="1" stop-color="#A87D59"/></linearGradient>' +
      '</defs>' +

      // 家具全部由玩家布置，固定硬装只保留墙面和地面（见 furnitureLayer）
      '</svg>';
  }

  function furnitureLayer(s) {
    if (!s || !s.shop || !Array.isArray(s.shop.layout) || !s.shop.layout.length) { return ''; }
    // SVG 回退：把 8×8 的布局压成两排，保证旧舞台也能看到全部家具
    var out = '<svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    var list = s.shop.layout.slice(0, 12);
    list.forEach(function (e, i) {
      var def = D.FURNITURE_BY_ID[e.id];
      if (!def) { return; }
      var rot = e.rot ? 1 : 0;
      var cw = rot ? def.h : def.w;
      var ch = rot ? def.w : def.h;
      var col = i % 6;
      var row = Math.floor(i / 6);
      var x = 22 + col * 72;
      var y = 192 + row * 58;
      out += '<g transform="translate(' + x + ',' + y + ')">' +
        '<svg width="' + (cw * 30) + '" height="' + (ch * 30) + '" viewBox="0 0 ' + (cw * 40) + ' ' + (ch * 40) + '" preserveAspectRatio="xMidYMax meet">' +
        D.furnitureArt(def.art, cw, ch) +
        '</svg></g>';
    });
    return out + '</svg>';
  }

  function frontSvg() {
    return '<svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><linearGradient id="s2front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9A57E"/><stop offset="1" stop-color="#9C7253"/></linearGradient></defs>' +
      '<g>' +
      '<path d="M-10 252 L146 252 L166 300 L-10 300 Z" fill="url(#s2front)" stroke="#5B4636" stroke-width="2.2"/>' +
      '<path d="M-10 257 L148 257" stroke="#EBDCC8" stroke-width="1.6" opacity=".35"/>' +
      '<ellipse cx="62" cy="244" rx="17" ry="5" fill="#FFF9EF" stroke="#5B4636" stroke-width="1.2"/>' +
      '<path d="M49 244 Q49 229 62 229 Q75 229 75 244" fill="#F7EBDD" stroke="#5B4636" stroke-width="1.2"/>' +
      '<path d="M68 229 Q78 224 82 231" fill="none" stroke="#5B4636" stroke-width="1.2"/>' +
      '<path d="M96 255 L132 253" stroke="#8C674B" stroke-width="1.2" opacity=".45"/>' +
      '</g>' +
      '<g class="shop2-plant" transform="translate(0,190) scale(.62)">' +
      '<path d="M18 76 L58 76 L53 120 L23 120 Z" fill="#C97B63" stroke="#5B4636" stroke-width="2"/>' +
      '<path d="M38 76 Q38 40 20 32 Q38 34 44 58 Q50 26 68 20 Q56 42 50 76" fill="#8A9A7B" stroke="#5B4636" stroke-width="2"/>' +
      '</g>' +
      '</svg>';
  }

  function customerSvg(customer, outfit, expression) {
    var p = customer.portrait || {};
    var aiPortrait = window.AILook && AILook.portraitUrl && AILook.portraitUrl(customer.id);
    if (aiPortrait) {
      p = { skin: p.skin, hair: p.hair, hairStyle: p.hairStyle, top: p.top,
        expression: p.expression, accessory: p.accessory, image: aiPortrait };
    }
    var skin = p.skin || '#F2D3B8';
    var hair = p.hair || '#2E2A27';
    var topItem = pickOutfit(outfit, 'top');
    var bottomItem = pickOutfit(outfit, 'bottom');
    var dressItem = pickOutfit(outfit, 'dress');
    var outerItem = pickOutfit(outfit, 'outer');
    var shoesItem = pickOutfit(outfit, 'shoes');
    var bagItem = pickOutfit(outfit, 'bag');
    var accItems = pickOutfits(outfit, 'accessory');
    var hosieryItem = pickOutfit(outfit, 'hosiery');

    var topFill = topItem ? hex(topItem.color) : (p.top || '#E8E2D6');
    var bottomFill = bottomItem ? hex(bottomItem.color) : '#6B7F95';
    var dressFill = dressItem ? hex(dressItem.color) : topFill;
    var outerFill = outerItem ? hex(outerItem.color) : '';
    var shoeFill = shoesItem ? hex(shoesItem.color) : '#5B4636';
    var st = ' stroke="#5B4636" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
    var detail = ' stroke="#5B4636" stroke-width="1.5" fill="none" stroke-linecap="round"';
    var white = ' stroke="rgba(255,255,255,.55)" stroke-width="1.5" fill="none" stroke-linecap="round"';

    var hairBack = '';
    var hairFront = '';
    if (p.hairStyle === 'long') {
      hairBack = '<path d="M40 48 Q40 18 60 18 Q80 18 80 48 L82 96 Q74 100 70 86 L70 50 Q60 36 50 50 L50 86 Q46 100 38 96 Z" fill="' + hair + '"' + st + '/>';
      hairFront = '<path d="M43 48 Q43 24 60 24 Q77 24 77 48 L76 55 Q70 51 70 44 Q60 34 50 44 Q50 51 44 55 Z" fill="' + hair + '"' + st + '/>';
    } else if (p.hairStyle === 'bob') {
      hairBack = '<path d="M41 50 Q41 20 60 20 Q79 20 79 50 L79 68 Q72 64 71 50 Q60 38 49 50 Q48 64 41 68 Z" fill="' + hair + '"' + st + '/>';
      hairFront = '<path d="M43 48 Q43 24 60 24 Q77 24 77 48 L76 54 Q70 50 70 44 Q60 34 50 44 Q50 50 44 54 Z" fill="' + hair + '"' + st + '/>';
    } else if (p.hairStyle === 'bun') {
      hairBack = '<circle cx="60" cy="20" r="9" fill="' + hair + '"' + st + '/>';
      hairFront = '<path d="M43 49 Q43 24 60 24 Q77 24 77 49 L76 54 Q70 50 70 44 Q60 34 50 44 Q50 50 44 54 Z" fill="' + hair + '"' + st + '/>';
    } else {
      hairFront = '<path d="M43 48 Q43 23 60 23 Q77 23 77 48 L77 52 Q70 50 69 43 Q60 34 51 43 Q50 50 43 52 Z" fill="' + hair + '"' + st + '/>';
    }

    var eyes = '';
    var brows = '';
    var mouth = '';
    if (expression === 'happy') {
      eyes = '<path d="M51 47 Q54 43 57 47" fill="none" stroke="#3F332B" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M63 47 Q66 43 69 47" fill="none" stroke="#3F332B" stroke-width="2" stroke-linecap="round"/>';
      mouth = '<path d="M55 55 Q60 61 65 55" class="mouth" fill="#7A4A3A" stroke="#5B4636" stroke-width="1.2" stroke-linejoin="round"/>';
    } else if (expression === 'hesitant') {
      eyes = '<ellipse cx="54" cy="47" rx="1.8" ry="2.6" fill="#3F332B"/><ellipse cx="66" cy="47" rx="1.8" ry="2.6" fill="#3F332B"/>';
      brows = '<path d="M50 41 L57 43 M63 43 L70 41" stroke="#3F332B" stroke-width="1.4" stroke-linecap="round" fill="none"/>';
      mouth = '<path d="M56 56 L64 56" class="mouth" stroke="#7A4A3A" stroke-width="1.6" stroke-linecap="round" fill="none"/>';
    } else if (expression === 'surprised') {
      eyes = '<ellipse cx="54" cy="47" rx="3" ry="4" fill="#FFFDF8" stroke="#3F332B" stroke-width="1.2"/>' +
        '<ellipse cx="66" cy="47" rx="3" ry="4" fill="#FFFDF8" stroke="#3F332B" stroke-width="1.2"/>';
      mouth = '<ellipse cx="60" cy="57" rx="4" ry="5" class="mouth" fill="#8A4F43" stroke="#5B4636" stroke-width="1.2"/>';
    } else {
      eyes = '<ellipse cx="54" cy="47" rx="2" ry="2.8" fill="#3F332B"/><ellipse cx="66" cy="47" rx="2" ry="2.8" fill="#3F332B"/>';
      mouth = '<path d="M56 55 Q60 58 64 55" class="mouth" fill="none" stroke="#7A4A3A" stroke-width="1.6" stroke-linecap="round"/>';
    }

    var accessory = '';
    if (accItems.length) {
      accItems.forEach(function (item) {
        var ac = hex(item.color);
        var slot = item.slot || 'other';
        if (item.shape === 'glasses') {
          accessory += '<circle cx="54" cy="47" r="5.5" fill="none" stroke="#8A6A3A" stroke-width="1.3"/>' +
            '<circle cx="66" cy="47" r="5.5" fill="none" stroke="#8A6A3A" stroke-width="1.3"/>' +
            '<path d="M59.5 47 L60.5 47 M48.5 46 L44 45 M71.5 46 L76 45" stroke="#8A6A3A" stroke-width="1.2"/>';
        } else if (item.shape === 'sunglasses') {
          accessory += '<path d="M48 44 L57 43 L58 50 Q53 53 49 50 Z" fill="rgba(46,42,39,.85)" stroke="#5B4636" stroke-width="1.2"/>' +
            '<path d="M63 43 L72 44 L71 50 Q67 53 62 50 Z" fill="rgba(46,42,39,.85)" stroke="#5B4636" stroke-width="1.2"/>' +
            '<path d="M57 46 L63 46 M48 45 L44 44 M72 45 L76 44" stroke="#5B4636" stroke-width="1.1" fill="none"/>';
        } else if (item.shape === 'pearl') {
          accessory += '<path d="M50 70 Q60 77 70 70" fill="none" stroke="#5B4636" stroke-width="1.1"/>' +
            '<circle cx="54" cy="73" r="1.8" fill="#FFFDF8" stroke="#5B4636" stroke-width=".8"/>' +
            '<circle cx="60" cy="75" r="1.8" fill="#FFFDF8" stroke="#5B4636" stroke-width=".8"/>' +
            '<circle cx="66" cy="73" r="1.8" fill="#FFFDF8" stroke="#5B4636" stroke-width=".8"/>';
        } else if (item.shape === 'scarf') {
          accessory += '<path d="M46 67 Q60 76 74 67 L76 75 Q60 84 44 75 Z" fill="' + ac + '"' + st + '/>' +
            '<path d="M66 76 L63 96 L72 96 L73 78" fill="' + ac + '"' + st + '/>';
        } else if (item.shape === 'beret') {
          accessory += '<path d="M42 34 Q44 18 60 18 Q76 18 78 34 Z" fill="' + ac + '"' + st + '/>' +
            '<path d="M40 34 Q60 42 80 34 L79 39 Q60 47 41 39 Z" fill="' + ac + '"' + st + '/>';
        } else if (item.shape === 'hairclip') {
          accessory += '<path d="M72 28 Q68 22 74 22 Q80 22 78 28 Q84 24 87 30 Q84 36 78 32 Q80 38 74 38 Q68 38 72 32 Z" fill="' + ac + '"' + st + '/>' +
            '<circle cx="76" cy="30" r="2" fill="#5B4636"/>';
        } else if (slot === 'neck') {
          if (item.variant === 'choker') {
            accessory += '<path d="M48 68 Q60 75 72 68" fill="none" stroke="' + ac + '" stroke-width="4"/>' +
              '<circle cx="60" cy="74" r="2" fill="#5B4636"/>';
          } else if (item.variant === 'collar') {
            accessory += '<path d="M50 70 Q60 77 70 70" fill="none" stroke="#5B4636" stroke-width="1"/>' +
              '<circle cx="54" cy="73" r="1.8" fill="#FFFDF8" stroke="#5B4636" stroke-width=".7"/>' +
              '<circle cx="60" cy="75" r="1.8" fill="#FFFDF8" stroke="#5B4636" stroke-width=".7"/>' +
              '<circle cx="66" cy="73" r="1.8" fill="#FFFDF8" stroke="#5B4636" stroke-width=".7"/>';
          } else if (item.variant === 'pendant') {
            accessory += '<path d="M50 70 Q60 78 70 70" fill="none" stroke="' + ac + '" stroke-width="1.6"/>' +
              '<path d="M60 78 Q56 84 60 88 Q64 84 60 78 Z" fill="' + ac + '" stroke="#5B4636" stroke-width=".8"/>';
          } else {
            accessory += '<path d="M50 70 Q60 78 70 70" fill="none" stroke="' + ac + '" stroke-width="2"/>' +
              '<circle cx="60" cy="78" r="2.5" fill="' + ac + '" stroke="#5B4636" stroke-width=".8"/>';
          }
        } else if (slot === 'hair') {
          if (item.variant === 'headband') {
            accessory += '<path d="M43 36 Q60 18 77 36" fill="none" stroke="' + ac + '" stroke-width="3" stroke-linecap="round"/>';
          } else if (item.variant === 'scrunchie') {
            accessory += '<circle cx="78" cy="34" r="5" fill="' + ac + '" stroke="#5B4636" stroke-width="1.2"/>';
          } else if (item.variant === 'claw') {
            accessory += '<path d="M70 28 L82 24 L80 34 L70 36 Z" fill="' + ac + '"' + st + '/>';
          } else if (item.variant === 'pin') {
            accessory += '<path d="M68 28 L80 24 M69 33 L81 29" stroke="' + ac + '" stroke-width="2" stroke-linecap="round"/>';
          } else {
            accessory += '<path d="M72 28 Q68 22 74 22 Q80 22 78 28 Q84 24 87 30 Q84 36 78 32 Q80 38 74 38 Q68 38 72 32 Z" fill="' + ac + '"' + st + '/>';
          }
        } else if (slot === 'waist') {
          accessory += '<path d="M44 122 L76 122" stroke="' + ac + '" stroke-width="4" stroke-linecap="round"/>' +
            '<rect x="57" y="119" width="6" height="6" rx="1" fill="none" stroke="#5B4636" stroke-width="1.2"/>';
        } else if (slot === 'ear') {
          if (item.variant === 'stud') {
            accessory += '<circle cx="43" cy="62" r="2" fill="' + ac + '" stroke="#5B4636" stroke-width=".7"/>' +
              '<circle cx="77" cy="62" r="2" fill="' + ac + '" stroke="#5B4636" stroke-width=".7"/>';
          } else if (item.variant === 'hoop') {
            accessory += '<circle cx="43" cy="64" r="3.5" fill="none" stroke="' + ac + '" stroke-width="1.4"/>' +
              '<circle cx="77" cy="64" r="3.5" fill="none" stroke="' + ac + '" stroke-width="1.4"/>';
          } else if (item.variant === 'cuff') {
            accessory += '<path d="M40 60 Q43 65 46 60" fill="none" stroke="' + ac + '" stroke-width="1.6"/>' +
              '<path d="M74 60 Q77 65 80 60" fill="none" stroke="' + ac + '" stroke-width="1.6"/>';
          } else {
            accessory += '<circle cx="43" cy="62" r="1.8" fill="' + ac + '" stroke="#5B4636" stroke-width=".7"/>' +
              '<path d="M43 62 L43 67" stroke="' + ac + '" stroke-width="1.4"/>' +
              '<circle cx="43" cy="68" r="1.5" fill="' + ac + '" stroke="#5B4636" stroke-width=".7"/>' +
              '<circle cx="77" cy="62" r="1.8" fill="' + ac + '" stroke="#5B4636" stroke-width=".7"/>' +
              '<path d="M77 62 L77 67" stroke="' + ac + '" stroke-width="1.4"/>' +
              '<circle cx="77" cy="68" r="1.5" fill="' + ac + '" stroke="#5B4636" stroke-width=".7"/>';
          }
        } else if (slot === 'wrist') {
          if (item.variant === 'watch') {
            accessory += '<circle cx="86" cy="146" r="3" fill="#FFFDF8" stroke="' + ac + '" stroke-width="1.4"/>' +
              '<path d="M84 143 L88 143 M84 149 L88 149" stroke="' + ac + '" stroke-width="1.2"/>';
          } else if (item.variant === 'beads') {
            accessory += '<path d="M31 143 Q34 148 37 143" fill="none" stroke="' + ac + '" stroke-width="1.4"/>' +
              '<circle cx="32" cy="145" r="1.2" fill="' + ac + '"/><circle cx="35" cy="147" r="1.2" fill="' + ac + '"/><circle cx="38" cy="145" r="1.2" fill="' + ac + '"/>';
          } else if (item.variant === 'ring') {
            accessory += '<circle cx="34" cy="147" r="2" fill="none" stroke="' + ac + '" stroke-width="1.4"/>' +
              '<circle cx="86" cy="147" r="2" fill="none" stroke="' + ac + '" stroke-width="1.4"/>';
          } else {
            accessory += '<path d="M31 143 Q34 147 37 143" fill="none" stroke="' + ac + '" stroke-width="2.2"/>' +
              '<path d="M83 143 Q86 147 89 143" fill="none" stroke="' + ac + '" stroke-width="2.2"/>';
          }
        } else {
          accessory += '<circle cx="70" cy="88" r="3" fill="' + ac + '" stroke="#5B4636" stroke-width="1"/>' +
            '<path d="M67 88 L73 88 M70 85 L70 91" stroke="#5B4636" stroke-width=".8"/>';
        }
      });
    } else if (p.accessory === 'glasses') {
      accessory = '<circle cx="54" cy="47" r="5.5" fill="none" stroke="#8A6A3A" stroke-width="1.3"/>' +
        '<circle cx="66" cy="47" r="5.5" fill="none" stroke="#8A6A3A" stroke-width="1.3"/>' +
        '<path d="M59.5 47 L60.5 47 M48.5 46 L44 45 M71.5 46 L76 45" stroke="#8A6A3A" stroke-width="1.2"/>';
    } else if (p.accessory === 'earrings') {
      accessory = '<circle cx="42" cy="61" r="1.8" fill="#E3B23C" stroke="#5B4636" stroke-width=".7"/>' +
        '<circle cx="78" cy="61" r="1.8" fill="#E3B23C" stroke="#5B4636" stroke-width=".7"/>';
    } else if (p.accessory === 'pearl') {
      accessory = '<path d="M50 70 Q60 77 70 70" fill="none" stroke="#5B4636" stroke-width="1.1"/>' +
        '<circle cx="54" cy="73" r="1.8" fill="#FFFDF8" stroke="#5B4636" stroke-width=".8"/>' +
        '<circle cx="60" cy="75" r="1.8" fill="#FFFDF8" stroke="#5B4636" stroke-width=".8"/>' +
        '<circle cx="66" cy="73" r="1.8" fill="#FFFDF8" stroke="#5B4636" stroke-width=".8"/>';
    }

    var face = '<ellipse cx="60" cy="47" rx="18" ry="20" fill="' + skin + '"' + st + '/>' +
      '<circle cx="43" cy="49" r="3.2" fill="' + skin + '"' + st + '/>' +
      '<circle cx="77" cy="49" r="3.2" fill="' + skin + '"' + st + '/>' +
      '<path d="M58 59 Q54 64 59 65" fill="none" stroke="#B98D69" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>' +
      hairFront + brows + eyes + mouth +
      '<circle cx="48" cy="53" r="2.8" fill="#D99A9A" opacity=".32"/>' +
      '<circle cx="72" cy="53" r="2.8" fill="#D99A9A" opacity=".32"/>';
    if (p.image) {
      var clipId = 'shop2face_' + customer.id;
      face = '<defs><clipPath id="' + clipId + '"><ellipse cx="60" cy="47" rx="18" ry="20"/></clipPath></defs>' +
        '<ellipse cx="60" cy="47" rx="18" ry="20" fill="' + skin + '"' + st + '/>' +
        '<image href="' + esc(p.image) + '" x="42" y="27" width="36" height="40" clip-path="url(#' + clipId + ')" preserveAspectRatio="xMidYMid slice" onerror="this.style.display=\'none\'"/>' +
        '<ellipse cx="60" cy="47" rx="18" ry="20" fill="none" stroke="#5B4636" stroke-width="2.2"/>';
    }

    var hoseShape = hosieryItem ? hosieryItem.shape : '';
    var hoseColor = hosieryItem ? hex(hosieryItem.color) : '';
    var legFill = (hosieryItem && hoseShape === 'tights') ? hoseColor : skin;
    var legOpacity = (hosieryItem && hosieryItem.id === 'h_sheer') ? ' opacity=".78"' : '';
    var legs = '';
    if (dressItem) {
      legs = '<path d="M51 180 L58 180 L56 208 L47 208 Z" fill="' + legFill + '"' + legOpacity + st + '/>' +
        '<path d="M62 180 L69 180 L73 208 L64 208 Z" fill="' + legFill + '"' + legOpacity + st + '/>';
    } else {
      legs = '<path d="M49 128 L57 128 L55 208 L45 208 Z" fill="' + legFill + '"' + legOpacity + st + '/>' +
        '<path d="M63 128 L71 128 L75 208 L65 208 Z" fill="' + legFill + '"' + legOpacity + st + '/>';
    }
    if (hosieryItem && hoseShape === 'fishnet') {
      legs += '<g stroke="' + hoseColor + '" stroke-width=".9" fill="none" opacity=".7">' +
        '<path d="M48 136 L54 146 M48 146 L54 156 M48 156 L54 166 M48 166 L54 176 M48 176 L54 186 M48 186 L54 196 M48 196 L52 204"/>' +
        '<path d="M54 136 L48 146 M54 146 L48 156 M54 156 L48 166 M54 166 L48 176 M54 176 L48 186 M54 186 L48 196 M54 196 L50 204"/>' +
        '<path d="M62 136 L68 146 M62 146 L68 156 M62 156 L68 166 M62 166 L68 176 M62 176 L68 186 M62 186 L68 196 M62 196 L66 204"/>' +
        '<path d="M68 136 L62 146 M68 146 L62 156 M68 156 L62 166 M68 166 L62 176 M68 176 L62 186 M68 186 L62 196 M68 196 L64 204"/>' +
        '</g>';
    }
    if (hosieryItem && hoseShape === 'knee') {
      var kneeTop = dressItem ? 176 : 164;
      legs += '<path d="M46 ' + kneeTop + ' L57 ' + kneeTop + ' L56 204 L47 204 Z" fill="' + hoseColor + '"' + st + '/>' +
        '<path d="M63 ' + kneeTop + ' L74 ' + kneeTop + ' L73 204 L64 204 Z" fill="' + hoseColor + '"' + st + '/>' +
        '<path d="M46 ' + (kneeTop + 7) + ' L57 ' + (kneeTop + 7) + ' M63 ' + (kneeTop + 7) + ' L74 ' + (kneeTop + 7) + '"' + white + '/>';
    }
    if (hosieryItem && hoseShape === 'ankle') {
      var ankleTop = dressItem ? 186 : 184;
      legs += '<path d="M46 ' + ankleTop + ' L57 ' + ankleTop + ' L56 204 L47 204 Z" fill="' + hoseColor + '"' + st + '/>' +
        '<path d="M63 ' + ankleTop + ' L74 ' + ankleTop + ' L73 204 L64 204 Z" fill="' + hoseColor + '"' + st + '/>' +
        '<path d="M46 ' + (ankleTop + 4) + ' L57 ' + (ankleTop + 4) + ' M63 ' + (ankleTop + 4) + ' L74 ' + (ankleTop + 4) + '"' + white + '/>';
    }

    var lower = '';
    if (dressItem) {
      lower = '<path d="M46 78 L74 78 L72 124 L88 184 Q60 193 32 184 L48 124 Z" fill="' + dressFill + '"' + st + '/>' +
        '<path d="M48 124 L72 124"' + detail + '/>' +
        '<path d="M44 148 Q60 154 76 148"' + white + '/>';
    } else {
      var isSkirt = bottomItem && (bottomItem.shape === 'skirt' || bottomItem.shape === 'pleat' || bottomItem.shape === 'tier');
      var isPleat = bottomItem && bottomItem.shape === 'pleat';
      var isShorts = bottomItem && bottomItem.shape === 'shorts';
      lower = '<path d="M44 76 Q60 68 76 76 L80 126 Q60 133 40 126 Z" fill="' + topFill + '"' + st + '/>' +
        '<path d="M50 78 Q56 86 60 76 Q64 86 70 78"' + detail + '/>' +
        '<path d="M45 102 L75 102"' + white + '/>' +
        (isPleat
          ? '<path d="M42 124 L78 124 L84 168 Q60 177 36 168 Z" fill="' + bottomFill + '"' + st + '/>' +
            '<path d="M42 131 L78 131"' + detail + '/>' +
            '<path d="M48 134 L42 166 M60 134 L60 171 M72 134 L78 166"' + white + '/>'
          : isSkirt
            ? '<path d="M42 124 L78 124 L88 188 Q60 198 32 188 Z" fill="' + bottomFill + '"' + st + '/>' +
              '<path d="M42 132 L78 132"' + detail + '/>' +
              '<path d="M48 134 L42 184 M60 134 L60 190 M72 134 L78 184"' + white + '/>'
            : isShorts
              ? '<path d="M42 124 L78 124 L76 168 L61 168 L60 144 L58 168 L42 168 Z" fill="' + bottomFill + '"' + st + '/>' +
                '<path d="M42 131 L78 131"' + detail + '/>'
              : '<path d="M42 124 L78 124 L76 205 L60 205 L60 148 L58 205 L42 205 Z" fill="' + bottomFill + '"' + st + '/>' +
                '<path d="M42 131 L78 131"' + detail + '/>' +
                '<path d="M52 131 L52 140 M68 131 L68 140"' + white + '/>');
    }

    var sleeves = '';
    if (dressItem) {
      sleeves = '<path d="M44 80 Q36 84 34 100 L40 101 Q44 90 50 86 Z" fill="' + dressFill + '"' + st + '/>' +
        '<path d="M76 80 Q84 84 86 100 L80 101 Q76 90 70 86 Z" fill="' + dressFill + '"' + st + '/>';
    } else {
      sleeves = '<path d="M44 79 Q35 85 33 106 L40 107 Q44 92 50 86 Z" fill="' + topFill + '"' + st + '/>' +
        '<path d="M76 79 Q85 85 87 106 L80 107 Q76 92 70 86 Z" fill="' + topFill + '"' + st + '/>';
    }

    var arms = '<g class="shop2-arm-left">' +
      '<path d="M35 104 Q32 126 34 146" fill="none" stroke="' + skin + '" stroke-width="7" stroke-linecap="round"/>' +
      '<circle class="hand-left" cx="34" cy="148" r="4" fill="' + skin + '" stroke="#5B4636" stroke-width="1.6"/>' +
      '</g>' +
      '<g class="shop2-arm-right">' +
      '<path d="M85 104 Q88 126 86 146" fill="none" stroke="' + skin + '" stroke-width="7" stroke-linecap="round"/>' +
      '<circle class="hand-right" cx="86" cy="148" r="4" fill="' + skin + '" stroke="#5B4636" stroke-width="1.6"/>' +
      '</g>';

    var outer = '';
    if (outerItem) {
      outer = '<path d="M42 74 L28 82 L24 160 L40 163 L48 92 Z" fill="' + outerFill + '"' + st + '/>' +
        '<path d="M78 74 L92 82 L96 160 L80 163 L72 92 Z" fill="' + outerFill + '"' + st + '/>' +
        (outerItem.shape === 'blazer' ? '<path d="M46 76 L60 96 L74 76"' + detail + '/>' : '');
    }

    var shoes = '<path d="M44 204 Q46 198 55 200 L56 214 Q46 220 42 214 Z" fill="' + shoeFill + '"' + st + '/>' +
      '<path d="M64 200 Q73 198 76 204 L78 214 Q74 220 64 214 Z" fill="' + shoeFill + '"' + st + '/>' +
      '<path d="M44 210 L56 210 M64 210 L78 210"' + white + '/>';

    var bag = '';
    if (bagItem) {
      bag = '<g class="shop2-bag"><path d="M82 128 L96 128 L98 150 Q98 156 90 156 L82 156 Q74 156 74 150 Z" fill="' + hex(bagItem.color) + '"' + st + '/>' +
        '<path d="M80 128 Q80 118 86 118 Q92 118 92 128" fill="none" stroke="#5B4636" stroke-width="1.8"/></g>';
    }

    var hairTop = p.hairStyle === 'bun' ? '<circle cx="60" cy="20" r="8" fill="' + hair + '"' + st + '/>' : '';
    var head = '<g class="shop2-head">' + hairBack + hairTop +
      '<path d="M56 64 L56 78 L64 78 L64 64 Z" fill="' + skin + '"' + st + '/>' +
      face + accessory + '</g>';

    return '<svg viewBox="0 0 120 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(customer.name) + '">' +
      '<ellipse cx="60" cy="232" rx="29" ry="5.5" fill="rgba(63,51,43,.2)"/>' +
      legs + shoes + arms + lower + sleeves + outer + head + bag +
      '</svg>';
  }

  /* ---------------- 过肩店主 ---------------- */

  function keeperSvg() {
    var ai = window.AILook && AILook.keeperUrl && AILook.keeperUrl();
    if (ai) {
      return '<img class="ai-keeper-arm" src="' + esc(ai) + '" alt="店主的手臂" loading="lazy" decoding="async">';
    }
    return '<svg viewBox="0 0 300 220" preserveAspectRatio="xMinYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g class="shop2-shoulder">' +
      '<path d="M-20 220 L-20 142 Q12 112 55 128 Q92 142 104 190 L108 220 Z" fill="#C97B63" stroke="#5B4636" stroke-width="2.6"/>' +
      '<path d="M-6 148 Q20 124 52 136" fill="none" stroke="rgba(255,255,255,.24)" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M0 220 L0 160 Q18 150 34 160" fill="none" stroke="#9E5B47" stroke-width="2" opacity=".45"/>' +
      '</g>' +
      '<g class="shop2-arm">' +
      '<path d="M62 166 Q98 152 132 144" fill="none" stroke="#C97B63" stroke-width="30" stroke-linecap="round"/>' +
      '<path d="M62 166 Q98 152 132 144" fill="none" stroke="#5B4636" stroke-width="34" stroke-linecap="round" opacity=".16"/>' +
      '<path d="M62 166 Q98 152 132 144" fill="none" stroke="#C97B63" stroke-width="26" stroke-linecap="round"/>' +
      '<path d="M68 160 Q100 148 130 141" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M128 146 L154 142" fill="none" stroke="#D9A57E" stroke-width="9" stroke-linecap="round"/>' +
      '<g class="shop2-hand">' +
      '<path d="M150 132 Q172 122 188 132 Q203 142 198 157 Q192 172 174 168 Q157 163 150 150 Z" fill="#D9A57E" stroke="#5B4636" stroke-width="2.4"/>' +
      '<path d="M160 136 Q172 130 183 135 M162 145 Q174 139 187 144 M164 154 Q175 149 189 154" fill="none" stroke="#5B4636" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>' +
      '<path d="M154 158 Q162 164 173 164" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2" stroke-linecap="round"/>' +
      '</g>' +
      '</g>' +
      '</svg>';
  }

  /* ---------------- 舞台 ---------------- */

  function currentCustomer() {
    return window.Engine ? Engine.currentCustomer() : null;
  }

  function bubbleText(s, key) {
    if (!s) { return ''; }
    if (key === 'chat') {
      if (s.chatPhase === 'reply' && s.chatReply) { return s.chatReply.text; }
      if (s.chatPhase === 'done') { return '那就麻烦你了。'; }
      var beat = Engine.getChatBeat();
      return beat ? beat.prompt : '你好，我想看看衣服。';
    }
    if (key === 'service') {
      if (s.lastTry && s.lastTry.hint) { return s.lastTry.hint; }
      if (s.itemReaction && s.itemReaction.text) { return s.itemReaction.text; }
      return '我看看你挑的。';
    }
    if (key === 'result') {
      var pr = s.pendingResult;
      var d = currentCustomer() ? Engine.getDialogue(currentCustomer()) : null;
      if (!pr) { return '……'; }
      if (pr.outcome !== 'expensive' && d && pr.result && pr.result.score >= 70 && d.reaction) { return d.reaction; }
      if (pr.outcome === 'perfect') { return '就是这套，我明天就穿它！'; }
      if (pr.outcome === 'happy') { return '挺好看的，我拿走啦。'; }
      if (pr.outcome === 'hesitant') { return '我再想想……真的好看吗？'; }
      if (pr.outcome === 'expensive') { return '超出预算了，有点可惜。'; }
      if (pr.outcome === 'discount') { return '九折的话，我就拿下。'; }
      if (pr.outcome === 'single') { return '我先带走这一件吧。'; }
      return '谢谢，我再逛逛。';
    }
    return '';
  }

  Scene.render = function (s, key) {
    if (!s) { return ''; }
    var customer = (key === 'chat' || key === 'service' || key === 'result') ? currentCustomer() : null;
    var outfit = [];
    if (key === 'result' && s.pendingResult) {
      outfit = s.pendingResult.itemIds || [];
    } else if (key === 'service') {
      outfit = s.selectedItems || [];
    }
    var expression = s.expression || 'neutral';
    if (key === 'result' && s.pendingResult) {
      var score = s.pendingResult.result.score;
      expression = score >= 85 ? 'happy' : score >= 55 ? 'neutral' : 'hesitant';
    }
    var cam = key === 'service' ? 'rack' : key === 'result' ? 'mirror' : key === 'settle' ? 'wide' : (key === 'brief' || key === 'prep') ? 'wide' : 'chat';
    var bubble = bubbleText(s, key);
    var cfg = Engine.getDayConfig(s.day);
    var weather = D.WEATHER[cfg.weather] || D.WEATHER.sunny;
    var personClass = 'shop2-person position-' + key + ' is-' + expression + ' look-' + (key === 'service' ? 'rack' : key === 'result' ? 'mirror' : 'player');
    var tools = '';

    if (key === 'chat' && !s.careUsed) {
      tools += '<button type="button" class="stage-tool" data-action="care-menu" title="茶点单">🍵<span>茶点</span></button>';
    }
    tools += '<button type="button" class="stage-tool" data-action="pet-cat" title="摸摸猫">🐈<span>摸猫</span></button>';
    tools += '<button type="button" class="stage-tool" data-action="pet-dog" title="摸摸狗">🐶<span>摸狗</span></button>';
    tools += '<button type="button" class="stage-tool sound" data-action="toggle-sound" title="声音开关">' +
      (Scene.isSoundOn() ? '🔊' : '🔇') + '<span>声音</span></button>';

    var stamp = '';
    if (key === 'result' && s.pendingResult) {
      stamp = '<div class="shop2-stamp"><strong>' + s.pendingResult.result.score + '</strong><span>搭配分</span></div>';
    }

    return '<div class="shop2' + (key === 'result' ? ' is-result' : '') + '" data-cam="' + cam + '" data-stage="' + key + '">' +
      '<div class="shop2-cam">' +
      '<div class="shop2-layer shop2-back">' + backSvg(s, key) + '</div>' +
      '<div class="shop2-layer shop2-mid">' + midSvg(s) + '</div>' +
      '<div class="shop2-layer shop2-furniture">' + furnitureLayer(s) + '</div>' +
      (customer ? '<div class="' + personClass + '" id="shop2-person">' + customerSvg(customer, outfit, expression) + '</div>' : '') +
      '<div class="shop2-layer shop2-front">' + frontSvg() + '</div>' +
      '<div class="shop2-keeper" id="shop2-keeper">' + keeperSvg() + '</div>' +
      '<div class="shop2-light"></div>' +
      '<div class="shop2-vignette"></div>' +
      '<div class="shop2-curtain"><i></i><i></i></div>' +
      '<div class="shop2-flash"></div>' +
      '</div>' +
      (bubble ? '<div class="shop2-bubble"><span>' + esc(bubble.length > 52 ? bubble.slice(0, 52) + '…' : bubble) + '</span></div>' : '') +
      '<div class="stage-hud">' +
      '<span class="stage-shop">' + esc(s.shopName) + '</span>' +
      '<span class="stage-day">' + Engine.getSeason(s.day).name + ' · DAY ' + Engine.getDayInSeason(s.day) + '</span>' +
      '</div>' +
      '<div class="stage-weather">' + esc(weather.name) + '</div>' +
      '<div class="stage-tools">' + tools + '</div>' +
      stamp +
      '<div class="shop2-drop">把她喜欢的衣服放到她身上</div>' +
      '</div>';
  };

  Scene.preview = function () {
    var s = {
      day: 1,
      windowItems: [],
      inventory: null,
      shopName: '',
      pricing: 'standard',
      pendingMarketing: 'none',
      marketing: 'none'
    };
    var customer = D.CUSTOMERS[0];
    var aiSpr = window.AILook && AILook.spriteUrl ? AILook.spriteUrl(customer.id) : '';
    var previewPerson = aiSpr
      ? '<img class="ai-shop-sprite" src="' + esc(aiSpr) + '" alt="" loading="lazy" decoding="async">'
      : customerSvg(customer, [], 'neutral');
    return '<div class="shop2 shop2-preview" data-cam="chat">' +
      '<div class="shop2-cam">' +
      '<div class="shop2-layer shop2-back">' + backSvg(s, 'chat') + '</div>' +
      '<div class="shop2-layer shop2-mid">' + midSvg(s) + '</div>' +
      '<div class="shop2-layer shop2-furniture">' + furnitureLayer(s) + '</div>' +
      (customer ? '<div class="shop2-person position-chat is-neutral look-player">' + previewPerson + '</div>' : '') +
      '<div class="shop2-layer shop2-front">' + frontSvg() + '</div>' +
      '<div class="shop2-keeper">' + keeperSvg() + '</div>' +
      '<div class="shop2-light"></div>' +
      '<div class="shop2-vignette"></div>' +
      '</div>' +
      '</div>';
  };

  Scene.gesture = function (name) {
    if (Scene._isoOn && window.Iso && Iso.gesture) { Iso.gesture(name); return; }
    var el = document.getElementById('shop2-keeper');
    if (!el) { return; }
    ['gesture-lean', 'gesture-point', 'gesture-joke', 'is-offer'].forEach(function (c) {
      el.classList.remove(c);
    });
    void el.offsetWidth;
    if (name) { el.classList.add('gesture-' + name); }
    setTimeout(function () {
      ['gesture-lean', 'gesture-point', 'gesture-joke'].forEach(function (c) {
        el.classList.remove(c);
      });
    }, 1300);
  };

  Scene.pulse = function (name) {
    if (Scene._isoOn && window.Iso && Iso.pulse) { Iso.pulse(name); return; }
    var el = document.getElementById('shop2-person');
    if (!el) { return; }
    el.classList.remove('is-' + name);
    void el.offsetWidth;
    el.classList.add('is-' + name);
    setTimeout(function () { el.classList.remove('is-' + name); }, 900);
  };

  Scene.talk = function (ms) {
    if (Scene._isoOn && window.Iso && Iso.talk) { Iso.talk(ms); return; }
    var el = document.getElementById('shop2-person');
    if (!el) { return; }
    el.classList.add('is-talking');
    setTimeout(function () { el.classList.remove('is-talking'); }, ms || 1000);
  };

  Scene.petCat = function () {
    if (Scene._isoOn && window.Iso && Iso.petCat) { return Iso.petCat(); }
    return false;
  };

  Scene.petDog = function () {
    if (Scene._isoOn && window.Iso && Iso.petDog) { return Iso.petDog(); }
    return false;
  };

  Scene.personSvg = customerSvg;
  /* ---------------- 2.5D 等距舞台入口 ---------------- */

  Scene._isoOn = false;

  Scene.snapshot = function () {
    if (Scene._isoOn && window.Iso && Iso.snapshot) { return Iso.snapshot(); }
    return null;
  };

  Scene.setAudioScene = function (s, key) {
    var season = 'spring';
    var weather = 'sunny';
    try {
      if (window.Engine && Engine.getSeason) { season = Engine.getSeason(s.day).id || season; }
      if (window.Engine && Engine.getWeatherDay) { weather = Engine.getWeatherDay(s.day).id || weather; }
    } catch (e) {}
    var mood = key === 'settle' ? 'evening' : (key === 'chat' || key === 'service' ? 'chat' : 'day');
    Scene.setMusicMood(mood);
    Scene.setAmbience(weather, season);
  };

  Scene.mount = function (root, s, key) {
    if (s && Scene.setAudioScene) { Scene.setAudioScene(s, key); }
    var forceSvg = /[?&]art=svg/.test(window.location.search || '');
    if (!window.Iso || !Iso.isAvailable() || forceSvg) {
      root.innerHTML = Scene.render(s, key);
      Scene._isoOn = false;
      return false;
    }
    if (!root.querySelector('canvas')) { root.innerHTML = ''; }
    Iso.mount(root, s, key);
    Scene._isoOn = true;
    return true;
  };

  Scene.unmount = function (root) {
    if (Scene._isoOn) {
      if (window.Iso && Iso.unmount) { Iso.unmount(); }
      return;
    }
    root.innerHTML = '';
  };

  window.Scene = Scene;
})();
