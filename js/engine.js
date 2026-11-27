/* 衣间小日子 — 经营与搭配引擎 */
(function () {
  var D = window.GAME_DATA;
  var SAVE_KEY = 'yijian_xiaorizi_save_v1';
  var SAVE_BACKUP_KEY = SAVE_KEY + '_backup';
  var VERSION = 17;
  var SAVE_WARN_BYTES = 1024 * 1024;   // 超过就提示，为 IndexedDB 决策留数据
  var SAVE_EXPORT_APP = 'yijian-xiaorizi';
  var SAVE_IMPORT_MAX_BYTES = 8 * 1024 * 1024;
  var SHELF_CAP_BASE = 40;             // 家具接入前的固定货架容量
  var STORE_CAP_BASE = 60;             // 仓库基础容量
  var STORE_CAP_STEP = 20;             // 每级 +20
  var STORE_MAX_LEVEL = 4;
  var STORE_UPGRADE_COST = { 1: 800, 2: 1600, 3: 3200 };
  var CART_MAX_PER_ITEM = 4;   // 散货单个款式每天最多进几件
  var WINDOW_MAX = 3;          // 橱窗最多主推几件
  var MAX_SELECTED = 8;        // 一套搭配最多几件（含配饰）
  var MAX_ACCESSORIES = 3;     // 配饰最多同时戴几件
  // 橱窗客流加成：摆 1/2/3 件分别 +8% / +13% / +16%（递减，避免三格碾压单格）
  var WINDOW_TRAFFIC = [0, 0.08, 0.13, 0.16];
  var CAT_ORDER = { top: 1, bottom: 2, dress: 3, outer: 4, shoes: 5, bag: 6, hosiery: 7, accessory: 8 };
  var SLOT_ORDER = { neck: 1, ear: 2, hair: 3, eyes: 4, wrist: 5, waist: 6, other: 7 };

  function compareItems(a, b) {
    var oa = CAT_ORDER[a.cat] || 9;
    var ob = CAT_ORDER[b.cat] || 9;
    if (oa !== ob) { return oa - ob; }
    if (a.cat === 'accessory') {
      var sa = SLOT_ORDER[a.slot] || 9;
      var sb = SLOT_ORDER[b.slot] || 9;
      if (sa !== sb) { return sa - sb; }
    }
    return a.name.localeCompare(b.name);
  }

  var Engine = {};
  Engine.state = null;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function round(n) {
    return Math.round(n);
  }

  function isSupportedVersion(v) {
    return typeof v === 'number' && v >= 1 && v <= VERSION;
  }

  /* ---------------- state 分片与迁移 ---------------- */

  // 物理存储拆进子对象，旧代码继续通过同名属性读写（非枚举访问器，不参与 JSON）
  var SHARDS = {
    core: [
      'shopName', 'seed', 'rngState', 'day', 'maxDay', 'cash', 'reputation', 'fans',
      'pricing', 'marketing', 'customersToday', 'customerIndex', 'dayStats', 'history',
      'usedCustomers', 'pendingResult', 'completed', 'summary', 'flags', 'savedAt', 'rev',
      'seasonClosed', 'staffMarket', 'staffMarketDay', 'staffUid', 'ordersDay', 'orderUid',
      'designUid', 'designDay', 'designDraft', 'designOrderDay', 'vipToday', 'weatherPrepDay', 'weatherPrepId',
      'queue', 'servingCustomerId', 'staffLog', 'regularVisits', 'feed', 'feedUid'

    ],
    ui: [
      'screen', 'cart', 'cartCategory', 'invCategory', 'todayLots', 'pendingLot',
      'pendingMarketing', 'windowItems', 'serviceMode', 'activeCategory', 'accessorySlot',
      'styleFilter', 'selectedItems', 'quickOptions', 'chatStep', 'chatPhase', 'chatReply',
      'careUsed', 'careLine', 'affinity', 'patience', 'revealed', 'dialogueLog',
      'lastTry', 'tryOnCount', 'itemReaction', 'expression',
      'wishId', 'wishRevealed', 'challengeId', 'previewPose'
    ]
  };

  function ensureShard(s, name, empty) {
    if (!s[name] || typeof s[name] !== 'object') {
      s[name] = empty ? empty() : {};
    }
    return s[name];
  }

  function attachAliases(s) {
    if (!s) { return s; }
    ensureShard(s, 'core');
    ensureShard(s, 'ui');
    Object.keys(SHARDS).forEach(function (shard) {
      SHARDS[shard].forEach(function (key) {
        var desc = Object.getOwnPropertyDescriptor(s, key);
        if (desc && !desc.get) {
          // 迁移残留的平铺字段：搬进分片后删掉
          s[shard][key] = desc.value;
          delete s[key];
          desc = null;
        }
        if (!desc) {
          Object.defineProperty(s, key, {
            enumerable: false,
            configurable: true,
            get: function () { return s[shard][key]; },
            set: function (value) { s[shard][key] = value; }
          });
        }
      });
    });
    return s;
  }

  function migrateToShards(s) {
    var core = {};
    var ui = {};
    var inventory = s.inventory || {};
    var warehouse = s.warehouse || { level: 1 };
    var shop = s.shop || { layout: [], wallpaper: 'cream', floor: 'wood', decorScore: 0 };
    var staff = Array.isArray(s.staff) ? s.staff : [];
    var orders = Array.isArray(s.orders) ? s.orders : [];
    var designs = Array.isArray(s.designs) ? s.designs : [];
    // 半迁移状态：已经存在的 core / ui 先留着，最后合并
    var existingCore = (s.core && typeof s.core === 'object') ? s.core : {};
    var existingUi = (s.ui && typeof s.ui === 'object') ? s.ui : {};

    Object.keys(s).forEach(function (key) {
      if (key === 'version' || key === 'inventory' || key === 'warehouse' || key === 'shop' ||
          key === 'staff' || key === 'orders' || key === 'designs' ||
          key === 'core' || key === 'ui') {
        return;
      }
      if (SHARDS.core.indexOf(key) >= 0) {
        core[key] = s[key];
      } else if (SHARDS.ui.indexOf(key) >= 0) {
        ui[key] = s[key];
      } else {
        core[key] = s[key];   // 未知字段保守放进 core，避免丢数据
      }
    });

    Object.keys(s).forEach(function (key) { delete s[key]; });
    core = Object.assign(existingCore, core);
    ui = Object.assign(existingUi, ui);
    if (typeof core.rev !== 'number') { core.rev = 0; }
    s.core = core;
    s.ui = ui;
    s.inventory = inventory;
    s.warehouse = warehouse;
    s.shop = shop;
    s.staff = staff;
    s.orders = orders;
    s.designs = designs;
  }

  var MIGRATIONS = {
    // v1 → v2：结构不变，只补默认值（v1 没有留下真实档，兼容保底）
    2: function () {},

    // v2 → v3：单件橱窗 → windowItems；补购物车与分类
    3: function (s) {
      if (!Array.isArray(s.windowItems)) {
        s.windowItems = [];
        if (typeof s.windowItem === 'string' && s.windowItem) { s.windowItems.push(s.windowItem); }
      }
      delete s.windowItem;
      s.windowItems = s.windowItems.filter(function (id, i) {
        return typeof id === 'string' && !!D.ITEMS_BY_ID[id] && s.windowItems.indexOf(id) === i;
      }).slice(0, WINDOW_MAX);
      if (!s.cart || typeof s.cart !== 'object' || Array.isArray(s.cart)) { s.cart = {}; }
      Object.keys(s.cart).forEach(function (id) {
        var qty = Math.round(Number(s.cart[id]) || 0);
        if (!D.ITEMS_BY_ID[id] || qty <= 0) { delete s.cart[id]; return; }
        s.cart[id] = clamp(qty, 1, CART_MAX_PER_ITEM);
      });
      if (!s.cartCategory) { s.cartCategory = 'all'; }
      if (!s.invCategory) { s.invCategory = 'all'; }
      if (!s.accessorySlot) { s.accessorySlot = 'all'; }
      if (!s.styleFilter) { s.styleFilter = 'all'; }
      if (!Array.isArray(s.selectedItems)) { s.selectedItems = []; }
    },

    // v3 → v4：平铺 state 分片成 core / ui，并补空壳
    4: function (s) { migrateToShards(s); },

    // v4 → v5：inventory 拆成货架 / 仓库双池
    5: function (s) {
      var inv = s.inventory;
      if (inv && inv.shelf && inv.store) {
        if (!s.warehouse || typeof s.warehouse !== 'object') { s.warehouse = { level: 1 }; }
        return;
      }
      var flat = (inv && typeof inv === 'object') ? inv : {};
      var shelf = {};
      var store = {};
      var used = 0;
      Object.keys(flat).forEach(function (id) {
        var qty = Math.round(Number(flat[id] && flat[id].qty) || 0);
        if (!D.ITEMS_BY_ID[id] || qty <= 0) { return; }
        var room = Math.max(0, SHELF_CAP_BASE - used);
        var toShelf = Math.min(qty, room);
        if (toShelf > 0) { shelf[id] = { qty: toShelf }; used += toShelf; }
        if (qty - toShelf > 0) { store[id] = { qty: qty - toShelf }; }
      });
      s.inventory = { shelf: shelf, store: store };
      s.warehouse = { level: 1 };
    },

    // v5 → v6：店铺装修（家具布局 / 已购清单）
    6: function (s) {
      if (!s.shop || typeof s.shop !== 'object') { s.shop = {}; }
      if (!Array.isArray(s.shop.layout) || !s.shop.layout.length) {
        s.shop.layout = D.SHOP_START.layout.map(function (e) {
          return { uid: e.uid, id: e.id, x: e.x, y: e.y, rot: e.rot || 0 };
        });
      }
      if (!s.shop.owned || typeof s.shop.owned !== 'object') {
        s.shop.owned = Object.assign({}, D.SHOP_START.owned);
      }
      if (typeof s.shop.nextUid !== 'number') { s.shop.nextUid = 10; }
    if (!s.shop.grid) { s.shop.grid = 'iso8'; }
    },

    // v6 → v7：员工与招聘市场
    7: function (s) {
      if (!Array.isArray(s.staff)) { s.staff = []; }
      if (!Array.isArray(s.staffMarket)) { s.staffMarket = []; }
      if (typeof s.staffMarketDay !== 'number') { s.staffMarketDay = 0; }
      if (typeof s.staffUid !== 'number') { s.staffUid = 1; }
    },

    // v7 → v8：线上订单
    8: function (s) {
      if (!Array.isArray(s.orders)) { s.orders = []; }
      if (typeof s.ordersDay !== 'number') { s.ordersDay = 0; }
      if (typeof s.orderUid !== 'number') { s.orderUid = 1; }
    },

    // v8 → v9：设计工坊
    9: function (s) {
      if (!Array.isArray(s.designs)) { s.designs = []; }
      if (typeof s.designUid !== 'number') { s.designUid = 1; }
      if (typeof s.designDay !== 'number') { s.designDay = 0; }
    },

    // v9 → v10：高定区与 VIP
    10: function (s) {
      if (!Array.isArray(s.vipToday)) { s.vipToday = []; }
    },

    // v10 → v11：店铺布局迁到 8×8 等距网格
    11: function (s) {
      if (!s.shop || typeof s.shop !== 'object') { s.shop = {}; }
      if (s.shop.grid === 'iso8') { return; }
      var cols = 8;
      var rows = 8;
      var old = Array.isArray(s.shop.layout) ? s.shop.layout : [];
      var placed = [];

      function dims(entry) {
        var def = D.FURNITURE_BY_ID[entry.id];
        if (!def) { return null; }
        return entry.rot ? { w: def.h, h: def.w } : { w: def.w, h: def.h };
      }
      function free(x, y, w, h) {
        if (x < 0 || y < 0 || x + w > cols || y + h > rows) { return false; }
        for (var i = 0; i < placed.length; i++) {
          var p = placed[i];
          var pd = dims(p);
          if (x < p.x + pd.w && p.x < x + w && y < p.y + pd.h && p.y < y + h) { return false; }
        }
        return true;
      }

      old.forEach(function (entry) {
        var d = dims(entry);
        if (!d) { return; }
        var x = Math.max(0, Math.min(cols - d.w, Math.round((entry.x || 0) * cols / 12)));
        var y = Math.max(0, Math.min(rows - d.h, Math.round(entry.y || 0)));
        if (!free(x, y, d.w, d.h)) {
          var found = false;
          for (var yy = 0; yy <= rows - d.h && !found; yy++) {
            for (var xx = 0; xx <= cols - d.w; xx++) {
              if (free(xx, yy, d.w, d.h)) { x = xx; y = yy; found = true; break; }
            }
          }
          if (!found) { return; }
        }
        placed.push({ uid: entry.uid, id: entry.id, x: x, y: y, rot: entry.rot ? 1 : 0 });
      });
      s.shop.layout = placed;
      s.shop.grid = 'iso8';
    },

    // v11 → v12：8×8 小店扩成 12×12 大店，旧布局按比例铺开
    12: function (s) {
      if (!s.shop || typeof s.shop !== 'object') { s.shop = {}; }
      if (s.shop.grid === 'iso12' || s.shop.grid === 'iso14') { return; }
      var cols = 12;
      var rows = 12;
      var old = Array.isArray(s.shop.layout) ? s.shop.layout : [];
      var placed = [];

      function dims(entry) {
        var def = D.FURNITURE_BY_ID[entry.id];
        if (!def) { return null; }
        return entry.rot ? { w: def.h, h: def.w } : { w: def.w, h: def.h };
      }
      function free(x, y, w, h) {
        if (x < 0 || y < 0 || x + w > cols || y + h > rows) { return false; }
        for (var i = 0; i < placed.length; i++) {
          var p = placed[i];
          var pd = dims(p);
          if (x < p.x + pd.w && p.x < x + w && y < p.y + pd.h && p.y < y + h) { return false; }
        }
        return true;
      }
      old.forEach(function (entry) {
        var d = dims(entry);
        if (!d) { return; }
        var x = Math.max(0, Math.min(cols - d.w, Math.round((entry.x || 0) * cols / 8)));
        var y = Math.max(0, Math.min(rows - d.h, Math.round((entry.y || 0) * rows / 8)));
        if (!free(x, y, d.w, d.h)) {
          var found = false;
          for (var yy = 0; yy <= rows - d.h && !found; yy++) {
            for (var xx = 0; xx <= cols - d.w; xx++) {
              if (free(xx, yy, d.w, d.h)) { x = xx; y = yy; found = true; break; }
            }
          }
          if (!found) { return; }
        }
        placed.push({ uid: entry.uid, id: entry.id, x: x, y: y, rot: entry.rot ? 1 : 0 });
      });
      s.shop.layout = placed;
      s.shop.grid = 'iso12';
    },

    // v12 → v13：员工培养体系（岗位 / 特质 / 潜力 / 工作成长）
    13: function (s) {
      if (Array.isArray(s.staff)) { s.staff.forEach(normalizeStaffMember); }
      if (Array.isArray(s.staffMarket)) { s.staffMarket.forEach(normalizeCandidate); }
    },

    // v13 → v14：12×12 扩成 14×14，旧布局等比铺开并避让
    14: function (s) {
      if (!s.shop || typeof s.shop !== 'object') { s.shop = {}; }
      if (s.shop.grid === 'iso14') { return; }
      var cols = D.SHOP_GRID.cols;
      var rows = D.SHOP_GRID.rows;
      var old = Array.isArray(s.shop.layout) ? s.shop.layout : [];
      var placed = [];

      function dims(entry) {
        var def = D.FURNITURE_BY_ID[entry.id];
        if (!def) { return null; }
        return entry.rot ? { w: def.h, h: def.w } : { w: def.w, h: def.h };
      }
      function free(x, y, w, h) {
        if (x < 0 || y < 0 || x + w > cols || y + h > rows) { return false; }
        for (var i = 0; i < placed.length; i++) {
          var p = placed[i];
          var pd = dims(p);
          if (x < p.x + pd.w && p.x < x + w && y < p.y + pd.h && p.y < y + h) { return false; }
        }
        return true;
      }
      old.forEach(function (entry) {
        var d = dims(entry);
        if (!d) { return; }
        var x = Math.max(0, Math.min(cols - d.w, Math.round((entry.x || 0) * cols / 12)));
        var y = Math.max(0, Math.min(rows - d.h, Math.round((entry.y || 0) * rows / 12)));
        if (!free(x, y, d.w, d.h)) {
          var found = false;
          for (var yy = 0; yy <= rows - d.h && !found; yy++) {
            for (var xx = 0; xx <= cols - d.w; xx++) {
              if (free(xx, yy, d.w, d.h)) { x = xx; y = yy; found = true; break; }
            }
          }
          if (!found) { return; }
        }
        placed.push({ uid: entry.uid, id: entry.id, x: x, y: y, rot: entry.rot ? 1 : 0 });
      });
      s.shop.layout = placed;
      s.shop.grid = 'iso14';
    },

    // v14 → v15：多顾客队列 / 店员接待 / 试衣间 / 选品姿势
    15: function (s) {
      if (!Array.isArray(s.queue)) { s.queue = []; }
      if (s.servingCustomerId === undefined) { s.servingCustomerId = null; }
      if (!Array.isArray(s.staffLog)) { s.staffLog = []; }
      if (!s.previewPose) { s.previewPose = 'stand'; }
      var ds = s.dayStats || (s.core && s.core.dayStats);
      if (ds && typeof ds.staffServed !== 'number') {
        ds.staffServed = 0;
        ds.staffSales = 0;
        ds.staffRevenue = 0;
        ds.crowdLeft = 0;
        ds.queueLeft = 0;
      }
    },

    // v15 → v16：设计款补 look / 印花 / 版型，订单补 kind，新增设计草稿与设计单
    16: function (s) {
      if (!Array.isArray(s.designs)) { s.designs = []; }
      s.designs.forEach(function (d) {
        if (!d.look) { d.look = deriveDesignLook(d); }
        if (!d.silhouette) { d.silhouette = (d.look && d.look.s) || 'shirt'; }
        if (!Array.isArray(d.decor)) { d.decor = (d.look && d.look.decor) || []; }
      });
      if (s.designDraft === undefined) { s.designDraft = null; }
      if (typeof s.designOrderDay !== 'number') { s.designOrderDay = 0; }
      if (!Array.isArray(s.orders)) { s.orders = []; }
      s.orders.forEach(function (o) {
        if (!o.kind) { o.kind = 'item'; }
        if (o.kind === 'design' && !o.want) { o.want = {}; }
      });
    },

    // v16 → v17：常客回访 / 顾客晒单
    17: function (s) {
      if (!s.regularVisits || typeof s.regularVisits !== 'object' || Array.isArray(s.regularVisits)) {
        s.regularVisits = {};
      }
      if (!Array.isArray(s.feed)) { s.feed = []; }
      if (typeof s.feedUid !== 'number') { s.feedUid = 1; }
      // 老存档里的设计款/订单字段保持；回访由后续结算自然产生
    }
  };

  function migrateState(s) {
    if (typeof s.version !== 'number') { s.version = 1; }
    if (s.version > VERSION) { throw new Error('save version too new'); }
    while (s.version < VERSION) {
      var from = s.version;
      var next = MIGRATIONS[from + 1];
      if (!next) { throw new Error('missing migration: ' + from); }
      next(s);
      s.version = from + 1;
    }
    return s;
  }

  // 读存档预览时兼容分片前/后的结构
  function peek(s, key) {
    if (!s) { return undefined; }
    if (s[key] !== undefined) { return s[key]; }
    if (s.core && s.core[key] !== undefined) { return s.core[key]; }
    if (s.ui && s.ui[key] !== undefined) { return s.ui[key]; }
    return undefined;
  }

  function styleLabels(styles) {
    return (styles || []).map(function (s) { return D.STYLE_LABELS[s] || s; });
  }

  Engine.newState = function (shopName) {
    var s = {
      version: VERSION,
      core: {
        shopName: (shopName || '衣间小日子').slice(0, 10),
        seed: Math.floor(Math.random() * 1000000000) || 1234567,
        rngState: 0,
        day: 1,
        maxDay: 7,
        cash: 12000,
        reputation: 50,
        fans: 0,
        pricing: 'standard',
        marketing: 'none',
        customersToday: [],
        customerIndex: 0,
        dayStats: null,
        history: [],
        usedCustomers: [],
        pendingResult: null,
        completed: false,
        summary: null,
        flags: {},
        savedAt: 0,
        rev: 0,
        weatherPrepDay: 0,
        weatherPrepId: null,
        queue: [],
        servingCustomerId: null,
        staffLog: [],
        regularVisits: {},
        feed: [],
        feedUid: 1
      },
      inventory: { shelf: {}, store: {} },
      warehouse: { level: 1 },
      shop: {
        layout: D.SHOP_START.layout.map(function (e) {
          return { uid: e.uid, id: e.id, x: e.x, y: e.y, rot: e.rot || 0 };
        }),
        owned: Object.assign({}, D.SHOP_START.owned),
        nextUid: 10,
        grid: 'iso14',
        wallpaper: 'cream',
        floor: 'wood'
      },
      staff: [],
      staffMarket: [],
      staffMarketDay: 0,
      staffUid: 1,
      orders: [],
      ordersDay: 0,
      orderUid: 1,
      designs: [],
      designUid: 1,
      designDay: 0,
      designDraft: null,
      designOrderDay: 0,
      vipToday: [],
      ui: {
        screen: 'brief',
        cart: {},
        cartCategory: 'all',
        invCategory: 'all',
        todayLots: [],
        pendingLot: null,
        pendingMarketing: null,
        windowItems: [],
        serviceMode: 'quick',
        activeCategory: 'all',
        accessorySlot: 'all',
        styleFilter: 'all',
        selectedItems: [],
        quickOptions: [],
        chatStep: 0,
        chatPhase: 'ask',
        chatReply: null,
        careUsed: false,
        careLine: '',
        careId: '',
        affinity: 45,
        patience: 2,
        revealed: [],
        dialogueLog: [],
        lastTry: null,
        tryOnCount: 0,
        itemReaction: null,
        expression: 'calm',
        wishId: '',
        wishRevealed: false,
        challengeId: '',
        previewPose: 'stand'
      }
    };
    attachAliases(s);
    s.rngState = s.seed;
    D.STARTING_INVENTORY.forEach(function (id) {
      s.inventory.shelf[id] = { qty: 2 };
    });
    return s;
  };

  Engine.startNew = function (shopName) {
    Engine.state = Engine.newState(shopName);
    Engine.prepareDay();
    Engine.save();
    return Engine.state;
  };

  Engine.prepareDay = function () {
    var s = Engine.state;
    if (!s) { return; }
    var cfg = Engine.getDayConfig(s.day);
    s.screen = 'brief';
    s.seasonClosed = false;
    s.vipToday = [];
    s.weatherPrepDay = 0;
    s.weatherPrepId = null;
    s.queue = [];
    s.servingCustomerId = null;
    s.staffLog = [];
    s.previewPose = 'stand';
    if (Engine.getDayInSeason(s.day) === 1) { s.usedCustomers = []; }
    s.pendingLot = null;
    s.pendingMarketing = null;
    s.windowItems = [];
    s.marketing = 'none';
    s.cart = {};
    s.cartCategory = 'all';
    s.invCategory = 'all';
    s.serviceMode = 'quick';
    s.activeCategory = 'all';
    s.accessorySlot = 'all';
    s.styleFilter = 'all';
    s.selectedItems = [];
    s.quickOptions = [];
    s.pendingResult = null;
    s.chatStep = 0;
    s.chatPhase = 'ask';
    s.chatReply = null;
    s.careUsed = false;
    s.careLine = '';
    s.careId = '';
    s.affinity = 45;
    s.patience = 2;
    s.revealed = [];
    s.dialogueLog = [];
    s.lastTry = null;
    s.tryOnCount = 0;
    s.itemReaction = null;
    s.expression = 'calm';
    s.customerIndex = 0;
    s.customersToday = [];
    s.flags = {};
    s.todayLots = cfg.lots ? cfg.lots.slice() : Engine.pickN(D.LOTS.map(function (l) { return l.id; }), 3);
    if (s.staffMarketDay !== s.day) { Engine.generateStaffMarket(s.day); }
    if (s.ordersDay !== s.day) { Engine.generateOrders(s.day); }
    Engine.getStaff().forEach(function (m) {
      var wasTraining = !!(m.trainingDay && m.trainingDay < s.day);
      if (wasTraining) { finishTraining(m); }
      m.morale = Math.max(0, (m.morale || 0) - Engine.getStaffMoraleDecay(m));
      if (!wasTraining) { applyStaffDailyGrowth(m); }
    });
    Engine.restockShelf();
    s.dayStats = {
      visitors: 0,
      served: 0,
      sales: 0,
      revenue: 0,
      cogs: 0,
      purchaseCost: 0,
      marketingCost: 0,
      staffCost: 0,
      weatherCost: 0,
      refreshmentCost: 0,
      staffServed: 0,
      staffSales: 0,
      staffRevenue: 0,
      crowdLeft: 0,
      queueLeft: 0,
      rent: 300,
      stylingBest: null,
      lost: [],
      extraTip: 0,
      goalMet: false,
      goalBonus: 0,
      loan: 0,
      reputationDelta: 0,
      fansDelta: 0,
      startReputation: s.reputation,
      startFans: s.fans,
      eventNote: '',
      closed: false,
      opened: false,
      nanaSale: false
    };
    s.customersToday = Engine.generateCustomers(cfg);
    s.customerIndex = 0;
    Engine.save();
  };

  function normalizeState(s) {
    if (!s) { return s; }
    ensureShard(s, 'core');
    ensureShard(s, 'ui');
    if (!s.inventory || typeof s.inventory !== 'object') {
      s.inventory = { shelf: {}, store: {} };
    } else if (!s.inventory.shelf) {
      // 兜底：还是平铺结构时直接当货架
      var legacy = {};
      Object.keys(s.inventory).forEach(function (id) {
        var qty = Math.round(Number(s.inventory[id] && s.inventory[id].qty) || 0);
        if (D.ITEMS_BY_ID[id] && qty > 0) { legacy[id] = { qty: qty }; }
      });
      s.inventory = { shelf: legacy, store: {} };
    }
    if (!s.inventory.store || typeof s.inventory.store !== 'object') { s.inventory.store = {}; }
    if (!s.warehouse || typeof s.warehouse !== 'object') { s.warehouse = { level: 1 }; }
    if (!s.warehouse.level || s.warehouse.level < 1) { s.warehouse.level = 1; }
    if (!s.shop || typeof s.shop !== 'object') { s.shop = {}; }
    if (!Array.isArray(s.shop.layout)) { s.shop.layout = []; }
    if (!s.shop.owned || typeof s.shop.owned !== 'object') {
      s.shop.owned = Object.assign({}, D.SHOP_START.owned);
    }
    if (typeof s.shop.nextUid !== 'number') { s.shop.nextUid = 10; }
    if (!s.shop.grid) { s.shop.grid = 'iso14'; }
    if (!Array.isArray(s.staff)) { s.staff = []; }
    s.staff.forEach(normalizeStaffMember);
    if (!Array.isArray(s.staffMarket)) { s.staffMarket = []; }
    s.staffMarket.forEach(normalizeCandidate);
    if (!Array.isArray(s.orders)) { s.orders = []; }
    if (!Array.isArray(s.designs)) { s.designs = []; }
    attachAliases(s);

    if (typeof s.day !== 'number') { s.day = 1; }
    if (typeof s.maxDay !== 'number') { s.maxDay = 7; }
    if (typeof s.cash !== 'number') { s.cash = 12000; }
    if (typeof s.reputation !== 'number') { s.reputation = 50; }
    if (typeof s.fans !== 'number') { s.fans = 0; }
    if (!s.shopName) { s.shopName = '衣间小日子'; }
    if (typeof s.weatherPrepDay !== 'number') { s.weatherPrepDay = 0; }
    if (s.weatherPrepId === undefined) { s.weatherPrepId = null; }
    if (!Array.isArray(s.queue)) { s.queue = []; }
    if (s.servingCustomerId === undefined) { s.servingCustomerId = null; }
    if (!Array.isArray(s.staffLog)) { s.staffLog = []; }
    if (!s.previewPose) { s.previewPose = 'stand'; }
    if (s.dayStats && typeof s.dayStats.staffServed !== 'number') {
      s.dayStats.staffServed = 0;
      s.dayStats.staffSales = 0;
      s.dayStats.staffRevenue = 0;
      s.dayStats.crowdLeft = 0;
      s.dayStats.queueLeft = 0;
    }
    if (typeof s.rev !== 'number') { s.rev = 0; }
    if (typeof s.chatStep !== 'number') { s.chatStep = 0; }
    if (!s.chatPhase) { s.chatPhase = 'ask'; }
    if (s.chatReply === undefined) { s.chatReply = null; }
    if (typeof s.careUsed !== 'boolean') { s.careUsed = false; }
    if (!s.careLine) { s.careLine = ''; }
    if (typeof s.careId !== 'string') { s.careId = ''; }
    if (s.dayStats && typeof s.dayStats.refreshmentCost !== 'number') { s.dayStats.refreshmentCost = 0; }
    if (typeof s.affinity !== 'number') { s.affinity = 45; }
    if (typeof s.patience !== 'number') { s.patience = 2; }
    if (!Array.isArray(s.revealed)) { s.revealed = []; }
    if (!Array.isArray(s.dialogueLog)) { s.dialogueLog = []; }
    if (s.lastTry === undefined) { s.lastTry = null; }
    if (typeof s.tryOnCount !== 'number') { s.tryOnCount = 0; }
    if (s.itemReaction === undefined) { s.itemReaction = null; }
    if (!s.expression) { s.expression = 'calm'; }
    if (typeof s.wishId !== 'string') { s.wishId = ''; }
    if (typeof s.wishRevealed !== 'boolean') { s.wishRevealed = false; }
    if (typeof s.challengeId !== 'string') { s.challengeId = ''; }
    if (s.screen === 'customer') { s.screen = 'chat'; }
    if (!Array.isArray(s.windowItems)) { s.windowItems = []; }
    s.windowItems = s.windowItems.filter(function (id, i) {
      return typeof id === 'string' && !!D.ITEMS_BY_ID[id] && s.windowItems.indexOf(id) === i;
    }).slice(0, WINDOW_MAX);
    if (!s.cart || typeof s.cart !== 'object' || Array.isArray(s.cart)) { s.cart = {}; }
    Object.keys(s.cart).forEach(function (id) {
      var qty = Math.round(Number(s.cart[id]) || 0);
      if (!D.ITEMS_BY_ID[id] || qty <= 0) { delete s.cart[id]; return; }
      s.cart[id] = clamp(qty, 1, CART_MAX_PER_ITEM);
    });
    if (!s.cartCategory) { s.cartCategory = 'all'; }
    if (!s.invCategory) { s.invCategory = 'all'; }
    if (!s.accessorySlot) { s.accessorySlot = 'all'; }
    if (!s.styleFilter) { s.styleFilter = 'all'; }
    if (!Array.isArray(s.selectedItems)) { s.selectedItems = []; }
    if (!s.regularVisits || typeof s.regularVisits !== 'object' || Array.isArray(s.regularVisits)) {
      s.regularVisits = {};
    }
    if (!Array.isArray(s.feed)) { s.feed = []; }
    if (typeof s.feedUid !== 'number') { s.feedUid = 1; }
    (s.designs || []).forEach(registerDesignItem);
    s.version = VERSION;
    return s;
  }

  Engine.save = function () {
    if (!Engine.state) { return false; }
    var s = Engine.state;
    try {
      s.savedAt = Date.now();
      s.rev = (s.rev || 0) + 1;
      var json = JSON.stringify(s);
      Engine.lastSaveBytes = json.length;
      localStorage.setItem(SAVE_KEY, json);
      Engine.saveError = null;
      if (json.length > SAVE_WARN_BYTES && typeof console !== 'undefined') {
        console.warn('[save] 存档 ' + Math.round(json.length / 1024) + 'KB，接近 localStorage 上限');
      }
      return true;
    } catch (e) {
      Engine.saveError = (e && e.name) || 'SaveError';
      // 配额不足时先牺牲备份，再试一次；仍失败就交给 UI 提示用户导出
      try {
        localStorage.removeItem(SAVE_BACKUP_KEY);
        localStorage.setItem(SAVE_KEY, JSON.stringify(s));
        Engine.saveError = null;
        return true;
      } catch (e2) {
        Engine.saveError = (e2 && e2.name) || Engine.saveError;
        if (typeof console !== 'undefined') {
          console.warn('[save] 写入失败：' + Engine.saveError);
        }
        return false;
      }
    }
  };

  Engine.load = function () {
    var raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return null; }
    if (!raw) { return null; }
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { return null; }
    if (!parsed || typeof parsed.version !== 'number' || parsed.version > VERSION) { return null; }
    try {
      var migrated = parsed.version < VERSION;
      if (migrated) {
        // 迁移前留一份原始存档，失败时不覆盖
        try { localStorage.setItem(SAVE_BACKUP_KEY, raw); } catch (e) {}
        migrateState(parsed);
      }
      Engine.state = normalizeState(parsed);
      Engine.state.rev = (Engine.state.rev || 0) + 1;
      if (migrated) { Engine.save(); }   // 升级后立刻落盘，避免每次启动重跑迁移
      return Engine.state;
    } catch (e) {
      return null;
    }
  };

  Engine.hasSave = function () {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch (e) {
      return false;
    }
  };

  Engine.getSavePreview = function () {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) { return null; }
      var s = JSON.parse(raw);
      if (!s || !isSupportedVersion(s.version)) { return null; }
      return {
        shopName: peek(s, 'shopName') || '衣间小日子',
        day: peek(s, 'day') || 1,
        cash: peek(s, 'cash') || 0,
        completed: !!peek(s, 'completed')
      };
    } catch (e) {
      return null;
    }
  };

  Engine.reset = function () {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    Engine.state = null;
    Engine.saveError = null;
  };

  /* ---------------- 存档导出 / 导入 ---------------- */

  function currentSaveObject() {
    if (Engine.state) { return Engine.state; }
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) { return null; }
      var parsed = JSON.parse(raw);
      if (!parsed || !isSupportedVersion(parsed.version)) { return null; }
      return parsed;
    } catch (e) {
      return null;
    }
  }

  Engine.exportSave = function () {
    var s = currentSaveObject();
    if (!s) { return null; }
    return JSON.stringify({
      app: SAVE_EXPORT_APP,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      state: s
    }, null, 2);
  };

  Engine.getSaveBytes = function () {
    var text = Engine.exportSave();
    return text ? text.length : 0;
  };

  Engine.importSave = function (text) {
    if (typeof text !== 'string' || !text) {
      return { ok: false, error: '存档文件是空的' };
    }
    if (text.length > SAVE_IMPORT_MAX_BYTES) {
      return { ok: false, error: '存档文件超过 8MB，可能不是本游戏的存档' };
    }
    var payload = null;
    try {
      payload = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: '文件不是有效的 JSON' };
    }
    if (!payload || payload.app !== SAVE_EXPORT_APP) {
      return { ok: false, error: '这不是《衣间小日子》的存档' };
    }
    var s = payload.state;
    if (!s || typeof s !== 'object' || Array.isArray(s)) {
      return { ok: false, error: '存档内容缺失' };
    }
    if (typeof s.version !== 'number') {
      s.version = typeof payload.version === 'number' ? payload.version : 0;
    }
    if (!isSupportedVersion(s.version)) {
      return {
        ok: false,
        error: s.version > VERSION
          ? '存档来自更新的版本（v' + s.version + '），请先升级游戏'
          : '存档版本不受支持（v' + s.version + '）'
      };
    }
    var migrated = s.version < VERSION;
    try {
      var raw = JSON.stringify(s);
      if (raw.length > SAVE_IMPORT_MAX_BYTES) {
        return { ok: false, error: '存档展开后超过 8MB，无法导入' };
      }
      // 覆盖前先把当前存档留一份，导错了还能找回
      try {
        var old = localStorage.getItem(SAVE_KEY);
        if (old) { localStorage.setItem(SAVE_BACKUP_KEY, old); }
      } catch (e) {}
      if (migrated) { migrateState(s); }
      var next = normalizeState(s);
      next.rev = ((Engine.state && Engine.state.rev) || 0) + 1;
      next.savedAt = Date.now();
      Engine.state = next;
      Engine.save();
      return { ok: true, state: next, migrated: migrated };
    } catch (e) {
      return { ok: false, error: '存档导入失败：' + ((e && e.message) || '数据损坏') };
    }
  };


  Engine.nextRandom = function () {
    var s = Engine.state;
    var a = s.rngState | 0;
    a = (a + 0x6D2B79F5) | 0;
    s.rngState = a;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  Engine.pickN = function (arr, n) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Engine.nextRandom() * (i + 1));
      var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy.slice(0, Math.min(n, copy.length));
  };

  Engine.weightedPick = function (items, weights) {
    var total = 0;
    for (var i = 0; i < items.length; i++) { total += weights[i]; }
    if (total <= 0) { return Math.floor(Engine.nextRandom() * items.length); }
    var r = Engine.nextRandom() * total;
    for (var j = 0; j < items.length; j++) {
      r -= weights[j];
      if (r <= 0) { return j; }
    }
    return items.length - 1;
  };

  /* ---------------- 季节与节日 ---------------- */

  Engine.getDayInSeason = function (day) {
    var d = typeof day === 'number' ? day : (Engine.state ? Engine.state.day : 1);
    return ((Math.max(1, d) - 1) % 7) + 1;
  };

  Engine.getSeasonIndex = function (day) {
    var d = typeof day === 'number' ? day : (Engine.state ? Engine.state.day : 1);
    return Math.floor((Math.max(1, d) - 1) / 7) % 4;
  };

  Engine.getSeason = function (day) {
    return D.SEASONS[Engine.getSeasonIndex(day)] || D.SEASONS[0];
  };

  // 突发天气：用 seed + day 做稳定哈希，同一天反复读档结果一致，且不消耗主 RNG
  function weatherHash(day, salt) {
    var s = Engine.state;
    var seed = (s && s.seed) || 1234567;
    var x = Math.sin(seed * 0.00013 + day * 12.9898 + (salt || 0) * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  Engine.pickWeatherEvent = function (day) {
    var d = typeof day === 'number' ? day : (Engine.state ? Engine.state.day : 1);
    if (d <= 1) { return null; }
    if (Engine.getFestival(d)) { return null; }
    if (weatherHash(d, 1) >= 0.36) { return null; }
    var season = Engine.getSeason(d);
    var pool = D.WEATHER_EVENTS.filter(function (e) {
      return e.seasons.indexOf(season.id) >= 0;
    });
    if (!pool.length) { return null; }
    var total = 0;
    pool.forEach(function (e) { total += e.weight || 1; });
    var roll = weatherHash(d, 2) * total;
    for (var i = 0; i < pool.length; i++) {
      roll -= pool[i].weight || 1;
      if (roll <= 0) { return pool[i]; }
    }
    return pool[pool.length - 1];
  };

  // 实际天气（含突发天气）+ 应对状态。天气数值以这里为准。
  Engine.getWeatherDay = function (day) {
    var d = typeof day === 'number' ? day : (Engine.state ? Engine.state.day : 1);
    var cfg = Engine.getDayConfig(d);
    var raw = D.WEATHER[cfg.weather] || D.WEATHER.sunny;
    var base = D.WEATHER[cfg.baseWeather || cfg.weather] || raw;
    var out = {};
    Object.keys(raw).forEach(function (k) { out[k] = raw[k]; });
    out.rawTraffic = raw.traffic;
    out.base = base;
    out.event = cfg.weatherEvent || null;
    var s = Engine.state;
    out.prepared = !!(s && s.day === d && s.weatherPrepDay === d &&
      cfg.weatherEvent && s.weatherPrepId === cfg.weatherEvent.id);
    if (out.prepared && raw.response) {
      out.traffic = raw.traffic * (raw.response.traffic || 1);
      out.responseBonusPct = Math.round(((raw.response.traffic || 1) - 1) * 100);
    }
    out.trafficPct = Math.round((out.traffic - 1) * 100);
    return out;
  };

  Engine.getWeather = function () {
    return Engine.getWeatherDay(Engine.state ? Engine.state.day : 1);
  };

  Engine.getWeatherDemand = function (day) {
    var w = Engine.getWeatherDay(day);
    return w.demand || null;
  };

  Engine.getWeatherPatience = function (day) {
    var w = Engine.getWeatherDay(day);
    return typeof w.patience === 'number' ? w.patience : 0;
  };

  Engine.prepareWeather = function () {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var w = Engine.getWeatherDay(s.day);
    if (!w.event) { return { ok: false, message: '今天没有突发天气。' }; }
    if (!w.response) { return { ok: false, message: '这种天气只能顺势而为。' }; }
    if (w.prepared) { return { ok: false, message: '已经准备好了。' }; }
    if (s.dayStats && s.dayStats.opened) { return { ok: false, message: '已经开门了，来不及准备了。' }; }
    if (s.cash < w.response.cost) { return { ok: false, message: '现金不够，先做点别的准备。' }; }
    s.cash -= w.response.cost;
    s.weatherPrepDay = s.day;
    s.weatherPrepId = w.event.id;
    if (s.dayStats) {
      s.dayStats.weatherCost = (s.dayStats.weatherCost || 0) + w.response.cost;
    }
    Engine.save();
    return { ok: true, response: w.response, weather: Engine.getWeatherDay(s.day) };
  };

  Engine.getYear = function (day) {
    var d = typeof day === 'number' ? day : (Engine.state ? Engine.state.day : 1);
    return Math.floor((Math.max(1, d) - 1) / 28) + 1;
  };

  Engine.getFestival = function (day) {
    var season = Engine.getSeason(day);
    var dis = Engine.getDayInSeason(day);
    for (var i = 0; i < D.FESTIVALS.length; i++) {
      var f = D.FESTIVALS[i];
      if (f.season === season.id && f.dayInSeason === dis) { return f; }
    }
    return null;
  };

  Engine.isSeasonEnd = function (day) {
    var d = typeof day === 'number' ? day : (Engine.state ? Engine.state.day : 1);
    return d % 7 === 0;
  };

  Engine.getDayConfig = function (day) {
    var d = Math.max(1, typeof day === 'number' ? day : 1);
    var base = D.DAYS[Math.min(D.DAYS.length - 1, Engine.getDayInSeason(d) - 1)] || D.DAYS[0];
    var festival = Engine.getFestival(d);
    var cfg = {};
    Object.keys(base).forEach(function (k) { cfg[k] = base[k]; });
    cfg.dayInSeason = Engine.getDayInSeason(d);
    cfg.season = Engine.getSeason(d);
    cfg.seasonIndex = Engine.getSeasonIndex(d);
    cfg.year = Engine.getYear(d);
    cfg.festival = festival;
    cfg.priceMult = 1;
    cfg.trafficMult = 1;
    if (d > 1 && cfg.dayInSeason === 1) {
      cfg.eventType = 'season';
      cfg.eventTitle = cfg.season.name + '季开始';
      cfg.eventText = cfg.season.note + '。换季了，应季款可以提价，过季款适合清仓。';
      cfg.tip = '应季款售价 +10%，过季款 −20%、进货成本也便宜 20%。';
    }
    if (festival) {
      cfg.trend = festival.trend;
      cfg.priceMult = festival.priceMult;
      cfg.trafficMult = festival.traffic;
      cfg.eventType = 'festival';
      cfg.eventTitle = festival.name;
      cfg.eventText = festival.eventText;
      cfg.tip = festival.tip;
    }
    // 突发天气只改当天实际天气，不动节日/季节事件文案
    cfg.baseWeather = cfg.weather;
    cfg.weatherEvent = Engine.pickWeatherEvent(d);
    if (cfg.weatherEvent) {
      cfg.weather = cfg.weatherEvent.weather;
      cfg.weatherMult = (D.WEATHER[cfg.weather] || {}).traffic || 1;
    }
    return cfg;
  };

  Engine.getLot = function (id) {
    return id ? D.LOTS_BY_ID[id] : null;
  };

  // 季节标签：warmth 推导，允许 item.seasons 手工覆盖
  Engine.getItemSeasons = function (item) {
    if (!item) { return []; }
    if (Array.isArray(item.seasons) && item.seasons.length) { return item.seasons; }
    var w = typeof item.warmth === 'number' ? item.warmth : 2;
    var out = [];
    if (w <= 2) { out.push('spring', 'summer'); }
    if (w >= 2) { out.push('autumn'); }
    if (w >= 3) { out.push('winter'); }
    if (item.cat === 'outer' && out.indexOf('winter') < 0) { out.push('winter'); }
    return out;
  };

  Engine.getItemSeasonState = function (item, day) {
    var list = Engine.getItemSeasons(item);
    if (!list.length) { return 'mid'; }
    var season = Engine.getSeason(day);
    return list.indexOf(season.id) >= 0 ? 'in' : 'off';
  };

  Engine.getSeasonPriceMult = function (item, day) {
    var state = Engine.getItemSeasonState(item, day);
    var mult = state === 'in' ? 1.10 : (state === 'off' ? 0.80 : 1);
    var f = Engine.getFestival(day);
    // 节日溢价只给主题风格，避免全场一起涨
    if (f && item && Array.isArray(item.style) && item.style.indexOf(f.trend) >= 0) {
      mult *= f.priceMult;
    }
    return mult;
  };

  Engine.getEffectivePrice = function (item, day) {
    var s = Engine.state;
    var pricing = D.PRICING[s.pricing] || D.PRICING.standard;
    return Math.round(item.price * pricing.priceMult * Engine.getSeasonPriceMult(item, day));
  };

  // 进货成本：过季便宜 20%
  Engine.getSupplyCost = function (item, day) {
    var state = Engine.getItemSeasonState(item, day);
    var mult = state === 'off' ? 0.8 : 1;
    return Math.max(1, Math.round(item.cost * mult));
  };

  // 套装按它包含单品的季节成本系数取平均
  Engine.getLotCost = function (lot, day) {
    if (!lot) { return 0; }
    var ids = [];
    lot.items.forEach(function (id) { if (ids.indexOf(id) < 0) { ids.push(id); } });
    var sum = 0;
    var n = 0;
    ids.forEach(function (id) {
      var it = D.ITEMS_BY_ID[id];
      if (it && it.cost > 0) { sum += Engine.getSupplyCost(it, day) / it.cost; n += 1; }
    });
    var avg = n ? sum / n : 1;
    return Math.round(lot.cost * avg);
  };

  /* ---------------- 库存：货架 / 仓库 ---------------- */

  function countMap(map) {
    var n = 0;
    Object.keys(map || {}).forEach(function (id) {
      var qty = map[id] && map[id].qty ? map[id].qty : 0;
      if (qty > 0) { n += qty; }
    });
    return n;
  }

  Engine.getShelfMap = function () {
    var s = Engine.state;
    return (s && s.inventory && s.inventory.shelf) ? s.inventory.shelf : {};
  };

  Engine.getStoreMap = function () {
    var s = Engine.state;
    return (s && s.inventory && s.inventory.store) ? s.inventory.store : {};
  };

  /* ---------------- 店铺装修 ---------------- */

  function furnDims(entry) {
    var def = D.FURNITURE_BY_ID[entry.id];
    if (!def) { return { w: 1, h: 1 }; }
    return entry.rot ? { w: def.h, h: def.w } : { w: def.w, h: def.h };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  }

  Engine.getPlacedFurniture = function () {
    var s = Engine.state;
    if (!s || !s.shop || !Array.isArray(s.shop.layout)) { return []; }
    var out = [];
    s.shop.layout.forEach(function (entry) {
      var def = D.FURNITURE_BY_ID[entry.id];
      if (!def) { return; }
      var dims = furnDims(entry);
      out.push({
        uid: entry.uid, id: entry.id, item: def,
        x: entry.x, y: entry.y, rot: entry.rot || 0,
        w: dims.w, h: dims.h
      });
    });
    return out;
  };

  Engine.getFurnitureOwned = function (id) {
    var s = Engine.state;
    return (s && s.shop && s.shop.owned && s.shop.owned[id]) || 0;
  };

  Engine.getFurniturePlacedCount = function (id) {
    var n = 0;
    Engine.getPlacedFurniture().forEach(function (f) { if (f.id === id) { n += 1; } });
    return n;
  };

  Engine.getFurnitureUnplaced = function (id) {
    return Engine.getFurnitureOwned(id) - Engine.getFurniturePlacedCount(id);
  };

  Engine.getRackCount = function () {
    var n = 0;
    Engine.getPlacedFurniture().forEach(function (f) {
      if (f.item.effects && f.item.effects.shelf) { n += 1; }
    });
    return n;
  };

  Engine.getFittingCount = function () {
    var n = 0;
    Engine.getPlacedFurniture().forEach(function (f) {
      if (f.item.effects && f.item.effects.fitting) { n += (f.item.effects.fitting || 0); }
    });
    return n;
  };

  Engine.getCoutureSlots = function () {
    var n = 0;
    Engine.getPlacedFurniture().forEach(function (f) {
      if (f.item.effects && f.item.effects.couture) { n += (f.item.effects.couture || 0); }
    });
    return n;
  };

  function decorEntries(layout) {
    var s = Engine.state;
    var source = layout || (s && s.shop && s.shop.layout) || [];
    var out = [];
    source.forEach(function (e) {
      var def = e.item || D.FURNITURE_BY_ID[e.id];
      if (!def) { return; }
      var w = e.w;
      var h = e.h;
      if (typeof w !== 'number' || typeof h !== 'number') {
        var rot = e.rot ? 1 : 0;
        w = rot ? def.h : def.w;
        h = rot ? def.w : def.h;
      }
      out.push({ uid: e.uid, id: e.id, x: e.x, y: e.y, rot: e.rot ? 1 : 0, w: w, h: h, item: def });
    });
    return out;
  }

  function decorOccupied(entries, x, y) {
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h) { return true; }
    }
    return false;
  }

  function decorGrade(score) {
    if (score >= 92) { return { key: 'S', label: '主理人级' }; }
    if (score >= 84) { return { key: 'A', label: '有品位' }; }
    if (score >= 70) { return { key: 'B', label: '舒服耐看' }; }
    if (score >= 56) { return { key: 'C', label: '还需打磨' }; }
    return { key: 'D', label: '先补基础' };
  }

  function decorTaste(audit) {
    if (audit.duplicatePenalty >= 4) { return { key: 'stack', label: '堆料现场' }; }
    if (!audit.topStyle || audit.topStyle === 'neutral') { return { key: 'plain', label: '基础混搭' }; }
    var base = D.FURNITURE_STYLES[audit.topStyle] || '混搭';
    if (audit.concentration >= 0.6) { return { key: audit.topStyle, label: base + '风' }; }
    if (audit.concentration >= 0.4) { return { key: audit.topStyle, label: base + '混搭' }; }
    if (audit.concentration >= 0.28) { return { key: audit.topStyle, label: base + '为主' }; }
    return { key: 'mix', label: '多风格试验' };
  }

  Engine.getDecorAudit = function (layout) {
    var entries = decorEntries(layout);
    var grid = D.SHOP_GRID;
    var totalCells = grid.cols * grid.rows;
    var usedCells = 0;
    entries.forEach(function (e) { usedCells += e.w * e.h; });
    var cellPct = usedCells / totalCells;

    // 1. 功能完整（15）
    var racks = entries.filter(function (e) { return e.item.effects && e.item.effects.shelf; }).length;
    var counters = entries.filter(function (e) { return e.item.art === 'counter'; }).length;
    var fittings = entries.filter(function (e) { return e.item.effects && e.item.effects.fitting; }).length;
    var displays = entries.filter(function (e) { return e.item.kind === 'display'; }).length;
    var fnScore = Math.min(2, racks) * 4 + Math.min(2, Math.max(0, racks - 2)) * 1 +
      Math.min(1, counters) * 4 + Math.min(1, fittings) * 4 + Math.min(1, displays) * 4;
    fnScore = Math.min(20, fnScore);

    // 2. 风格统一（20）
    var weights = {};
    var seen = {};
    var styledWeight = 0;
    entries.forEach(function (e) {
      var count = seen[e.id] || 0;
      seen[e.id] = count + 1;
      if (e.item.style === 'neutral' || count >= 2) { return; }
      var weight = (e.item.effects && e.item.effects.decor) || 1;
      weights[e.item.style] = (weights[e.item.style] || 0) + weight;
      styledWeight += weight;
    });
    var topStyle = null;
    var topWeight = 0;
    Object.keys(weights).forEach(function (k) {
      if (weights[k] > topWeight) { topWeight = weights[k]; topStyle = k; }
    });
    var concentration = styledWeight ? topWeight / styledWeight : 0;
    var styleScore = styledWeight ? 20 * (0.2 + 0.8 * Math.pow(concentration, 0.7)) : 0;
    var topCount = topStyle ? entries.filter(function (e) { return e.item.style === topStyle; }).length : 0;
    if (topCount >= 3) { styleScore += 2; }
    styleScore = Math.min(20, styleScore);

    // 3. 空间利用（15）：22%–45% 最舒服
    var spaceScore;
    if (cellPct < 0.22) { spaceScore = 15 * (cellPct / 0.22); }
    else if (cellPct <= 0.45) { spaceScore = 15; }
    else { spaceScore = 15 * (1 - (cellPct - 0.45) / 0.55); }
    spaceScore = Math.max(0, Math.min(15, spaceScore));

    // 4. 动线留白（15）：功能家具至少留 3 个空边
    var fnItems = entries.filter(function (e) { return e.item.kind === 'function'; });
    var flowSum = 0;
    fnItems.forEach(function (e) {
      var free = 0;
      var points = [
        [e.x + e.w / 2, e.y - 0.5],
        [e.x + e.w / 2, e.y + e.h + 0.5],
        [e.x - 0.5, e.y + e.h / 2],
        [e.x + e.w + 0.5, e.y + e.h / 2]
      ];
      points.forEach(function (p) {
        var x = Math.floor(p[0]);
        var y = Math.floor(p[1]);
        if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows || !decorOccupied(entries, x, y)) { free += 1; }
      });
      flowSum += Math.min(3, free);
    });
    var avgFree = fnItems.length ? flowSum / fnItems.length : 0;
    var flowScore = 15 * Math.min(1, avgFree / 3);

    // 5. 舒适氛围（15）
    function uniqueCount(pred) {
      var ids = {};
      entries.forEach(function (e) { if (pred(e)) { ids[e.id] = 1; } });
      return Object.keys(ids).length;
    }
    var comfortScore = Math.min(2, uniqueCount(function (e) { return e.item.kind === 'comfort'; })) * 2 +
      Math.min(2, uniqueCount(function (e) { return e.item.art === 'plant' || e.item.art === 'plant_big'; })) * 2 +
      Math.min(1, uniqueCount(function (e) { return e.item.art === 'rug' || e.item.art === 'round_rug'; })) * 2 +
      Math.min(1, uniqueCount(function (e) { return e.item.art === 'lamp'; })) * 2 +
      Math.min(1, uniqueCount(function (e) { return e.item.art === 'sign' || e.item.art === 'easel' || e.item.art === 'wallpaper' || e.item.art === 'curtain'; })) * 2 +
      Math.min(1, uniqueCount(function (e) { return e.item.art === 'clock' || e.item.art === 'basket' || e.item.art === 'coat_rack'; })) * 1;
    comfortScore = Math.min(15, comfortScore);

    // 6. 独特重点（15）：独特比例 + 视觉重点 - 重复堆料
    var idCounts = {};
    entries.forEach(function (e) { idCounts[e.id] = (idCounts[e.id] || 0) + 1; });
    var uniqueTotal = Object.keys(idCounts).length;
    var focal = entries.filter(function (e) {
      return ['mannequin', 'mirror', 'easel', 'sign', 'clock'].indexOf(e.item.art) >= 0;
    }).length;
    var duplicatePenalty = 0;
    Object.keys(idCounts).forEach(function (id) {
      if (idCounts[id] > 2) { duplicatePenalty += Math.min(4, (idCounts[id] - 2) * 2); }
    });
    var focusScore = 8 * (uniqueTotal / Math.max(1, entries.length)) + 2 * Math.min(3, focal);
    focusScore = Math.max(0, Math.min(15, focusScore - duplicatePenalty));

    var score = Math.round(fnScore + styleScore + spaceScore + flowScore + comfortScore + focusScore);
    score = Math.max(0, Math.min(100, score));
    var trafficPct = Math.round(Math.min(0.5, score / 200) * 100);
    var audit = {
      score: score,
      grade: decorGrade(score),
      taste: decorTaste({ duplicatePenalty: duplicatePenalty, topStyle: topStyle, concentration: concentration }),
      breakdown: [
        { key: 'function', label: '功能完整', score: Math.round(fnScore), max: 20,
          note: racks < 2 ? '货架不足' : (!counters ? '缺收银台' : (!fittings ? '缺试衣间' : (!displays ? '缺展示重点' : '基础功能齐全'))) },
        { key: 'style', label: '风格统一', score: Math.round(styleScore), max: 20,
          note: !styledWeight ? '还没有风格家具' : (concentration >= 0.6 ? '主导风格很统一' : (concentration >= 0.4 ? '有点混搭，可以再收一收' : '风格偏杂，试试统一色系')) },
        { key: 'space', label: '空间利用', score: Math.round(spaceScore), max: 15,
          note: cellPct < 0.1 ? '太空了' : cellPct > 0.55 ? '太挤了' : '空间舒服' },
        { key: 'flow', label: '动线留白', score: Math.round(flowScore), max: 15,
          note: flowScore < 8 ? '功能家具周围太堵' : '动线顺畅' },
        { key: 'comfort', label: '舒适氛围', score: Math.round(comfortScore), max: 15,
          note: comfortScore < 8 ? '缺座椅 / 绿植 / 灯光' : '氛围到位' },
        { key: 'focus', label: '独特重点', score: Math.round(focusScore), max: 15,
          note: duplicatePenalty ? '同款堆太多 -' + duplicatePenalty : (focal < 2 ? '缺视觉重点' : '重点清楚') }
      ],
      cellsUsed: usedCells,
      cellsTotal: totalCells,
      cellPct: Math.round(cellPct * 100),
      emptyPct: Math.round((1 - cellPct) * 100),
      unique: uniqueTotal,
      total: entries.length,
      duplicatePenalty: duplicatePenalty,
      concentration: concentration,
      topStyle: topStyle,
      trafficPct: trafficPct,
      hints: []
    };
    if (racks < 2) { audit.hints.push('至少放 2 个货架，不然货架容量不够'); }
    if (!counters) { audit.hints.push('缺收银台，结算会不方便'); }
    if (!fittings) { audit.hints.push('缺试衣间，顾客没法试穿'); }
    if (!displays) { audit.hints.push('缺展示重点：模特 / 镜子 / 画架'); }
    if (duplicatePenalty) { audit.hints.push('重复家具太多，独特重点 -' + duplicatePenalty); }
    if (cellPct > 0.55) { audit.hints.push('家具太挤了，留一点走动空间'); }
    if (cellPct < 0.08) { audit.hints.push('店里有点空，可以加地毯 / 绿植 / 展示'); }
    if (styledWeight && concentration < 0.35) { audit.hints.push('风格太杂，试着围绕一个主风格摆'); }
    return audit;
  };

  Engine.getDecorScore = function (layout) {
    return Engine.getDecorAudit(layout).score;
  };

  Engine.getDecorTrafficMult = function (layout) {
    return 1 + Math.min(0.5, Engine.getDecorScore(layout) / 200);
  };

  Engine.previewDecorPlacement = function (id, x, y, rot) {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var check = Engine.canPlaceFurniture(id, x, y, rot || 0, null);
    if (!check.ok) { return check; }
    var layout = (s.shop.layout || []).map(function (e) {
      return { uid: e.uid, id: e.id, x: e.x, y: e.y, rot: e.rot ? 1 : 0 };
    });
    layout.push({ uid: 'preview', id: id, x: x, y: y, rot: rot ? 1 : 0 });
    var before = Engine.getDecorAudit();
    var after = Engine.getDecorAudit(layout);
    return {
      ok: true,
      before: before,
      after: after,
      deltaScore: after.score - before.score,
      deltaTrafficPct: after.trafficPct - before.trafficPct
    };
  };

  /* 今日客流预测：预约人数由装修/口碑/天气/店员决定，橱窗/营销/定价影响进店人数 */
  Engine.getTrafficForecast = function (day) {
    var s = Engine.state;
    if (!s) {
      return { count: 0, visitors: 0, baseCount: 2, decorPct: 0, repPct: 0, staffPct: 0, weatherPct: 0, windowPct: 0, marketingPct: 0, pricingPct: 0 };
    }
    var cfg = Engine.getDayConfig(typeof day === 'number' ? day : s.day);
    var weather = Engine.getWeatherDay(typeof day === 'number' ? day : s.day);
    var pricing = D.PRICING[s.pricing] || D.PRICING.standard;
    var mkt = D.MARKETING[s.pendingMarketing || s.marketing || 'none'] || D.MARKETING.none;
    var repMult = 1 + (s.reputation - 50) / 200;
    var decorMult = Engine.getDecorTrafficMult();
    var staffMult = 1 + Engine.getDisplayBonus();
    var windowMult = Engine.getWindowTrafficMult();
    var eventMult = cfg.trafficMult || 1;
    var stable = weather.traffic * repMult * decorMult * staffMult * eventMult;
    if (cfg.eventType === 'competitor') { stable *= 0.9; }
    else if (cfg.eventType === 'market') { stable *= 1.2; }
    var trafficMult = stable * windowMult * mkt.traffic * pricing.traffic;
    var visitors = Math.max(2, Math.round(cfg.baseTraffic * trafficMult));

    var seed = (s.seed || 1) * 0.0001 + (s.day || 1) * 12.9898 +
      (s.reputation || 50) * 7.13;
    var jitter = Math.sin(seed) * 0.55;
    var extra = (stable - 1) * 4 + (trafficMult - stable) * 2 + (s.reputation - 50) / 30;
    var force = (cfg.force || []).length;
    var used = s.usedCustomers || [];
    var available = D.CUSTOMERS.filter(function (c) { return used.indexOf(c.id) < 0; }).length;
    var count = Math.round(cfg.customerCount + extra + jitter);
    count = Math.max(Math.max(1, force), Math.min(5, count, Math.max(force, available)));

    return {
      count: count,
      visitors: visitors,
      baseCount: cfg.customerCount,
      stableMult: stable,
      trafficMult: trafficMult,
      weatherMult: weather.traffic,
      repMult: repMult,
      decorMult: decorMult,
      staffMult: staffMult,
      windowMult: windowMult,
      marketingMult: mkt.traffic,
      pricingMult: pricing.traffic,
      eventMult: eventMult,
      weather: weather,
      weatherEvent: weather.event || null,
      weatherPrepared: !!weather.prepared,
      decorPct: Math.round((decorMult - 1) * 100),
      repPct: Math.round((repMult - 1) * 100),
      staffPct: Math.round((staffMult - 1) * 100),
      weatherPct: Math.round((weather.traffic - 1) * 100),
      windowPct: Math.round((windowMult - 1) * 100),
      marketingPct: Math.round((mkt.traffic - 1) * 100),
      pricingPct: Math.round((pricing.traffic - 1) * 100)
    };
  };

  function cellFree(rect, ignoreUid) {
    var g = D.SHOP_GRID;
    if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > g.cols || rect.y + rect.h > g.rows) {
      return false;
    }
    return !Engine.getPlacedFurniture().some(function (f) {
      return f.uid !== ignoreUid && rectsOverlap(rect, f);
    });
  }

  Engine.canPlaceFurniture = function (id, x, y, rot, ignoreUid) {
    var def = D.FURNITURE_BY_ID[id];
    if (!def) { return { ok: false, message: '没有这件家具。' }; }
    if (Engine.getFurnitureUnplaced(id) <= 0) {
      return { ok: false, message: '这件家具都摆出来了，先收起来一件。' };
    }
    var dims = furnDims({ id: id, rot: rot });
    if (!cellFree({ x: x, y: y, w: dims.w, h: dims.h }, ignoreUid)) {
      return { ok: false, message: '这个位置放不下。' };
    }
    return { ok: true };
  };

  Engine.placeFurniture = function (id, x, y) {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var check = Engine.canPlaceFurniture(id, x, y, 0, null);
    if (!check.ok) { return check; }
    s.shop.nextUid = (s.shop.nextUid || 10) + 1;
    s.shop.layout.push({ uid: 'f' + s.shop.nextUid, id: id, x: x, y: y, rot: 0 });
    Engine.save();
    return { ok: true };
  };

  Engine.moveFurniture = function (uid, x, y) {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var entry = null;
    s.shop.layout.forEach(function (e) { if (e.uid === uid) { entry = e; } });
    if (!entry) { return { ok: false }; }
    var dims = furnDims(entry);
    if (!cellFree({ x: x, y: y, w: dims.w, h: dims.h }, uid)) {
      return { ok: false, message: '这个位置放不下。' };
    }
    entry.x = x;
    entry.y = y;
    Engine.save();
    return { ok: true };
  };

  Engine.rotateFurniture = function (uid) {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var entry = null;
    s.shop.layout.forEach(function (e) { if (e.uid === uid) { entry = e; } });
    if (!entry) { return { ok: false }; }
    var nextRot = entry.rot ? 0 : 1;
    var dims = furnDims({ id: entry.id, rot: nextRot });
    if (!cellFree({ x: entry.x, y: entry.y, w: dims.w, h: dims.h }, uid)) {
      return { ok: false, message: '转过来放不下，先挪个位置。' };
    }
    entry.rot = nextRot;
    Engine.save();
    return { ok: true };
  };

  Engine.storeFurniture = function (uid) {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var before = s.shop.layout.length;
    s.shop.layout = s.shop.layout.filter(function (e) { return e.uid !== uid; });
    if (s.shop.layout.length === before) { return { ok: false }; }
    Engine.save();
    return { ok: true };
  };

  Engine.buyFurniture = function (id) {
    var s = Engine.state;
    var def = D.FURNITURE_BY_ID[id];
    if (!s || !def) { return { ok: false }; }
    if (def.price <= 0) { return { ok: false, message: '这件是初始家具，不用买。' }; }
    if (s.cash < def.price) { return { ok: false, message: '现金不够。' }; }
    s.cash -= def.price;
    s.shop.owned[id] = (s.shop.owned[id] || 0) + 1;
    Engine.save();
    return { ok: true };
  };

  /* ---------------- 高定与 VIP ---------------- */

  Engine.getCoutureDesigns = function () {
    return Engine.getDesigns().filter(function (d) { return d.tier === 'couture'; });
  };

  Engine.getVipChance = function () {
    var s = Engine.state;
    if (!s) { return 0; }
    var couture = Engine.getCoutureDesigns().length;
    if (!couture || Engine.getCoutureSlots() <= 0) { return 0; }
    return Math.min(0.6, 0.15 + couture * 0.1 + (s.reputation || 0) / 500);
  };

  Engine.isVip = function (customerOrId) {
    var s = Engine.state;
    if (!s || !Array.isArray(s.vipToday)) { return false; }
    var id = typeof customerOrId === 'string' ? customerOrId : (customerOrId && customerOrId.id);
    return !!id && s.vipToday.indexOf(id) >= 0;
  };

  Engine.markVipToday = function (ids) {
    var s = Engine.state;
    if (!s) { return; }
    s.vipToday = Array.isArray(ids) ? ids.slice(0, 1) : [];
  };

  /* ---------------- 设计工坊 ---------------- */

  function findDesignOption(list, id) {
    return (list || []).filter(function (x) { return x.id === id; })[0] || null;
  }

  function registerDesignItem(design) {
    if (!design || !design.id) { return; }
    var look = design.look || deriveDesignLook(design);
    design.look = look;
    var existing = D.ITEMS_BY_ID[design.id];
    if (existing) {
      existing.look = look;
      existing.design = true;
      existing.custom = design.custom || null;
      existing.print = design.print || null;
      existing.name = design.name || existing.name;
      existing.fabricId = design.fabricId;
      existing.silhouette = design.silhouette;
      existing.score = design.score;
      existing.tier = design.tier;
      return;
    }
    var item = {
      id: design.id,
      name: design.name,
      cat: design.cat,
      shape: design.cat,
      style: [design.style || 'minimal'],
      colors: [design.color],
      color: design.color,
      formality: design.formality,
      warmth: design.warmth,
      cost: design.cost,
      price: design.price,
      fit: ['soft', 'comfort'],
      desc: '自己设计的独家款。',
      seasons: design.seasons,
      design: true,
      fabricId: design.fabricId,
      silhouette: design.silhouette,
      score: design.score,
      tier: design.tier,
      look: look,
      custom: design.custom || null,
      print: design.print || null
    };
    D.ITEMS.push(item);
    D.ITEMS_BY_ID[item.id] = item;
  }

  function designSilhouette(cat, id) {
    var list = (D.DESIGN.silhouettes && D.DESIGN.silhouettes[cat]) || [];
    return findDesignOption(list, id) || list[0] || null;
  }

  function deriveDesignLook(design) {
    design = design || {};
    var cat = design.cat || 'top';
    var sil = designSilhouette(cat, design.silhouette);
    var base = (design.look && typeof design.look === 'object') ? design.look : ((sil && sil.look) || { s: 'tee', neck: 'crew', slv: 'short', len: 'waist', fit: 'regular' });
    var look = {};
    for (var k in base) { look[k] = base[k]; }
    var fb = (D.DESIGN.fabricLook && D.DESIGN.fabricLook[design.fabricId]) || { m: 'cotton', p: 'none' };
    look.m = fb.m;
    look.p = design.pattern || fb.p || 'none';
    look.decor = (design.decor || look.decor || []).slice(0, D.DESIGN.maxDecorations);
    if (design.custom) { look.custom = design.custom; }
    if (design.print) { look.print = design.print; }
    return look;
  }

  Engine.getDesignOptions = function () { return D.DESIGN; };

  Engine.computeDesign = function (cfg) {
    cfg = cfg || {};
    var cat = findDesignOption(D.DESIGN.cats, cfg.cat) || D.DESIGN.cats[0];
    var silList = (D.DESIGN.silhouettes && D.DESIGN.silhouettes[cat.id]) || [];
    var sil = findDesignOption(silList, cfg.silhouette) || silList[0] || null;
    var fabric = findDesignOption(D.DESIGN.fabrics, cfg.fabric) || D.DESIGN.fabrics[0];
    var decoIds = Array.isArray(cfg.deco) ? cfg.deco : [];
    var decos = decoIds.map(function (id) { return findDesignOption(D.DESIGN.decorations, id); })
      .filter(Boolean).slice(0, D.DESIGN.maxDecorations);
    var fb = (D.DESIGN.fabricLook && D.DESIGN.fabricLook[fabric.id]) || { m: 'cotton', p: 'none' };
    var pattern = cfg.pattern || fb.p || 'none';
    var hasCustom = !!(cfg.custom && cfg.custom.front && cfg.custom.front.d);
    var hasPrint = !!(cfg.print && cfg.print.grid && cfg.print.grid.length);

    var cost = D.DESIGN.workCost + fabric.cost;
    decos.forEach(function (d) { cost += d.cost; });
    if (hasPrint) { cost += D.DESIGN.printCost || 0; }

    var seasonId = Engine.getSeason().id;
    var seasonPart = fabric.seasons.indexOf(seasonId) >= 0 ? 15 : 6;
    var targetWarmth = cat.id === 'outer' ? 4 : cat.id === 'bottom' ? 3 : 2;
    var warmthPart = Math.max(0, 10 - Math.abs(fabric.warmth - targetWarmth) * 3);

    var family = D.COLOR_FAMILY[cfg.color] || 'neutral';
    var colorPart = (family === 'neutral' ? 10 : 7) + (family === 'blue' && fabric.id === 'denim' ? 10 : 7);

    var shapePart = 20 + (hasCustom ? 5 : 0);
    var craftPart = decos.length === 0 ? 8 : decos.length === 1 ? 15 : 20;
    var noveltyPart = 4 + (hasPrint ? 3 : 0) + (hasCustom ? 3 : 0);

    var parts = {
      shape: clamp(shapePart, 0, 25),
      fabric: clamp(seasonPart + warmthPart, 0, 25),
      color: clamp(colorPart, 0, 20),
      craft: clamp(craftPart, 0, 20),
      novelty: clamp(noveltyPart, 0, 10)
    };
    var score = clamp(parts.shape + parts.fabric + parts.color + parts.craft + parts.novelty, 0, 100);
    if (hasCustom) { score = Math.max(score, 45); }

    var min = Math.round(cost * 1.8);
    var max = Math.round(cost * (1.8 + score / 50));
    return {
      cat: cat, fabric: fabric, decos: decos, cost: cost, score: score,
      min: min, max: max, tier: score >= 80 ? 'couture' : 'normal',
      parts: parts, silhouette: sil, pattern: pattern,
      hasCustom: hasCustom, hasPrint: hasPrint
    };
  };

  Engine.designPrice = function (calc, mode) {
    mode = mode || 'mid';
    return mode === 'low' ? calc.min : mode === 'high' ? calc.max : Math.round((calc.min + calc.max) / 2);
  };

  Engine.getDesignOrder = function () {
    var s = Engine.state;
    if (!s || !Array.isArray(s.orders)) { return null; }
    return s.orders.filter(function (o) { return o.kind === 'design' && o.status === 'open'; })[0] || null;
  };

  Engine.createDesign = function (cfg, orderId) {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    if (s.designDay === s.day) { return { ok: false, message: '今天已经设计过一件了。' }; }
    var calc = Engine.computeDesign(cfg);
    if (s.cash < calc.cost) { return { ok: false, message: '现金不够，设计和工时都要钱。' }; }
    if (Engine.getShelfCount() >= Engine.getShelfCap() && Engine.getStoreCount() >= Engine.getStoreCap()) {
      return { ok: false, message: '货架和仓库都满了。' };
    }
    var price = Engine.designPrice(calc, cfg.priceMode);

    var sil = calc.silhouette || designSilhouette(calc.cat.id, cfg.silhouette);
    var baseLook = (sil && sil.look) ? sil.look : {};
    var look = {};
    for (var lk in baseLook) { look[lk] = baseLook[lk]; }
    var fb = (D.DESIGN.fabricLook && D.DESIGN.fabricLook[calc.fabric.id]) || { m: 'cotton', p: 'none' };
    look.m = fb.m;
    look.p = cfg.pattern || fb.p || 'none';
    look.decor = (calc.decos || []).map(function (d) { return d.id; }).slice(0, D.DESIGN.maxDecorations);
    if (cfg.custom && cfg.custom.front) { look.custom = cfg.custom; }
    if (cfg.print && cfg.print.grid) { look.print = cfg.print; }

    s.designUid = (s.designUid || 1) + 1;
    var name = String(cfg.name || '').trim().slice(0, 24);
    if (!name) {
      name = (D.COLOR_LABELS[cfg.color] || cfg.color) + calc.fabric.name + calc.cat.name + ' #' + s.designUid;
    }
    var design = {
      id: 'dx' + s.designUid,
      name: name,
      cat: calc.cat.id,
      silhouette: sil ? sil.id : '',
      pattern: look.p,
      color: cfg.color,
      style: calc.fabric.style,
      fabricId: calc.fabric.id,
      warmth: calc.fabric.warmth,
      formality: calc.cat.formality,
      seasons: calc.fabric.seasons.slice(),
      cost: calc.cost,
      price: price,
      score: calc.score,
      tier: calc.tier,
      createdDay: s.day,
      status: 'stock',
      look: look,
      decor: look.decor.slice(),
      custom: cfg.custom || null,
      print: cfg.print || null
    };
    registerDesignItem(design);
    s.designs.push(design);
    s.cash -= calc.cost;
    s.designDay = s.day;
    s.designDraft = null;

    if (Engine.getShelfCount() < Engine.getShelfCap()) {
      Engine.getShelfMap()[design.id] = { qty: 1 };
    } else {
      Engine.addToStore(design.id, 1);
    }

    var delivered = false;
    var payout = 0;
    var order = orderId ? (s.orders || []).filter(function (o) { return o.id === orderId && o.status === 'open' && o.kind === 'design'; })[0] : null;
    if (order) {
      var dr = Engine.deliverOrder(order.id);
      delivered = !!dr.ok;
      payout = dr.price || 0;
    }
    Engine.save();
    return { ok: true, design: design, calc: calc, delivered: delivered, payout: payout, order: order || null };
  };

  Engine.getDesignDraft = function () {
    var s = Engine.state;
    return s && s.designDraft ? s.designDraft : null;
  };

  Engine.saveDesignDraft = function (cfg) {
    var s = Engine.state;
    if (!s) { return; }
    s.designDraft = cfg || null;
    Engine.save();
  };

  Engine.clearDesignDraft = function () {
    var s = Engine.state;
    if (!s) { return; }
    s.designDraft = null;
    Engine.save();
  };

  Engine.getDesigns = function () {
    var s = Engine.state;
    return (s && Array.isArray(s.designs)) ? s.designs : [];
  };

  /* ---------------- 线上订单 ---------------- */

  Engine.getOpenOrders = function () {
    var s = Engine.state;
    return (s && Array.isArray(s.orders)) ? s.orders.filter(function (o) { return o.status === 'open'; }) : [];
  };

  Engine.generateOrders = function (day) {
    var s = Engine.state;
    if (!s) { return; }
    var d = day || s.day;
    if (s.ordersDay === d) { return; }
    s.ordersDay = d;
    var count = Math.min(3, Math.round(0.3 + (s.fans || 0) / 40 + Engine.nextRandom() * 1.2));
    for (var i = 0; i < count; i++) {
      var item = D.ITEMS[Math.floor(Engine.nextRandom() * D.ITEMS.length)];
      if (!item) { continue; }
      var qty = Engine.nextRandom() > 0.7 ? 2 : 1;
      var deadline = d + 1 + Math.floor(Engine.nextRandom() * 3);
      var price = Math.round(Engine.getEffectivePrice(item) * 1.15) * qty;
      s.orderUid = (s.orderUid || 1) + 1;
      s.orders.push({
        id: 'o' + s.orderUid,
        kind: 'item',
        createdDay: d,
        deadlineDay: deadline,
        want: { cat: item.cat, style: item.style[0], color: item.color },
        qty: qty,
        price: price,
        status: 'open'
      });
    }

    // 设计单：约 40% 概率，一天最多 1 个，持续 3–5 天
    var hasOpenDesign = s.orders.some(function (o) { return o.kind === 'design' && o.status === 'open'; });
    if (d >= 2 && !hasOpenDesign && Engine.nextRandom() < 0.4) {
      var cat = D.DESIGN.cats[Math.floor(Engine.nextRandom() * D.DESIGN.cats.length)];
      var colors = Object.keys(D.COLOR_HEX);
      var color = colors[Math.floor(Engine.nextRandom() * colors.length)];
      var fabric = D.DESIGN.fabrics[Math.floor(Engine.nextRandom() * D.DESIGN.fabrics.length)];
      var deco = Engine.nextRandom() > 0.35 ? D.DESIGN.decorations[Math.floor(Engine.nextRandom() * D.DESIGN.decorations.length)] : null;
      var designCustomers = D.CUSTOMERS.filter(function (c) { return !c.regularFirst; });
      var customer = designCustomers[Math.floor(Engine.nextRandom() * designCustomers.length)];
      var baseCost = D.DESIGN.workCost + fabric.cost + (deco ? deco.cost : 0);
      var budget = Math.round(baseCost * (2.2 + Engine.nextRandom() * 0.7) / 10) * 10;
      var ddl = d + 3 + Math.floor(Engine.nextRandom() * 3);
      s.orderUid = (s.orderUid || 1) + 1;
      s.orders.push({
        id: 'o' + s.orderUid,
        kind: 'design',
        createdDay: d,
        deadlineDay: ddl,
        customerId: customer.id,
        want: {
          cat: cat.id,
          color: color,
          fabric: fabric.id,
          deco: deco ? deco.id : null,
          style: fabric.style,
          minScore: 70,
          budget: budget
        },
        qty: 1,
        status: 'open'
      });
      s.designOrderDay = d;
    }
    Engine.save();
  };

  function allInventoryEntries(cat) {
    var out = Engine.getInventoryEntries(cat).slice();
    var store = Engine.getStoreMap();
    Object.keys(store).forEach(function (id) {
      var entry = store[id];
      var item = D.ITEMS_BY_ID[id];
      if (!item || !entry || entry.qty <= 0) { return; }
      if (cat && cat !== 'all' && item.cat !== cat) { return; }
      out.push({ item: item, qty: entry.qty, store: true });
    });
    return out;
  }

  Engine.findOrderMatches = function (order) {
    var out = [];
    var want = order.want || {};
    if (order.kind === 'design') {
      var fb = (D.DESIGN.fabricLook && D.DESIGN.fabricLook[want.fabric]) || null;
      allInventoryEntries(want.cat).forEach(function (entry) {
        var it = entry.item;
        if (!it || !it.design) { return; }
        var look = it.look || {};
        var okCat = !want.cat || it.cat === want.cat;
        var okColor = !want.color || it.color === want.color;
        var okFabric = !want.fabric || it.fabricId === want.fabric || (fb && look.m === fb.m);
        var okDeco = !want.deco || (look.decor || []).indexOf(want.deco) >= 0;
        var okScore = !want.minScore || (it.score || 0) >= want.minScore;
        var okBudget = !want.budget || (it.price || 0) <= want.budget;
        if (okCat && okColor && okFabric && okDeco && okScore && okBudget) { out.push(entry); }
      });
      return out;
    }
    Engine.getInventoryEntries(want.cat).forEach(function (entry) {
      var okStyle = !want.style || entry.item.style.indexOf(want.style) >= 0;
      var okColor = !want.color || entry.item.color === want.color;
      if (okStyle && okColor) { out.push(entry); }
    });
    return out;
  };

  Engine.deliverOrder = function (id) {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var order = (s.orders || []).filter(function (o) { return o.id === id && o.status === 'open'; })[0];
    if (!order) { return { ok: false, message: '这个订单已经处理过了。' }; }
    var matches = Engine.findOrderMatches(order);
    var available = 0;
    matches.forEach(function (e) { available += e.qty; });
    if (available < order.qty) {
      return { ok: false, message: '库存凑不齐，需要 ' + order.qty + ' 件同款风格/颜色。' };
    }
    var need = order.qty;
    var cogs = 0;
    var firstItem = matches[0] ? matches[0].item : null;
    matches.forEach(function (e) {
      while (need > 0 && e.qty > 0) {
        if (e.store) { Engine.takeFromStore(e.item.id, 1); }
        else { Engine.takeFromShelf(e.item.id, 1); }
        cogs += e.item.cost;
        e.qty -= 1;
        need -= 1;
      }
    });
    var payout = order.price;
    if (order.kind === 'design' && firstItem) {
      payout = Math.round((firstItem.price || order.price) * 1.15);
    }
    order.status = 'done';
    order.deliveredPrice = payout;
    s.cash += payout;
    if (s.dayStats) {
      s.dayStats.revenue += payout;
      s.dayStats.cogs += cogs;
      s.dayStats.sales += 1;
    }
    s.reputation = clamp(s.reputation + (order.kind === 'design' ? 2 : 1), 0, 100);
    s.fans += (order.kind === 'design' ? 2 : 1);
    Engine.sanitizeWindow();
    Engine.save();
    return { ok: true, price: payout, cogs: cogs, design: order.kind === 'design' };
  };

  Engine.takeFromStore = function (id, qty) {
    var map = Engine.getStoreMap();
    var entry = map[id];
    if (!entry || entry.qty <= 0 || qty <= 0) { return 0; }
    var take = Math.min(qty, entry.qty);
    entry.qty -= take;
    if (entry.qty <= 0) { delete map[id]; }
    return take;
  };

  Engine.expireOrders = function () {
    var s = Engine.state;
    if (!s || !Array.isArray(s.orders)) { return 0; }
    var expired = 0;
    s.orders.forEach(function (o) {
      if (o.status !== 'open') { return; }
      if (o.deadlineDay <= s.day) {
        o.status = 'expired';
        expired += 1;
      }
    });
    if (expired) {
      s.reputation = clamp(s.reputation - 3 * expired, 0, 100);
      s.fans = Math.max(0, s.fans - 2 * expired);
      if (s.dayStats) {
        s.dayStats.eventNote += (s.dayStats.eventNote ? ' ' : '') + '有 ' + expired + ' 个线上订单超时，口碑和粉丝掉了。';
      }
    }
    return expired;
  };

  /* ---------------- 员工 ---------------- */

  var STAFF_NAMES = ['阿 May', '小林', '大熊', '阿哲', '小满', '阿洛', '桃子', '安安', 'Kiki', '老周', '阿澄', '小鹿'];
  var STAFF_PERSONALITIES = { outgoing: '外向', introverted: '内向', careful: '细致', assertive: '强势' };
  var STAFF_SKILLS = ['sales', 'organize', 'display', 'styling'];
  var STAFF_SKILL_LABELS = { sales: '销售', organize: '整理', display: '陈列', styling: '搭配' };
  var STAFF_ROLES = {
    sales: { name: '导购', skill: 'sales', desc: '销售技能 ×1.25；3 级时成交价再 +1%' },
    organize: { name: '仓管', skill: 'organize', desc: '整理技能 ×1.25；3 级时仓库容量 +2' },
    display: { name: '陈列师', skill: 'display', desc: '陈列技能 ×1.25；3 级时客流再 +1%' },
    styling: { name: '搭配师', skill: 'styling', desc: '搭配技能 ×1.25；3 级时搭配分再 +1' }
  };
  var STAFF_POTENTIAL = {
    S: { label: 'S', days: 2, desc: '学得很快，约 2 天升 1 级' },
    A: { label: 'A', days: 3, desc: '成长稳定，约 3 天升 1 级' },
    B: { label: 'B', days: 4, desc: '需要多带几天，约 4 天升 1 级' },
    C: { label: 'C', days: 5, desc: '慢慢来，约 5 天升 1 级' }
  };
  var STAFF_PERKS = {
    warm: { name: '亲和', good: true, desc: '顾客初始好感 +3', effect: { affinity: 3 } },
    closer: { name: '成交手', good: true, desc: '销售效果 +1', effect: { sales: 1 } },
    quick: { name: '麻利', good: true, desc: '整理效果 +1', effect: { organize: 1 } },
    eye: { name: '审美', good: true, desc: '搭配效果 +1', effect: { styling: 1 } },
    detail: { name: '细节控', good: true, desc: '陈列效果 +1，但士气每天 -1', effect: { display: 1 } },
    steady: { name: '稳重', good: true, desc: '士气下降减半', effect: { morale: 1 } }
  };
  var STAFF_FLAWS = {
    shy: { name: '社恐', good: false, desc: '顾客初始好感 -2，但成长经验 +20%', effect: { affinity: -2, growth: 1.2 } },
    glass: { name: '玻璃心', good: false, desc: '士气低于 50 时技能效果再减半', effect: { fragile: 1 } },
    slow: { name: '慢热', good: false, desc: '入职前 2 天技能效果 -20%', effect: { slowStart: 1 } },
    proud: { name: '心气高', good: false, desc: '奖金恢复的士气减半', effect: { bonus: 0.5 } },
    clumsy: { name: '冒失', good: false, desc: '整理效果 -1', effect: { organize: -1 } },
    picky: { name: '挑剔', good: false, desc: '培训费 +20%', effect: { trainCost: 1.2 } }
  };
  var STAFF_BACKGROUNDS = [
    { title: '服装学院应届生', text: '刚毕业，作品集很认真，但还没有真正接待过客人。', quote: '我想先在一家小店里，把搭配和待客都练熟。' },
    { title: '商场专柜前店员', text: '站过三年柜台，见过客流高峰，也见过难缠客人。', quote: '我不怕忙，只怕店里没有好看的货。' },
    { title: '自由搭配师', text: '接散单帮人改造衣橱，审美大胆，作息有点随性。', quote: '衣服是穿给自己看的，不是挂在架子上的。' },
    { title: '二手店买手', text: '会淘货，会看面料，最擅长把旧东西摆出新味道。', quote: '给我一堆旧衣服，我也能搭出故事。' },
    { title: '宝妈重返职场', text: '离开职场两年，做事细，耐心足，想找回自己的节奏。', quote: '我想做一份能和审美有关的工作。' },
    { title: '夜校学生', text: '白天打工晚上上课，学东西快，但有时候会累。', quote: '我不怕从叠衣服开始。' }
  ];
  var STAFF_TRAIN_BASE = 150;
  var STAFF_TRAIN_STEP = 100;
  var STAFF_BONUS_COST = 100;
  var STAFF_MAX = 4;

  function staffSkillSum(m) {
    var sum = 0;
    STAFF_SKILLS.forEach(function (k) { sum += (m && m.skills && m.skills[k]) || 0; });
    return sum;
  }

  function staffHasPerk(m, id) {
    return !!(m && Array.isArray(m.perks) && m.perks.indexOf(id) >= 0);
  }

  function staffPerkEffect(m, key) {
    var v = 0;
    (m && m.perks || []).forEach(function (id) {
      var p = STAFF_PERKS[id] || STAFF_FLAWS[id];
      if (p && p.effect && typeof p.effect[key] === 'number') { v += p.effect[key]; }
    });
    return v;
  }

  function staffPerkList(m) {
    var out = [];
    (m && m.perks || []).forEach(function (id) {
      var p = STAFF_PERKS[id] || STAFF_FLAWS[id];
      if (p) { out.push({ id: id, name: p.name, desc: p.desc, good: p.good }); }
    });
    return out;
  }

  function staffPotentialOf(m) {
    return STAFF_POTENTIAL[(m && m.potential) || 'B'] || STAFF_POTENTIAL.B;
  }

  function staffRecommendedRole(m) {
    var best = null;
    var bestVal = -1;
    STAFF_SKILLS.forEach(function (k) {
      var v = (m && m.skills && m.skills[k]) || 0;
      if (v > bestVal) { bestVal = v; best = k; }
    });
    return best;
  }

  function normalizeStaffMember(m) {
    if (!m || typeof m !== 'object') { return m; }
    if (!Array.isArray(m.perks)) { m.perks = []; }
    if (!m.potential) { m.potential = 'B'; }
    if (typeof m.workDays !== 'number') { m.workDays = 0; }
    if (m.trainingSkill === undefined) { m.trainingSkill = null; }
    if (!m.lookSeed) { m.lookSeed = m.uid || m.name || 'staff'; }
    if (m.role === undefined) { m.role = null; }
    if (!m.background) {
      m.background = STAFF_BACKGROUNDS[0];
    }
    if (typeof m.hiredDay !== 'number') {
      m.hiredDay = (Engine.state && Engine.state.day) || 1;
    }
    if (!m.skills || typeof m.skills !== 'object') {
      m.skills = { sales: 1, organize: 1, display: 1, styling: 1 };
    }
    STAFF_SKILLS.forEach(function (k) {
      if (typeof m.skills[k] !== 'number') { m.skills[k] = 1; }
      m.skills[k] = clamp(Math.round(m.skills[k]), 0, 5);
    });
    if (!m.recommendedRole) { m.recommendedRole = staffRecommendedRole(m); }
    return m;
  }

  function normalizeCandidate(c) {
    if (!c || typeof c !== 'object') { return c; }
    if (!Array.isArray(c.perks)) { c.perks = []; }
    if (!c.potential) { c.potential = 'B'; }
    if (!c.background) { c.background = STAFF_BACKGROUNDS[0]; }
    if (!c.lookSeed) { c.lookSeed = c.id || c.name || 'candidate'; }
    if (!c.skills || typeof c.skills !== 'object') {
      c.skills = { sales: 1, organize: 1, display: 1, styling: 1 };
    }
    if (!c.recommendedRole) { c.recommendedRole = staffRecommendedRole(c); }
    return c;
  }

  Engine.getStaffTraitLabel = function (key) { return STAFF_PERSONALITIES[key] || key; };
  Engine.getStaffSkillLabel = function (key) { return STAFF_SKILL_LABELS[key] || key; };
  Engine.getStaffSkillKeys = function () { return STAFF_SKILLS.slice(); };
  Engine.getStaffRoleLabel = function (key) { return (STAFF_ROLES[key] && STAFF_ROLES[key].name) || '未定岗'; };
  Engine.getStaffRoleDesc = function (key) { return (STAFF_ROLES[key] && STAFF_ROLES[key].desc) || ''; };
  Engine.getStaffRoles = function () {
    return Object.keys(STAFF_ROLES).map(function (id) {
      return { id: id, name: STAFF_ROLES[id].name, skill: STAFF_ROLES[id].skill, desc: STAFF_ROLES[id].desc };
    });
  };
  Engine.getStaffPotential = function (m) {
    var p = staffPotentialOf(m);
    return { key: (m && m.potential) || 'B', label: p.label, days: p.days, desc: p.desc };
  };
  Engine.getStaffPerks = function (m) { return staffPerkList(m); };
  Engine.getStaffRecommendedRole = function (m) { return staffRecommendedRole(m); };
  Engine.getStaffTitle = function (m) {
    if (!m) { return '实习'; }
    var sum = staffSkillSum(m);
    var days = Engine.state ? Math.max(1, Engine.state.day - (m.hiredDay || Engine.state.day) + 1) : 1;
    if (sum >= 18 && days >= 6) { return '首席'; }
    if (sum >= 15 && days >= 4) { return '资深'; }
    if (sum >= 10 && days >= 2) { return '正式'; }
    return '实习';
  };
  Engine.getStaffGrowthNeed = function (m) {
    var p = staffPotentialOf(m);
    var need = p.days;
    if (staffPerkEffect(m, 'growth') > 1) { need -= 1; }
    return Math.max(1, need);
  };
  Engine.getStaffMoraleDecay = function (m) {
    var decay = 3;
    if (staffHasPerk(m, 'steady')) { decay *= 0.5; }
    if (staffHasPerk(m, 'detail')) { decay += 1; }
    if (Engine.getStaff().some(function (x) { return x.manager; })) { decay -= 1; }
    return Math.max(1, Math.round(decay * 10) / 10);
  };
  Engine.getStaffAffinityBonus = function () {
    var n = 0;
    var day = Engine.state ? Engine.state.day : 0;
    Engine.getStaff().forEach(function (m) {
      if (m.trainingDay && m.trainingDay === day) { return; }
      n += staffPerkEffect(m, 'affinity');
    });
    return n;
  };

  Engine.generateStaffMarket = function (day) {
    var s = Engine.state;
    if (!s) { return; }
    var d = day || s.day;
    var seedBase = (s.seed || 1) + d * 131;
    var rand = function (i) {
      var x = Math.sin(seedBase + i * 97.13) * 10000;
      return x - Math.floor(x);
    };
    var market = [];
    var traits = Object.keys(STAFF_PERSONALITIES);
    var goodKeys = Object.keys(STAFF_PERKS);
    var flawKeys = Object.keys(STAFF_FLAWS);
    for (var i = 0; i < 3; i++) {
      var name = STAFF_NAMES[(d * 3 + i) % STAFF_NAMES.length];
      var skills = {};
      STAFF_SKILLS.forEach(function (k, j) {
        var base = 1 + Math.floor(rand(i * 7 + j) * 4);
        if (s.reputation >= 65 && rand(i * 13 + j) > 0.7) { base += 1; }
        skills[k] = Math.min(5, base);
      });
      var sum = staffSkillSum({ skills: skills });
      var pRoll = rand(i * 61);
      var potential = pRoll > 0.9 ? 'S' : pRoll > 0.7 ? 'A' : pRoll > 0.35 ? 'B' : 'C';
      var good = goodKeys[Math.floor(rand(i * 71) * goodKeys.length)];
      var flaw = flawKeys[Math.floor(rand(i * 83) * flawKeys.length)];
      var bg = STAFF_BACKGROUNDS[Math.floor(rand(i * 91) * STAFF_BACKGROUNDS.length)];
      var potentialBonus = potential === 'S' ? 100 : potential === 'A' ? 50 : 0;
      market.push({
        id: 'c' + d + '_' + i,
        name: name,
        age: 20 + Math.floor(rand(i * 31) * 15),
        personality: traits[Math.floor(rand(i * 41) * traits.length)],
        skills: skills,
        morale: 60 + Math.floor(rand(i * 51) * 30),
        salary: 60 + sum * 12 + (potential === 'S' ? 30 : potential === 'A' ? 15 : 0),
        hireCost: 150 + sum * 20 + potentialBonus,
        potential: potential,
        perks: [good, flaw],
        background: bg,
        lookSeed: 'c' + d + '_' + i,
        recommendedRole: staffRecommendedRole({ skills: skills })
      });
    }
    s.staffMarket = market;
    s.staffMarketDay = d;
  };

  Engine.getStaff = function () {
    var s = Engine.state;
    return (s && Array.isArray(s.staff)) ? s.staff : [];
  };

  Engine.getStaffWages = function () {
    var n = 0;
    Engine.getStaff().forEach(function (m) { n += m.salary || 0; });
    return n;
  };

  Engine.getStaffEffect = function (kind) {
    var s = Engine.state;
    if (!s) { return 0; }
    var total = 0;
    Engine.getStaff().forEach(function (m) {
      if (m.trainingDay && m.trainingDay === s.day) { return; }
      var v = (m.skills && m.skills[kind]) || 0;
      v += staffPerkEffect(m, kind);
      if (m.role === kind) { v *= 1.25; }
      if (m.manager) { v *= 1.2; }
      if ((m.morale || 0) < 30) { v *= 0.5; }
      else if (staffHasPerk(m, 'glass') && (m.morale || 0) < 50) { v *= 0.5; }
      if (staffHasPerk(m, 'slow') && s.day - (m.hiredDay || s.day) < 2) { v *= 0.8; }
      total += v;
    });
    return Math.max(0, total);
  };

  Engine.getRolePerkCount = function (kind) {
    var n = 0;
    Engine.getStaff().forEach(function (m) {
      if (m.role === kind && (m.skills && m.skills[kind] || 0) >= 3) { n += 1; }
    });
    return n;
  };

  Engine.getSalesBonus = function () {
    return Math.min(0.06, Engine.getStaffEffect('sales') * 0.01 + Engine.getRolePerkCount('sales') * 0.01);
  };
  Engine.getStylingBonus = function () {
    return Math.min(6, Math.round(Engine.getStaffEffect('styling') + Engine.getRolePerkCount('styling')));
  };
  Engine.getDisplayBonus = function () {
    return Math.min(0.06, Engine.getStaffEffect('display') * 0.01 + Engine.getRolePerkCount('display') * 0.01);
  };
  Engine.getOrganizeBonus = function () {
    return Math.min(12, Math.round(Engine.getStaffEffect('organize') + Engine.getRolePerkCount('organize')));
  };

  Engine.hireStaff = function (candidateId) {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    if (Engine.getStaff().length >= STAFF_MAX) { return { ok: false, message: '最多招 ' + STAFF_MAX + ' 名员工。' }; }
    var cand = (s.staffMarket || []).filter(function (c) { return c.id === candidateId; })[0];
    if (!cand) { return { ok: false, message: '这个人已经不在市场了。' }; }
    if (s.cash < cand.hireCost) { return { ok: false, message: '现金不够付招聘费。' }; }
    s.cash -= cand.hireCost;
    s.staffUid = (s.staffUid || 1) + 1;
    var member = normalizeStaffMember({
      uid: 's' + s.staffUid,
      name: cand.name,
      age: cand.age,
      personality: cand.personality,
      skills: Object.assign({}, cand.skills),
      morale: cand.morale,
      salary: cand.salary,
      manager: false,
      trainingDay: 0,
      trainingSkill: null,
      hiredDay: s.day,
      potential: cand.potential,
      perks: (cand.perks || []).slice(),
      background: cand.background,
      lookSeed: cand.lookSeed || cand.id,
      recommendedRole: cand.recommendedRole || staffRecommendedRole(cand),
      role: null,
      workDays: 0
    });
    s.staff.push(member);
    s.staffMarket = s.staffMarket.filter(function (c) { return c.id !== candidateId; });
    Engine.save();
    return { ok: true };
  };

  function findStaff(uid) {
    return Engine.getStaff().filter(function (m) { return m.uid === uid; })[0] || null;
  }

  Engine.getTrainingOptions = function (uid) {
    var m = findStaff(uid);
    if (!m) { return []; }
    var picky = staffHasPerk(m, 'picky') ? 1.2 : 1;
    return STAFF_SKILLS.map(function (skill) {
      var level = (m.skills && m.skills[skill]) || 0;
      return {
        skill: skill,
        label: STAFF_SKILL_LABELS[skill],
        level: level,
        next: Math.min(5, level + 1),
        cost: Math.round((STAFF_TRAIN_BASE + level * STAFF_TRAIN_STEP) * picky),
        maxed: level >= 5
      };
    });
  };

  Engine.trainStaff = function (uid, skill) {
    var s = Engine.state;
    var m = findStaff(uid);
    if (!s || !m) { return { ok: false }; }
    if (m.trainingDay) { return { ok: false, message: '她正在培训中。' }; }
    var options = Engine.getTrainingOptions(uid).filter(function (o) { return !o.maxed; });
    var opt = null;
    if (skill) {
      opt = options.filter(function (o) { return o.skill === skill; })[0] || null;
    } else {
      opt = options.sort(function (a, b) { return a.level - b.level; })[0] || null;
    }
    if (!opt) { return { ok: false, message: '四项技能都已经满级了。' }; }
    if (s.cash < opt.cost) { return { ok: false, message: '现金不够培训费。' }; }
    s.cash -= opt.cost;
    m.trainingDay = s.day;
    m.trainingSkill = opt.skill;
    if (s.dayStats) { s.dayStats.staffCost = (s.dayStats.staffCost || 0) + opt.cost; }
    Engine.save();
    return { ok: true, cost: opt.cost, skill: opt.skill };
  };

  Engine.setStaffRole = function (uid, role) {
    var s = Engine.state;
    var m = findStaff(uid);
    if (!s || !m) { return { ok: false }; }
    if (role && !STAFF_ROLES[role]) { return { ok: false, message: '没有这个岗位。' }; }
    m.role = role || null;
    Engine.save();
    return { ok: true };
  };

  Engine.staffBonus = function (uid) {
    var s = Engine.state;
    var m = findStaff(uid);
    if (!s || !m) { return { ok: false }; }
    if (s.cash < STAFF_BONUS_COST) { return { ok: false, message: '现金不够发奖金。' }; }
    s.cash -= STAFF_BONUS_COST;
    var gain = staffHasPerk(m, 'proud') ? 8 : 15;
    m.morale = Math.min(100, (m.morale || 0) + gain);
    Engine.save();
    return { ok: true, gain: gain };
  };

  Engine.fireStaff = function (uid) {
    var s = Engine.state;
    var m = findStaff(uid);
    if (!s || !m) { return { ok: false }; }
    s.cash -= m.salary || 0;   // 赔偿一天工资
    s.staff = s.staff.filter(function (x) { return x.uid !== uid; });
    Engine.save();
    return { ok: true };
  };

  Engine.appointManager = function (uid) {
    var s = Engine.state;
    var m = findStaff(uid);
    if (!s || !m) { return { ok: false }; }
    var sum = staffSkillSum(m);
    if (sum < 15) { return { ok: false, message: '技能总和要到 15 才能当店长。' }; }
    if ((m.morale || 0) < 70) { return { ok: false, message: '士气要到 70 才能当店长。' }; }
    s.staff.forEach(function (x) { x.manager = false; });
    m.manager = true;
    Engine.save();
    return { ok: true };
  };

  function finishTraining(m) {
    var skill = m.trainingSkill;
    var keys = STAFF_SKILLS.filter(function (k) { return (m.skills[k] || 0) < 5; });
    if (!skill || (m.skills[skill] || 0) >= 5) {
      keys.sort(function (a, b) { return (m.skills[a] || 0) - (m.skills[b] || 0); });
      skill = keys[0] || null;
    }
    if (skill) {
      m.skills[skill] = Math.min(5, (m.skills[skill] || 0) + 1);
    }
    m.trainingDay = 0;
    m.trainingSkill = null;
    m.morale = Math.min(100, (m.morale || 0) + 10);
  }

  function applyStaffDailyGrowth(m) {
    var need = Engine.getStaffGrowthNeed(m);
    m.workDays = (m.workDays || 0) + 1;
    if (m.workDays < need) { return; }
    var role = m.role || staffRecommendedRole(m);
    if (role && (m.skills[role] || 0) < 5) {
      m.skills[role] = Math.min(5, (m.skills[role] || 0) + 1);
      m.workDays = 0;
      m.morale = Math.min(100, (m.morale || 0) + 3);
    } else {
      m.workDays = 0;
    }
  }

  Engine.getShelfCap = function () {
    // 基础 40 件，含初始 2 个货架；每多一个货架 +8
    return SHELF_CAP_BASE + Math.max(0, Engine.getRackCount() - 2) * 8;
  };

  Engine.getStoreCap = function () {
    return STORE_CAP_BASE + (Engine.getStoreLevel() - 1) * STORE_CAP_STEP + Engine.getOrganizeBonus() * 2;
  };

  Engine.getStoreLevel = function () {
    var s = Engine.state;
    return s && s.warehouse ? (s.warehouse.level || 1) : 1;
  };

  Engine.getShelfQty = function (id) {
    var entry = Engine.getShelfMap()[id];
    return entry && entry.qty > 0 ? entry.qty : 0;
  };

  Engine.getStoreQty = function (id) {
    var entry = Engine.getStoreMap()[id];
    return entry && entry.qty > 0 ? entry.qty : 0;
  };

  Engine.getShelfCount = function () { return countMap(Engine.getShelfMap()); };
  Engine.getStoreCount = function () { return countMap(Engine.getStoreMap()); };

  Engine.addToStore = function (id, qty) {
    var s = Engine.state;
    if (!s || !D.ITEMS_BY_ID[id] || qty <= 0) { return { added: 0, overflow: Math.max(0, qty || 0) }; }
    var free = Math.max(0, Engine.getStoreCap() - Engine.getStoreCount());
    var added = Math.min(qty, free);
    if (added > 0) {
      var map = Engine.getStoreMap();
      map[id] = map[id] || { qty: 0 };
      map[id].qty += added;
    }
    return { added: added, overflow: qty - added };
  };

  Engine.moveToShelf = function (id, qty) {
    var s = Engine.state;
    if (!s || qty <= 0) { return 0; }
    var shelf = Engine.getShelfMap();
    var store = Engine.getStoreMap();
    var free = Math.max(0, Engine.getShelfCap() - Engine.getShelfCount());
    var have = store[id] ? store[id].qty : 0;
    var moved = Math.min(qty, free, have);
    if (moved <= 0) { return 0; }
    shelf[id] = shelf[id] || { qty: 0 };
    shelf[id].qty += moved;
    store[id].qty -= moved;
    if (store[id].qty <= 0) { delete store[id]; }
    return moved;
  };

  Engine.restockShelf = function () {
    var ids = Object.keys(Engine.getStoreMap());
    var moved = 0;
    for (var i = 0; i < ids.length; i++) {
      if (Engine.getShelfCount() >= Engine.getShelfCap()) { break; }
      moved += Engine.moveToShelf(ids[i], Engine.getStoreMap()[ids[i]].qty);
    }
    return moved;
  };

  Engine.takeFromShelf = function (id, qty) {
    var map = Engine.getShelfMap();
    var entry = map[id];
    if (!entry || entry.qty <= 0 || qty <= 0) { return 0; }
    var take = Math.min(qty, entry.qty);
    entry.qty -= take;
    if (entry.qty <= 0) { delete map[id]; }
    return take;
  };

  Engine.getStoreUpgradeCost = function () {
    var level = Engine.getStoreLevel();
    if (level >= STORE_MAX_LEVEL) { return null; }
    return STORE_UPGRADE_COST[level];
  };

  Engine.upgradeStore = function () {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var cost = Engine.getStoreUpgradeCost();
    if (cost == null) { return { ok: false, message: '仓库已经满级了。' }; }
    if (s.cash < cost) { return { ok: false, message: '现金不够升级仓库。' }; }
    s.cash -= cost;
    s.warehouse.level += 1;
    Engine.save();
    return { ok: true, level: s.warehouse.level, cost: cost };
  };

  Engine.getClearancePrice = function (item) {
    return Math.max(1, Math.round(Engine.getEffectivePrice(item) * 0.3));
  };

  Engine.getStoreEntries = function (category) {
    var out = [];
    var map = Engine.getStoreMap();
    Object.keys(map).forEach(function (id) {
      var entry = map[id];
      var item = D.ITEMS_BY_ID[id];
      if (!item || !entry || entry.qty <= 0) { return; }
      if (category && category !== 'all' && item.cat !== category) { return; }
      out.push({ item: item, qty: entry.qty, clearPrice: Engine.getClearancePrice(item) });
    });
    out.sort(function (a, b) { return compareItems(a.item, b.item); });
    return out;
  };

  Engine.clearanceSell = function (ids) {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var sold = 0;
    var cash = 0;
    var map = Engine.getStoreMap();
    (ids || []).forEach(function (id) {
      var entry = map[id];
      var item = D.ITEMS_BY_ID[id];
      if (!entry || entry.qty <= 0 || !item) { return; }
      var qty = entry.qty;
      var price = Engine.getClearancePrice(item);
      cash += price * qty;
      sold += qty;
      if (s.dayStats) {
        s.dayStats.cogs += item.cost * qty;
        s.dayStats.revenue += price * qty;
      }
      delete map[id];
    });
    if (!sold) { return { ok: false, message: '没有可清仓的商品。' }; }
    s.cash += cash;
    Engine.save();
    return { ok: true, sold: sold, cash: cash };
  };

  Engine.getInventoryEntries = function (category) {
    var out = [];
    var map = Engine.getShelfMap();
    Object.keys(map).forEach(function (id) {
      var entry = map[id];
      var item = D.ITEMS_BY_ID[id];
      if (!item || !entry || entry.qty <= 0) { return; }
      if (category && category !== 'all' && item.cat !== category) { return; }
      out.push({ item: item, qty: entry.qty });
    });
    out.sort(function (a, b) { return compareItems(a.item, b.item); });
    return out;
  };

  Engine.getInventoryItems = function (category) {
    return Engine.getInventoryEntries(category).map(function (x) { return x.item; });
  };

  Engine.getInventoryCount = function () {
    return Engine.getShelfCount();
  };

  Engine.getWardrobeSummary = function () {
    var out = { pieces: 0, kinds: 0, costBasis: 0, retailValue: 0 };
    Engine.getInventoryEntries('all').forEach(function (entry) {
      out.pieces += entry.qty;
      out.kinds += 1;
      out.costBasis += entry.item.cost * entry.qty;
      out.retailValue += Engine.getEffectivePrice(entry.item) * entry.qty;
    });
    return out;
  };

  /* ---------------- 散货自选（购物车） ---------------- */

  Engine.getSupplyEntries = function (category) {
    var s = Engine.state;
    var out = [];
    if (!s) { return out; }
    D.ITEMS.forEach(function (item) {
      if (item.design) { return; }
      if (category && category !== 'all' && item.cat !== category) { return; }
      var owned = Engine.getShelfQty(item.id) + Engine.getStoreQty(item.id);
      out.push({
        item: item,
        owned: owned,
        qty: s.cart[item.id] || 0,
        cost: Engine.getSupplyCost(item),
        season: Engine.getItemSeasonState(item)
      });
    });
    out.sort(function (a, b) { return compareItems(a.item, b.item); });
    return out;
  };

  Engine.getCartEntries = function () {
    var s = Engine.state;
    var out = [];
    if (!s) { return out; }
    D.ITEMS.forEach(function (item) {
      var qty = s.cart[item.id] || 0;
      if (qty > 0) {
        var unit = Engine.getSupplyCost(item);
        out.push({ item: item, qty: qty, unit: unit, subtotal: unit * qty });
      }
    });
    return out;
  };

  Engine.getCartCount = function () {
    var n = 0;
    Engine.getCartEntries().forEach(function (e) { n += e.qty; });
    return n;
  };

  Engine.getCartCost = function () {
    var n = 0;
    Engine.getCartEntries().forEach(function (e) { n += e.subtotal; });
    return n;
  };

  Engine.addToCart = function (id, delta) {
    var s = Engine.state;
    var item = D.ITEMS_BY_ID[id];
    if (!s || !item) { return { ok: false }; }
    var cur = s.cart[id] || 0;
    var step = delta == null ? 1 : delta;
    var next = clamp(cur + step, 0, CART_MAX_PER_ITEM);
    if (next === cur) {
      return { ok: false, message: step > 0 ? '单款最多进 ' + CART_MAX_PER_ITEM + ' 件' : '' };
    }
    if (next === 0) {
      delete s.cart[id];
      if (Array.isArray(s.windowItems) && s.windowItems.indexOf(id) >= 0) {
        var stillOwned = Engine.getShelfQty(id) > 0;
        if (!stillOwned) { s.windowItems.splice(s.windowItems.indexOf(id), 1); }
      }
    } else {
      s.cart[id] = next;
    }
    Engine.save();
    return { ok: true, qty: next };
  };

  Engine.clearCart = function () {
    var s = Engine.state;
    if (!s) { return; }
    s.cart = {};
    Engine.save();
  };

  Engine.setCartCategory = function (cat) {
    var s = Engine.state;
    if (!s) { return; }
    s.cartCategory = cat || 'all';
    s.accessorySlot = 'all';
    Engine.save();
  };

  Engine.setInventoryCategory = function (cat) {
    var s = Engine.state;
    if (!s) { return; }
    s.invCategory = cat || 'all';
    s.accessorySlot = 'all';
    Engine.save();
  };

  Engine.setAccessorySlot = function (slot) {
    var s = Engine.state;
    if (!s) { return; }
    s.accessorySlot = slot || 'all';
    Engine.save();
  };

  Engine.setStyleFilter = function (style) {
    var s = Engine.state;
    if (!s) { return; }
    s.styleFilter = style || 'all';
    Engine.save();
  };

  /* ---------------- 橱窗主推（最多 3 件） ---------------- */

  Engine.getWindowItems = function () {
    var s = Engine.state;
    if (!s || !Array.isArray(s.windowItems)) { return []; }
    return s.windowItems.slice(0, WINDOW_MAX);
  };

  // 橱窗候选 = 现有存货 + 今天购物车里待入库的散货（到货的排在前面，免得挑完看不见）
  Engine.getWindowCandidates = function () {
    var s = Engine.state;
    var out = [];
    var seen = {};
    if (!s) { return out; }
    Engine.getCartEntries().forEach(function (entry) {
      var owned = Engine.getShelfQty(entry.item.id);
      out.push({ item: entry.item, qty: owned, incoming: entry.qty });
      seen[entry.item.id] = true;
    });
    Engine.getInventoryEntries('all').forEach(function (entry) {
      if (seen[entry.item.id]) { return; }
      out.push({ item: entry.item, qty: entry.qty });
    });
    return out;
  };

  Engine.isWindowEligible = function (id) {
    var s = Engine.state;
    if (!s || !D.ITEMS_BY_ID[id]) { return false; }
    var owned = Engine.getShelfQty(id) > 0;
    var incoming = s.cart && s.cart[id] > 0;
    return !!(owned || incoming);
  };

  Engine.getWindowTrafficMult = function () {
    var n = Engine.getWindowItems().length;
    return 1 + WINDOW_TRAFFIC[clamp(n, 0, WINDOW_MAX)];
  };

  Engine.sanitizeWindow = function () {
    var s = Engine.state;
    if (!s) { return; }
    var before = (s.windowItems || []).length;
    s.windowItems = (s.windowItems || []).filter(function (id) {
      return !!D.ITEMS_BY_ID[id] && Engine.getShelfQty(id) > 0;
    });
    if (s.windowItems.length !== before) { Engine.save(); }
  };

  Engine.toggleWindow = function (itemId) {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var item = D.ITEMS_BY_ID[itemId];
    if (!item) { return { ok: false }; }
    if (!s.windowItems) { s.windowItems = []; }
    var idx = s.windowItems.indexOf(itemId);
    if (idx >= 0) {
      s.windowItems.splice(idx, 1);
      Engine.save();
      return { ok: true, removed: true };
    }
    if (Engine.getShelfQty(itemId) <= 0) {
      if (!(s.cart && s.cart[itemId] > 0)) {
        return { ok: false, message: '这件没有库存，先补货吧。' };
      }
    }
    if (s.windowItems.length >= WINDOW_MAX) {
      return { ok: false, message: '橱窗最多主推 ' + WINDOW_MAX + ' 件' };
    }
    s.windowItems.push(itemId);
    Engine.save();
    return { ok: true, added: true };
  };

  Engine.selectLot = function (id) {
    var s = Engine.state;
    if (!s) { return; }
    if (!id || id === 'none') {
      s.pendingLot = null;
    } else if (D.LOTS_BY_ID[id]) {
      s.pendingLot = id;
    }
    Engine.save();
  };

  Engine.selectMarketing = function (id) {
    var s = Engine.state;
    if (!s || !D.MARKETING[id]) { return; }
    s.pendingMarketing = id === 'none' ? 'none' : id;
    Engine.save();
  };

  Engine.selectPricing = function (id) {
    var s = Engine.state;
    if (!s || !D.PRICING[id]) { return; }
    s.pricing = id;
    Engine.save();
  };

  Engine.toPrep = function () {
    var s = Engine.state;
    if (!s) { return; }
    s.screen = 'prep';
    Engine.save();
  };

  Engine.openShop = function () {
    var s = Engine.state;
    if (!s || !s.dayStats) { return { ok: false, message: '状态还没准备好，刷新一下试试。' }; }
    if (s.dayStats.opened) { return { ok: false, message: '今天已经开门了。' }; }

    var lot = s.pendingLot ? D.LOTS_BY_ID[s.pendingLot] : null;
    var mkt = s.pendingMarketing ? D.MARKETING[s.pendingMarketing] : D.MARKETING.none;
    var cartEntries = Engine.getCartEntries();
    var cartCost = Engine.getCartCost();
    var lotCost = lot ? Engine.getLotCost(lot) : 0;
    var wages = Engine.getStaffWages();
    var cost = lotCost + cartCost + (mkt ? mkt.cost : 0) + wages;
    if (cost > s.cash) {
      return { ok: false, message: '现金不够，换个进货或营销方案吧。' };
    }
    var incoming = Engine.getCartCount() + (lot ? lot.items.length * 2 : 0);
    if (Engine.getStoreCount() + incoming > Engine.getStoreCap()) {
      return { ok: false, message: '仓库放不下，先清仓或升级仓库。' };
    }

    s.cash -= cost;
    s.dayStats.purchaseCost = lotCost + cartCost;
    s.dayStats.marketingCost = mkt ? mkt.cost : 0;
    s.dayStats.staffCost = (s.dayStats.staffCost || 0) + wages;
    s.dayStats.opened = true;

    if (lot) {
      lot.items.forEach(function (id) {
        Engine.addToStore(id, 2);
      });
    }
    cartEntries.forEach(function (entry) {
      Engine.addToStore(entry.item.id, entry.qty);
    });
    s.cart = {};

    s.marketing = mkt.id;
    Engine.restockShelf();
    Engine.sanitizeWindow();

    var cfg = Engine.getDayConfig(s.day);
    var weather = Engine.getWeatherDay(s.day);
    var pricing = D.PRICING[s.pricing] || D.PRICING.standard;
    var traffic = cfg.baseTraffic * weather.traffic;
    traffic *= Engine.getWindowTrafficMult();
    traffic *= mkt.traffic;
    traffic *= pricing.traffic;
    traffic *= 1 + (s.reputation - 50) / 200;
    traffic *= Engine.getDecorTrafficMult();
    traffic *= 1 + Engine.getDisplayBonus();
    traffic *= cfg.trafficMult || 1;
    if (cfg.eventType === 'competitor') { traffic *= 0.9; }
    else if (cfg.eventType === 'market') { traffic *= 1.2; }
    s.dayStats.visitors = Engine.getTrafficForecast().visitors;

    if (!s.customersToday || !s.customersToday.length) {
      s.customersToday = Engine.generateCustomers(cfg);
    }
    Engine.syncAppointments();
    Engine.buildDayQueue();
    s.serviceMode = 'quick';
    s.activeCategory = 'all';
    s.accessorySlot = 'all';
    s.styleFilter = 'all';
    s.selectedItems = [];
    s.quickOptions = [];
    s.pendingResult = null;
    Engine.beginCustomer();
    return { ok: true };
  };

  Engine.generateCustomers = function (cfg, seedList) {
    var s = Engine.state;
    var count = Engine.getTrafficForecast().count;
    var used = s.usedCustomers || [];
    var selected = [];
    (seedList || []).forEach(function (id) {
      if (D.CUSTOMERS_BY_ID[id] && selected.indexOf(id) < 0) { selected.push(id); }
    });

    var force = (cfg.force || []).filter(function (id) { return !!D.CUSTOMERS_BY_ID[id]; });
    // 常客回访：第一次接待过、今天到回访日、还没回来过，就作为额外预约注入
    (D.REGULAR_RETURNS || []).forEach(function (r) {
      var rec = s.regularVisits && s.regularVisits[r.first];
      if (!rec || rec.returned || r.day !== s.day) { return; }
      if (s.usedCustomers.indexOf(r.next) >= 0) { return; }
      if (D.CUSTOMERS_BY_ID[r.next] && force.indexOf(r.next) < 0) { force.push(r.next); }
    });
    force.forEach(function (id) {
      if (selected.indexOf(id) < 0) { selected.unshift(id); }
    });

    // 客人变少时只撤掉散客，固定预约保留
    while (selected.length > count) {
      var drop = -1;
      for (var di = selected.length - 1; di >= 0; di--) {
        if (force.indexOf(selected[di]) < 0) { drop = di; break; }
      }
      if (drop < 0) { break; }
      selected.splice(drop, 1);
    }

    var pool = D.CUSTOMERS.filter(function (c) {
      if (c.regularFirst) { return false; }   // 回访客只按日程注入，不参与随机池
      if (used.indexOf(c.id) >= 0) { return false; }
      if (selected.indexOf(c.id) >= 0) { return false; }
      return true;
    });

    while (selected.length < count && pool.length) {
      var weights = pool.map(function (c) {
        var w = 1;
        var windowItems = s.windowItems || [];
        if (windowItems.length) {
          var hits = 0;
          windowItems.forEach(function (wid) {
            var wi = D.ITEMS_BY_ID[wid];
            if (wi && c.styles.some(function (st) { return wi.style.indexOf(st) >= 0; })) { hits += 1; }
          });
          if (hits) { w += Math.min(0.6, 0.3 * hits); }
        }
        if (c.styles.indexOf(cfg.trend) >= 0) { w += 0.4; }
        var season = cfg.season || Engine.getSeason();
        if (season && season.trends && c.styles.some(function (st) { return season.trends.indexOf(st) >= 0; })) {
          w += 0.3;
        }
        // 当天/已过预约日的顾客优先；未来顾客也能被客流拉进来，但权重更低
        if (c.reserveDay === s.day) { w += 1.6; }
        else if (c.reserveDay && c.reserveDay < s.day) { w += 0.5; }
        else if (c.reserveDay && c.reserveDay > s.day) { w += 0.05; }
        return w;
      });
      var idx = Engine.weightedPick(pool, weights);
      selected.push(pool[idx].id);
      pool.splice(idx, 1);
    }

    return selected;
  };

  // 装修/口碑/天气变化后，按新的预约人数补齐或撤掉散客
  Engine.syncAppointments = function () {
    var s = Engine.state;
    if (!s) { return []; }
    var before = (s.customersToday || []).join(',');
    var cfg = Engine.getDayConfig(s.day);
    s.customersToday = Engine.generateCustomers(cfg, s.customersToday || []);
    if (s.customerIndex >= s.customersToday.length) { s.customerIndex = 0; }
    if (s.customersToday.join(',') !== before) { Engine.save(); }
    return s.customersToday;
  };

  /* ---------------- 多顾客队列 / 店员接待 / 试衣间 ---------------- */

  function customerByIdSafe(id) {
    var c = id ? D.CUSTOMERS_BY_ID[id] : null;
    if (!c) { return null; }
    if (!Engine.isVip(c.id)) { return c; }
    var vip = {};
    Object.keys(c).forEach(function (k) { vip[k] = c[k]; });
    vip.vip = true;
    vip.budget = Math.round((c.budget || 600) * 3);
    return vip;
  }

  function queueRecord(id) {
    var s = Engine.state;
    if (!s || !Array.isArray(s.queue)) { return null; }
    for (var i = 0; i < s.queue.length; i++) {
      if (s.queue[i].id === id) { return s.queue[i]; }
    }
    return null;
  }

  function staffByUid(uid) {
    var list = Engine.getStaff();
    for (var i = 0; i < list.length; i++) {
      if (list[i].uid === uid) { return list[i]; }
    }
    return null;
  }

  function staffInUse() {
    var s = Engine.state;
    var used = {};
    if (!s || !Array.isArray(s.queue)) { return used; }
    s.queue.forEach(function (r) {
      if (r.staffUid && (r.status === 'staff' || r.status === 'staffFitting')) { used[r.staffUid] = true; }
    });
    return used;
  }

  function freeStaff() {
    var used = staffInUse();
    return Engine.getStaff().filter(function (m) { return !used[m.uid]; });
  }

  function planStaffOutfit(customer) {
    if (!customer) { return null; }
    var options = Engine.generateOutfitOptions(customer);
    if (!options || !options.length) { return null; }
    var affordable = options.filter(function (o) { return o.total <= customer.budget * 1.15; });
    var pick = affordable.length ? affordable[0] : options[0];
    return {
      items: pick.items.slice(),
      total: pick.total,
      score: pick.score,
      result: pick.result
    };
  }

  function queueLog(entry) {
    var s = Engine.state;
    if (!s) { return; }
    if (!Array.isArray(s.staffLog)) { s.staffLog = []; }
    s.staffLog.push(entry);
    if (s.staffLog.length > 40) { s.staffLog = s.staffLog.slice(-40); }
  }

  Engine.getFittingRooms = function () {
    return Math.max(0, Engine.getFittingCount());
  };

  Engine.getFittingOccupied = function () {
    var s = Engine.state;
    if (!s || !Array.isArray(s.queue)) { return 0; }
    var n = 0;
    s.queue.forEach(function (r) {
      if (r.status === 'fitting' || r.status === 'staffFitting') { n += 1; }
    });
    return n;
  };

  Engine.getFittingQueue = function () {
    var s = Engine.state;
    if (!s || !Array.isArray(s.queue)) { return []; }
    return s.queue.filter(function (r) { return r.status === 'fittingWait'; });
  };

  function promoteStaffToFitting(limitForUser) {
    var s = Engine.state;
    if (!s) { return; }
    var rooms = Engine.getFittingRooms();
    var occupied = Engine.getFittingOccupied();
    var roomLeft = rooms - occupied;
    if (limitForUser && roomLeft > 0) { roomLeft -= 1; }
    for (var i = 0; i < s.queue.length && roomLeft > 0; i++) {
      var r = s.queue[i];
      if (r.status !== 'staff') { continue; }
      r.status = 'staffFitting';
      roomLeft -= 1;
      queueLog({ type: 'staffFitting', customerName: (customerByIdSafe(r.id) || {}).name || r.id, staffName: r.staffName || '店员' });
    }
  }

  function assignStaffToQueue(keepOneForUser) {
    var s = Engine.state;
    if (!s || !Array.isArray(s.queue)) { return; }
    var free = freeStaff();
    if (!free.length) { return; }
    var waiting = s.queue.filter(function (r) { return r.status === 'waiting'; });
    for (var i = 0; i < free.length; i++) {
      if (waiting.length <= (keepOneForUser ? 1 : 0)) { break; }
      var rec = waiting.shift();
      var customer = customerByIdSafe(rec.id);
      var plan = planStaffOutfit(customer);
      rec.staffUid = free[i].uid;
      rec.staffName = free[i].name;
      rec.planned = plan;
      rec.itemIds = plan ? plan.items.slice() : [];
      rec.note = plan ? '' : '没有可推荐的完整搭配';
      rec.status = 'staff';
    }
    promoteStaffToFitting(true);
  }

  function tickWaitingPatience() {
    var s = Engine.state;
    if (!s || !Array.isArray(s.queue)) { return; }
    s.queue.forEach(function (r) {
      if (r.status !== 'waiting') { return; }
      r.patience = Math.max(0, (r.patience || 0) - 1);
      if (r.patience <= 0) {
        r.status = 'left';
        r.leaveReason = 'wait';
        r.note = '等太久，走了';
        if (s.dayStats) { s.dayStats.queueLeft = (s.dayStats.queueLeft || 0) + 1; }
        queueLog({ type: 'queueLeft', customerName: (customerByIdSafe(r.id) || {}).name || r.id });
      }
    });
  }

  function staffSell(customer, rec, plan) {
    var s = Engine.state;
    var ds = s.dayStats;
    var items = (plan && plan.items) || rec.itemIds || [];
    var result = (plan && plan.result) || Engine.scoreOutfit(customer, items);
    var sold = [];
    var revenue = 0;
    var cogs = 0;
    items.forEach(function (id) {
      var item = D.ITEMS_BY_ID[id];
      if (!item || Engine.getShelfQty(id) <= 0) { return; }
      sold.push(id);
      revenue += Engine.getEffectivePrice(item);
      cogs += item.cost;
    });
    if (!sold.length) {
      rec.status = 'done';
      rec.sold = false;
      rec.note = '货架上没有可卖的款';
      if (ds) { ds.staffServed = (ds.staffServed || 0) + 1; ds.served += 1; }
      queueLog({ type: 'staffLeave', customerName: customer.name, staffName: rec.staffName, reason: rec.note });
      Engine.markCustomerUsed(customer.id);
      return;
    }
    sold.forEach(function (id) { Engine.takeFromShelf(id, 1); });
    Engine.sanitizeWindow();
    revenue = round(revenue * (1 + Engine.getSalesBonus()));
    s.cash += revenue;
    if (ds) {
      ds.revenue += revenue;
      ds.cogs += cogs;
      ds.sales += 1;
      ds.served += 1;
      ds.staffServed = (ds.staffServed || 0) + 1;
      ds.staffSales = (ds.staffSales || 0) + 1;
      ds.staffRevenue = (ds.staffRevenue || 0) + revenue;
    }
    var repGain = result.score >= 85 ? 3 : result.score >= 70 ? 2 : 1;
    s.reputation = clamp(s.reputation + repGain, 0, 100);
    if (result.score >= 80) { s.fans += 1; }
    if (ds) {
      ds.reputationDelta = s.reputation - ds.startReputation;
      ds.fansDelta = s.fans - ds.startFans;
      if (!ds.stylingBest || result.score > ds.stylingBest.score) {
        ds.stylingBest = {
          customerId: customer.id,
          customerName: customer.name,
          score: result.score,
          itemIds: sold.slice(),
          total: revenue,
          discount: 1,
          byStaff: rec.staffName || ''
        };
      }
    }
    rec.status = 'done';
    rec.sold = true;
    rec.itemIds = sold.slice();
    rec.score = result.score;
    rec.revenue = revenue;
    rec.note = '店员成交 ¥' + revenue;
    if (customer.id === 'nana' && ds) { ds.nanaSale = true; }
    Engine.markCustomerUsed(customer.id);
    queueLog({
      type: 'staffSale', customerName: customer.name, staffName: rec.staffName,
      score: result.score, revenue: revenue, items: sold.slice()
    });
  }

  function completeStaffRecord(rec) {
    var s = Engine.state;
    if (!s || !rec || rec.status === 'done' || rec.status === 'left') { return; }
    var customer = customerByIdSafe(rec.id);
    if (!customer) { rec.status = 'left'; return; }
    var plan = rec.planned || planStaffOutfit(customer);
    var result = (plan && plan.result) || Engine.scoreOutfit(customer, rec.itemIds || []);
    var canSell = result.score >= 55 && result.total <= customer.budget * 1.15;
    if (canSell) {
      staffSell(customer, rec, plan);
    } else {
      rec.status = 'done';
      rec.sold = false;
      rec.score = result.score;
      rec.note = result.score < 55 ? '店员没搭到她的点上' : '价格超出预算';
      if (s.dayStats) {
        s.dayStats.served += 1;
        s.dayStats.staffServed = (s.dayStats.staffServed || 0) + 1;
        s.dayStats.reputationDelta = s.reputation - s.dayStats.startReputation;
        s.dayStats.fansDelta = s.fans - s.dayStats.startFans;
      }
      if (result.score < 40) { s.reputation = clamp(s.reputation - 1, 0, 100); }
      Engine.markCustomerUsed(customer.id);
      queueLog({ type: 'staffLeave', customerName: customer.name, staffName: rec.staffName, reason: rec.note });
    }
  }

  function completeStaffFitting() {
    var s = Engine.state;
    if (!s || !Array.isArray(s.queue)) { return; }
    var list = s.queue.filter(function (r) { return r.status === 'staffFitting'; });
    list.forEach(function (r) { completeStaffRecord(r); });
  }

  function flushStaffQueue() {
    var s = Engine.state;
    if (!s || !Array.isArray(s.queue)) { return; }
    for (var guard = 0; guard < 12; guard++) {
      var rec = s.queue.filter(function (r) { return r.status === 'staff' || r.status === 'staffFitting'; })[0];
      if (!rec) { break; }
      completeStaffRecord(rec);
    }
  }

  Engine.buildDayQueue = function () {
    var s = Engine.state;
    if (!s) { return []; }
    var ids = (s.customersToday || []).slice();
    var staff = Engine.getStaff();
    var capacity = 3 + staff.length;
    s.queue = [];
    s.servingCustomerId = null;
    s.staffLog = [];
    ids.forEach(function (id, index) {
      var customer = customerByIdSafe(id);
      if (!customer) { return; }
      var patience = 3 + (customer.styling ? 1 : 0) + Engine.getWeatherPatience();
      var rec = {
        id: id,
        status: 'waiting',
        patience: Math.max(1, patience),
        arrivedAt: index,
        staffUid: null,
        staffName: '',
        itemIds: [],
        note: ''
      };
      if (index >= capacity) {
        rec.status = 'left';
        rec.leaveReason = 'crowd';
        rec.note = '人太多，看了一眼就走了';
        if (s.dayStats) { s.dayStats.crowdLeft = (s.dayStats.crowdLeft || 0) + 1; }
        queueLog({ type: 'crowdLeft', customerName: customer.name });
      }
      s.queue.push(rec);
    });
    var first = s.queue.filter(function (r) { return r.status === 'waiting'; })[0];
    if (first) {
      first.status = 'serving';
      s.servingCustomerId = first.id;
      s.customerIndex = s.customersToday.indexOf(first.id);
    }
    assignStaffToQueue(true);
    Engine.save();
    return s.queue;
  };

  Engine.getQueueRecord = queueRecord;

  Engine.getQueue = function () {
    var s = Engine.state;
    if (!s || !Array.isArray(s.queue)) { return []; }
    return s.queue.map(function (r) {
      var out = {};
      Object.keys(r).forEach(function (k) { out[k] = r[k]; });
      out.customer = D.CUSTOMERS_BY_ID[r.id] || null;
      return out;
    });
  };

  Engine.getQueueSummary = function () {
    var s = Engine.state;
    var out = {
      total: 0, serving: 0, waiting: 0, staff: 0, staffFitting: 0,
      fitting: 0, fittingWait: 0, done: 0, left: 0,
      onFloor: 0, fittingRooms: Engine.getFittingRooms(),
      fittingOccupied: Engine.getFittingOccupied(), crowdLeft: 0, queueLeft: 0
    };
    if (!s || !Array.isArray(s.queue)) { return out; }
    s.queue.forEach(function (r) {
      out.total += 1;
      if (r.status === 'serving') { out.serving += 1; }
      else if (r.status === 'waiting') { out.waiting += 1; }
      else if (r.status === 'staff') { out.staff += 1; }
      else if (r.status === 'staffFitting') { out.staffFitting += 1; }
      else if (r.status === 'fitting') { out.fitting += 1; }
      else if (r.status === 'fittingWait') { out.fittingWait += 1; }
      else if (r.status === 'done') { out.done += 1; }
      else if (r.status === 'left') { out.left += 1; }
    });
    out.staff += out.staffFitting;
    out.onFloor = out.serving + out.waiting + out.staff + out.fitting + out.fittingWait;
    out.crowdLeft = s.dayStats ? (s.dayStats.crowdLeft || 0) : 0;
    out.queueLeft = s.dayStats ? (s.dayStats.queueLeft || 0) : 0;
    return out;
  };

  Engine.getStaffLog = function () {
    var s = Engine.state;
    return s && Array.isArray(s.staffLog) ? s.staffLog.slice() : [];
  };

  Engine.setPreviewPose = function (pose) {
    var s = Engine.state;
    if (!s) { return; }
    if (['stand', 'hip', 'twirl', 'mirror'].indexOf(pose) < 0) { pose = 'stand'; }
    s.previewPose = pose;
    Engine.save();
  };

  Engine.getQueueCustomer = function (id) { return customerByIdSafe(id); };

  Engine.currentCustomer = function () {
    var s = Engine.state;
    if (!s) { return null; }
    if (s.servingCustomerId) {
      var c = customerByIdSafe(s.servingCustomerId);
      if (c) { return c; }
    }
    // 有队列时，队列结束就是今天结束，不再回退到旧的 customerIndex
    if (Array.isArray(s.queue) && s.queue.length) { return null; }
    if (!s.customersToday || s.customerIndex >= s.customersToday.length) { return null; }
    return customerByIdSafe(s.customersToday[s.customerIndex]);
  };

  Engine.getTodayAppointments = function () {
    var s = Engine.state;
    if (!s) { return []; }
    var cfg = Engine.getDayConfig(s.day);
    var ids = (s.customersToday && s.customersToday.length) ? s.customersToday : (cfg.force || []);
    return ids.map(function (id) { return D.CUSTOMERS_BY_ID[id]; }).filter(Boolean);
  };

  /* ---------------- 对话与好感 ---------------- */

  Engine.getDialogue = function (customer) {
    if (!customer) { return null; }
    if (typeof D.getDialogue === 'function') { return D.getDialogue(customer); }
    return null;
  };

  Engine.getChatBeat = function () {
    var s = Engine.state;
    var customer = Engine.currentCustomer();
    var d = Engine.getDialogue(customer);
    if (!s || !d || !d.beats) { return null; }
    return d.beats[s.chatStep] || null;
  };

  Engine.getAffinityLabel = function (value) {
    var v = typeof value === 'number' ? value : (Engine.state ? Engine.state.affinity : 45);
    if (v >= 78) { return '信任'; }
    if (v >= 60) { return '放松'; }
    if (v >= 38) { return '一般'; }
    return '防备';
  };

  Engine.getPatienceLeft = function () {
    var s = Engine.state;
    if (!s) { return 0; }
    return Math.max(0, (s.patience || 2) - (s.tryOnCount || 0));
  };

  Engine.recomputePatience = function () {
    var s = Engine.state;
    if (!s) { return; }
    var p = 2 + (s.affinity >= 65 ? 1 : 0) + (s.careUsed ? 1 : 0) + Engine.getWeatherPatience();
    if (p < s.tryOnCount) { p = s.tryOnCount; }
    s.patience = Math.max(1, p);
  };

  Engine.getWish = function (customer) {
    var s = Engine.state;
    var id = (s && s.wishId) || (customer && customer.wish) || 'polish';
    var def = (D.WISHES && (D.WISHES[id] || D.WISHES.polish)) || { label: '', desc: '' };
    return { id: id, label: def.label, desc: def.desc };
  };

  Engine.pickChallenge = function (customer) {
    var s = Engine.state;
    if (!s) { return 'budgetCut'; }
    var hasAcc = Engine.getInventoryItems('bag').length > 0 || Engine.getInventoryItems('accessory').length > 0;
    var hasWindow = (s.windowItems || []).some(function (id) { return Engine.getShelfQty(id) > 0; });
    var hasSeason = Engine.getInventoryItems('all').some(function (e) {
      return Engine.getItemSeasonState(e.item) === 'in';
    });
    var byWish = {
      polish: ['season', 'window', 'accent'],
      comfort: ['season', 'window', 'accent'],
      bright: ['accent', 'window', 'season'],
      unique: ['window', 'season', 'accent'],
      practical: ['accent', 'window', 'season'],
      budget: ['accent', 'window', 'season']
    };
    var order = byWish[(customer && customer.wish) || 'polish'] || ['accent', 'window', 'season'];
    for (var i = 0; i < order.length; i++) {
      var id = order[i];
      if (id === 'accent' && hasAcc) { return 'accent'; }
      if (id === 'window' && hasWindow) { return 'window'; }
      if (id === 'season' && hasSeason) { return 'season'; }
    }
    return 'budgetCut';
  };

  Engine.getChallenge = function (customer) {
    var s = Engine.state;
    var id = (s && s.challengeId) || Engine.pickChallenge(customer);
    var def = (D.CHALLENGES && (D.CHALLENGES[id] || D.CHALLENGES.budgetCut)) || { label: '', desc: '' };
    return { id: id, label: def.label, desc: def.desc };
  };

  Engine.challengeDone = function (id, customer, result, itemIds) {
    var s = Engine.state;
    if (!result || !customer || !itemIds || !itemIds.length) { return false; }
    switch (id) {
      case 'budgetCut':
        return result.total <= customer.budget * 0.85;
      case 'accent':
        return !!(result.categories.hasBag || result.categories.hasAccessory);
      case 'window':
        return itemIds.some(function (x) { return (s.windowItems || []).indexOf(x) >= 0; });
      case 'season':
        return result.items.some(function (it) { return Engine.getItemSeasonState(it) === 'in'; });
      default:
        return false;
    }
  };

  Engine.evaluateExtras = function (customer, itemIds, result) {
    var s = Engine.state;
    var ids = (itemIds || []).slice();
    var r = result || Engine.scoreOutfit(customer, ids);
    var wish = Engine.getWish(customer);
    var challenge = Engine.getChallenge(customer);
    var wishDone = !!(ids.length && D.wishDone && D.wishDone(customer, r.items, r.total));
    var challengeDone = Engine.challengeDone(challenge.id, customer, r, ids);
    var tip = (wishDone ? 80 : 0) + (challengeDone ? 60 : 0);
    return {
      wish: {
        id: wish.id, label: wish.label, desc: wish.desc,
        done: wishDone, revealed: !!(s && s.wishRevealed), tip: wishDone ? 80 : 0
      },
      challenge: {
        id: challenge.id, label: challenge.label, desc: challenge.desc,
        done: challengeDone, tip: challengeDone ? 60 : 0
      },
      tip: tip
    };
  };

  Engine.beginCustomer = function () {
    var s = Engine.state;
    if (!s) { return; }
    if (!s.servingCustomerId && Array.isArray(s.queue)) {
      var next = s.queue.filter(function (r) { return r.status === 'waiting'; })[0];
      if (next) {
        next.status = 'serving';
        s.servingCustomerId = next.id;
        s.customerIndex = Math.max(0, (s.customersToday || []).indexOf(next.id));
      }
    }
    var customer = Engine.currentCustomer();
    if (!customer) { Engine.endDay(); return; }
    var rec = queueRecord(s.servingCustomerId);
    if (rec && rec.status !== 'left' && rec.status !== 'done') { rec.status = 'serving'; }
    s.screen = 'chat';
    s.serviceMode = 'quick';
    s.activeCategory = 'all';
    s.accessorySlot = 'all';
    s.styleFilter = 'all';
    s.selectedItems = [];
    s.quickOptions = [];
    s.pendingResult = null;
    s.chatStep = 0;
    s.chatPhase = 'ask';
    s.chatReply = null;
    s.careUsed = false;
    s.careLine = '';
    s.careId = '';
    s.affinity = clamp(45 + Engine.getStaffAffinityBonus(), 0, 100);
    s.patience = Math.max(1, 2 + Engine.getWeatherPatience());
    s.revealed = [];
    s.dialogueLog = [];
    s.lastTry = null;
    s.tryOnCount = 0;
    s.itemReaction = null;
    s.expression = 'calm';
    s.wishId = customer.wish || 'polish';
    s.wishRevealed = false;
    s.challengeId = Engine.pickChallenge(customer);
    s.previewPose = 'stand';
    Engine.save();
  };

  Engine.chooseReply = function (index) {
    var s = Engine.state;
    var customer = Engine.currentCustomer();
    var d = Engine.getDialogue(customer);
    if (!s || !d) { return { ok: false }; }
    var beat = d.beats[s.chatStep];
    if (!beat || !beat.choices) { return { ok: false }; }
    var choice = beat.choices[index];
    if (!choice) { return { ok: false }; }

    var match = choice.tone === d.tone;
    var delta = match ? 10 : -3;
    s.affinity = clamp(s.affinity + delta, 0, 100);
    if (choice.reveal && s.revealed.indexOf(choice.reveal) < 0) {
      s.revealed.push(choice.reveal);
    }
    s.dialogueLog.push({ who: 'customer', text: beat.prompt });
    s.dialogueLog.push({ who: 'player', text: choice.text });
    s.dialogueLog.push({ who: 'customer', text: choice.reply });
    s.chatReply = {
      text: choice.reply,
      tone: choice.tone,
      match: match,
      delta: delta,
      reveal: choice.reveal || null
    };
    s.chatPhase = 'reply';
    s.expression = match ? 'happy' : (delta < 0 ? 'hesitant' : 'calm');
    if (!s.wishRevealed && s.affinity >= 65) { s.wishRevealed = true; }
    Engine.recomputePatience();
    Engine.save();
    return { ok: true, match: match, delta: delta };
  };

  Engine.continueChat = function () {
    var s = Engine.state;
    var customer = Engine.currentCustomer();
    var d = Engine.getDialogue(customer);
    if (!s || !d) { return; }
    if (s.chatPhase === 'reply') {
      if (s.chatStep + 1 < d.beats.length) {
        s.chatStep += 1;
        s.chatPhase = 'ask';
        s.chatReply = null;
        s.expression = 'calm';
      } else {
        s.chatPhase = 'done';
        s.chatReply = null;
        s.expression = s.affinity >= 65 ? 'happy' : 'calm';
        if (s.affinity >= 65) { s.wishRevealed = true; }
      }
      Engine.save();
    }
  };

  Engine.careAction = function (id) {
    var s = Engine.state;
    var customer = Engine.currentCustomer();
    var d = Engine.getDialogue(customer);
    if (!s || !customer || s.careUsed) { return { ok: false }; }
    var item = D.REFRESHMENTS_BY_ID[id] || D.REFRESHMENTS_BY_ID.water;
    if (!item) { return { ok: false }; }
    var cost = item.cost || 0;
    if (cost > s.cash) { return { ok: false, message: '现金不够，先拿杯温水吧。' }; }

    // 茶点是即时消耗：当场扣现金，同时记进当天支出，结算时从利润里减掉
    s.cash -= cost;
    if (s.dayStats) {
      s.dayStats.refreshmentCost = (s.dayStats.refreshmentCost || 0) + cost;
    }
    s.careUsed = true;
    s.careId = item.id;
    s.careLine = (item.id === 'water' && d && d.care) ? d.care : item.line;
    s.wishRevealed = true;
    if (customer.wishLine) { s.careLine += ' 她小声说：“' + customer.wishLine + '”'; }
    s.affinity = clamp(s.affinity + item.affinity, 0, 100);
    s.expression = 'happy';
    Engine.recomputePatience();
    Engine.save();
    return { ok: true, line: s.careLine, item: item, cost: cost };
  };

  Engine.reactToItem = function (id) {
    var s = Engine.state;
    var customer = Engine.currentCustomer();
    var item = D.ITEMS_BY_ID[id];
    if (!s || !customer || !item) { return null; }
    var mood = 'calm';
    var text = '';
    var avoidHit = item.style.some(function (st) { return customer.avoid.indexOf(st) >= 0; });
    var styleHit = item.style.some(function (st) { return customer.styles.indexOf(st) >= 0; });
    var fitHit = item.fit.indexOf(customer.bodyNeed) >= 0;
    var family = D.COLOR_FAMILY[item.color] || 'neutral';
    var pool;

    if (avoidHit) {
      mood = 'hesitant';
      pool = D.CUSTOMER_REACTIONS.avoid;
    } else if (styleHit && (fitHit || item.cat === 'shoes' || item.cat === 'bag')) {
      mood = 'happy';
      pool = D.CUSTOMER_REACTIONS.like;
    } else if (fitHit) {
      mood = 'happy';
      pool = D.CUSTOMER_REACTIONS.fit;
    } else if (styleHit) {
      mood = 'happy';
      pool = D.CUSTOMER_REACTIONS.like;
    } else if (customer.colorPref && family !== 'neutral' && family !== customer.colorPref) {
      mood = 'hesitant';
      pool = D.CUSTOMER_REACTIONS.color;
    } else {
      pool = D.CUSTOMER_REACTIONS.neutral;
    }

    if (!text) {
      var idx = (id.length + s.affinity + s.selectedItems.length) % pool.length;
      text = pool[idx];
    }
    s.itemReaction = { itemId: id, text: text, mood: mood };
    s.expression = mood;
    Engine.save();
    return s.itemReaction;
  };

  Engine.getTryHint = function (customer, result) {
    var s = Engine.state;
    var note = '';
    var expression = 'calm';
    var avoidItem = result.items.filter(function (it) {
      return it.style.some(function (st) { return customer.avoid.indexOf(st) >= 0; });
    })[0];

    if (avoidItem) {
      return {
        text: '她碰到“' + D.STYLE_LABELS[avoidItem.style[0]] + '”那一件时，明显犹豫了。',
        expression: 'hesitant'
      };
    }
    if (result.budgetScore < 5) {
      return {
        text: '她很喜欢，但总价超了预算，正在心里算钱。',
        expression: 'hesitant'
      };
    }
    if (result.score >= 85) {
      return { text: '她眼睛亮了，这套很接近她想要的。', expression: 'happy' };
    }
    if (result.styleScore < 18) {
      note = '她一直在看风格，可能这套不太像她平时会穿的。';
      expression = 'hesitant';
    } else if (result.occasionScore < 14) {
      note = '这套去“' + customer.occasion + '”有点不太对，正式度再调一下。';
      expression = 'hesitant';
    } else if (result.colorScore < 14) {
      note = '颜色有点多，她平时穿得更统一。';
      expression = 'hesitant';
    } else if (result.fitScore < 10) {
      note = '版型还差一点，她想要的是“' + customer.bodyLabel + '”。';
    } else {
      note = '她点了点头，但还有一处说不上来的别扭。';
    }
    return { text: note, expression: expression };
  };

  Engine.tryOn = function () {
    var s = Engine.state;
    var customer = Engine.currentCustomer();
    if (!s || !customer) { return { ok: false, message: '现在没有顾客。' }; }
    if (!s.selectedItems.length) { return { ok: false, message: '先选几件衣服再让她试。' }; }
    if (Engine.getPatienceLeft() <= 0) {
      return { ok: false, message: '她已经试得有点累了，做决定吧。' };
    }

    var result = Engine.scoreOutfit(customer, s.selectedItems);
    var missing = [];
    if (!result.categories.hasShoes) { missing.push('鞋'); }
    if (!result.categories.hasDress && !result.categories.hasTop) { missing.push('上装'); }
    if (!result.categories.hasDress && !result.categories.hasBottom) { missing.push('下装'); }
    if (missing.length) {
      return { ok: false, message: '还缺：' + missing.join('、') + '。搭配不完整，她没法试。' };
    }

    var hint = Engine.getTryHint(customer, result);
    s.tryOnCount += 1;
    s.lastTry = {
      score: result.score,
      total: result.total,
      hint: hint.text,
      itemIds: s.selectedItems.slice(),
      at: Date.now()
    };
    s.expression = hint.expression;
    Engine.save();
    return {
      ok: true,
      score: result.score,
      hint: hint.text,
      left: Engine.getPatienceLeft()
    };
  };

  Engine.getMissingForOutfit = function () {
    var hasShoes = Engine.getInventoryItems('shoes').length > 0;
    var hasDress = Engine.getInventoryItems('dress').length > 0;
    var hasTop = Engine.getInventoryItems('top').length > 0;
    var hasBottom = Engine.getInventoryItems('bottom').length > 0;
    var missing = [];
    if (!hasShoes) { missing.push('鞋'); }
    if (!hasDress && !hasTop) { missing.push('上装'); }
    if (!hasDress && !hasBottom) { missing.push('下装'); }
    return missing;
  };

  Engine.getCategoryCounts = function () {
    var counts = { top: 0, bottom: 0, dress: 0, outer: 0, shoes: 0, bag: 0, accessory: 0, hosiery: 0 };
    Engine.getInventoryEntries('all').forEach(function (entry) {
      if (counts[entry.item.cat] != null) { counts[entry.item.cat] += entry.qty; }
    });
    return counts;
  };

  Engine.serveCustomer = function () {
    var s = Engine.state;
    var customer = Engine.currentCustomer();
    if (!customer) { return; }
    s.serviceMode = 'quick';
    s.quickOptions = Engine.generateOutfitOptions(customer);
    s.selectedItems = [];
    s.activeCategory = 'all';
    s.accessorySlot = 'all';
    s.styleFilter = 'all';
    s.lastTry = null;
    s.itemReaction = null;
    s.expression = 'calm';
    s.screen = 'service';
    Engine.save();
  };

  Engine.startFittingRoom = function () {
    var s = Engine.state;
    var customer = Engine.currentCustomer();
    if (!s || !customer) { return { ok: false, message: '现在没有正在接待的顾客。' }; }
    var defaults = [];
    ['top', 'bottom', 'shoes'].forEach(function (cat) {
      var items = Engine.getInventoryItems(cat);
      if (items && items.length) { defaults.push(items[0].id); }
    });
    s.selectedItems = defaults;
    s.serviceMode = 'styling';
    s.quickOptions = [];
    s.activeCategory = 'all';
    s.accessorySlot = 'all';
    s.styleFilter = 'all';
    s.lastTry = null;
    s.itemReaction = null;
    s.expression = 'calm';
    s.screen = 'fitting';
    var rec = queueRecord(s.servingCustomerId);
    var rooms = Engine.getFittingRooms();
    var occupied = Engine.getFittingOccupied();
    var waiting = rooms > 0 && occupied >= rooms;
    if (rec) {
      rec.status = waiting ? 'fittingWait' : 'fitting';
      rec.noRoom = rooms <= 0;
      rec.itemIds = defaults.slice();
      rec.fitStarted = s.day;
    }
    Engine.buildPendingResult(defaults);
    Engine.save();
    return { ok: true, items: defaults.slice(), waiting: waiting, noRoom: rooms <= 0 };
  };

  Engine.previewOption = function (index) {
    var s = Engine.state;
    var customer = Engine.currentCustomer();
    if (!s || !customer || !s.quickOptions || !s.quickOptions[index]) { return { ok: false }; }
    var opt = s.quickOptions[index];
    s.selectedItems = opt.items.slice();
    s.serviceMode = 'styling';
    s.activeCategory = 'all';
    s.accessorySlot = 'all';
    s.styleFilter = 'all';
    s.lastTry = null;
    s.itemReaction = null;
    s.expression = 'calm';
    s.screen = 'service';
    Engine.save();
    return { ok: true, items: s.selectedItems.slice() };
  };

  Engine.openStyling = function () {
    var s = Engine.state;
    var customer = Engine.currentCustomer();
    if (!customer) { return; }
    s.serviceMode = 'styling';
    s.selectedItems = [];
    s.activeCategory = 'all';
    s.accessorySlot = 'all';
    s.styleFilter = 'all';
    s.quickOptions = [];
    s.lastTry = null;
    s.itemReaction = null;
    s.expression = 'calm';
    s.screen = 'service';
    Engine.save();
  };

  Engine.setCategory = function (cat) {
    var s = Engine.state;
    if (!s) { return; }
    s.activeCategory = cat || 'all';
    s.accessorySlot = 'all';
    Engine.save();
  };

  Engine.toggleItem = function (id) {
    var s = Engine.state;
    var item = D.ITEMS_BY_ID[id];
    if (!s || !item) { return { ok: false }; }
    if (Engine.getShelfQty(id) <= 0) {
      return { ok: false, message: '这件已经售罄了。' };
    }
    var idx = s.selectedItems.indexOf(id);
    if (idx >= 0) {
      s.selectedItems.splice(idx, 1);
      s.itemReaction = null;
      s.lastTry = null;
      s.expression = 'calm';
      Engine.save();
      return { ok: true };
    }
    if (item.cat === 'accessory') {
      var slot = item.slot || 'other';
      var sameSlot = s.selectedItems.some(function (x) {
        var it = D.ITEMS_BY_ID[x];
        return it && it.cat === 'accessory' && (it.slot || 'other') === slot;
      });
      var accCount = s.selectedItems.filter(function (x) {
        var it = D.ITEMS_BY_ID[x];
        return it && it.cat === 'accessory';
      }).length;
      if (!sameSlot && accCount >= MAX_ACCESSORIES) {
        return { ok: false, message: '最多同时戴 ' + MAX_ACCESSORIES + ' 件配饰，已经够满了。' };
      }
      s.selectedItems = s.selectedItems.filter(function (x) {
        var it = D.ITEMS_BY_ID[x];
        return it && !(it.cat === 'accessory' && (it.slot || 'other') === slot);
      });
    } else {
      if (item.cat === 'dress') {
        s.selectedItems = s.selectedItems.filter(function (x) {
          var it = D.ITEMS_BY_ID[x];
          return it && it.cat !== 'top' && it.cat !== 'bottom';
        });
      } else if (item.cat === 'top' || item.cat === 'bottom') {
        s.selectedItems = s.selectedItems.filter(function (x) {
          var it = D.ITEMS_BY_ID[x];
          return it && it.cat !== 'dress';
        });
      }
      s.selectedItems = s.selectedItems.filter(function (x) {
        var it = D.ITEMS_BY_ID[x];
        return it && it.cat !== item.cat;
      });
    }
    if (s.selectedItems.length >= MAX_SELECTED) {
      return { ok: false, message: '最多选 ' + MAX_SELECTED + ' 件，重点会不突出。' };
    }
    s.selectedItems.push(id);
    s.lastTry = null;
    Engine.reactToItem(id);
    Engine.save();
    return { ok: true };
  };

  Engine.clearSelection = function () {
    var s = Engine.state;
    if (!s) { return; }
    s.selectedItems = [];
    s.lastTry = null;
    s.itemReaction = null;
    s.expression = 'calm';
    Engine.save();
  };

  Engine.getOutfitTotal = function (itemIds) {
    var total = 0;
    (itemIds || []).forEach(function (id) {
      var item = D.ITEMS_BY_ID[id];
      if (item) { total += Engine.getEffectivePrice(item); }
    });
    return total;
  };

  Engine.scoreOutfit = function (customer, itemIds) {
    var s = Engine.state;
    var ids = [];
    (itemIds || []).forEach(function (id) {
      if (ids.indexOf(id) < 0 && D.ITEMS_BY_ID[id]) { ids.push(id); }
    });
    var items = ids.map(function (id) { return D.ITEMS_BY_ID[id]; });

    var cats = {
      hasDress: false, hasTop: false, hasBottom: false, hasShoes: false,
      hasOuter: false, hasBag: false, hasAccessory: false, hasHosiery: false,
      accessoryCount: 0
    };
    var total = 0;
    var cogs = 0;
    var formalitySum = 0;
    var families = [];
    var uniqueStyles = [];

    items.forEach(function (it) {
      if (it.cat === 'dress') { cats.hasDress = true; }
      if (it.cat === 'top') { cats.hasTop = true; }
      if (it.cat === 'bottom') { cats.hasBottom = true; }
      if (it.cat === 'shoes') { cats.hasShoes = true; }
      if (it.cat === 'outer') { cats.hasOuter = true; }
      if (it.cat === 'bag') { cats.hasBag = true; }
      if (it.cat === 'accessory') { cats.hasAccessory = true; cats.accessoryCount += 1; }
      if (it.cat === 'hosiery') { cats.hasHosiery = true; }
      total += Engine.getEffectivePrice(it);
      cogs += it.cost;
      formalitySum += it.formality;
      var fam = D.COLOR_FAMILY[it.color] || 'neutral';
      if (families.indexOf(fam) < 0) { families.push(fam); }
      it.style.forEach(function (st) {
        if (uniqueStyles.indexOf(st) < 0) { uniqueStyles.push(st); }
      });
    });

    var styleHits = 0;
    var avoidHits = 0;
    items.forEach(function (it) {
      var hit = it.style.some(function (st) { return customer.styles.indexOf(st) >= 0; });
      if (hit) { styleHits++; }
      var bad = it.style.some(function (st) { return customer.avoid.indexOf(st) >= 0; });
      if (bad) { avoidHits++; }
    });
    var styleScore = clamp((styleHits / Math.max(1, items.length)) * 35 - avoidHits * 7, 0, 35);

    var avgFormality = items.length ? formalitySum / items.length : 0;
    var occasionScore = clamp(25 - Math.abs(avgFormality - customer.formality) * 8, 0, 25);

    var colorScore;
    if (families.length <= 1) { colorScore = 18; }
    else if (families.length === 2) { colorScore = 20; }
    else if (families.length === 3) { colorScore = 14; }
    else { colorScore = 8; }
    if (customer.colorPref && families.indexOf(customer.colorPref) >= 0 && families.length <= 2) {
      colorScore = Math.min(20, colorScore + 2);
    }

    var fitHit = items.some(function (it) { return it.fit.indexOf(customer.bodyNeed) >= 0; });
    var fitScore = fitHit ? 10 : 5;

    var hasExtra = cats.hasBag || cats.hasAccessory;
    var hasAccent = items.some(function (it) { return (D.COLOR_FAMILY[it.color] || 'neutral') !== 'neutral'; });
    var surpriseScore = hasExtra ? (hasAccent ? 5 : 3) : 1;
    if (cats.accessoryCount >= 2) { surpriseScore = Math.min(5, surpriseScore + 1); }
    if (uniqueStyles.length >= 4) { surpriseScore = Math.max(0, surpriseScore - 2); }

    var budgetScore = total <= customer.budget ? 5 : total <= customer.budget * 1.1 ? 2 : -5;

    var bonus = 0;
    var windowHits = 0;
    (s.windowItems || []).forEach(function (wid) {
      if (ids.indexOf(wid) >= 0) { windowHits += 1; }
    });
    if (windowHits) { bonus += Math.min(3, windowHits * 2); }
    var seasonHits = 0;
    items.forEach(function (it) {
      var st = Engine.getItemSeasonState(it);
      if (st === 'in') { seasonHits += 1; }
      else if (st === 'off') { seasonHits -= 1; }
    });
    if (seasonHits > 0) { bonus += Math.min(4, seasonHits); }
    var trend = Engine.getDayConfig(s.day).trend;
    if (items.some(function (it) { return it.style.indexOf(trend) >= 0; })) { bonus += 2; }
    var weatherDemand = Engine.getWeatherDemand(s.day);
    var weatherHits = 0;
    if (weatherDemand) {
      var demandCats = weatherDemand.cats || [];
      var demandStyles = weatherDemand.styles || [];
      items.forEach(function (it) {
        if (demandCats.indexOf(it.cat) >= 0) { weatherHits += 1; }
        if (demandStyles.some(function (st2) { return it.style.indexOf(st2) >= 0; })) { weatherHits += 1; }
      });
    }
    if (weatherHits > 0) {
      bonus += Math.min(4, weatherHits * (weatherDemand.bonus || 2));
    }
    bonus += clamp((s.reputation - 50) / 10, -3, 3);
    bonus += Engine.getStylingBonus();
    var pricing = D.PRICING[s.pricing] || D.PRICING.standard;
    bonus += pricing.scoreBonus;

    var penalty = 0;
    var notes = [];
    if (weatherHits > 0 && weatherDemand) {
      notes.push('今天的天气让' + weatherDemand.label + '，这套正好对上。');
    }
    if (customer.vip) {
      var hasCouture = items.some(function (it) { return it.design; });
      if (hasCouture) {
        bonus += 6;
        notes.push('VIP 看上了你的独家设计。');
      } else {
        penalty += 10;
        notes.push('VIP 想要独家款，这套都是量产的。');
      }
    }
    if (seasonHits < 0) {
      penalty += Math.min(4, -seasonHits);
      notes.push('有 ' + (-seasonHits) + ' 件单品不太合这个季节。');
    }

    if (!cats.hasDress && (!cats.hasTop || !cats.hasBottom)) {
      penalty += 25;
      notes.push('上装或下装还缺一件，整套没成立。');
    }
    if (!cats.hasShoes) {
      penalty += 20;
      notes.push('没给她配鞋，总不能光脚出门。');
    }
    if (cats.hasDress && cats.hasBottom) {
      penalty += 10;
      notes.push('连衣裙下面又叠了下装，比例有点乱。');
    }
    if (ids.length > 7) {
      penalty += 5;
      notes.push('单品有点多，重点不突出。');
    }
    if (!ids.length) {
      penalty += 40;
      notes.push('还没选任何单品。');
    }
    if (total > customer.budget * 1.2) {
      penalty += 5;
      notes.push('总价超出预算太多。');
    }

    if (styleScore >= 28) { notes.push('风格很对她的胃口。'); }
    else if (styleScore < 12) { notes.push('风格和她的偏好差得有点远。'); }
    if (occasionScore >= 20) { notes.push('正式度和场合刚好。'); }
    else if (occasionScore < 12) { notes.push('这套的正式度和场合不太匹配。'); }
    if (colorScore >= 18) { notes.push('配色干净，不超过三种主色。'); }
    else if (colorScore < 12) { notes.push('颜色有点花，超过三种主色了。'); }
    if (fitHit) { notes.push('也照顾到了她的身材需求。'); }
    if (hasExtra) { notes.push('包或配饰让整套完整了。'); }
    if (budgetScore >= 5) { notes.push('价格在她预算内。'); }
    if (avoidHits) {
      var avoidNames = customer.avoid.map(function (s2) { return D.STYLE_LABELS[s2] || s2; }).join('、');
      notes.push('踩到了她的雷区：' + avoidNames + '。');
    }

    var totalScore = round(styleScore + occasionScore + colorScore + fitScore + surpriseScore + budgetScore + bonus - penalty);
    totalScore = clamp(totalScore, 0, 100);

    return {
      score: totalScore,
      total: total,
      cogs: cogs,
      itemIds: ids,
      items: items,
      styleScore: round(styleScore),
      occasionScore: round(occasionScore),
      colorScore: round(colorScore),
      fitScore: fitScore,
      surpriseScore: surpriseScore,
      budgetScore: budgetScore,
      bonus: bonus,
      weatherBonus: weatherHits > 0 ? Math.min(4, weatherHits * ((weatherDemand && weatherDemand.bonus) || 2)) : 0,
      penalty: penalty,
      avgFormality: avgFormality,
      families: families,
      categories: cats,
      notes: notes.slice(0, 5)
    };
  };

  Engine.generateOutfitOptions = function (customer) {
    var s = Engine.state;
    var tops = Engine.getInventoryItems('top');
    var bottoms = Engine.getInventoryItems('bottom');
    var dresses = Engine.getInventoryItems('dress');
    var shoes = Engine.getInventoryItems('shoes');
    var bags = Engine.getInventoryItems('bag');
    var accessories = Engine.getInventoryItems('accessory');

    function styleMatch(item) {
      var n = 0;
      item.style.forEach(function (st) {
        if (customer.styles.indexOf(st) >= 0) { n += 2; }
        if (customer.avoid.indexOf(st) >= 0) { n -= 2; }
      });
      return n;
    }
    function rank(arr) {
      return arr.slice().sort(function (a, b) {
        return styleMatch(b) - styleMatch(a) || a.price - b.price;
      });
    }

    tops = rank(tops).slice(0, 6);
    bottoms = rank(bottoms).slice(0, 6);
    dresses = rank(dresses).slice(0, 4);
    shoes = rank(shoes).slice(0, 6);
    bags = rank(bags).slice(0, 3);
    accessories = rank(accessories).slice(0, 6);
    var hosiery = rank(Engine.getInventoryItems('hosiery')).slice(0, 3);

    var accA = accessories[0] || null;
    var accB = null;
    for (var ai = 1; ai < accessories.length; ai++) {
      if ((accessories[ai].slot || 'other') !== (accA && (accA.slot || 'other'))) {
        accB = accessories[ai];
        break;
      }
    }

    var combos = [];
    var seen = {};

    function add(ids) {
      var key = ids.slice().sort().join('|');
      if (seen[key]) { return; }
      seen[key] = true;
      var result = Engine.scoreOutfit(customer, ids);
      combos.push({
        items: ids.slice(),
        total: result.total,
        score: result.score,
        result: result
      });
    }

    function addAccVariants(base) {
      if (accA) { add(base.concat([accA.id])); }
      if (accB) { add(base.concat([accB.id])); }
      if (accA && accB) { add(base.concat([accA.id, accB.id])); }
    }
    function addHosiery(base) {
      if (!hosiery.length || base.length >= 7) { return; }
      add(base.concat([hosiery[0].id]));
    }

    if (dresses.length && shoes.length) {
      dresses.forEach(function (d) {
        shoes.forEach(function (sh) {
          var base = [d.id, sh.id];
          add(base);
          addAccVariants(base);
          addHosiery(base);
          if (bags.length) {
            var withBag = base.concat([bags[0].id]);
            add(withBag);
            addAccVariants(withBag);
            addHosiery(withBag);
          }
        });
      });
    }

    if (tops.length && bottoms.length && shoes.length) {
      tops.forEach(function (t) {
        bottoms.forEach(function (b) {
          shoes.forEach(function (sh) {
            var base = [t.id, b.id, sh.id];
            add(base);
            addAccVariants(base);
            addHosiery(base);
            if (bags.length) {
              var withBag = base.concat([bags[0].id]);
              add(withBag);
              addAccVariants(withBag);
              addHosiery(withBag);
            }
          });
        });
      });
    }

    combos.sort(function (a, b) { return b.score - a.score || a.total - b.total; });
    if (!combos.length) { return []; }

    var picked = [];
    var pickedKeys = {};

    function signature(combo) {
      return combo.items.slice().sort().join('|');
    }
    function push(combo, label, reason) {
      if (!combo) { return; }
      var sig = signature(combo);
      if (pickedKeys[sig]) { return; }
      pickedKeys[sig] = true;
      picked.push({
        label: label,
        reason: reason,
        items: combo.items.slice(),
        total: combo.total,
        score: combo.score
      });
    }

    var affordable = combos.filter(function (c) { return c.total <= customer.budget * 1.05; });
    var best = affordable.length ? affordable[0] : combos[0];
    push(
      best,
      affordable.length ? '风格优先' : '放手一搏',
      affordable.length ? '风格和场合都稳，成交概率最高。' : '这套最好看，但超预算了，得靠折扣或运气。'
    );

    var budgetBest = null;
    var byPrice = combos.slice().sort(function (a, b) { return a.total - b.total || b.score - a.score; });
    for (var i = 0; i < byPrice.length; i++) {
      if (pickedKeys[signature(byPrice[i])]) { continue; }
      if (byPrice[i].total <= customer.budget * 0.98) {
        budgetBest = byPrice[i];
        break;
      }
    }
    if (!budgetBest) {
      for (var k = 0; k < byPrice.length; k++) {
        if (!pickedKeys[signature(byPrice[k])] && byPrice[k].total <= customer.budget * 1.05) {
          budgetBest = byPrice[k];
          break;
        }
      }
    }
    push(budgetBest, '预算优先', '总价压到最低，先把她留下来。');

    var bold = null;
    for (var j = 0; j < combos.length; j++) {
      if (pickedKeys[signature(combos[j])]) { continue; }
      if (combos[j].total > customer.budget * 1.15) { continue; }
      bold = combos[j];
      break;
    }
    if (!bold) {
      for (var m = 0; m < combos.length; m++) {
        if (!pickedKeys[signature(combos[m])] && combos[m].total <= customer.budget * 1.3) {
          bold = combos[m];
          break;
        }
      }
    }
    push(bold, '记忆点优先', '多一点记忆点，适合想被看到的顾客。');

    for (var k = 0; k < combos.length && picked.length < 3; k++) {
      push(combos[k], '备选方案', '再试一个不同思路。');
    }

    var out = picked.slice(0, 3);
    if (out.length > 1) {
      var shift = ((customer.id.charCodeAt(0) || 0) % (out.length - 1)) + 1;
      out = out.slice(shift).concat(out.slice(0, shift));
    }
    return out;
  };

  Engine.buildPendingResult = function (itemIds) {
    var s = Engine.state;
    var customer = Engine.currentCustomer();
    if (!s || !customer) { return null; }
    itemIds = (itemIds || []).slice();
    var result = Engine.scoreOutfit(customer, itemIds);
    var extras = Engine.evaluateExtras(customer, itemIds, result);
    var over = result.total > customer.budget * 1.15;
    var affinity = typeof s.affinity === 'number' ? s.affinity : 45;
    var outcome;
    if (!result.categories.hasShoes) { outcome = 'invalid'; }
    else if (!result.categories.hasDress && (!result.categories.hasTop || !result.categories.hasBottom)) { outcome = 'invalid'; }
    else if (over) { outcome = 'expensive'; }
    else if (result.score >= 85) { outcome = 'perfect'; }
    else if (result.score >= 70) { outcome = 'happy'; }
    else if (result.score >= 55) { outcome = 'hesitant'; }
    else if (result.score >= 40 && result.total <= customer.budget) { outcome = 'single'; }
    else { outcome = 'leave'; }

    var discountedTotal = result.total * 0.9;
    var canDiscount = outcome === 'hesitant' ||
      (outcome === 'expensive' && affinity >= 65 && discountedTotal <= customer.budget * 1.05);

    s.pendingResult = {
      customerId: customer.id,
      itemIds: itemIds.slice(),
      result: result,
      extras: extras,
      outcome: outcome,
      canDiscount: canDiscount,
      discount: 1,
      sale: null,
      affinity: affinity,
      message: '',
      resolved: false
    };

    var validOutfit = result.categories.hasShoes && (result.categories.hasDress || (result.categories.hasTop && result.categories.hasBottom));
    if (validOutfit && itemIds.length && s.dayStats && (!s.dayStats.stylingBest || result.score > s.dayStats.stylingBest.score)) {
      s.dayStats.stylingBest = {
        customerId: customer.id,
        customerName: customer.name,
        score: result.score,
        itemIds: itemIds.slice(),
        total: result.total,
        discount: 1
      };
    }
    return s.pendingResult;
  };

  // 兼容旧调用：不经过试衣间，直接结算
  Engine.resolveCustomer = function (itemIds) {
    var s = Engine.state;
    if (!s) { return; }
    var pr = Engine.buildPendingResult(itemIds);
    if (!pr) { return; }
    if (!pr.canDiscount) {
      Engine.finalizePending();
    } else {
      pr.message = pr.outcome === 'expensive'
        ? '她很喜欢，但价格卡在预算上，正在犹豫。'
        : '她对着镜子转了两圈，喜欢，但有点犹豫。';
      s.screen = 'result';
      Engine.save();
    }
  };

  // 推荐完成 → 进试衣间换装（试衣间满则排队）
  Engine.startTryOn = function (itemIds) {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var pr = Engine.buildPendingResult(itemIds);
    if (!pr) { return { ok: false, message: '现在没有正在接待的顾客。' }; }
    s.selectedItems = (itemIds || []).slice();
    var rec = queueRecord(s.servingCustomerId);
    if (rec) { rec.itemIds = (itemIds || []).slice(); }
    var rooms = Engine.getFittingRooms();
    var occupied = Engine.getFittingOccupied();
    var status = 'fitting';
    var noRoom = false;
    if (rooms <= 0) { noRoom = true; }
    else if (occupied >= rooms) { status = 'fittingWait'; }
    if (rec) {
      rec.status = status;
      rec.noRoom = noRoom;
      rec.fitStarted = s.day;
    }
    s.screen = 'fitting';
    Engine.save();
    return { ok: true, waiting: status === 'fittingWait', noRoom: noRoom, rooms: rooms, occupied: occupied };
  };

  Engine.waitForFitting = function () {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var rec = queueRecord(s.servingCustomerId);
    if (!rec || rec.status !== 'fittingWait') { return { ok: false, message: '现在不需要等试衣间。' }; }
    var staffRec = null;
    for (var i = 0; i < s.queue.length; i++) {
      if (s.queue[i].status === 'staffFitting') { staffRec = s.queue[i]; break; }
    }
    if (staffRec) { completeStaffRecord(staffRec); }
    var rooms = Engine.getFittingRooms();
    var occupied = Engine.getFittingOccupied();
    if (rooms <= 0) {
      rec.status = 'fitting';
      rec.noRoom = true;
      s.screen = 'fitting';
      Engine.save();
      return { ok: true, noRoom: true };
    }
    if (occupied < rooms) {
      rec.status = 'fitting';
      rec.noRoom = false;
      s.screen = 'fitting';
      Engine.save();
      return { ok: true };
    }
    Engine.save();
    return { ok: false, message: '试衣间还满着，再等一等。' };
  };

  Engine.completeFitting = function () {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    if (!s.pendingResult) { Engine.buildPendingResult(s.selectedItems); }
    if (!s.pendingResult) { return { ok: false }; }
    var rec = queueRecord(s.servingCustomerId);
    if (rec) { rec.status = 'done'; rec.fitDone = true; }
    Engine.finalizePending();
    s.screen = 'result';
    Engine.save();
    return { ok: true };
  };

  Engine.finalizePending = function () {
    var s = Engine.state;
    var pr = s.pendingResult;
    if (!pr || pr.resolved) { return; }
    var customer = D.CUSTOMERS_BY_ID[pr.customerId];
    if (!customer) { return; }
    var affinity = typeof pr.affinity === 'number' ? pr.affinity : 45;
    var tipRate = 0;
    if (pr.result.score >= 92) { tipRate += 0.08; }
    if (affinity >= 78) { tipRate += 0.05; }
    if (Engine.isVip(customer.id)) { tipRate += 0.15; }
    tipRate = clamp(tipRate, 0, 0.15);

    if (pr.outcome === 'perfect') {
      Engine.completeSale(customer, 1, tipRate);
    } else if (pr.outcome === 'happy') {
      Engine.completeSale(customer, 1, tipRate);
    } else if (pr.outcome === 'single') {
      Engine.completeSingleSale(customer);
    } else if (pr.outcome === 'expensive') {
      Engine.completeLeave(customer, '她看了眼吊牌，说超出预算了。', 1);
    } else if (pr.outcome === 'invalid') {
      Engine.completeLeave(customer, '这套还没搭完整，她不知道该从哪里试起。', 1);
    } else if (pr.outcome === 'leave') {
      Engine.completeLeave(customer, '她照了照镜子，说不太像自己。', 2);
    }
    Engine.recordRegularVisit(customer, pr);
    Engine.addFeedPost(customer, pr);
    Engine.save();
  };

  Engine.acceptDiscount = function () {
    var s = Engine.state;
    var pr = s.pendingResult;
    if (!pr || !pr.canDiscount || pr.resolved) { return; }
    var customer = D.CUSTOMERS_BY_ID[pr.customerId];
    pr.outcome = 'discount';
    pr.discount = 0.9;
    Engine.completeSale(customer, 0.9, 0);
  };

  Engine.declineDiscount = function () {
    var s = Engine.state;
    var pr = s.pendingResult;
    if (!pr || !pr.canDiscount || pr.resolved) { return; }
    var customer = D.CUSTOMERS_BY_ID[pr.customerId];
    Engine.completeLeave(customer, '你说这款不打折，她想了想，还是放下了。', 0);
  };

  Engine.completeSale = function (customer, discount, tipRate) {
    var s = Engine.state;
    var pr = s.pendingResult;
    if (!pr) { return; }
    var ids = pr.itemIds.slice();
    var revenue = 0;
    var cogs = 0;
    var sold = [];

    ids.forEach(function (id) {
      var item = D.ITEMS_BY_ID[id];
      if (!item) { return; }
      if (Engine.getShelfQty(id) <= 0) { return; }
      revenue += Engine.getEffectivePrice(item);
      cogs += item.cost;
      Engine.takeFromShelf(id, 1);
      sold.push(id);
    });

    Engine.sanitizeWindow();
    revenue = round(revenue * discount * (1 + Engine.getSalesBonus()));
    var extraTip = (pr.extras && pr.extras.tip) || 0;
    var tip = round(revenue * tipRate) + extraTip;
    s.cash += revenue + tip;
    s.dayStats.revenue += revenue + tip;
    s.dayStats.cogs += cogs;
    s.dayStats.sales += 1;
    s.dayStats.served += 1;
    s.dayStats.extraTip = (s.dayStats.extraTip || 0) + extraTip;

    var repGain = pr.result.score >= 85 ? 5 : pr.result.score >= 70 ? 3 : 2;
    s.reputation = clamp(s.reputation + repGain, 0, 100);
    s.fans += pr.result.score >= 85 ? 2 : 1;
    s.dayStats.reputationDelta = s.reputation - s.dayStats.startReputation;
    s.dayStats.fansDelta = s.fans - s.dayStats.startFans;
    if (customer.id === 'nana') { s.dayStats.nanaSale = true; }

    if (!s.dayStats.stylingBest || pr.result.score > s.dayStats.stylingBest.score) {
      s.dayStats.stylingBest = {
        customerId: customer.id,
        customerName: customer.name,
        score: pr.result.score,
        itemIds: ids.slice(),
        total: revenue,
        discount: discount
      };
    }

    pr.sale = {
      items: sold,
      revenue: revenue,
      tip: tip,
      extraTip: extraTip,
      cogs: cogs,
      discount: discount,
      repGain: repGain
    };
    pr.resolved = true;
    pr.canDiscount = false;
    pr.message = tip > 0
      ? '她太喜欢了，直接穿着走了，还多给了小费。'
      : discount < 1
        ? '她犹豫了一下，九折成交。'
        : '她对着镜子笑了，这套就是她的。';
    Engine.markCustomerUsed(customer.id);
    s.screen = 'result';
    Engine.save();
  };

  Engine.completeSingleSale = function (customer) {
    var s = Engine.state;
    var pr = s.pendingResult;
    if (!pr) { return; }
    var candidates = [];
    pr.itemIds.forEach(function (id) {
      var item = D.ITEMS_BY_ID[id];
      if (!item) { return; }
      if (Engine.getShelfQty(id) <= 0) { return; }
      var price = Engine.getEffectivePrice(item);
      if (price > customer.budget) { return; }
      var match = 0;
      item.style.forEach(function (st) {
        if (customer.styles.indexOf(st) >= 0) { match += 1; }
        if (customer.avoid.indexOf(st) >= 0) { match -= 1; }
      });
      candidates.push({ id: id, item: item, price: price, match: match });
    });
    candidates.sort(function (a, b) { return b.match - a.match || b.price - a.price; });
    if (!candidates.length) {
      Engine.completeLeave(customer, '她只想要其中一件，但价格还是不太合适。', 1);
      return;
    }
    var pick = candidates[0];
    var revenue = pick.price;
    s.cash += revenue;
    s.dayStats.revenue += revenue;
    s.dayStats.cogs += pick.item.cost;
    s.dayStats.sales += 1;
    s.dayStats.served += 1;
    Engine.takeFromShelf(pick.id, 1);
    Engine.sanitizeWindow();
    s.reputation = clamp(s.reputation + 2, 0, 100);
    s.fans += 1;
    s.dayStats.reputationDelta = s.reputation - s.dayStats.startReputation;
    s.dayStats.fansDelta = s.fans - s.dayStats.startFans;
    if (customer.id === 'nana') { s.dayStats.nanaSale = true; }

    pr.sale = {
      items: [pick.id],
      revenue: revenue,
      tip: 0,
      cogs: pick.item.cost,
      discount: 1,
      repGain: 2,
      single: true
    };
    pr.resolved = true;
    pr.canDiscount = false;
    pr.message = '她只拿走了 ' + pick.item.name + '，说下次再来配一套。';
    Engine.markCustomerUsed(customer.id);
    s.screen = 'result';
    Engine.save();
  };

  Engine.completeLeave = function (customer, message, penalty) {
    var s = Engine.state;
    var pr = s.pendingResult;
    if (!pr) { return; }
    s.dayStats.served += 1;
    if (penalty > 0) {
      s.reputation = clamp(s.reputation - penalty, 0, 100);
    }
    s.dayStats.reputationDelta = s.reputation - s.dayStats.startReputation;
    s.dayStats.fansDelta = s.fans - s.dayStats.startFans;
    s.dayStats.lost.push({
      customerId: customer.id,
      customerName: customer.name,
      score: pr.result.score,
      reason: message,
      total: pr.result.total
    });

    pr.sale = null;
    pr.resolved = true;
    pr.canDiscount = false;
    pr.message = message;
    Engine.markCustomerUsed(customer.id);
    s.screen = 'result';
    Engine.save();
  };

  Engine.markCustomerUsed = function (id) {
    var s = Engine.state;
    if (s.usedCustomers.indexOf(id) < 0) { s.usedCustomers.push(id); }
  };

  /* ---------------- 常客回访 / 顾客晒单 ---------------- */

  Engine.recordRegularVisit = function (customer, pr) {
    var s = Engine.state;
    if (!s || !customer || !pr) { return; }
    var score = (pr.result && pr.result.score) || 0;
    var items = (pr.itemIds || []).slice(0, 6);
    s.regularVisits = s.regularVisits || {};

    if (customer.regularFirst) {
      var rec = s.regularVisits[customer.regularFirst];
      if (!rec) { rec = s.regularVisits[customer.regularFirst] = {}; }
      rec.returned = true;
      rec.returnDay = s.day;
      rec.returnScore = score;
      rec.returnOutcome = pr.outcome;
      rec.returnItems = items;
      return;
    }

    var next = null;
    (D.REGULAR_RETURNS || []).forEach(function (r) {
      if (r.first === customer.id) { next = r; }
    });
    if (next && !s.regularVisits[customer.id]) {
      s.regularVisits[customer.id] = {
        firstDay: s.day,
        firstScore: score,
        firstOutcome: pr.outcome,
        firstItems: items,
        returned: false
      };
    }
  };

  Engine.getRegularMemory = function (customer) {
    var s = Engine.state;
    if (!s || !customer || !customer.regularFirst) { return null; }
    var rec = s.regularVisits && s.regularVisits[customer.regularFirst];
    if (!rec) { return null; }
    var first = D.CUSTOMERS_BY_ID[customer.regularFirst];
    var items = (rec.firstItems || []).map(function (id) { return D.ITEMS_BY_ID[id]; }).filter(Boolean);
    var score = rec.firstScore || 0;
    var line;
    if (score >= 85) {
      line = '上次那套' + (items[0] ? '「' + items[0].name + '」' : '搭配') + '她穿去' + (first ? first.occasion : '') + '，被夸了好几次。';
    } else if (score >= 60) {
      line = '上次那套' + (items[0] ? '「' + items[0].name + '」' : '搭配') + '还算合身，这次想再往前走一点。';
    } else {
      line = '上次那套她没怎么穿，这次想换个方向。';
    }
    return { score: score, items: items, line: line, firstDay: rec.firstDay || 0 };
  };

  Engine.addFeedPost = function (customer, pr) {
    var s = Engine.state;
    if (!s || !customer || !pr || !pr.result) { return null; }
    var score = pr.result.score || 0;
    var text;
    if (pr.outcome === 'perfect') {
      text = '今天这套被三个人夸了，链接已经发群里。';
    } else if (pr.outcome === 'happy') {
      text = '新衣服上身，今天走路都轻一点。';
    } else if (pr.outcome === 'single') {
      text = '试了好几套，最后只带走一件，但很值。';
    } else if (pr.outcome === 'discount') {
      text = '犹豫了半天，还是拿下了。谢谢老板给台阶。';
    } else if (pr.outcome === 'expensive') {
      text = '很喜欢，但超预算了。先收藏，下次再来。';
    } else {
      text = '今天在「' + s.shopName + '」试了几套，记录一下。';
    }
    s.feed = s.feed || [];
    s.feedUid = s.feedUid || 1;
    var post = {
      id: 'f' + s.feedUid,
      day: s.day,
      customerId: customer.id,
      customerName: customer.name,
      outfit: (pr.itemIds || []).slice(0, 4),
      score: score,
      outcome: pr.outcome,
      text: text,
      likes: 3 + Math.round(score / 12) + (pr.outcome === 'perfect' ? 4 : 0),
      liked: false,
      createdAt: Date.now()
    };
    s.feedUid += 1;
    s.feed.unshift(post);
    if (s.feed.length > 24) { s.feed = s.feed.slice(0, 24); }
    pr.feedId = post.id;
    return post;
  };

  Engine.getFeed = function (limit) {
    var s = Engine.state;
    if (!s || !Array.isArray(s.feed)) { return []; }
    return s.feed.slice(0, limit || 6);
  };

  Engine.getFeedPost = function (id) {
    var s = Engine.state;
    if (!s || !Array.isArray(s.feed)) { return null; }
    for (var i = 0; i < s.feed.length; i++) {
      if (s.feed[i].id === id) { return s.feed[i]; }
    }
    return null;
  };

  Engine.likeFeedPost = function (id) {
    var post = Engine.getFeedPost(id);
    if (!post) { return false; }
    post.liked = !post.liked;
    post.likes = Math.max(0, (post.likes || 0) + (post.liked ? 1 : -1));
    Engine.save();
    return post.liked;
  };

  Engine.advanceQueue = function () {
    var s = Engine.state;
    if (!s) { return { ok: false }; }
    var rec = queueRecord(s.servingCustomerId);
    if (rec && rec.status !== 'left' && rec.status !== 'done') { rec.status = 'done'; }
    s.servingCustomerId = null;
    s.pendingResult = null;
    s.serviceMode = 'quick';
    s.selectedItems = [];
    s.quickOptions = [];
    s.activeCategory = 'all';
    s.accessorySlot = 'all';
    s.styleFilter = 'all';
    s.lastTry = null;
    s.itemReaction = null;

    completeStaffFitting();
    tickWaitingPatience();
    assignStaffToQueue(true);

    var next = s.queue.filter(function (r) { return r.status === 'waiting'; })[0];
    if (next) {
      next.status = 'serving';
      s.servingCustomerId = next.id;
      s.customerIndex = Math.max(0, (s.customersToday || []).indexOf(next.id));
      promoteStaffToFitting(false);
      Engine.beginCustomer();
      return { ok: true, serving: next.id };
    }

    // 没有下一位人工接待：店员把剩下的人收尾，再结算
    flushStaffQueue();
    var still = s.queue.filter(function (r) { return r.status === 'waiting'; })[0];
    if (still) {
      still.status = 'serving';
      s.servingCustomerId = still.id;
      s.customerIndex = Math.max(0, (s.customersToday || []).indexOf(still.id));
      Engine.beginCustomer();
      return { ok: true, serving: still.id };
    }
    Engine.endDay();
    return { ok: true, closed: true };
  };

  Engine.nextCustomer = function () {
    var s = Engine.state;
    if (!s) { return; }
    if (!Array.isArray(s.queue) || !s.queue.length) {
      // 旧存档没有队列：保持原来的顺序接待
      s.customerIndex += 1;
      s.pendingResult = null;
      s.serviceMode = 'quick';
      s.selectedItems = [];
      s.quickOptions = [];
      s.activeCategory = 'all';
      s.lastTry = null;
      s.itemReaction = null;
      if (s.customerIndex >= s.customersToday.length) { Engine.endDay(); }
      else { Engine.beginCustomer(); }
      return;
    }
    Engine.advanceQueue();
  };

  Engine.checkGoal = function (goal) {
    var s = Engine.state;
    var ds = s.dayStats;
    if (!goal || !ds) { return false; }
    switch (goal.type) {
      case 'sales': return ds.sales >= goal.value;
      case 'revenue': return ds.revenue >= goal.value;
      case 'profit': return ds.profit >= goal.value;
      case 'fans': return s.fans >= goal.value;
      case 'styleScore': return !!ds.stylingBest && ds.stylingBest.score >= goal.value;
      default: return false;
    }
  };

  Engine.getGoalProgress = function () {
    var s = Engine.state;
    var ds = s.dayStats;
    var cfg = Engine.getDayConfig(s.day);
    var goal = cfg.goal;
    if (!ds) { return 0; }
    var current = 0;
    switch (goal.type) {
      case 'sales': current = ds.sales; break;
      case 'revenue': current = ds.revenue; break;
      case 'profit': current = ds.revenue - ds.cogs - ds.marketingCost - (ds.staffCost || 0) - (ds.weatherCost || 0) - (ds.refreshmentCost || 0) - ds.rent; break;
      case 'fans': current = s.fans; break;
      case 'styleScore': current = ds.stylingBest ? ds.stylingBest.score : 0; break;
    }
    return clamp(current / goal.value, 0, 1);
  };

  Engine.endDay = function () {
    var s = Engine.state;
    var ds = s.dayStats;
    if (!s || !ds) { return; }
    if (ds.closed) { s.screen = 'settle'; return; }
    var cfg = Engine.getDayConfig(s.day);
    ds.closed = true;

    if (cfg.eventType === 'flower') {
      s.fans += 1;
      s.reputation = clamp(s.reputation + 2, 0, 100);
      ds.eventNote = '花店老板娘帮你介绍了熟客：粉丝 +1，口碑 +2。';
    }
    if (cfg.eventType === 'rain' && s.marketing === 'note') {
      s.fans += 2;
      ds.eventNote = '雨天的笔记意外受欢迎：粉丝 +2。';
    }
    if (cfg.eventType === 'influencer') {
      if (ds.stylingBest && ds.stylingBest.score >= 80) {
        s.fans += 8;
        s.reputation = clamp(s.reputation + 5, 0, 100);
        ds.eventNote = '博主把你的搭配发上了首页：粉丝 +8，口碑 +5。';
      } else {
        s.fans += 2;
        ds.eventNote = '博主拍了几张照，但没发：粉丝 +2。';
      }
    }
    if (cfg.eventType === 'wedding') {
      var nanaSale = ds.nanaSale;
      if (nanaSale) {
        s.reputation = clamp(s.reputation + 5, 0, 100);
        ds.eventNote = '新娘对你的敬酒服很满意：口碑 +5。';
      }
    }

    var wx = Engine.getWeatherDay(s.day);
    if (wx.event) {
      var weatherNotes = [];
      if (wx.prepared && wx.response) {
        if (wx.response.rep) {
          s.reputation = clamp(s.reputation + wx.response.rep, 0, 100);
        }
        weatherNotes.push(wx.response.note + (wx.response.rep ? '（口碑 +' + wx.response.rep + '）' : ''));
      }
      if (wx.id === 'rainbow') {
        s.fans += 2;
        s.reputation = clamp(s.reputation + 1, 0, 100);
        weatherNotes.push('彩虹引来拍照的人：粉丝 +2，口碑 +1。');
      }
      var wetWeather = ['rain', 'thunder', 'downpour', 'snow'].indexOf(wx.id) >= 0;
      if (wetWeather && s.marketing === 'note') {
        s.fans += 2;
        weatherNotes.push('雨雪天的笔记意外受欢迎：粉丝 +2。');
      }
      if (weatherNotes.length) {
        ds.eventNote = (ds.eventNote ? ds.eventNote + ' ' : '') + weatherNotes.join(' ');
      }
    }

    if (ds.crowdLeft) {
      ds.eventNote = (ds.eventNote ? ds.eventNote + ' ' : '') + '门口人太多，' + ds.crowdLeft + ' 位顾客没进店。';
    }
    if (ds.queueLeft) {
      ds.eventNote = (ds.eventNote ? ds.eventNote + ' ' : '') + '有 ' + ds.queueLeft + ' 位顾客等太久走了。';
    }
    if (ds.staffServed) {
      ds.eventNote = (ds.eventNote ? ds.eventNote + ' ' : '') + '店员接待 ' + ds.staffServed + ' 位，成交 ' + (ds.staffSales || 0) + ' 单。';
    }

    s.cash -= ds.rent;

    ds.profit = ds.revenue - ds.cogs - ds.marketingCost - (ds.staffCost || 0) - (ds.weatherCost || 0) - (ds.refreshmentCost || 0) - ds.rent;

    ds.goalMet = Engine.checkGoal(cfg.goal);
    if (ds.goalMet) {
      ds.goalBonus = 300;
      s.cash += 300;
      s.reputation = clamp(s.reputation + 2, 0, 100);
      s.fans += 1;
      ds.profit += 300;
    }

    if (s.cash < 0) {
      ds.loan = 3000;
      s.cash += 3000;
      s.reputation = clamp(s.reputation - 5, 0, 100);
      ds.eventNote += (ds.eventNote ? ' ' : '') + '现金流告急，你临时借了 ¥3,000。';
    }

    Engine.expireOrders();
    var decorRep = Math.min(2, Math.floor(Engine.getDecorScore() / 50));
    if (decorRep > 0) { s.reputation = clamp(s.reputation + decorRep, 0, 100); }
    ds.reputationDelta = s.reputation - ds.startReputation;
    ds.fansDelta = s.fans - ds.startFans;

    s.history.push({
      day: s.day,
      revenue: ds.revenue,
      profit: ds.profit,
      sales: ds.sales,
      visitors: ds.visitors,
      served: ds.served,
      goalMet: ds.goalMet,
      best: ds.stylingBest,
      rep: s.reputation,
      fans: s.fans,
      cash: s.cash,
      loan: ds.loan,
      goalBonus: ds.goalBonus,
      refreshmentCost: ds.refreshmentCost || 0,
      staffServed: ds.staffServed || 0,
      staffSales: ds.staffSales || 0,
      crowdLeft: ds.crowdLeft || 0,
      queueLeft: ds.queueLeft || 0
    });

    s.screen = 'settle';
    Engine.save();
  };

  Engine.nextDay = function () {
    var s = Engine.state;
    if (!s) { return; }
    if (s.seasonClosed) { Engine.continueSeason(); return; }
    s.day += 1;
    Engine.prepareDay();
  };

  Engine.continueSeason = function () {
    var s = Engine.state;
    if (!s) { return; }
    s.seasonClosed = false;
    s.summary = null;
    s.day += 1;
    Engine.prepareDay();
    Engine.save();
  };

  Engine.finishSeason = function () {
    var s = Engine.state;
    if (!s) { return; }
    var totals = { revenue: 0, profit: 0, sales: 0, visitors: 0, served: 0 };
    var best = null;
    var hadLoan = false;
    // 只统计刚结束的这一季（7 天）
    s.history.slice(-7).forEach(function (h) {
      totals.revenue += h.revenue;
      totals.profit += h.profit;
      totals.sales += h.sales;
      totals.visitors += h.visitors;
      totals.served += h.served;
      if (h.loan) { hadLoan = true; }
      if (h.best && (!best || h.best.score > best.score)) { best = h.best; }
    });

    var level = 1;
    if (totals.revenue >= 5000) { level = 2; }
    if (totals.revenue >= 8000) { level = 3; }
    if (totals.revenue >= 11000) { level = 4; }
    if (totals.revenue >= 14000) { level = 5; }
    var levelNames = ['巷口新店', '街区小店', '熟客常来', '街角名店', '城中热店'];

    var title = '温柔店主';
    if (totals.profit >= 5000) { title = '街角商业奇才'; }
    else if (best && best.score >= 90) { title = '搭配鬼才'; }
    else if (s.reputation >= 75) { title = '街坊口碑王'; }
    else if (totals.sales >= 12) { title = '小店劳模'; }

    var season = Engine.getSeason(s.day);
    var nextSeason = D.SEASONS[(Engine.getSeasonIndex(s.day) + 1) % D.SEASONS.length];
    s.summary = {
      kind: 'season',
      shopName: s.shopName,
      days: 7,
      seasonIndex: Engine.getSeasonIndex(s.day) + 1,
      seasonName: season.name,
      seasonIcon: season.icon,
      year: Engine.getYear(s.day),
      nextSeasonName: nextSeason.name,
      nextSeasonIcon: nextSeason.icon,
      totalRevenue: totals.revenue,
      totalProfit: totals.profit,
      totalSales: totals.sales,
      totalVisitors: totals.visitors,
      bestScore: best ? best.score : 0,
      bestCustomer: best ? best.customerName : '',
      bestItems: best ? best.itemIds : [],
      finalReputation: s.reputation,
      finalFans: s.fans,
      level: level,
      levelName: levelNames[level - 1],
      title: title,
      hadLoan: hadLoan
    };
    s.seasonClosed = true;
    s.screen = 'summary';
    Engine.save();
  };

  Engine.debugAddCash = function (amount) {
    var s = Engine.state;
    if (!s) { return; }
    s.cash += amount;
    Engine.save();
  };

  Engine.debugSkipDay = function () {
    var s = Engine.state;
    if (!s) { return; }
    Engine.nextDay();
    Engine.save();
  };

  Engine.debugCompleteDay = function () {
    var s = Engine.state;
    if (!s) { return; }
    if (!s.dayStats) { return; }
    if (!s.dayStats.opened) { s.dayStats.opened = true; }
    s.customerIndex = s.customersToday.length;
    Engine.endDay();
  };

  Engine.exportData = function () {
    var s = Engine.state;
    if (!s) { return {}; }
    return {
      shopName: s.shopName,
      day: s.day,
      cash: s.cash,
      reputation: s.reputation,
      fans: s.fans,
      pricing: s.pricing,
      dayStats: s.dayStats,
      history: s.history,
      summary: s.summary,
      usedCustomers: s.usedCustomers
    };
  };

  Engine.styleLabels = styleLabels;
  Engine.MAX_SELECTED = MAX_SELECTED;
  Engine.MAX_ACCESSORIES = MAX_ACCESSORIES;
  window.Engine = Engine;
})();
