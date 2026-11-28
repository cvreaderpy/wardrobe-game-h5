/* 衣间小日子 — 全部单品的服装结构配置
 *
 * s     silhouette 轮廓
 * m     material   材质
 * p     pattern    图案
 * neck  领型   slv 袖型   len 长度   fit 版型   clo 闭合方式   det 结构细节
 * rise  腰位（下装）
 */
(function () {
  var Iso = window.Iso = window.Iso || {};

  Iso.looks = {
    /* ---------------- 上装 16 ---------------- */
    t_knit:      { s: 'knit',      m: 'knit',    p: 'rib',     neck: 'v',        slv: 'long',  len: 'hip',   fit: 'regular',   clo: 'open',     det: ['ribbed', 'pockets'] },
    t_shirt:     { s: 'shirt',     m: 'cotton',  p: 'none',    neck: 'collar',   slv: 'long',  len: 'waist', fit: 'regular',   clo: 'buttons',  det: ['cuffs', 'placket', 'pocket'] },
    t_tee:       { s: 'tee',       m: 'cotton',  p: 'stripe',  neck: 'crew',     slv: 'short', len: 'waist', fit: 'regular',   clo: 'none' },
    t_blouse:    { s: 'blouse',    m: 'cotton',  p: 'floral',  neck: 'v',        slv: 'puff',  len: 'waist', fit: 'regular',   clo: 'buttons',  det: ['lace', 'gather'] },
    t_hoodie:    { s: 'hoodie',    m: 'cotton',  p: 'none',    neck: 'hood',     slv: 'long',  len: 'hip',   fit: 'oversized', clo: 'none',     det: ['kangaroo', 'drawstring', 'ribbed'] },
    t_cami:      { s: 'cami',      m: 'satin',   p: 'none',    neck: 'straps',   slv: 'none',  len: 'waist', fit: 'slim',      clo: 'none' },
    t_vest:      { s: 'vest',      m: 'wool',    p: 'tweed',   neck: 'v',        slv: 'none',  len: 'waist', fit: 'slim',      clo: 'buttons',  det: ['welt'] },
    t_corset:    { s: 'corset',    m: 'satin',   p: 'none',    neck: 'sweetheart', slv: 'none', len: 'crop', fit: 'slim',     clo: 'lace',     det: ['boning'] },
    t_polo:      { s: 'polo',      m: 'cotton',  p: 'stripe',  neck: 'collar',   slv: 'short', len: 'waist', fit: 'regular',   clo: 'placket' },
    t_cardigan:  { s: 'cardigan',  m: 'knit',    p: 'rib',     neck: 'v',        slv: 'long',  len: 'crop',  fit: 'regular',   clo: 'open',     det: ['ribbed'] },
    t_tube:      { s: 'tube',      m: 'satin',   p: 'none',    neck: 'straight', slv: 'none',  len: 'crop',  fit: 'slim',      clo: 'none' },
    t_crop:      { s: 'crop',      m: 'cotton',  p: 'none',    neck: 'crew',     slv: 'short', len: 'crop',  fit: 'slim',      clo: 'none' },
    t_satin:     { s: 'satin',     m: 'satin',   p: 'none',    neck: 'cowl',     slv: 'long',  len: 'waist', fit: 'regular',   clo: 'none',     det: ['cuff'] },
    t_turtle:    { s: 'turtle',    m: 'knit',    p: 'rib',     neck: 'turtle',   slv: 'long',  len: 'waist', fit: 'slim',      clo: 'none' },
    t_oversize:  { s: 'oversize',  m: 'cotton',  p: 'stripe',  neck: 'collar',   slv: 'long',  len: 'hip',   fit: 'oversized', clo: 'buttons',  det: ['drop', 'pocket'] },
    t_knitvest:  { s: 'knitvest',  m: 'knit',    p: 'rib',     neck: 'v',        slv: 'none',  len: 'waist', fit: 'regular',   clo: 'none',     det: ['ribbed'] },
    t_halter:      { s: 'cami',    m: 'satin',   p: 'none',    neck: 'straps',   slv: 'none',  len: 'waist', fit: 'slim',      clo: 'none' },
    t_puff:        { s: 'blouse',  m: 'cotton',  p: 'none',    neck: 'v',        slv: 'puff',  len: 'waist', fit: 'regular',   clo: 'buttons',  det: ['lace', 'gather'] },

    /* ---------------- 下装 11 ---------------- */
    b_jeans:          { s: 'jeans',          m: 'denim',   p: 'twill', rise: 'mid',  len: 'full', det: ['pockets', 'stitch', 'fly'] },
    b_skirt:          { s: 'skirt',          m: 'wool',    p: 'none',  rise: 'high', len: 'midi', det: ['pleat'] },
    b_wide:           { s: 'wide',           m: 'wool',    p: 'none',  rise: 'high', len: 'full', det: ['crease'] },
    b_shorts:         { s: 'shorts',         m: 'denim',   p: 'twill', rise: 'mid',  len: 'mini', det: ['fray', 'pockets'] },
    b_cargo:          { s: 'cargo',          m: 'cotton',  p: 'none',  rise: 'mid',  len: 'full', det: ['cargo', 'cuff'] },
    b_pleat:          { s: 'pleat',          m: 'wool',    p: 'none',  rise: 'high', len: 'mini', det: ['knife'] },
    b_leather:        { s: 'leather',        m: 'leather', p: 'none',  rise: 'mid',  len: 'full', det: ['sheen'] },
    b_denimskirt:     { s: 'denimskirt',     m: 'denim',   p: 'twill', rise: 'high', len: 'knee', det: ['stitch', 'slit'] },
    b_tailoredshorts: { s: 'tailoredshorts', m: 'wool',    p: 'none',  rise: 'high', len: 'mini', det: ['cuff'] },
    b_tier:           { s: 'tier',           m: 'cotton',  p: 'none',  rise: 'high', len: 'midi', det: ['tier'] },
    b_widejeans:      { s: 'widejeans',      m: 'denim',   p: 'twill', rise: 'high', len: 'full', det: ['flare', 'stitch'] },
    b_midi:           { s: 'skirt',          m: 'satin',   p: 'none',  rise: 'high', len: 'midi', det: ['drape'] },

    /* ---------------- 连衣裙 11 ---------------- */
    d_flower:    { s: 'tea',       m: 'cotton', p: 'floral', neck: 'v',        slv: 'puff',  len: 'midi', fit: 'fitflare', det: ['ruffle', 'tie'] },
    d_black:     { s: 'bodycon',   m: 'cotton', p: 'none',   neck: 'scoop',    slv: 'none',  len: 'mini', fit: 'slim' },
    d_cn:        { s: 'qipao',     m: 'satin',  p: 'none',   neck: 'mandarin', slv: 'short', len: 'knee', fit: 'slim',     det: ['slit', 'frog'] },
    d_y2k:       { s: 'slipmini',  m: 'satin',  p: 'none',   neck: 'cowl',     slv: 'none',  len: 'mini', fit: 'slim' },
    d_slip:      { s: 'slip',      m: 'satin',  p: 'none',   neck: 'v',        slv: 'none',  len: 'midi', fit: 'bias',     det: ['drape'] },
    d_pinafore:  { s: 'pinafore',  m: 'denim',  p: 'twill',  neck: 'straps',   slv: 'none',  len: 'mini', fit: 'flare',    det: ['bib', 'stitch'] },
    d_shirt:     { s: 'shirtdress', m: 'cotton', p: 'none',  neck: 'collar',   slv: 'long',  len: 'knee', fit: 'regular',  det: ['belt', 'placket'] },
    d_knit:      { s: 'knitdress', m: 'knit',   p: 'rib',    neck: 'crew',     slv: 'long',  len: 'midi', fit: 'slim' },
    d_wrap:      { s: 'wrap',      m: 'silk',   p: 'none',   neck: 'v',        slv: 'short', len: 'knee', fit: 'wrap',     det: ['tie', 'ruffle'] },
    d_sundress:  { s: 'sundress',  m: 'cotton', p: 'floral', neck: 'straps',   slv: 'none',  len: 'mini', fit: 'flare',    det: ['tier'] },
    d_qipao:     { s: 'qipao',     m: 'satin',  p: 'floral', neck: 'mandarin', slv: 'short', len: 'maxi', fit: 'slim',     det: ['slit', 'frog'] },
    d_slip_black:  { s: 'slip',      m: 'satin',  p: 'none', neck: 'cowl',   slv: 'none',  len: 'midi', fit: 'bias',  det: ['drape'] },

    /* ---------------- 外套 10 ---------------- */
    o_trench:      { s: 'trench',       m: 'wool',  p: 'none',  len: 'long', clo: 'belt',    det: ['lapel', 'storm', 'epaulette'] },
    o_denim:       { s: 'denimjacket',  m: 'denim', p: 'twill', len: 'crop', clo: 'buttons', det: ['collar', 'pockets', 'stitch'] },
    o_cardigan:    { s: 'longcardigan', m: 'knit',  p: 'rib',   len: 'long', clo: 'open',    det: ['ribbed'] },
    o_blazer:      { s: 'blazer',       m: 'wool',  p: 'tweed', len: 'hip',  clo: 'buttons', det: ['lapel', 'pocket'] },
    o_quilt:       { s: 'quilted',      m: 'nylon', p: 'quilt', len: 'crop', clo: 'zip',     det: ['collar'] },
    o_tailored:    { s: 'tailored',     m: 'wool',  p: 'none',  len: 'crop', clo: 'buttons', det: ['lapel'] },
    o_denimvest:   { s: 'denimvest',    m: 'denim', p: 'twill', len: 'hip',  clo: 'buttons', det: ['pockets', 'stitch'] },
    o_trenchshort: { s: 'croppedtrench', m: 'wool', p: 'none',  len: 'crop', clo: 'belt',    det: ['lapel', 'storm'] },
    o_puffer:      { s: 'puffer',       m: 'nylon', p: 'quilt', len: 'hip',  clo: 'zip',     det: ['collar', 'channel'] },
    o_cape:        { s: 'cape',         m: 'wool',  p: 'none',  len: 'long', clo: 'none',    det: ['drape'] },
    o_trench_olive:   { s: 'trench',     m: 'wool',  p: 'none',  len: 'long', clo: 'belt',    det: ['lapel', 'storm', 'epaulette'] },

    /* ---------------- 鞋 12 ---------------- */
    s_mary:     { s: 'mary',      m: 'leather', heel: 'low',      det: ['strap', 'buckle'] },
    s_loafer:   { s: 'loafer',    m: 'leather', heel: 'flat',     det: ['saddle', 'penny'] },
    s_sneaker:  { s: 'sneaker',   m: 'canvas',  heel: 'flat',     det: ['lace', 'sole'] },
    s_heel:     { s: 'stiletto',  m: 'leather', heel: 'high',     det: ['point'] },
    s_boot:     { s: 'ankleboot', m: 'leather', heel: 'block',    det: ['zip', 'seam'] },
    s_ballet:   { s: 'ballet',    m: 'leather', heel: 'flat',     det: ['bow'] },
    s_sandal:   { s: 'sandal',    m: 'metal',   heel: 'high',     det: ['strap'] },
    s_platform: { s: 'platform',  m: 'leather', heel: 'platform', det: ['strap', 'buckle'] },
    s_chelsea:  { s: 'chelsea',   m: 'suede',   heel: 'flat',     det: ['elastic'] },
    s_runner:   { s: 'runner',    m: 'mesh',    heel: 'flat',     det: ['lace', 'sole'] },
    s_slipper:  { s: 'slipper',   m: 'fluff',   heel: 'flat',     det: ['fluff'] },
    s_kitten:   { s: 'kitten',    m: 'leather', heel: 'kitten',   det: ['slingback'] },
    s_mule:         { s: 'stiletto',  m: 'leather', heel: 'low',      det: ['point', 'backless'] },

    /* ---------------- 包 8 ---------------- */
    g_tote:     { s: 'tote',     m: 'straw',   det: ['handle', 'weave'] },
    g_black:    { s: 'shoulder', m: 'leather', det: ['flap', 'clasp'] },
    g_mini:     { s: 'mini',     m: 'leather', det: ['chain'] },
    g_bucket:   { s: 'bucket',   m: 'leather', det: ['drawstring'] },
    g_shoulder: { s: 'baguette', m: 'leather', det: ['flap'] },
    g_saddle:   { s: 'saddle',   m: 'leather', det: ['saddle'] },
    g_backpack: { s: 'backpack', m: 'nylon',   det: ['strap'] },
    g_clutch:   { s: 'clutch',   m: 'satin',   det: ['clasp'] },

    /* ---------------- 配饰 26 ---------------- */
    a_scarf:   { s: 'scarf',     m: 'silk' },
    a_pearl:   { s: 'pearl',     m: 'pearl' },
    a_glasses: { s: 'glasses',   m: 'metal' },
    a_beret:   { s: 'beret',     m: 'wool' },
    a_belt:    { s: 'belt',      m: 'leather' },
    a_clip:    { s: 'hairclip',  m: 'satin' },
    a_sun:     { s: 'sunglasses', m: 'acetate' },
    a_chain:   { s: 'chain',     m: 'metal' },
    a_choker:  { s: 'choker',    m: 'velvet' },
    a_pendant: { s: 'pendant',   m: 'metal' },
    a_collar:  { s: 'collar',    m: 'pearl' },
    a_stud:    { s: 'stud',      m: 'pearl' },
    a_hoop:    { s: 'hoop',      m: 'metal' },
    a_drop:    { s: 'drop',      m: 'glass' },
    a_cuff:    { s: 'cuff',      m: 'metal' },
    a_hairbow: { s: 'bow',       m: 'satin' },
    a_scrunchie: { s: 'scrunchie', m: 'silk' },
    a_claw:    { s: 'claw',      m: 'acetate' },
    a_headband: { s: 'headband', m: 'fabric' },
    a_hairpin: { s: 'hairpin',   m: 'metal' },
    a_bangle:  { s: 'bangle',    m: 'metal' },
    a_beads:   { s: 'beads',     m: 'glass' },
    a_watch:   { s: 'watch',     m: 'leather' },
    a_ring:    { s: 'ring',      m: 'metal' },
    a_chainbelt: { s: 'chainbelt', m: 'metal' },
    a_brooch:  { s: 'brooch',    m: 'metal' },

    /* ---------------- 袜 6 ---------------- */
    h_sheer:   { s: 'sheer',   m: 'mesh' },
    h_opaque:  { s: 'opaque',  m: 'knit' },
    h_fishnet: { s: 'fishnet', m: 'mesh' },
    h_knee:    { s: 'knee',    m: 'knit' },
    h_ankle:   { s: 'ankle',   m: 'cotton' },
    h_legging: { s: 'legging', m: 'knit' },
    h_sheer_wine:   { s: 'sheer',   m: 'mesh' },
    h_opaque_black: { s: 'opaque',  m: 'knit' },
    h_knee_white:   { s: 'knee',    m: 'knit' },
    h_ankle_black:  { s: 'ankle',   m: 'cotton' },

    /* EXPANSION:START */
    t_utility_shirt: { s: 'polo', m: 'cotton', p: 'none', neck: 'collar', slv: 'short', len: 'waist', fit: 'regular', clo: 'placket' },
    t_henley_cocoa: { s: 'turtle', m: 'knit', p: 'rib', neck: 'turtle', slv: 'long', len: 'waist', fit: 'slim', clo: 'none' },
    t_breton_navy: { s: 'tee', m: 'cotton', p: 'stripe', neck: 'crew', slv: 'long', len: 'waist', fit: 'regular', clo: 'none' },
    t_square_terracotta: { s: 'turtle', m: 'knit', p: 'rib', neck: 'turtle', slv: 'long', len: 'waist', fit: 'slim', clo: 'none' },
    t_zip_hoodie_lav: { s: 'hoodie', m: 'cotton', p: 'none', neck: 'hood', slv: 'long', len: 'hip', fit: 'oversized', clo: 'none', det: ['kangaroo', 'drawstring', 'ribbed'] },
    t_lace_cami_cream: { s: 'cami', m: 'satin', p: 'none', neck: 'straps', slv: 'none', len: 'waist', fit: 'slim', clo: 'none' },
    t_long_vest_black: { s: 'vest', m: 'wool', p: 'none', neck: 'v', slv: 'none', len: 'hip', fit: 'slim', clo: 'buttons', det: ['welt'] },
    t_utility_vest_olive: { s: 'vest', m: 'cotton', p: 'none', neck: 'v', slv: 'none', len: 'waist', fit: 'slim', clo: 'buttons', det: ['welt'] },
    t_velvet_shirt_wine: { s: 'shirt', m: 'velvet', p: 'none', neck: 'collar', slv: 'long', len: 'waist', fit: 'regular', clo: 'buttons', det: ['cuffs', 'placket', 'pocket'] },
    t_oxford_sky: { s: 'shirt', m: 'cotton', p: 'none', neck: 'collar', slv: 'long', len: 'waist', fit: 'regular', clo: 'buttons', det: ['cuffs', 'placket', 'pocket'] },
    t_ruffle_blouse_white: { s: 'blouse', m: 'cotton', p: 'none', neck: 'v', slv: 'long', len: 'waist', fit: 'regular', clo: 'buttons', det: ['lace', 'gather'] },
    t_knit_polo_caramel: { s: 'polo', m: 'knit', p: 'rib', neck: 'collar', slv: 'long', len: 'waist', fit: 'regular', clo: 'placket' },
    t_one_shoulder_black: { s: 'shirt', m: 'jersey', p: 'none', neck: 'collar', slv: 'long', len: 'waist', fit: 'regular', clo: 'buttons', det: ['cuffs', 'placket', 'pocket'] },
    t_cable_cream: { s: 'knit', m: 'knit', p: 'cable', neck: 'v', slv: 'long', len: 'hip', fit: 'regular', clo: 'open', det: ['ribbed', 'pockets'] },
    t_halfzip_sage: { s: 'hoodie', m: 'cotton', p: 'none', neck: 'hood', slv: 'long', len: 'hip', fit: 'oversized', clo: 'none', det: ['kangaroo', 'drawstring', 'ribbed'] },
    t_leather_vest_black: { s: 'vest', m: 'leather', p: 'none', neck: 'v', slv: 'none', len: 'waist', fit: 'slim', clo: 'buttons', det: ['welt'] },
    t_wrap_white: { s: 'satin', m: 'silk', p: 'none', neck: 'cowl', slv: 'long', len: 'waist', fit: 'regular', clo: 'none', det: ['cuff'] },
    t_plaid_shirt_blue: { s: 'shirt', m: 'cotton', p: 'plaid', neck: 'collar', slv: 'long', len: 'waist', fit: 'regular', clo: 'buttons', det: ['cuffs', 'placket', 'pocket'] },
    t_mesh_black: { s: 'shirt', m: 'mesh', p: 'none', neck: 'collar', slv: 'long', len: 'waist', fit: 'regular', clo: 'buttons', det: ['cuffs', 'placket', 'pocket'] },
    t_bow_blouse_cream: { s: 'satin', m: 'satin', p: 'none', neck: 'cowl', slv: 'long', len: 'waist', fit: 'regular', clo: 'none', det: ['cuff'] },
    t_rib_tank_white: { s: 'cami', m: 'cotton', p: 'rib', neck: 'straps', slv: 'none', len: 'waist', fit: 'slim', clo: 'none' },
    t_denim_shirt: { s: 'oversize', m: 'denim', p: 'twill', neck: 'collar', slv: 'long', len: 'hip', fit: 'oversized', clo: 'buttons', det: ['drop', 'pocket'] },
    t_bodysuit_black: { s: 'shirt', m: 'wool', p: 'none', neck: 'collar', slv: 'long', len: 'waist', fit: 'regular', clo: 'buttons', det: ['cuffs', 'placket', 'pocket'] },
    t_peterpan_pink: { s: 'blouse', m: 'cotton', p: 'none', neck: 'v', slv: 'long', len: 'waist', fit: 'regular', clo: 'buttons', det: ['lace', 'gather'] },
    t_puff_crop_white: { s: 'crop', m: 'cotton', p: 'none', neck: 'crew', slv: 'short', len: 'waist', fit: 'slim', clo: 'none' },
    t_lace_cami_black: { s: 'cami', m: 'satin', p: 'none', neck: 'straps', slv: 'none', len: 'waist', fit: 'slim', clo: 'none' },
    b_circle_cream: { s: 'skirt', m: 'cotton', p: 'none', len: 'midi', det: ['pleat'], rise: 'high' },
    b_pencil_black: { s: 'skirt', m: 'wool', p: 'none', len: 'knee', det: ['pleat'], rise: 'high' },
    b_cargo_skirt_khaki: { s: 'skirt', m: 'cotton', p: 'none', len: 'midi', det: ['pleat'], rise: 'high' },
    b_tailored_grey: { s: 'wide', m: 'wool', p: 'none', len: 'full', det: ['crease'], rise: 'high' },
    b_parachute_blue: { s: 'cargo', m: 'nylon', p: 'none', len: 'full', det: ['cargo', 'cuff'], rise: 'high' },
    b_velvet_wide_wine: { s: 'wide', m: 'velvet', p: 'none', len: 'full', det: ['crease'], rise: 'high' },
    b_linen_shorts_white: { s: 'shorts', m: 'linen', p: 'none', len: 'mini', det: ['fray', 'pockets'], rise: 'high' },
    b_biker_black: { s: 'shorts', m: 'jersey', p: 'none', len: 'mini', det: ['fray', 'pockets'], rise: 'high' },
    b_denim_maxi: { s: 'denimskirt', m: 'denim', p: 'twill', len: 'maxi', det: ['stitch', 'slit'], rise: 'high' },
    b_pleat_sage: { s: 'skirt', m: 'wool', p: 'none', len: 'midi', det: ['pleat'], rise: 'high' },
    b_corduroy_brown: { s: 'wide', m: 'corduroy', p: 'none', len: 'full', det: ['crease'], rise: 'high' },
    b_flare_black: { s: 'wide', m: 'wool', p: 'none', len: 'full', det: ['crease'], rise: 'high' },
    b_knit_cream: { s: 'skirt', m: 'knit', p: 'rib', len: 'midi', det: ['drape'], rise: 'high' },
    b_stripe_wide_blue: { s: 'wide', m: 'cotton', p: 'stripe', len: 'full', det: ['crease'], rise: 'high' },
    b_cargo_shorts_olive: { s: 'cargo', m: 'cotton', p: 'none', len: 'mini', det: ['cargo', 'cuff'], rise: 'high' },
    b_satin_rose: { s: 'skirt', m: 'satin', p: 'none', len: 'midi', det: ['drape'], rise: 'high' },
    b_jogger_charcoal: { s: 'cargo', m: 'cotton', p: 'none', len: 'full', det: ['cargo', 'cuff'], rise: 'high' },
    b_aline_khaki: { s: 'skirt', m: 'cotton', p: 'none', len: 'mini', det: ['pleat'], rise: 'high' },
    d_shirt_white: { s: 'shirtdress', m: 'cotton', p: 'none', neck: 'collar', slv: 'long', len: 'knee', fit: 'regular', det: ['belt', 'placket'] },
    d_slip_maxi_black: { s: 'slip', m: 'satin', p: 'none', neck: 'v', slv: 'none', len: 'maxi', fit: 'bias', det: ['drape'] },
    d_tea_sage: { s: 'tea', m: 'cotton', p: 'none', neck: 'v', slv: 'puff', len: 'midi', fit: 'fitflare', det: ['ruffle', 'tie'] },
    d_denim_shirt: { s: 'shirtdress', m: 'denim', p: 'twill', neck: 'collar', slv: 'long', len: 'knee', fit: 'regular', det: ['belt', 'placket'] },
    d_velvet_gown_wine: { s: 'wrap', m: 'velvet', p: 'none', neck: 'v', slv: 'short', len: 'maxi', fit: 'wrap', det: ['tie', 'ruffle'] },
    d_knit_pinafore_cream: { s: 'pinafore', m: 'knit', p: 'rib', neck: 'straps', slv: 'none', len: 'knee', fit: 'flare', det: ['bib', 'stitch'] },
    d_chiffon_floral: { s: 'tea', m: 'chiffon', p: 'floral', neck: 'v', slv: 'puff', len: 'maxi', fit: 'fitflare', det: ['ruffle', 'tie'] },
    d_blazer_black: { s: 'shirtdress', m: 'wool', p: 'none', neck: 'collar', slv: 'long', len: 'knee', fit: 'regular', det: ['belt', 'placket'] },
    d_wrap_knit_oat: { s: 'knitdress', m: 'knit', p: 'rib', neck: 'crew', slv: 'long', len: 'midi', fit: 'slim' },
    d_linen_sundress_butter: { s: 'sundress', m: 'linen', p: 'none', neck: 'straps', slv: 'none', len: 'mini', fit: 'flare', det: ['tier'] },
    d_plaid_pinafore: { s: 'pinafore', m: 'wool', p: 'plaid', neck: 'straps', slv: 'none', len: 'knee', fit: 'flare', det: ['bib', 'stitch'] },
    d_lace_maxi_black: { s: 'slip', m: 'lace', p: 'none', neck: 'v', slv: 'none', len: 'maxi', fit: 'bias', det: ['drape'] },
    d_satin_slip_terracotta: { s: 'slip', m: 'satin', p: 'none', neck: 'v', slv: 'none', len: 'midi', fit: 'bias', det: ['drape'] },
    d_tulle_white: { s: 'sundress', m: 'tulle', p: 'none', neck: 'straps', slv: 'none', len: 'mini', fit: 'flare', det: ['tier'] },
    d_utility_olive: { s: 'shirtdress', m: 'cotton', p: 'none', neck: 'collar', slv: 'long', len: 'knee', fit: 'regular', det: ['belt', 'placket'] },
    d_knit_rose: { s: 'knitdress', m: 'knit', p: 'rib', neck: 'crew', slv: 'long', len: 'midi', fit: 'slim' },
    o_leather_black: { s: 'denimjacket', m: 'leather', p: 'none', len: 'crop', clo: 'buttons', det: ['collar', 'pockets', 'stitch'] },
    o_trench_oat: { s: 'trench', m: 'wool', p: 'none', len: 'long', clo: 'belt', det: ['lapel', 'storm', 'epaulette'] },
    o_chore_denim: { s: 'denimjacket', m: 'denim', p: 'twill', len: 'crop', clo: 'buttons', det: ['collar', 'pockets', 'stitch'] },
    o_wool_grey: { s: 'tailored', m: 'wool', p: 'none', len: 'long', clo: 'buttons', det: ['lapel'] },
    o_bomber_olive: { s: 'quilted', m: 'nylon', p: 'none', len: 'crop', clo: 'zip', det: ['collar'] },
    o_crop_cardigan_cream: { s: 'longcardigan', m: 'knit', p: 'rib', len: 'crop', clo: 'open', det: ['ribbed'] },
    o_blazer_burgundy: { s: 'blazer', m: 'wool', p: 'none', len: 'crop', clo: 'buttons', det: ['lapel', 'pocket'] },
    o_trench_black: { s: 'trench', m: 'wool', p: 'none', len: 'long', clo: 'belt', det: ['lapel', 'storm', 'epaulette'] },
    o_field_khaki: { s: 'denimjacket', m: 'cotton', p: 'none', len: 'crop', clo: 'buttons', det: ['collar', 'pockets', 'stitch'] },
    o_tweed_pink: { s: 'blazer', m: 'tweed', p: 'tweed', len: 'crop', clo: 'buttons', det: ['lapel', 'pocket'] },
    o_quilt_vest_blue: { s: 'quilted', m: 'nylon', p: 'quilt', len: 'crop', clo: 'zip', det: ['collar'] },
    o_knit_cape_cream: { s: 'cape', m: 'knit', p: 'rib', len: 'crop', clo: 'none', det: ['drape'] },
    o_corduroy_brown: { s: 'denimjacket', m: 'corduroy', p: 'none', len: 'crop', clo: 'buttons', det: ['collar', 'pockets', 'stitch'] },
    o_puffer_black: { s: 'puffer', m: 'nylon', p: 'quilt', len: 'crop', clo: 'zip', det: ['collar', 'channel'] },
    s_pointed_flat_black: { s: 'ballet', m: 'leather', det: ['bow'], heel: 'flat' },
    s_oxford_brown: { s: 'loafer', m: 'leather', det: ['saddle', 'penny'], heel: 'flat' },
    s_ankle_boot_cream: { s: 'ankleboot', m: 'leather', det: ['zip', 'seam'], heel: 'block' },
    s_sport_sandal_blue: { s: 'sandal', m: 'nylon', det: ['strap'], heel: 'high' },
    s_platform_boot_black: { s: 'platform', m: 'leather', det: ['strap', 'buckle'], heel: 'platform' },
    s_ballet_pink: { s: 'ballet', m: 'leather', det: ['bow'], heel: 'flat' },
    s_chunky_sneaker_grey: { s: 'runner', m: 'mesh', det: ['lace', 'sole'], heel: 'flat' },
    s_velvet_pump_wine: { s: 'kitten', m: 'velvet', det: ['slingback'], heel: 'kitten' },
    s_hiking_olive: { s: 'runner', m: 'suede', det: ['lace', 'sole'], heel: 'flat' },
    s_mary_white: { s: 'mary', m: 'leather', det: ['strap', 'buckle'], heel: 'low' },
    s_mule_black: { s: 'stiletto', m: 'leather', det: ['point', 'backless'], heel: 'low' },
    s_ballet_silver: { s: 'ballet', m: 'metal', det: ['bow'], heel: 'flat' },
    s_laceup_boot_black: { s: 'ankleboot', m: 'leather', det: ['zip', 'seam'], heel: 'block' },
    s_canvas_blue: { s: 'sneaker', m: 'canvas', det: ['lace', 'sole'], heel: 'flat' },
    s_loafer_brown: { s: 'loafer', m: 'leather', det: ['saddle', 'penny'], heel: 'flat' },
    s_hightop_white: { s: 'sneaker', m: 'canvas', det: ['lace', 'sole'], heel: 'flat' },
    /* EXPANSION:END */
    /* ACCESSORY:PACK:START */
    a_bucket_hat: { s: 'bucket', m: 'straw' },
    a_beanie: { s: 'beanie', m: 'knit' },
    a_round_glasses: { s: 'glasses', m: 'metal' },
    a_cateye_sun: { s: 'sunglasses', m: 'acetate' },
    a_aviator_sun: { s: 'sunglasses', m: 'metal' },
    g_hobo: { s: 'shoulder', m: 'leather', det: ['slouch'] },
    g_camera: { s: 'saddle',   m: 'leather', det: ['zip'] },
    g_tophandle: { s: 'tote',     m: 'leather', det: ['handle'] },
    g_phone: { s: 'mini',     m: 'leather', det: ['strap'] },
    a_huggie: { s: 'hoop', m: 'metal' },
    a_pearl_drop: { s: 'drop', m: 'pearl' },
    a_chandelier: { s: 'drop', m: 'glass' },
    a_chain_bracelet: { s: 'bangle', m: 'metal' },
    a_cuff_bracelet: { s: 'bangle', m: 'metal' },
    a_charm_bracelet: { s: 'beads', m: 'metal' },
    h_crew_white: { s: 'ankle', m: 'cotton' },
    h_crew_black: { s: 'ankle', m: 'cotton' },
    h_overknee: { s: 'knee', m: 'knit' },
    /* ACCESSORY:PACK:END */
  };

  var FALLBACK = {
    top: { s: 'tee', m: 'cotton', p: 'none', neck: 'crew', slv: 'short', len: 'waist', fit: 'regular', clo: 'none' },
    bottom: { s: 'skirt', m: 'cotton', p: 'none', rise: 'high', len: 'midi' },
    dress: { s: 'sundress', m: 'cotton', p: 'none', neck: 'straps', slv: 'none', len: 'mini', fit: 'flare' },
    outer: { s: 'blazer', m: 'wool', p: 'none', len: 'hip', clo: 'buttons' },
    shoes: { s: 'flat', m: 'leather', heel: 'flat' },
    bag: { s: 'tote', m: 'leather' },
    accessory: { s: 'chain', m: 'metal' },
    hosiery: { s: 'opaque', m: 'knit' }
  };

  Iso.lookOf = function (item) {
    if (!item) { return null; }
    if (item.look && typeof item.look === 'object') { return item.look; }
    var l = Iso.looks[item.id];
    if (l) { return l; }
    var base = FALLBACK[item.cat] || FALLBACK.top;
    var out = {};
    for (var k in base) { out[k] = base[k]; }
    out.fallback = true;
    return out;
  };

  Iso.lookCoverage = function (items) {
    var missing = [];
    var extra = [];
    var seen = {};
    (items || []).forEach(function (it) {
      seen[it.id] = 1;
      if (!Iso.looks[it.id]) { missing.push(it.id); }
    });
    Object.keys(Iso.looks).forEach(function (id) {
      if (!seen[id]) { extra.push(id); }
    });
    return { missing: missing, extra: extra, total: Object.keys(Iso.looks).length };
  };
})();
