/* 衣间小日子 — 静态数据 */
(function () {
  var D = {};

  D.STYLE_LABELS = {
    work: '通勤',
    minimal: '极简',
    french: '法式',
    sweet: '甜美',
    vintage: '复古',
    sporty: '运动',
    y2k: '千禧',
    newchinese: '新中式',
    cleanfit: '清冷',
    gorpcore: '山系',
    balletcore: '芭蕾',
    academia: '学院'
  };

  D.CATEGORY_LABELS = {
    top: '上装',
    bottom: '下装',
    dress: '连衣裙',
    outer: '外套',
    shoes: '鞋',
    bag: '包',
    accessory: '配饰',
    hosiery: '丝袜'
  };

  D.ACCESSORY_SLOT_LABELS = {
    neck: '颈',
    ear: '耳',
    hair: '发',
    waist: '腰',
    wrist: '腕',
    eyes: '眼',
    other: '其他'
  };

  D.COLOR_HEX = {
    cream: '#F1E3D3',
    white: '#FFFFFF',
    black: '#2E2A27',
    cocoa: '#6B4F3A',
    terracotta: '#C97B63',
    sage: '#8A9A7B',
    mustard: '#E3B23C',
    denim: '#6B7F95',
    rose: '#D99A9A',
    lavender: '#B7A6C9',
    grey: '#B9B2A8',
    butter: '#E8C97A',
    burgundy: '#6E2B35',
    chocolate: '#4A342A',
    sky: '#A9C3D3',
    olive: '#7C7F52',
    nude: '#D9BBA6',
    silver: '#C9C9C4'
  };

  /* 设计工坊部件 */
  D.DESIGN = {
    cats: [
      { id: 'top', name: '上装', formality: 3 },
      { id: 'bottom', name: '下装', formality: 3 },
      { id: 'dress', name: '连衣裙', formality: 4 },
      { id: 'outer', name: '外套', formality: 4 }
    ],
    fabrics: [
      { id: 'cotton', name: '棉', cost: 60, warmth: 2, style: 'minimal', seasons: ['spring', 'summer', 'autumn'] },
      { id: 'silk', name: '丝', cost: 160, warmth: 2, style: 'french', seasons: ['spring', 'summer'] },
      { id: 'wool', name: '羊毛', cost: 140, warmth: 4, style: 'academia', seasons: ['autumn', 'winter'] },
      { id: 'denim', name: '牛仔', cost: 90, warmth: 3, style: 'cleanfit', seasons: ['spring', 'autumn'] },
      { id: 'chiffon', name: '雪纺', cost: 110, warmth: 1, style: 'sweet', seasons: ['spring', 'summer'] },
      { id: 'leather', name: '皮革', cost: 200, warmth: 3, style: 'y2k', seasons: ['autumn', 'winter'] }
    ],
    decorations: [
      { id: 'lace', name: '蕾丝', cost: 40, craft: 8 },
      { id: 'rhinestone', name: '贴钻', cost: 60, craft: 9 },
      { id: 'embroidery', name: '刺绣', cost: 50, craft: 9 },
      { id: 'ruffle', name: '荷叶边', cost: 35, craft: 7 },
      { id: 'tassel', name: '流苏', cost: 45, craft: 7 },
      { id: 'pearl', name: '珍珠', cost: 70, craft: 10 },
      { id: 'sequin', name: '亮片', cost: 55, craft: 8 },
      { id: 'patch', name: '拼接', cost: 30, craft: 6 }
    ],
    workCost: 100,
    maxDecorations: 2,
    printCost: 20,
    printSize: 32,
    printPalette: ['#3F332B', '#FFF9EF', '#D99A9A', '#C97B63', '#8A9A7B', '#6B7F95', '#E3B23C', '#B7A6C9'],

    // 版型：每个品类 5–6 个真实轮廓
    silhouettes: {
      top: [
        { id: 'shirt',  name: '衬衫',   look: { s: 'shirt',  neck: 'collar',     slv: 'long',  len: 'waist', fit: 'regular',   clo: 'buttons', det: ['cuffs', 'placket'] } },
        { id: 'knit',   name: '针织开衫', look: { s: 'knit',   neck: 'v',          slv: 'long',  len: 'hip',   fit: 'regular',   clo: 'open',    det: ['ribbed'] } },
        { id: 'cami',   name: '吊带',   look: { s: 'cami',   neck: 'straps',     slv: 'none',  len: 'waist', fit: 'slim' } },
        { id: 'hoodie', name: '卫衣',   look: { s: 'hoodie', neck: 'hood',       slv: 'long',  len: 'hip',   fit: 'oversized', det: ['kangaroo', 'ribbed'] } },
        { id: 'vest',   name: '马甲',   look: { s: 'vest',   neck: 'v',          slv: 'none',  len: 'waist', fit: 'slim',      clo: 'buttons' } },
        { id: 'corset', name: '胸衣',   look: { s: 'corset', neck: 'sweetheart', slv: 'none',  len: 'crop',  fit: 'slim',      det: ['boning'] } }
      ],
      bottom: [
        { id: 'jeans',  name: '直筒牛仔', look: { s: 'jeans',  rise: 'mid',  len: 'full', det: ['pockets', 'stitch'] } },
        { id: 'skirt',  name: 'A 字裙',   look: { s: 'skirt',  rise: 'high', len: 'midi', det: ['pleat'] } },
        { id: 'pleat',  name: '百褶裙',   look: { s: 'pleat',  rise: 'high', len: 'mini', det: ['knife'] } },
        { id: 'wide',   name: '阔腿裤',   look: { s: 'wide',   rise: 'high', len: 'full', det: ['crease'] } },
        { id: 'shorts', name: '短裤',     look: { s: 'shorts', rise: 'mid',  len: 'mini', det: ['pockets'] } }
      ],
      dress: [
        { id: 'tea',      name: '茶歇裙', look: { s: 'tea',      neck: 'v',        slv: 'puff',  len: 'midi', fit: 'fitflare', det: ['ruffle'] } },
        { id: 'slip',     name: '吊带裙', look: { s: 'slip',     neck: 'v',        slv: 'none',  len: 'midi', fit: 'bias' } },
        { id: 'qipao',    name: '旗袍',   look: { s: 'qipao',    neck: 'mandarin', slv: 'short', len: 'knee', fit: 'slim', det: ['slit'] } },
        { id: 'wrap',     name: '裹身裙', look: { s: 'wrap',     neck: 'v',        slv: 'short', len: 'knee', fit: 'wrap', det: ['tie'] } },
        { id: 'pinafore', name: '背带裙', look: { s: 'pinafore', neck: 'straps',   slv: 'none',  len: 'mini', fit: 'flare', det: ['bib'] } }
      ],
      outer: [
        { id: 'trench',   name: '风衣',   look: { s: 'trench',       len: 'long', clo: 'belt',    det: ['lapel', 'storm'] } },
        { id: 'blazer',   name: '西装',   look: { s: 'blazer',       len: 'hip',  clo: 'buttons', det: ['lapel'] } },
        { id: 'cardigan', name: '长开衫', look: { s: 'longcardigan', len: 'long', clo: 'open',    det: ['ribbed'] } },
        { id: 'jacket',   name: '短夹克', look: { s: 'denimjacket',  len: 'crop', clo: 'buttons', det: ['collar', 'pockets'] } },
        { id: 'cape',     name: '斗篷',   look: { s: 'cape',         len: 'long', clo: 'none',    det: ['drape'] } }
      ]
    },

    patterns: [
      { id: 'none', name: '纯色' },
      { id: 'stripe', name: '条纹' },
      { id: 'plaid', name: '格纹' },
      { id: 'floral', name: '碎花' },
      { id: 'polka', name: '波点' }
    ],

    fabricLook: {
      cotton: { m: 'cotton', p: 'none' },
      silk: { m: 'satin', p: 'none' },
      wool: { m: 'wool', p: 'tweed' },
      denim: { m: 'denim', p: 'twill' },
      chiffon: { m: 'silk', p: 'floral' },
      leather: { m: 'leather', p: 'none' }
    }
  };

  D.COLOR_LABELS = {
    cream: '奶油', white: '白', black: '黑', cocoa: '可可', terracotta: '陶土',
    sage: '鼠尾草', mustard: '芥末', denim: '牛仔蓝', rose: '玫瑰',
    lavender: '薰衣草', grey: '灰', butter: '黄油', burgundy: '酒红',
    chocolate: '巧克力', sky: '天空蓝', olive: '橄榄', nude: '裸色', silver: '银灰'
  };

  D.COLOR_FAMILY = {
    cream: 'neutral',
    white: 'neutral',
    black: 'neutral',
    cocoa: 'neutral',
    grey: 'neutral',
    terracotta: 'warm',
    mustard: 'warm',
    rose: 'warm',
    sage: 'cool',
    denim: 'cool',
    lavender: 'cool',
    butter: 'warm',
    burgundy: 'warm',
    chocolate: 'neutral',
    sky: 'cool',
    olive: 'neutral',
    nude: 'neutral',
    silver: 'neutral'
  };

  D.ITEMS = [
    { id: 't_knit', name: '奶油针织开衫', cat: 'top', shape: 'top', style: ['french', 'minimal'], colors: ['cream'], color: 'cream', formality: 3, warmth: 3, cost: 80, price: 168, fit: ['cover', 'soft'], desc: '软软的，像周末下午。' },
    { id: 't_shirt', name: '挺括白衬衫', cat: 'top', shape: 'shirt', style: ['work', 'minimal'], colors: ['white'], color: 'white', formality: 4, warmth: 2, cost: 70, price: 158, fit: ['tall', 'slim'], desc: '面试和通勤的底牌。' },
    { id: 't_tee', name: '条纹短袖', cat: 'top', shape: 'tee', style: ['french', 'minimal'], colors: ['cream', 'black'], color: 'cream', formality: 2, warmth: 2, cost: 40, price: 99, fit: ['soft', 'comfort'], desc: '一件就能出门。' },
    { id: 't_blouse', name: '法式碎花衬衫', cat: 'top', shape: 'blouse', style: ['french', 'sweet'], colors: ['rose'], color: 'rose', formality: 3, warmth: 2, cost: 75, price: 178, fit: ['cover', 'soft'], desc: '领口有一点小心机。' },
    { id: 't_hoodie', name: '灰调连帽卫衣', cat: 'top', shape: 'hoodie', style: ['sporty', 'minimal'], colors: ['grey'], color: 'grey', formality: 1, warmth: 4, cost: 60, price: 128, fit: ['comfort', 'cover'], desc: '舒服是第一生产力。' },
    { id: 't_cami', name: '缎面小吊带', cat: 'top', shape: 'cami', style: ['y2k', 'sweet'], colors: ['lavender'], color: 'lavender', formality: 3, warmth: 1, cost: 45, price: 118, fit: ['slim', 'tall'], desc: '灯光下会发光。' },
    { id: 'b_jeans', name: '直筒牛仔裤', cat: 'bottom', shape: 'pants', style: ['minimal', 'sporty'], colors: ['denim'], color: 'denim', formality: 2, warmth: 3, cost: 80, price: 188, fit: ['tall', 'cover'], desc: '衣柜里的万能牌。' },
    { id: 'b_skirt', name: '百褶中裙', cat: 'bottom', shape: 'skirt', style: ['french', 'work'], colors: ['cocoa'], color: 'cocoa', formality: 3, warmth: 2, cost: 70, price: 168, fit: ['tall', 'slim'], desc: '走起来有风。' },
    { id: 'b_wide', name: '垂感阔腿裤', cat: 'bottom', shape: 'pants', style: ['work', 'minimal'], colors: ['black'], color: 'black', formality: 4, warmth: 2, cost: 90, price: 198, fit: ['tall', 'cover'], desc: '显高，也藏得住。' },
    { id: 'b_shorts', name: '牛仔短裤', cat: 'bottom', shape: 'shorts', style: ['sporty', 'y2k'], colors: ['denim'], color: 'denim', formality: 1, warmth: 1, cost: 35, price: 89, fit: ['slim'], desc: '夏天的保留节目。' },
    { id: 'd_flower', name: '法式茶歇裙', cat: 'dress', shape: 'dress', style: ['french', 'sweet'], colors: ['rose'], color: 'rose', formality: 3, warmth: 2, cost: 120, price: 268, fit: ['tall', 'slim'], desc: '穿上就想去河边散步。' },
    { id: 'd_black', name: '小黑裙', cat: 'dress', shape: 'dress', style: ['minimal', 'work'], colors: ['black'], color: 'black', formality: 4, warmth: 2, cost: 110, price: 258, fit: ['slim', 'tall'], desc: '不会出错的安全牌。' },
    { id: 'd_cn', name: '新中式旗袍裙', cat: 'dress', shape: 'dress', style: ['newchinese', 'vintage'], colors: ['sage'], color: 'sage', formality: 4, warmth: 2, cost: 140, price: 328, fit: ['tall', 'cover'], desc: '盘扣和斜襟都很讲究。' },
    { id: 'd_y2k', name: 'Y2K 吊带裙', cat: 'dress', shape: 'dress', style: ['y2k', 'sweet'], colors: ['lavender'], color: 'lavender', formality: 2, warmth: 1, cost: 60, price: 148, fit: ['slim', 'tall'], desc: '拍照很出片。' },
    { id: 'o_trench', name: '卡其风衣', cat: 'outer', shape: 'coat', style: ['french', 'work'], colors: ['mustard'], color: 'mustard', formality: 4, warmth: 4, cost: 150, price: 358, fit: ['cover', 'tall'], desc: '一穿就有故事感。' },
    { id: 'o_denim', name: '牛仔外套', cat: 'outer', shape: 'jacket', style: ['sporty', 'y2k'], colors: ['denim'], color: 'denim', formality: 2, warmth: 3, cost: 100, price: 228, fit: ['cover', 'comfort'], desc: '随便搭都不会错。' },
    { id: 'o_cardigan', name: '长款针织开衫', cat: 'outer', shape: 'coat', style: ['minimal', 'french'], colors: ['cream'], color: 'cream', formality: 2, warmth: 4, cost: 90, price: 208, fit: ['cover', 'soft'], desc: '像把被子穿出门。' },
    { id: 'o_blazer', name: '燕麦色西装', cat: 'outer', shape: 'blazer', style: ['work', 'minimal'], colors: ['cream'], color: 'cream', formality: 5, warmth: 3, cost: 130, price: 298, fit: ['tall', 'slim'], desc: '气场是可以穿出来的。' },
    { id: 's_mary', name: '玛丽珍鞋', cat: 'shoes', shape: 'mary', style: ['french', 'sweet'], colors: ['black'], color: 'black', formality: 3, warmth: 2, cost: 60, price: 138, fit: ['comfort'], desc: '搭裙子几乎不会错。' },
    { id: 's_loafer', name: '乐福鞋', cat: 'shoes', shape: 'loafer', style: ['work', 'minimal'], colors: ['cocoa'], color: 'cocoa', formality: 4, warmth: 2, cost: 70, price: 158, fit: ['comfort'], desc: '能跑起来的通勤鞋。' },
    { id: 's_sneaker', name: '白球鞋', cat: 'shoes', shape: 'sneaker', style: ['sporty', 'minimal'], colors: ['white'], color: 'white', formality: 1, warmth: 2, cost: 55, price: 128, fit: ['comfort'], desc: '万能，但不够正式。' },
    { id: 's_heel', name: '细跟高跟鞋', cat: 'shoes', shape: 'heel', style: ['work', 'y2k'], colors: ['black'], color: 'black', formality: 5, warmth: 1, cost: 80, price: 188, fit: ['tall'], desc: '美，但要少走路。' },
    { id: 's_boot', name: '复古短靴', cat: 'shoes', shape: 'boot', style: ['vintage', 'y2k'], colors: ['cocoa'], color: 'cocoa', formality: 3, warmth: 4, cost: 90, price: 208, fit: ['tall', 'comfort'], desc: '秋冬的安全感。' },
    { id: 'g_tote', name: '草编托特包', cat: 'bag', shape: 'tote', style: ['french', 'minimal'], colors: ['mustard'], color: 'mustard', formality: 2, warmth: 2, cost: 40, price: 98, fit: [], desc: '装得下伞和水杯。' },
    { id: 'g_black', name: '黑色通勤包', cat: 'bag', shape: 'bag', style: ['work', 'minimal'], colors: ['black'], color: 'black', formality: 4, warmth: 2, cost: 60, price: 148, fit: [], desc: '电脑和体面都装得下。' },
    { id: 'g_mini', name: '迷你斜挎包', cat: 'bag', shape: 'bag', style: ['y2k', 'sweet'], colors: ['rose'], color: 'rose', formality: 2, warmth: 1, cost: 35, price: 88, fit: [], desc: '装可爱就够了。' },
    { id: 'a_scarf', name: '丝巾', cat: 'accessory', slot: 'neck', shape: 'scarf', style: ['french', 'vintage'], colors: ['terracotta'], color: 'terracotta', formality: 3, warmth: 1, cost: 20, price: 58, fit: [], desc: '系在包上也算搭配。' },
    { id: 'a_pearl', name: '珍珠项链', cat: 'accessory', slot: 'neck', shape: 'pearl', style: ['newchinese', 'vintage'], colors: ['cream'], color: 'cream', formality: 4, warmth: 1, cost: 30, price: 78, fit: [], desc: '一下就温柔了。' },
    { id: 'a_glasses', name: '金丝眼镜', cat: 'accessory', slot: 'eyes', shape: 'glasses', style: ['work', 'minimal'], colors: ['mustard'], color: 'mustard', formality: 3, warmth: 1, cost: 25, price: 68, fit: [], desc: '看起来更聪明。' },
    { id: 'a_beret', name: '贝雷帽', cat: 'accessory', slot: 'hair', shape: 'beret', style: ['french', 'sweet'], colors: ['terracotta'], color: 'terracotta', formality: 3, warmth: 2, cost: 25, price: 68, fit: [], desc: '法式氛围感神器。' },
    { id: 't_vest', name: '西装马甲', cat: 'top', shape: 'vest', style: ['work', 'cleanfit'], colors: ['chocolate'], color: 'chocolate', formality: 4, warmth: 2, cost: 70, price: 158, fit: ['formal', 'slim'], desc: '一件就把衬衫变得更贵。' },
    { id: 't_corset', name: '鱼骨胸衣', cat: 'top', shape: 'corset', style: ['y2k', 'balletcore'], colors: ['burgundy'], color: 'burgundy', formality: 3, warmth: 1, cost: 55, price: 138, fit: ['slim', 'photo'], desc: '外面套件西装就能出门。' },
    { id: 't_polo', name: '雾蓝条纹 Polo', cat: 'top', shape: 'shirt', style: ['cleanfit', 'vintage'], colors: ['sky'], color: 'sky', formality: 3, warmth: 3, cost: 75, price: 168, fit: ['comfort', 'soft'], desc: '领子立起来，周末也有精神。' },
    { id: 'b_cargo', name: '工装直筒裤', cat: 'bottom', shape: 'pants', style: ['gorpcore', 'sporty'], colors: ['olive'], color: 'olive', formality: 2, warmth: 3, cost: 85, price: 188, fit: ['cover', 'dirty'], desc: '口袋很多，搬花也方便。' },
    { id: 'b_pleat', name: '酒红百褶短裙', cat: 'bottom', shape: 'pleat', style: ['academia', 'sweet'], colors: ['burgundy'], color: 'burgundy', formality: 3, warmth: 2, cost: 55, price: 138, fit: ['slim', 'tall'], desc: '跑起来裙摆会开花。' },
    { id: 'd_slip', name: '缎面吊带裙', cat: 'dress', shape: 'slip', style: ['cleanfit', 'y2k'], colors: ['burgundy'], color: 'burgundy', formality: 3, warmth: 1, cost: 95, price: 228, fit: ['slim', 'photo'], desc: '灯光一打，像换了一个人。' },
    { id: 'd_pinafore', name: '牛仔背带裙', cat: 'dress', shape: 'dress', style: ['academia', 'sweet'], colors: ['denim'], color: 'denim', formality: 2, warmth: 2, cost: 85, price: 198, fit: ['cover', 'tall'], desc: '里面塞一件衬衫就很好看。' },
    { id: 'o_quilt', name: '轻薄绗缝外套', cat: 'outer', shape: 'jacket', style: ['gorpcore', 'minimal'], colors: ['olive'], color: 'olive', formality: 2, warmth: 4, cost: 120, price: 268, fit: ['cover', 'comfort'], desc: '轻，但比想象中暖。' },
    { id: 'o_tailored', name: '短款西装外套', cat: 'outer', shape: 'blazer', style: ['cleanfit', 'work'], colors: ['grey'], color: 'grey', formality: 5, warmth: 3, cost: 130, price: 298, fit: ['presence', 'formal'], desc: '肩线一挺，气场就来了。' },
    { id: 's_ballet', name: '芭蕾平底鞋', cat: 'shoes', shape: 'flat', style: ['balletcore', 'french'], colors: ['nude'], color: 'nude', formality: 3, warmth: 1, cost: 65, price: 148, fit: ['comfort', 'slim'], desc: '走一天也不闹脾气。' },
    { id: 's_sandal', name: '细带凉鞋', cat: 'shoes', shape: 'sandal', style: ['cleanfit', 'y2k'], colors: ['silver'], color: 'silver', formality: 3, warmth: 1, cost: 60, price: 148, fit: ['photo', 'comfort'], desc: '脚背露出来，比例就好了。' },
    { id: 'g_bucket', name: '抽绳水桶包', cat: 'bag', shape: 'bag', style: ['gorpcore', 'minimal'], colors: ['olive'], color: 'olive', formality: 2, warmth: 2, cost: 45, price: 108, fit: [], desc: '装水杯和伞都刚好。' },
    { id: 'g_shoulder', name: '腋下包', cat: 'bag', shape: 'bag', style: ['y2k', 'cleanfit'], colors: ['black'], color: 'black', formality: 3, warmth: 1, cost: 50, price: 128, fit: [], desc: '只装得下手机和口红。' },
    { id: 'a_belt', name: '细皮带', cat: 'accessory', slot: 'waist', shape: 'belt', style: ['work', 'cleanfit'], colors: ['cocoa'], color: 'cocoa', formality: 3, warmth: 1, cost: 18, price: 58, fit: [], desc: '把比例重新分一次。' },
    { id: 'a_clip', name: '缎面发夹', cat: 'accessory', slot: 'hair', shape: 'hairclip', style: ['balletcore', 'sweet'], colors: ['butter'], color: 'butter', formality: 2, warmth: 1, cost: 12, price: 39, fit: [], desc: '夹住碎发，也夹住一点精致。' },
    { id: 'a_sun', name: '窄框墨镜', cat: 'accessory', slot: 'eyes', shape: 'sunglasses', style: ['y2k', 'cleanfit'], colors: ['black'], color: 'black', formality: 2, warmth: 1, cost: 25, price: 68, fit: [], desc: '不笑的时候很酷。' },
    { id: 'h_sheer', name: '透肤黑丝', cat: 'hosiery', shape: 'tights', style: ['work', 'y2k'], colors: ['black'], color: 'black', formality: 3, warmth: 1, cost: 15, price: 45, fit: ['formal', 'slim'], desc: '正式场合的安全牌。' },
    { id: 'h_opaque', name: '燕麦连裤袜', cat: 'hosiery', shape: 'tights', style: ['academia', 'minimal'], colors: ['cream'], color: 'cream', formality: 3, warmth: 3, cost: 22, price: 58, fit: ['comfort', 'cover'], desc: '冬天的第二条裤子。' },
    { id: 'h_fishnet', name: '网袜', cat: 'hosiery', shape: 'fishnet', style: ['y2k', 'sporty'], colors: ['black'], color: 'black', formality: 1, warmth: 1, cost: 12, price: 39, fit: ['photo', 'slim'], desc: '破一点，才像去听歌。' },
    { id: 'h_knee', name: '堆堆及膝袜', cat: 'hosiery', shape: 'knee', style: ['balletcore', 'sweet'], colors: ['butter'], color: 'butter', formality: 2, warmth: 2, cost: 10, price: 35, fit: ['soft', 'comfort'], desc: '堆在小腿，配短裙刚好。' },
    { id: 't_cardigan', name: '短款针织开衫', cat: 'top', shape: 'top', style: ['cleanfit', 'french'], colors: ['butter'], color: 'butter', formality: 3, warmth: 2, cost: 65, price: 148, fit: ['soft', 'comfort'], desc: '扣子只扣中间一颗。' },
    { id: 't_tube', name: '黑色抹胸', cat: 'top', shape: 'tube', style: ['y2k', 'cleanfit'], colors: ['black'], color: 'black', formality: 3, warmth: 1, cost: 40, price: 98, fit: ['slim', 'photo'], desc: '外面加件衬衫就能出门。' },
    { id: 't_crop', name: '短款白 T', cat: 'top', shape: 'tee', style: ['sporty', 'cleanfit'], colors: ['white'], color: 'white', formality: 2, warmth: 1, cost: 35, price: 88, fit: ['slim', 'photo'], desc: '腰线露一点，比例就出来了。' },
    { id: 't_satin', name: '香槟缎面衬衫', cat: 'top', shape: 'blouse', style: ['french', 'cleanfit'], colors: ['cream'], color: 'cream', formality: 4, warmth: 2, cost: 80, price: 188, fit: ['formal', 'tall'], desc: '灯下会有很淡的光。' },
    { id: 't_turtle', name: '燕麦高领打底', cat: 'top', shape: 'turtle', style: ['minimal', 'academia'], colors: ['cream'], color: 'cream', formality: 3, warmth: 4, cost: 60, price: 138, fit: ['cover', 'comfort'], desc: '冬天的第二层皮肤。' },
    { id: 't_oversize', name: '蓝白廓形衬衫', cat: 'top', shape: 'shirt', style: ['cleanfit', 'minimal'], colors: ['sky'], color: 'sky', formality: 3, warmth: 2, cost: 75, price: 168, fit: ['cover', 'tall'], desc: '大一号，反而更利落。' },
    { id: 't_knitvest', name: '针织背心', cat: 'top', shape: 'vest', style: ['academia', 'vintage'], colors: ['cocoa'], color: 'cocoa', formality: 3, warmth: 2, cost: 55, price: 128, fit: ['soft', 'comfort'], desc: '里面叠衬衫，学院味就出来了。' },
    { id: 'b_leather', name: '黑色皮直筒裤', cat: 'bottom', shape: 'pants', style: ['y2k', 'cleanfit'], colors: ['black'], color: 'black', formality: 4, warmth: 2, cost: 110, price: 238, fit: ['slim', 'tall'], desc: '走路会有一点声音。' },
    { id: 'b_denimskirt', name: '牛仔中裙', cat: 'bottom', shape: 'skirt', style: ['vintage', 'sweet'], colors: ['denim'], color: 'denim', formality: 2, warmth: 2, cost: 60, price: 148, fit: ['cover', 'tall'], desc: '开衩刚好方便走路。' },
    { id: 'b_tailoredshorts', name: '西装短裤', cat: 'bottom', shape: 'shorts', style: ['work', 'cleanfit'], colors: ['grey'], color: 'grey', formality: 3, warmth: 1, cost: 50, price: 118, fit: ['formal', 'slim'], desc: '夏天开庭也能穿。' },
    { id: 'b_tier', name: '层叠长裙', cat: 'bottom', shape: 'tier', style: ['french', 'sweet'], colors: ['rose'], color: 'rose', formality: 3, warmth: 2, cost: 70, price: 168, fit: ['cover', 'photo'], desc: '风一吹，一层一层地动。' },
    { id: 'b_widejeans', name: '微喇牛仔裤', cat: 'bottom', shape: 'pants', style: ['vintage', 'cleanfit'], colors: ['denim'], color: 'denim', formality: 3, warmth: 3, cost: 85, price: 188, fit: ['tall', 'slim'], desc: '裤脚盖住鞋面，腿就长了。' },
    { id: 'd_shirt', name: '卡其衬衫裙', cat: 'dress', shape: 'dress', style: ['cleanfit', 'work'], colors: ['cocoa'], color: 'cocoa', formality: 4, warmth: 2, cost: 95, price: 228, fit: ['formal', 'tall'], desc: '系根腰带就像换了件衣服。' },
    { id: 'd_knit', name: '灰色针织连衣裙', cat: 'dress', shape: 'dress', style: ['minimal', 'academia'], colors: ['grey'], color: 'grey', formality: 3, warmth: 4, cost: 90, price: 208, fit: ['cover', 'comfort'], desc: '软，但不塌。' },
    { id: 'd_wrap', name: '玫瑰裹身裙', cat: 'dress', shape: 'dress', style: ['french', 'sweet'], colors: ['rose'], color: 'rose', formality: 4, warmth: 2, cost: 100, price: 238, fit: ['slim', 'tall'], desc: '腰线是自己系出来的。' },
    { id: 'd_sundress', name: '碎花吊带太阳裙', cat: 'dress', shape: 'slip', style: ['sweet', 'french'], colors: ['butter'], color: 'butter', formality: 2, warmth: 1, cost: 70, price: 168, fit: ['slim', 'photo'], desc: '适合有太阳的下午。' },
    { id: 'd_qipao', name: '改良旗袍', cat: 'dress', shape: 'dress', style: ['newchinese', 'vintage'], colors: ['burgundy'], color: 'burgundy', formality: 4, warmth: 2, cost: 130, price: 308, fit: ['tall', 'formal'], desc: '盘扣和开衩都收着一点。' },
    { id: 'o_denimvest', name: '牛仔马甲', cat: 'outer', shape: 'vest', style: ['sporty', 'gorpcore'], colors: ['denim'], color: 'denim', formality: 3, warmth: 2, cost: 70, price: 158, fit: ['cover', 'dirty'], desc: '套在卫衣外面刚刚好。' },
    { id: 'o_trenchshort', name: '短款风衣', cat: 'outer', shape: 'coat', style: ['french', 'cleanfit'], colors: ['mustard'], color: 'mustard', formality: 4, warmth: 3, cost: 120, price: 268, fit: ['tall', 'presence'], desc: '不拖沓，但很有精神。' },
    { id: 'o_puffer', name: '轻羽绒', cat: 'outer', shape: 'jacket', style: ['gorpcore', 'sporty'], colors: ['olive'], color: 'olive', formality: 2, warmth: 5, cost: 150, price: 338, fit: ['cover', 'comfort'], desc: '冷天也能体面地出门。' },
    { id: 'o_cape', name: '羊毛斗篷', cat: 'outer', shape: 'coat', style: ['vintage', 'french'], colors: ['burgundy'], color: 'burgundy', formality: 4, warmth: 3, cost: 140, price: 318, fit: ['cover', 'presence'], desc: '把手藏起来，只露出一点袖口。' },
    { id: 's_platform', name: '厚底玛丽珍', cat: 'shoes', shape: 'mary', style: ['y2k', 'sweet'], colors: ['black'], color: 'black', formality: 3, warmth: 2, cost: 70, price: 168, fit: ['tall', 'comfort'], desc: '悄悄高五厘米。' },
    { id: 's_chelsea', name: '切尔西短靴', cat: 'shoes', shape: 'boot', style: ['work', 'cleanfit'], colors: ['cocoa'], color: 'cocoa', formality: 4, warmth: 3, cost: 85, price: 198, fit: ['comfort', 'dirty'], desc: '一脚蹬，赶地铁很快。' },
    { id: 's_runner', name: '复古跑鞋', cat: 'shoes', shape: 'sneaker', style: ['sporty', 'gorpcore'], colors: ['grey'], color: 'grey', formality: 2, warmth: 2, cost: 65, price: 148, fit: ['comfort', 'dirty'], desc: '走一天也不累。' },
    { id: 's_slipper', name: '毛绒拖鞋', cat: 'shoes', shape: 'flat', style: ['sweet', 'minimal'], colors: ['cream'], color: 'cream', formality: 1, warmth: 3, cost: 35, price: 88, fit: ['comfort', 'soft'], desc: '只在店里穿，也算造型。' },
    { id: 's_kitten', name: '猫跟单鞋', cat: 'shoes', shape: 'heel', style: ['work', 'french'], colors: ['nude'], color: 'nude', formality: 4, warmth: 1, cost: 70, price: 168, fit: ['formal', 'comfort'], desc: '能走路，也能撑场面。' },
    { id: 'g_saddle', name: '马鞍包', cat: 'bag', shape: 'bag', style: ['vintage', 'french'], colors: ['cocoa'], color: 'cocoa', formality: 3, warmth: 2, cost: 55, price: 138, fit: [], desc: '旧旧的，但很耐看。' },
    { id: 'g_backpack', name: '迷你双肩包', cat: 'bag', shape: 'backpack', style: ['gorpcore', 'sporty'], colors: ['olive'], color: 'olive', formality: 2, warmth: 2, cost: 50, price: 128, fit: [], desc: '两只手都空出来。' },
    { id: 'g_clutch', name: '缎面手拿包', cat: 'bag', shape: 'clutch', style: ['y2k', 'french'], colors: ['burgundy'], color: 'burgundy', formality: 4, warmth: 1, cost: 40, price: 108, fit: [], desc: '只装一支口红和钥匙。' },
    { id: 'a_chain', name: '细金链', cat: 'accessory', slot: 'neck', shape: 'necklace', variant: 'chain', style: ['cleanfit', 'minimal'], colors: ['silver'], color: 'silver', formality: 3, warmth: 1, cost: 20, price: 58, fit: [], desc: '露锁骨的时候刚刚好。' },
    { id: 'a_choker', name: '黑丝绒 Choker', cat: 'accessory', slot: 'neck', shape: 'necklace', variant: 'choker', style: ['y2k', 'sweet'], colors: ['black'], color: 'black', formality: 2, warmth: 1, cost: 15, price: 45, fit: [], desc: '一小圈，就把风格定住了。' },
    { id: 'a_pendant', name: '月亮吊坠', cat: 'accessory', slot: 'neck', shape: 'necklace', variant: 'pendant', style: ['vintage', 'cleanfit'], colors: ['silver'], color: 'silver', formality: 3, warmth: 1, cost: 25, price: 68, fit: [], desc: '低头的时候会闪一下。' },
    { id: 'a_collar', name: '珍珠领', cat: 'accessory', slot: 'neck', shape: 'necklace', variant: 'collar', style: ['academia', 'french'], colors: ['cream'], color: 'cream', formality: 3, warmth: 1, cost: 28, price: 78, fit: [], desc: '像从旧照片里借来的。' },
    { id: 'a_stud', name: '珍珠耳钉', cat: 'accessory', slot: 'ear', shape: 'earrings', variant: 'stud', style: ['work', 'minimal'], colors: ['cream'], color: 'cream', formality: 3, warmth: 1, cost: 15, price: 45, fit: [], desc: '不抢戏，但很干净。' },
    { id: 'a_hoop', name: '金属圈耳环', cat: 'accessory', slot: 'ear', shape: 'earrings', variant: 'hoop', style: ['y2k', 'cleanfit'], colors: ['silver'], color: 'silver', formality: 2, warmth: 1, cost: 16, price: 48, fit: [], desc: '转头的幅度都会变大。' },
    { id: 'a_drop', name: '长坠耳环', cat: 'accessory', slot: 'ear', shape: 'earrings', variant: 'drop', style: ['french', 'sweet'], colors: ['burgundy'], color: 'burgundy', formality: 3, warmth: 1, cost: 18, price: 52, fit: [], desc: '走路的时候会轻轻晃。' },
    { id: 'a_cuff', name: '耳骨夹', cat: 'accessory', slot: 'ear', shape: 'earrings', variant: 'cuff', style: ['y2k', 'sporty'], colors: ['silver'], color: 'silver', formality: 2, warmth: 1, cost: 12, price: 39, fit: [], desc: '不用打耳洞也能戴。' },
    { id: 'a_hairbow', name: '缎面蝴蝶结', cat: 'accessory', slot: 'hair', shape: 'hair', variant: 'bow', style: ['balletcore', 'sweet'], colors: ['rose'], color: 'rose', formality: 2, warmth: 1, cost: 12, price: 39, fit: [], desc: '夹在低马尾上。' },
    { id: 'a_scrunchie', name: '大肠发圈', cat: 'accessory', slot: 'hair', shape: 'hair', variant: 'scrunchie', style: ['sweet', 'sporty'], colors: ['lavender'], color: 'lavender', formality: 2, warmth: 1, cost: 8, price: 28, fit: [], desc: '随手一扎就很好看。' },
    { id: 'a_claw', name: '鲨鱼夹', cat: 'accessory', slot: 'hair', shape: 'hair', variant: 'claw', style: ['minimal', 'work'], colors: ['cocoa'], color: 'cocoa', formality: 2, warmth: 1, cost: 14, price: 42, fit: [], desc: '三秒出门。' },
    { id: 'a_headband', name: '发箍', cat: 'accessory', slot: 'hair', shape: 'hair', variant: 'headband', style: ['academia', 'french'], colors: ['black'], color: 'black', formality: 2, warmth: 1, cost: 10, price: 35, fit: [], desc: '把碎发都收进去。' },
    { id: 'a_hairpin', name: '一字夹', cat: 'accessory', slot: 'hair', shape: 'hair', variant: 'pin', style: ['cleanfit', 'y2k'], colors: ['silver'], color: 'silver', formality: 2, warmth: 1, cost: 6, price: 25, fit: [], desc: '越简单越常用。' },
    { id: 'a_bangle', name: '金属手镯', cat: 'accessory', slot: 'wrist', shape: 'wrist', variant: 'bangle', style: ['cleanfit', 'work'], colors: ['silver'], color: 'silver', formality: 3, warmth: 1, cost: 20, price: 58, fit: [], desc: '敲键盘的时候会响。' },
    { id: 'a_beads', name: '串珠手链', cat: 'accessory', slot: 'wrist', shape: 'wrist', variant: 'beads', style: ['sweet', 'vintage'], colors: ['rose'], color: 'rose', formality: 2, warmth: 1, cost: 12, price: 39, fit: [], desc: '一颗一颗，颜色很轻。' },
    { id: 'a_watch', name: '细表', cat: 'accessory', slot: 'wrist', shape: 'wrist', variant: 'watch', style: ['work', 'minimal'], colors: ['cocoa'], color: 'cocoa', formality: 4, warmth: 1, cost: 60, price: 158, fit: [], desc: '看时间的时候很体面。' },
    { id: 'a_ring', name: '素圈戒指', cat: 'accessory', slot: 'wrist', shape: 'wrist', variant: 'ring', style: ['minimal', 'cleanfit'], colors: ['silver'], color: 'silver', formality: 3, warmth: 1, cost: 18, price: 52, fit: [], desc: '只戴一只就够。' },
    { id: 'a_chainbelt', name: '链条腰带', cat: 'accessory', slot: 'waist', shape: 'chainbelt', style: ['y2k', 'vintage'], colors: ['silver'], color: 'silver', formality: 3, warmth: 1, cost: 22, price: 68, fit: [], desc: '松松地挂在胯上。' },
    { id: 'a_brooch', name: '复古胸针', cat: 'accessory', slot: 'other', shape: 'brooch', style: ['vintage', 'french'], colors: ['mustard'], color: 'mustard', formality: 3, warmth: 1, cost: 25, price: 78, fit: [], desc: '别在西装领上。' },
    { id: 'h_ankle', name: '白色短袜', cat: 'hosiery', shape: 'ankle', style: ['academia', 'sporty'], colors: ['white'], color: 'white', formality: 2, warmth: 1, cost: 8, price: 28, fit: ['comfort'], desc: '配乐福鞋刚刚好。' },
    { id: 'h_legging', name: '黑色打底裤', cat: 'hosiery', shape: 'tights', style: ['minimal', 'sporty'], colors: ['black'], color: 'black', formality: 2, warmth: 3, cost: 25, price: 68, fit: ['cover', 'comfort'], desc: '裙子和短裤下面都能穿。' }
  ];

  D.ITEMS_BY_ID = {};
  D.ITEMS.forEach(function (it) { D.ITEMS_BY_ID[it.id] = it; });

  D.STARTING_INVENTORY = [
    't_knit', 't_shirt', 't_tee', 't_blouse',
    'b_jeans', 'b_skirt',
    'd_flower', 'd_black',
    'o_trench',
    's_mary', 's_loafer', 's_sneaker',
    'g_tote', 'a_scarf', 'h_sheer', 'a_chain'
  ];

  D.LOTS = [
    { id: 'lot_work', name: '通勤补货包', tagline: '白衬衫 + 阔腿裤，一周不用想', items: ['t_shirt', 'b_wide', 's_loafer', 'g_black'], cost: 250, style: 'work' },
    { id: 'lot_french', name: '法式上新包', tagline: '碎花、茶歇裙、玛丽珍，温柔一套', items: ['t_blouse', 'd_flower', 's_mary', 'a_beret'], cost: 240, style: 'french' },
    { id: 'lot_y2k', name: '甜酷少女包', tagline: '吊带、短靴、小包，拍照很炸', items: ['t_cami', 'd_y2k', 's_boot', 'g_mini'], cost: 200, style: 'y2k' },
    { id: 'lot_cn', name: '新中式限定', tagline: '旗袍裙 + 珍珠 + 燕麦西装', items: ['d_cn', 'a_pearl', 'o_blazer'], cost: 260, style: 'newchinese' },
    { id: 'lot_casual', name: '周末休闲包', tagline: '卫衣、短裤、球鞋，舒服就完事', items: ['t_hoodie', 'b_shorts', 's_sneaker', 'o_denim'], cost: 215, style: 'sporty' },
    { id: 'lot_minimal', name: '极简基础包', tagline: '针织、牛仔、开衫，怎么搭都稳', items: ['t_knit', 'b_jeans', 'o_cardigan', 's_loafer'], cost: 275, style: 'minimal' },
    { id: 'lot_cleanfit', name: '清冷通勤包', tagline: '马甲、短西装、细皮带，利落但不凶', items: ['t_vest', 'o_tailored', 's_loafer', 'g_shoulder', 'h_sheer'], cost: 285, style: 'cleanfit' },
    { id: 'lot_ballet', name: '芭蕾约会包', tagline: '胸衣、缎面裙、平底鞋，温柔有记忆点', items: ['t_corset', 'd_slip', 's_ballet', 'a_clip', 'h_knee'], cost: 205, style: 'balletcore' },
    { id: 'lot_gorpcore', name: '山系周末包', tagline: '工装、绗缝、水桶包，舒服又耐造', items: ['b_cargo', 'o_quilt', 'g_bucket', 's_sneaker'], cost: 260, style: 'gorpcore' },
    { id: 'lot_academia', name: '学院开学包', tagline: '针织背心、牛仔中裙、短袜，干净又乖', items: ['t_knitvest', 'b_denimskirt', 's_chelsea', 'a_headband', 'h_ankle'], cost: 185, style: 'academia' },
    { id: 'lot_party', name: '夜色派对包', tagline: '抹胸、皮裤、厚底鞋，灯光下很亮', items: ['t_tube', 'b_leather', 's_platform', 'a_choker', 'a_hoop'], cost: 215, style: 'y2k' },
    { id: 'lot_outdoor', name: '山系进阶包', tagline: '轻羽绒、微喇牛仔、跑鞋，冷天也能走', items: ['o_puffer', 'b_widejeans', 's_runner', 'g_backpack'], cost: 300, style: 'gorpcore' },
    { id: 'lot_weekend', name: '周末甜风包', tagline: '开衫、太阳裙、毛绒鞋，软软的一天', items: ['t_cardigan', 'd_sundress', 's_slipper', 'a_hairbow'], cost: 155, style: 'sweet' },
    { id: 'lot_power', name: '气场通勤包', tagline: '缎面衬衫、短西装、猫跟鞋，开会能撑住', items: ['t_satin', 'b_tailoredshorts', 'o_trenchshort', 's_kitten', 'a_watch'], cost: 325, style: 'work' },
    { id: 'lot_qipao', name: '新中式雅集包', tagline: '改良旗袍、珍珠领、胸针，收着一点亮', items: ['d_qipao', 'a_collar', 'a_brooch', 's_kitten'], cost: 215, style: 'newchinese' }
  ];

  D.LOTS_BY_ID = {};
  D.LOTS.forEach(function (l) { D.LOTS_BY_ID[l.id] = l; });

  D.MARKETING = {
    note: { id: 'note', name: '发小红书笔记', icon: '📝', cost: 0, traffic: 1.08, fans: 2, rep: 1, desc: '0 元 · 客流 +8% · 粉丝 +2' },
    live: { id: 'live', name: '直播带货', icon: '📺', cost: 300, traffic: 1.25, fans: 5, rep: 1, desc: '¥300 · 客流 +25% · 粉丝 +5' },
    flyer: { id: 'flyer', name: '街坊传单', icon: '📮', cost: 150, traffic: 1.15, fans: 1, rep: 0, desc: '¥150 · 客流 +15% · 粉丝 +1' },
    none: { id: 'none', name: '今天不营销', icon: '🍵', cost: 0, traffic: 1.0, fans: 0, rep: 0, desc: '省钱，靠熟客' }
  };

  D.PRICING = {
    budget: { id: 'budget', name: '平价走量', priceMult: 0.85, traffic: 1.15, scoreBonus: 3, desc: '好卖，但利润薄' },
    standard: { id: 'standard', name: '正常定价', priceMult: 1.0, traffic: 1.0, scoreBonus: 0, desc: '不功不过' },
    premium: { id: 'premium', name: '高端路线', priceMult: 1.2, traffic: 0.85, scoreBonus: -3, desc: '利润高，但客流少' }
  };

  D.WEATHER = {
    sunny: { id: 'sunny', name: '晴', icon: '☀', traffic: 1.0, desc: '适合把橱窗打开' },
    cloudy: { id: 'cloudy', name: '多云', icon: '☁', traffic: 0.92, desc: '街上人不算少' },
    rain: { id: 'rain', name: '小雨', icon: '☂', traffic: 0.72, desc: '适合做线上' },
    hot: { id: 'hot', name: '闷热', icon: '☼', traffic: 0.95, desc: '大家都不想出门' },
    cold: { id: 'cold', name: '降温', icon: '❄', traffic: 0.9, desc: '外套会好卖' },

    // 突发天气：基础预报之外，按季节随机出现
    thunder: {
      id: 'thunder', name: '雷阵雨', icon: '⚡', traffic: 0.62, event: true,
      desc: '雨点砸在橱窗上，街上人少了一半', patience: -1,
      demand: { cats: ['outer', 'bag'], bonus: 2, label: '外套 / 包更受欢迎' },
      response: { id: 'umbrella', label: '门口摆伞架', cost: 60, traffic: 1.25, rep: 1, note: '进店的人收伞从容，口碑 +1' }
    },
    downpour: {
      id: 'downpour', name: '暴雨', icon: '☂', traffic: 0.5, event: true,
      desc: '雨大到看不清街对面，适合把客人往线上引', patience: -1,
      demand: { cats: ['outer', 'bag'], bonus: 3, label: '防水外套 / 大包更受欢迎' },
      response: { id: 'umbrella', label: '门口摆伞架 + 防滑垫', cost: 80, traffic: 1.35, rep: 2, note: '门口不积水，客人愿意多待一会' }
    },
    heatwave: {
      id: 'heatwave', name: '热浪', icon: '☼', traffic: 0.82, event: true,
      desc: '柏油路都在冒热气，清凉款反而有人问', patience: 0,
      demand: { cats: ['top', 'dress'], bonus: 2, label: '短袖 / 连衣裙更受欢迎' },
      response: { id: 'ac', label: '开空调', cost: 100, traffic: 1.22, rep: 1, note: '店里凉快，客人愿意多试两套' }
    },
    coldwave: {
      id: 'coldwave', name: '寒潮', icon: '❄', traffic: 0.78, event: true,
      desc: '一阵冷风把行人吹得直缩脖子，外套最好卖', patience: -1,
      demand: { cats: ['outer'], bonus: 3, label: '外套 / 大衣更受欢迎' },
      response: { id: 'heater', label: '开暖气', cost: 100, traffic: 1.25, rep: 1, note: '推门就是暖风，试衣间不再冷冰冰' }
    },
    gale: {
      id: 'gale', name: '大风', icon: '≋', traffic: 0.85, event: true,
      desc: '风把门口立牌吹得哐哐响，橱窗得收一收', patience: 0,
      demand: { cats: ['outer'], bonus: 2, label: '防风外套更受欢迎' },
      response: { id: 'tie', label: '加固橱窗和立牌', cost: 40, traffic: 1.15, rep: 1, note: '门口不再东倒西歪，路人敢靠近了' }
    },
    fog: {
      id: 'fog', name: '大雾', icon: '☁', traffic: 0.74, event: true,
      desc: '雾把街角吞掉了，得让店门口亮一点', patience: -1,
      demand: { cats: ['accessory'], bonus: 2, label: '亮色配饰更受欢迎' },
      response: { id: 'light', label: '点亮门口灯', cost: 40, traffic: 1.2, rep: 1, note: '暖黄的门口灯像雾里的路标' }
    },
    snow: {
      id: 'snow', name: '初雪', icon: '❄', traffic: 0.82, event: true,
      desc: '第一场雪落下来，大家都想买件暖和外套', patience: 0,
      demand: { cats: ['outer'], bonus: 3, label: '外套 / 围巾更受欢迎' },
      response: { id: 'salt', label: '门口撒融雪盐', cost: 50, traffic: 1.15, rep: 2, note: '门口不滑，进店的人也会夸一句' }
    },
    rainbow: {
      id: 'rainbow', name: '雨后彩虹', icon: '☀', traffic: 1.22, event: true,
      desc: '雨停了，彩虹挂在店外，街上全是拍照的人', patience: 1,
      demand: { cats: ['accessory', 'bag'], bonus: 2, label: '上镜配饰 / 包更受欢迎' }
    }
  };

  /* 突发天气池：季节 + 权重，result 指向 D.WEATHER 里的实际天气 */
  D.WEATHER_EVENTS = [
    {
      id: 'thunder', weather: 'thunder', seasons: ['spring', 'summer', 'autumn'], weight: 14,
      title: '午后雷阵雨',
      text: '上午还晒着太阳，午后一声闷雷，雨就下来了。街上的人全躲到了屋檐下。',
      tip: '客流会掉一截；门口有伞架的话，客人的耐心会好很多。'
    },
    {
      id: 'downpour', weather: 'downpour', seasons: ['summer', 'autumn'], weight: 8,
      title: '暴雨突袭',
      text: '云层压得很低，雨像倒下来一样。今天适合把客人从线上引过来。',
      tip: '客流大幅下降；防水外套和大包会更好卖。'
    },
    {
      id: 'heatwave', weather: 'heatwave', seasons: ['summer'], weight: 16,
      title: '热浪',
      text: '蝉鸣突然停了，柏油路开始冒热气。谁都不想在外面多站一秒。',
      tip: '短袖和连衣裙更好卖；店里开空调能留住客人。'
    },
    {
      id: 'coldwave', weather: 'coldwave', seasons: ['autumn', 'winter'], weight: 14,
      title: '寒潮',
      text: '天气预报说降温，谁也没想到降得这么狠。风从门缝里钻进来。',
      tip: '外套会好卖；暖气能让试衣间不再冷冰冰。'
    },
    {
      id: 'gale', weather: 'gale', seasons: ['spring', 'autumn'], weight: 10,
      title: '大风',
      text: '一阵横风吹过，门口立牌哐当倒地，橱窗里的衣架也晃了起来。',
      tip: '客流小跌；加固橱窗和立牌可以挽回一部分。'
    },
    {
      id: 'fog', weather: 'fog', seasons: ['autumn', 'winter'], weight: 8,
      title: '大雾',
      text: '雾从街口漫过来，对面的招牌只剩一团模糊的暖光。',
      tip: '客流下降、客人更没耐心；点亮门口灯会好一些。'
    },
    {
      id: 'snowfall', weather: 'snow', seasons: ['winter'], weight: 16,
      title: '初雪',
      text: '第一场雪落在橱窗上，路过的孩子停下来哈气画小人。',
      tip: '外套最好卖；门口撒融雪盐既安全又攒口碑。'
    },
    {
      id: 'rainbow', weather: 'rainbow', seasons: ['spring', 'summer'], weight: 6,
      title: '雨后彩虹',
      text: '雨停了，一道彩虹挂在街角。拍照的人堵在门口，顺便就进来了。',
      tip: '难得的好天气：客流上涨、客人更有耐心，上镜配饰会好卖。'
    }
  ];

  D.TRENDS = {
    work: { id: 'work', name: '通勤风' },
    minimal: { id: 'minimal', name: '极简风' },
    french: { id: 'french', name: '法式风' },
    sweet: { id: 'sweet', name: '甜美风' },
    vintage: { id: 'vintage', name: '复古风' },
    sporty: { id: 'sporty', name: '运动风' },
    y2k: { id: 'y2k', name: '千禧风' },
    cleanfit: { id: 'cleanfit', name: '清冷风' },
    newchinese: { id: 'newchinese', name: '新中式' }
  };

  D.CUSTOMERS = [
    {
      id: 'lin', name: '林小满', age: 24, job: '广告公司新人', occasion: '面试',
      formality: 5, budget: 600, styles: ['work', 'minimal'], avoid: ['sweet', 'sporty'],
      bodyNeed: 'tall', bodyLabel: '想显高、显得专业', colorPref: 'neutral', styling: true, reserveDay: 1,
      wish: 'polish',
      wishLine: '我不想让人一看就觉得我是来实习的。',
      story: '明天要去 dream company 面试，衣柜里全是卫衣。',
      request: '帮我搭一套面试战袍，专业但别太老气。',
      portrait: { skin: '#F2D3B8', hair: '#2E2A27', hairStyle: 'bob', top: '#E8E2D6', expression: 'calm', accessory: 'glasses' }
    },
    {
      id: 'guo', name: '小郭', age: 24, job: '程序员', occasion: '通勤',
      formality: 3, budget: 480, styles: ['minimal', 'sporty'], avoid: ['sweet'],
      bodyNeed: 'comfort', bodyLabel: '舒服、不用想', colorPref: 'neutral', styling: false, reserveDay: 1,
      wish: 'comfort',
      wishLine: '别让我一整天都在偷偷拉衣服。',
      story: '每天骑车上班，想要不用想就能穿的套装。',
      request: '最好一套能直接穿去上班，别太贵。',
      portrait: { skin: '#F2D3B8', hair: '#2E2A27', hairStyle: 'short', top: '#6B7F95', expression: 'calm', accessory: 'glasses' }
    },
    {
      id: 'zhou', name: '周雨', age: 28, job: '品牌设计师', occasion: '约会',
      formality: 3, budget: 800, styles: ['french', 'sweet'], avoid: ['sporty'],
      bodyNeed: 'slim', bodyLabel: '显瘦、有氛围', colorPref: 'warm', styling: true, reserveDay: 2,
      wish: 'bright',
      wishLine: '我想让他一眼就在人群里看见我。',
      story: '分手三个月，第一次约会，想被夸好看。',
      request: '想穿得温柔一点，但不要用力过猛。',
      portrait: { skin: '#F5DCC6', hair: '#6B4F3A', hairStyle: 'wavy', top: '#D99A9A', expression: 'happy', accessory: 'earrings' }
    },
    {
      id: 'laochen', name: '老陈', age: 40, job: '花店老板', occasion: '市集',
      formality: 2, budget: 420, styles: ['vintage', 'minimal'], avoid: ['y2k'],
      bodyNeed: 'dirty', bodyLabel: '耐脏、方便搬花', colorPref: 'neutral', styling: false, reserveDay: 2,
      wish: 'practical',
      wishLine: '搬花的时候，我不想再怕弄脏衣服。',
      story: '周末市集摆摊，想要舒服又有老板样子。',
      request: '帮我配一套搬花也不心疼的衣服。',
      portrait: { skin: '#D9B08C', hair: '#2E2A27', hairStyle: 'short', top: '#6B4F3A', expression: 'calm', accessory: 'none' }
    },
    {
      id: 'chen', name: '陈姐', age: 35, job: '全职妈妈', occasion: '日常',
      formality: 2, budget: 500, styles: ['minimal', 'sporty'], avoid: ['y2k'],
      bodyNeed: 'cover', bodyLabel: '遮肉、方便活动', colorPref: 'neutral', styling: true, reserveDay: 3,
      wish: 'comfort',
      wishLine: '我得能追上孩子，不能只站着好看。',
      story: '生完孩子后衣柜都穿不下了，想找回自己。',
      request: '不要太紧，接孩子也能跑得动。',
      portrait: { skin: '#EBC9A9', hair: '#2E2A27', hairStyle: 'bun', top: '#8A9A7B', expression: 'calm', accessory: 'none' }
    },
    {
      id: 'xiaolu', name: '小鹿', age: 19, job: '大一学生', occasion: '开学',
      formality: 2, budget: 350, styles: ['sweet', 'sporty'], avoid: ['work'],
      bodyNeed: 'slim', bodyLabel: '显瘦、预算有限', colorPref: 'warm', styling: false, reserveDay: 3,
      wish: 'budget',
      wishLine: '预算就这么多，我还不想穿得像地摊货。',
      story: '开学想换个风格，但预算只有 250。',
      request: '想要一套看起来不便宜的学生穿搭。',
      portrait: { skin: '#F2D3B8', hair: '#6B4F3A', hairStyle: 'pixie', top: '#D99A9A', expression: 'happy', accessory: 'none' }
    },
    {
      id: 'ali', name: '阿梨', age: 22, job: '大学生', occasion: '音乐节',
      formality: 2, budget: 500, styles: ['y2k', 'sweet'], avoid: ['work'],
      bodyNeed: 'photo', bodyLabel: '出片、显高', colorPref: 'cool', styling: true, reserveDay: 4,
      wish: 'bright',
      wishLine: '音乐节，我想在人群里被看见。',
      story: '要去音乐节，想要拍照很炸的搭配。',
      request: '帮我搭一套能在人群里被看到的。',
      portrait: { skin: '#F2D3B8', hair: '#B7A6C9', hairStyle: 'ponytail', top: '#E3B23C', expression: 'happy', accessory: 'earrings' }
    },
    {
      id: 'xiaok', name: '小K', age: 26, job: '带货主播', occasion: '直播',
      formality: 3, budget: 900, styles: ['sweet', 'y2k'], avoid: ['vintage'],
      bodyNeed: 'photo', bodyLabel: '上镜、有记忆点', colorPref: 'warm', styling: true, reserveDay: 4,
      wish: 'unique',
      wishLine: '直播镜头一开，我不想和别的主播撞款。',
      story: '今晚直播要上新，想穿得有记忆点。',
      request: '要显眼，但不能像去蹦迪。',
      portrait: { skin: '#F2D3B8', hair: '#D99A9A', hairStyle: 'braid', top: '#C97B63', expression: 'happy', accessory: 'none' }
    },
    {
      id: 'he', name: '何工', age: 29, job: '建筑师', occasion: '看展',
      formality: 3, budget: 800, styles: ['minimal', 'vintage'], avoid: ['sweet'],
      bodyNeed: 'tall', bodyLabel: '利落、显高', colorPref: 'neutral', styling: true, reserveDay: 5,
      wish: 'polish',
      wishLine: '我想看起来像真的懂这个展。',
      story: '周末去看建筑展，想穿得像个懂行的人。',
      request: '不要太正式，但要有轮廓感。',
      portrait: { skin: '#F5DCC6', hair: '#2E2A27', hairStyle: 'short', top: '#6B4F3A', expression: 'calm', accessory: 'glasses' }
    },
    {
      id: 'tang', name: '唐唐', age: 28, job: '咖啡师', occasion: '日常',
      formality: 2, budget: 420, styles: ['minimal', 'vintage'], avoid: ['y2k'],
      bodyNeed: 'comfort', bodyLabel: '舒服、耐脏', colorPref: 'neutral', styling: false, reserveDay: 5,
      wish: 'comfort',
      wishLine: '站一天吧台，脚和腰都得舒服。',
      story: '每天在吧台站八小时，衣服要能动。',
      request: '帮我配一套上班和下班都能穿的。',
      portrait: { skin: '#EBC9A9', hair: '#6B4F3A', hairStyle: 'bun', top: '#8A9A7B', expression: 'calm', accessory: 'none' }
    },
    {
      id: 'nana', name: '娜娜', age: 27, job: '准新娘', occasion: '婚礼',
      formality: 5, budget: 1500, styles: ['french', 'sweet'], avoid: ['sporty'],
      bodyNeed: 'tall', bodyLabel: '显高、能走路', colorPref: 'warm', styling: true, reserveDay: 6,
      wish: 'unique',
      wishLine: '敬酒服要上镜，最好别人没穿过。',
      story: '婚礼前最后一次试纱，想搭一双能走路的高跟鞋。',
      request: '帮我搭一套敬酒服，要上镜，也要能撑到散场。',
      portrait: { skin: '#F5DCC6', hair: '#2E2A27', hairStyle: 'wavy', top: '#FFFFFF', expression: 'happy', accessory: 'earrings' }
    },
    {
      id: 'wang', name: '王阿姨', age: 52, job: '街坊', occasion: '喝喜酒',
      formality: 4, budget: 600, styles: ['vintage', 'newchinese'], avoid: ['sporty'],
      bodyNeed: 'cover', bodyLabel: '遮手臂、喜庆', colorPref: 'warm', styling: true, reserveDay: 6,
      wish: 'polish',
      wishLine: '喝喜酒，体面就行，别太花。',
      story: '侄女结婚，想穿得喜庆但不抢新娘风头。',
      request: '帮我选一套喝喜酒的衣服，别太花。',
      portrait: { skin: '#EBC9A9', hair: '#6B4F3A', hairStyle: 'short', top: '#C97B63', expression: 'calm', accessory: 'pearl' }
    },
    {
      id: 'qi', name: '齐姐', age: 33, job: '财务主管', occasion: '通勤',
      formality: 4, budget: 500, styles: ['work', 'minimal'], avoid: ['y2k'],
      bodyNeed: 'comfort', bodyLabel: '得体、舒服', colorPref: 'neutral', styling: false, reserveDay: 6,
      wish: 'comfort',
      wishLine: '通勤衣服最好不用熨，早上能多睡十分钟。',
      story: '月底加班，想穿得舒服又不能让领导觉得随意。',
      request: '帮我搭一套通勤，最好不用熨。',
      portrait: { skin: '#EBC9A9', hair: '#2E2A27', hairStyle: 'bun', top: '#E8E2D6', expression: 'calm', accessory: 'none' }
    },
    {
      id: 'su', name: '苏老师', age: 30, job: '中学教师', occasion: '见家长',
      formality: 4, budget: 700, styles: ['newchinese', 'minimal'], avoid: ['y2k'],
      bodyNeed: 'formal', bodyLabel: '得体、温柔', colorPref: 'cool', styling: true, reserveDay: 7,
      wish: 'polish',
      wishLine: '见家长，我想看起来乖一点、稳一点。',
      story: '第一次见男朋友父母，不能太时髦也不能太随便。',
      request: '帮我搭一套见家长的战袍，要乖一点。',
      portrait: { skin: '#F5DCC6', hair: '#2E2A27', hairStyle: 'long', top: '#D8C9B8', expression: 'calm', accessory: 'pearl' }
    },
    {
      id: 'mimi', name: '咪咪', age: 23, job: '宠物店店员', occasion: '约会',
      formality: 3, budget: 450, styles: ['sweet', 'french'], avoid: ['work'],
      bodyNeed: 'photo', bodyLabel: '可爱、上镜', colorPref: 'warm', styling: false, reserveDay: 7,
      wish: 'bright',
      wishLine: '想甜一点，但别像小朋友。',
      story: '下班直接去约会，想从工服里逃出来。',
      request: '帮我搭一套甜甜的，但别太幼稚。',
      portrait: { skin: '#F2D3B8', hair: '#D99A9A', hairStyle: 'braid', top: '#B7A6C9', expression: 'happy', accessory: 'earrings' }
    },
    {
      id: 'gu', name: '顾律师', age: 32, job: '律师', occasion: '开庭',
      formality: 5, budget: 1200, styles: ['work', 'minimal'], avoid: ['sweet'],
      bodyNeed: 'presence', bodyLabel: '气场、专业', colorPref: 'neutral', styling: true, reserveDay: 7,
      wish: 'polish',
      wishLine: '开庭要有气场，但不能咄咄逼人。',
      story: '下周开庭，想穿得让客户放心。',
      request: '帮我搭一套有气场但不咄咄逼人的。',
      portrait: { skin: '#F5DCC6', hair: '#2E2A27', hairStyle: 'bob', top: '#2E2A27', expression: 'calm', accessory: 'glasses' }
    }
  ];

  D.CUSTOMERS_BY_ID = {};
  D.CUSTOMERS.forEach(function (c) { D.CUSTOMERS_BY_ID[c.id] = c; });

  D.DAYS = [
    {
      day: 1, weather: 'sunny', trend: 'work', baseTraffic: 8, customerCount: 2,
      force: ['lin', 'guo'], lots: ['lot_work', 'lot_french', 'lot_casual'],
      goal: { type: 'sales', value: 1, label: '完成 1 单成交' },
      eventType: 'opening', eventTitle: '开业第一天',
      eventText: '门口的花篮还没撤，第一位客人推门进来了。',
      tip: '先别追求完美，成交比高分重要。'
    },
    {
      day: 2, weather: 'cloudy', trend: 'french', baseTraffic: 10, customerCount: 2,
      force: ['zhou', 'laochen'], lots: ['lot_french', 'lot_minimal', 'lot_ballet'],
      goal: { type: 'sales', value: 2, label: '完成 2 单成交' },
      eventType: 'flower', eventTitle: '花店老板娘来串门',
      eventText: '隔壁花店老板娘说，今天街上人不少，她帮你多看了两眼橱窗。',
      tip: '橱窗主推的单品，会吸引喜欢同风格的顾客。'
    },
    {
      day: 3, weather: 'rain', trend: 'minimal', baseTraffic: 6, customerCount: 2,
      force: ['chen', 'xiaolu'], lots: ['lot_minimal', 'lot_academia', 'lot_cleanfit'],
      goal: { type: 'fans', value: 4, label: '粉丝达到 4 位' },
      eventType: 'rain', eventTitle: '下雨天',
      eventText: '雨点敲着玻璃，街上的人少了一半。今天适合发笔记，把客人从线上捞回来。',
      tip: '发小红书笔记 0 成本，雨天还会多涨粉。'
    },
    {
      day: 4, weather: 'sunny', trend: 'y2k', baseTraffic: 12, customerCount: 2,
      force: ['ali', 'xiaok'], lots: ['lot_y2k', 'lot_party', 'lot_french'],
      goal: { type: 'styleScore', value: 80, label: '做出 80 分以上的搭配' },
      eventType: 'influencer', eventTitle: '小红书博主探店',
      eventText: '一个穿搭博主推门进来，说想看看你的橱窗。她可能会把你的搭配发出去。',
      tip: '今天努力把搭配分做到 80 以上。'
    },
    {
      day: 5, weather: 'cloudy', trend: 'vintage', baseTraffic: 9, customerCount: 2,
      force: ['he', 'tang'], lots: ['lot_minimal', 'lot_gorpcore', 'lot_outdoor'],
      goal: { type: 'profit', value: 250, label: '今日利润达到 ¥250' },
      eventType: 'competitor', eventTitle: '对手店开业',
      eventText: '街角新开了一家店，喇叭从早响到晚。今天客流会少一成，得靠老客和搭配留住人。',
      tip: '利润 = 营业额 − 进货 − 营销 − 房租。'
    },
    {
      day: 6, weather: 'sunny', trend: 'newchinese', baseTraffic: 11, customerCount: 3,
      force: ['nana', 'wang', 'qi'], lots: ['lot_cn', 'lot_qipao', 'lot_french'],
      goal: { type: 'revenue', value: 1000, label: '今日营业额达到 ¥1,000' },
      eventType: 'wedding', eventTitle: '婚礼大客户',
      eventText: '一位新娘和两位阿姨同时进店，今天店里会很热闹。',
      tip: '大客户预算高，但要求也高，先看清场合和禁忌。'
    },
    {
      day: 7, weather: 'sunny', trend: 'sweet', baseTraffic: 14, customerCount: 3,
      force: ['su', 'mimi', 'gu'], lots: ['lot_cn', 'lot_power', 'lot_weekend'],
      goal: { type: 'revenue', value: 1200, label: '今日营业额达到 ¥1,200' },
      eventType: 'market', eventTitle: '周末市集',
      eventText: '周末市集开到了店门口，人流比平时多两成。最后一天，冲一把。',
      tip: '今天结束后会生成你的 7 天小店总结卡。'
    }
  ];

  /* 季节：4 季 × 7 天循环，第 8 天进入下一季 */
  D.SEASONS = [
    {
      id: 'spring', name: '春', icon: '🌸', short: '春',
      trends: ['french', 'sweet', 'work'],
      note: '轻薄、浅色、花开'
    },
    {
      id: 'summer', name: '夏', icon: '☀', short: '夏',
      trends: ['y2k', 'cleanfit', 'sporty'],
      note: '短袖、吊带、清爽'
    },
    {
      id: 'autumn', name: '秋', icon: '🍂', short: '秋',
      trends: ['vintage', 'academia', 'minimal'],
      note: '叠穿、大地色、针织'
    },
    {
      id: 'winter', name: '冬', icon: '❄', short: '冬',
      trends: ['newchinese', 'gorpcore', 'work'],
      note: '外套、羊毛、深色'
    }
  ];

  /* 节日：每季 1 个，落在季内第 N 天 */
  D.FESTIVALS = [
    {
      id: 'sakura', name: '樱花祭', season: 'spring', dayInSeason: 4,
      trend: 'french', traffic: 1.2, priceMult: 1.10,
      eventText: '门口的樱花开了，街上全是拍照的人。浅色、法式款今天最上镜。',
      tip: '樱花祭：客流 +20%，法式款溢价 +10%。'
    },
    {
      id: 'graduation', name: '毕业季', season: 'summer', dayInSeason: 3,
      trend: 'cleanfit', traffic: 1.15, priceMult: 1.10,
      eventText: '毕业照和入职照挤在同一天，清冷干净的搭配最好卖。',
      tip: '毕业季：客流 +15%，清冷/通勤款溢价 +10%。'
    },
    {
      id: 'midautumn', name: '中秋', season: 'autumn', dayInSeason: 5,
      trend: 'newchinese', traffic: 1.2, priceMult: 1.15,
      eventText: '中秋家宴，长辈们都想穿得喜庆一点，新中式最好卖。',
      tip: '中秋：客流 +20%，新中式溢价 +15%。'
    },
    {
      id: 'christmas', name: '圣诞', season: 'winter', dayInSeason: 4,
      trend: 'sweet', traffic: 1.25, priceMult: 1.15,
      eventText: '街上挂满灯串，约会和聚会的人都出来了，甜美风最抢手。',
      tip: '圣诞：客流 +25%，甜美款溢价 +15%。'
    }
  ];

  window.GAME_DATA = D;
})();
