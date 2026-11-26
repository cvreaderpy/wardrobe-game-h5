/* 衣间小日子 — 顾客对话、语气偏好与即时反应 */
(function () {
  var D = window.GAME_DATA;

  D.TONE_LABELS = {
    warm: '共情',
    direct: '直接',
    fun: '玩笑'
  };

  D.TONE_HINTS = {
    warm: '先接住她的情绪',
    direct: '把问题问清楚',
    fun: '让气氛松一点'
  };

  D.REVEAL_LABELS = {
    avoid: '避雷',
    budget: '预算底线',
    body: '身材诉求',
    style: '真正想要的感觉'
  };

  /* 顾客没说出口的小心愿：满足后会给小费，并解锁一句专属反应 */
  D.WISHES = {
    polish: { label: '想显精神', desc: '至少一件正式度 ≥ 4 的单品', hint: '她一直在看肩线和领口。' },
    comfort: { label: '不想受罪', desc: '至少一件舒适 / 柔软版型的单品', hint: '她悄悄活动了一下脚踝。' },
    bright: { label: '想被看见', desc: '至少一件暖色或亮色单品', hint: '她说最近照片里总是灰灰的。' },
    unique: { label: '不想撞衫', desc: '至少一件复古 / Y2K / 设计款', hint: '她说同事总和她买同款。' },
    budget: { label: '想省一点', desc: '总价不超过预算的 85%', hint: '她把吊牌翻来覆去看了两次。' },
    practical: { label: '要能干活', desc: '至少一件耐脏 / 方便活动的单品', hint: '她一直在看袖口和裤脚。' }
  };

  D.getWish = function (customer) {
    if (!customer) { return D.WISHES.polish; }
    return D.WISHES[customer.wish] || D.WISHES.polish;
  };

  D.wishDone = function (customer, items, total) {
    if (!customer || !items || !items.length) { return false; }
    switch (customer.wish) {
      case 'polish':
        return items.some(function (it) { return (it.formality || 0) >= 4; });
      case 'comfort':
        return items.some(function (it) {
          return (it.fit || []).indexOf('comfort') >= 0 || (it.fit || []).indexOf('soft') >= 0;
        });
      case 'bright':
        return items.some(function (it) { return D.COLOR_FAMILY[it.color] === 'warm'; });
      case 'unique':
        return items.some(function (it) {
          return !!it.design || (it.style || []).some(function (st) {
            return st === 'vintage' || st === 'y2k' || st === 'newchinese';
          });
        });
      case 'budget':
        return total <= customer.budget * 0.85;
      case 'practical':
        return items.some(function (it) {
          return (it.fit || []).indexOf('dirty') >= 0 || (it.fit || []).indexOf('comfort') >= 0;
        });
      default:
        return false;
    }
  };

  /* 今日挑战：和心愿形成取舍，成交通常给一笔额外小费 */
  D.CHALLENGES = {
    budgetCut: { label: '省着点花', desc: '总价不超过预算的 85%' },
    accent: { label: '加个记忆点', desc: '至少一件包或配饰' },
    window: { label: '橱窗同款', desc: '用一件今天橱窗里的单品' },
    season: { label: '当季新品', desc: '至少一件当季新品' }
  };

  /*
   * 每位顾客 2–3 个对话回合。
   * tone 是她更吃哪一套；选择匹配 +10 好感，普通 +4，不匹配 -3。
   * reveal 表示这一句能套出哪类信息。
   */
  D.DIALOGUES = {
    lin: {
      tone: 'warm',
      care: '她双手捂着杯子，肩膀慢慢松下来。',
      reaction: '她盯着镜子里的自己，小声说：“好像真的可以。”',
      beats: [
        {
          prompt: '外面风有点大……我明天有个面试，现在脑子一片空白。',
          choices: [
            { tone: 'warm', text: '先坐下缓一缓，面试而已，不是你的人生判决。', reply: '……你这么说，我好像没那么慌了。', reveal: 'body' },
            { tone: 'direct', text: '哪家公司？什么岗位？我按场合给你配。', reply: '一家 4A，做文案。我不想穿得太学生气。', reveal: 'style' },
            { tone: 'fun', text: '衣柜里全是卫衣，说明你至少有一百件退路。', reply: '哈哈，可惜面试官不看我的卫衣收藏。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '我最怕穿得像我主管，或者像卖保险的。',
          choices: [
            { tone: 'warm', text: '那就找一件有精神、但不端着的。', reply: '对，我想要专业，但我还是我。', reveal: 'body' },
            { tone: 'direct', text: '预算多少？我按预算配，不让你为难。', reply: '600 以内吧，第一份工资还没发。', reveal: 'budget' },
            { tone: 'fun', text: '放心，我这儿没有卖保险套装。', reply: '那我信你一次。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '如果只能选一件，你觉得什么最重要？',
          choices: [
            { tone: 'warm', text: '一件让你敢抬头的。', reply: '那我想要那件白衬衫。' },
            { tone: 'direct', text: '版型和正式度，先稳住场合。', reply: '好，听你的。' },
            { tone: 'fun', text: '鞋。走进去那几步最需要底气。', reply: '有道理，我走路容易不自信。' }
          ]
        }
      ]
    },

    guo: {
      tone: 'direct',
      care: '他把水一口喝完，像在补充编译能量。',
      reaction: '他活动了一下肩膀：“能骑车，能上班，行。”',
      beats: [
        {
          prompt: '我午休只有四十分钟，直接说重点吧。',
          choices: [
            { tone: 'direct', text: '通勤、舒服、预算 480，三件搞定。', reply: '对，就这个思路。', reveal: 'budget' },
            { tone: 'warm', text: '先坐，喝口水再挑，不差这两分钟。', reply: '……行，但我真的赶时间。', reveal: 'body' },
            { tone: 'fun', text: '程序员买衣服，是不是也讲究可维护性？', reply: '最好能机洗、免熨、不起球。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '别给我那种要吸肚子的衣服。',
          choices: [
            { tone: 'direct', text: '松量够、腰头不勒，骑车也能穿。', reply: '懂我。', reveal: 'body' },
            { tone: 'warm', text: '舒服最重要，你不需要为衣服受罪。', reply: '这话我记下了。', reveal: 'body' },
            { tone: 'fun', text: '放心，穿上还能蹲下来改 bug。', reply: '那我先看看。', reveal: 'style' }
          ]
        }
      ]
    },

    zhou: {
      tone: 'warm',
      care: '她对着镜子补了口红，又擦掉了一点。',
      reaction: '她侧过身看裙摆：“这个长度，刚好。”',
      beats: [
        {
          prompt: '我三个月没约会了，今天是不是有点用力过猛？',
          choices: [
            { tone: 'warm', text: '没有，你只是认真对待自己。', reply: '……这句话有点犯规。', reveal: 'body' },
            { tone: 'direct', text: '约会对象喜欢什么风格？', reply: '他说喜欢我穿裙子，但我不想太明显。', reveal: 'style' },
            { tone: 'fun', text: '用力过猛也比在家刷手机强。', reply: '你怎么知道我在家刷了三个月。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '我想被夸好看，又怕对方觉得我太刻意。',
          choices: [
            { tone: 'warm', text: '那就选一件让你自己先开心的。', reply: '我自己先开心……这个说法好。', reveal: 'body' },
            { tone: 'direct', text: '预算 800，选法式但不甜腻的。', reply: '嗯，我不想穿成蛋糕。', reveal: 'budget' },
            { tone: 'fun', text: '刻意一点怎么了，约会本来就要有仪式感。', reply: '那我就不客气了。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '你觉得我适合什么颜色？',
          choices: [
            { tone: 'warm', text: '暖一点的颜色，会让你看起来更有血色。', reply: '我平时都穿黑白灰。' },
            { tone: 'direct', text: '玫瑰、陶土，别超过两个主色。', reply: '好，我记一下。' },
            { tone: 'fun', text: '适合让人想约你下一次的颜色。', reply: '你真的很会说话。' }
          ]
        }
      ]
    },

    laochen: {
      tone: 'direct',
      care: '他把水放在门口，说怕碰倒你的衣架。',
      reaction: '他蹲了一下，又站起来：“这个能干活。”',
      beats: [
        {
          prompt: '我手上还有泥，就不跟你握手了。',
          choices: [
            { tone: 'direct', text: '没事，先说要搬多少花。', reply: '周末市集，两大箱，还得蹲上蹲下。', reveal: 'body' },
            { tone: 'warm', text: '辛苦，先擦擦手，慢慢看。', reply: '你这儿有纸巾吗？', reveal: 'body' },
            { tone: 'fun', text: '泥是花店老板的工牌。', reply: '哈哈，那我这工牌天天戴着。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '别给我浅色的，一天就废。',
          choices: [
            { tone: 'direct', text: '深色、耐脏、能活动，三件够。', reply: '对，越简单越好。', reveal: 'style' },
            { tone: 'warm', text: '那选深色，但可以有一点老板的样子。', reply: '对，不能像去干农活。', reveal: 'body' },
            { tone: 'fun', text: '深色也分很多种，有一种叫“有故事”。', reply: '行，你挑。', reveal: 'avoid' }
          ]
        }
      ]
    },

    chen: {
      tone: 'warm',
      care: '她把包放下，第一次认真看镜子里的自己。',
      reaction: '她拉了拉衣角：“原来我还能穿成这样。”',
      beats: [
        {
          prompt: '我生完孩子以后，很多衣服都穿不进去了。',
          choices: [
            { tone: 'warm', text: '衣服可以换，你不用急着变回从前。', reply: '……好久没人跟我说这个了。', reveal: 'body' },
            { tone: 'direct', text: '今天想解决什么场合？', reply: '接孩子、买菜，最好也能见朋友。', reveal: 'style' },
            { tone: 'fun', text: '那就买能追公交的，实用第一。', reply: '你还挺懂当妈的。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '我不想穿得太紧，也不想看起来放弃自己。',
          choices: [
            { tone: 'warm', text: '松一点也可以很好看，关键是线条。', reply: '真的吗？我总觉得自己像套了个袋子。', reveal: 'body' },
            { tone: 'direct', text: '预算 500，选有垂感的。', reply: '好，别太贵，我很久没给自己买衣服了。', reveal: 'budget' },
            { tone: 'fun', text: '放弃自己的人才不会进这家店。', reply: '你这张嘴。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '你觉得我还能穿亮色吗？',
          choices: [
            { tone: 'warm', text: '当然，先从靠近脸的一点点开始。', reply: '那我试试丝巾。' },
            { tone: 'direct', text: '可以，但全身别超过两个亮色。', reply: '行，稳一点。' },
            { tone: 'fun', text: '能，孩子同学会以为你是姐姐。', reply: '少来，我都三十五了。' }
          ]
        }
      ]
    },

    xiaolu: {
      tone: 'fun',
      care: '她把书包抱在胸前，听到价格时眼睛亮了一下。',
      reaction: '她对着镜子转了一圈：“这个真的不贵吗？”',
      beats: [
        {
          prompt: '我预算真的只有 350，会不会一进门就被赶出去？',
          choices: [
            { tone: 'fun', text: '不会，我们只赶走不试衣服的人。', reply: '那我放心了，我可能试很多。', reveal: 'body' },
            { tone: 'direct', text: '350 也能配一套，先看学生党价位。', reply: '太好了，我开学还要买书。', reveal: 'budget' },
            { tone: 'warm', text: '预算不是问题，先把风格找到。', reply: '嗯……我想看起来不像高中生。', reveal: 'style' }
          ]
        },
        {
          prompt: '我想看起来贵一点，但又不能真的贵。',
          choices: [
            { tone: 'fun', text: '这叫“看起来很贵”，我们专业。', reply: '哈哈，那我要学。', reveal: 'style' },
            { tone: 'direct', text: '选基础款加一个亮点，最省钱。', reply: '比如？', reveal: 'body' },
            { tone: 'warm', text: '干净、合身，比价格更显贵。', reply: '我记下来了。', reveal: 'avoid' }
          ]
        }
      ]
    },

    ali: {
      tone: 'fun',
      care: '她已经开始对着镜子比耶了。',
      reaction: '她掏出手机拍了一张：“这个发出去肯定有人问链接。”',
      beats: [
        {
          prompt: '我要去音乐节，想在人群里被看到，但不是被保安看到。',
          choices: [
            { tone: 'fun', text: '目标明确，那我们走“安全范围内最炸”。', reply: '对对对，就是这个意思。', reveal: 'style' },
            { tone: 'direct', text: '场地在户外还是室内？', reply: '户外，从下午蹦到晚上。', reveal: 'body' },
            { tone: 'warm', text: '先选你穿着自在的，拍照才会好看。', reply: '自在……我平时穿得挺素的。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '我朋友都穿得很夸张，我不想输。',
          choices: [
            { tone: 'fun', text: '输赢不重要，出片最重要。', reply: '你懂我。', reveal: 'style' },
            { tone: 'direct', text: '预算 500，亮点放在上半身。', reply: '好，我下半身穿旧牛仔就行。', reveal: 'budget' },
            { tone: 'warm', text: '你不用跟她们一样，你有自己的好看。', reply: '……你这么说我有点想试裙子。', reveal: 'body' }
          ]
        },
        {
          prompt: '如果太夸张，我男朋友会不会不自在？',
          choices: [
            { tone: 'fun', text: '让他不自在，说明你成功了。', reply: '哈哈哈，那我更要试。' },
            { tone: 'direct', text: '约会和音乐节是两套逻辑，今天先为镜头。', reply: '行，今天不谈恋爱。' },
            { tone: 'warm', text: '你开心最重要，他会习惯的。', reply: '那我选我自己喜欢的。' }
          ]
        }
      ]
    },

    xiaok: {
      tone: 'direct',
      care: '她对着手机镜头整理了一下头发。',
      reaction: '她打开前置摄像头看了两秒：“这个上镜。”',
      beats: [
        {
          prompt: '我今晚直播，镜头会吃妆，也会吃衣服。',
          choices: [
            { tone: 'direct', text: '要上镜，先定一个记忆点。', reply: '对，我不想看起来像路人。', reveal: 'style' },
            { tone: 'warm', text: '别紧张，你本人比镜头好看。', reply: '谢谢，但我还是需要一套战袍。', reveal: 'body' },
            { tone: 'fun', text: '镜头吃衣服，那你穿两件。', reply: '哈哈，那也太热了。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '不能像去蹦迪，我粉丝里有学生。',
          choices: [
            { tone: 'direct', text: '甜酷，露肤度控制在上半身。', reply: '专业，继续说。', reveal: 'style' },
            { tone: 'warm', text: '那就选有设计感但不过分的。', reply: '嗯，我不想被家长举报。', reveal: 'avoid' },
            { tone: 'fun', text: '放心，蹦迪款我另外收费。', reply: '你真的很会做生意。', reveal: 'budget' }
          ]
        },
        {
          prompt: '你觉得我今天能卖爆吗？',
          choices: [
            { tone: 'direct', text: '衣服有记忆点，剩下的看你。', reply: '好，借你吉言。' },
            { tone: 'warm', text: '你状态很好，穿什么都有人看。', reply: '那我信你。' },
            { tone: 'fun', text: '卖爆了记得回来请我喝奶茶。', reply: '成交。' }
          ]
        }
      ]
    },

    he: {
      tone: 'direct',
      care: '他把水杯放在图纸旁边，杯底压住了一角。',
      reaction: '他退后两步看了看：“轮廓对了。”',
      beats: [
        {
          prompt: '我不太会逛店，一般买了就走。',
          choices: [
            { tone: 'direct', text: '看展、利落、有轮廓，三件够。', reply: '对，别太正式。', reveal: 'style' },
            { tone: 'warm', text: '没关系，慢慢看，我不跟着你。', reply: '谢谢，我先自己转一圈。', reveal: 'body' },
            { tone: 'fun', text: '那我给你导览一下，不收门票。', reply: '可以，讲重点。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '我不想穿得像中介，也不想太随便。',
          choices: [
            { tone: 'direct', text: '建筑感，靠版型不靠装饰。', reply: '这个词准确。', reveal: 'style' },
            { tone: 'warm', text: '那就选一件有分寸的，不用力。', reply: '嗯，我要的是这个。', reveal: 'body' },
            { tone: 'fun', text: '中介一般没有你这么好的鞋。', reply: '你观察得挺细。', reveal: 'budget' }
          ]
        },
        {
          prompt: '预算 800，值得花在哪？',
          choices: [
            { tone: 'direct', text: '外套或鞋，其他可以基础。', reply: '合理。' },
            { tone: 'warm', text: '花在你每次穿都会开心的地方。', reply: '那就外套吧。' },
            { tone: 'fun', text: '花在别人看不出价格、但看得出品味的地方。', reply: '这话我可以引用吗？' }
          ]
        }
      ]
    },

    tang: {
      tone: 'direct',
      care: '他闻到杯子里的水，说像手冲的尾段。',
      reaction: '他抬手试了试袖口：“不碍事，能干活。”',
      beats: [
        {
          prompt: '我站八小时，衣服得能跟着我动。',
          choices: [
            { tone: 'direct', text: '弹力、耐脏、口袋，优先这三个。', reply: '你做过餐饮？', reveal: 'body' },
            { tone: 'warm', text: '那先舒服，再谈好看。', reply: '对，我下班还要去见朋友。', reveal: 'style' },
            { tone: 'fun', text: '能蹲下捡豆子的那种。', reply: '太具体了，但我懂。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '最好上班下班都能穿。',
          choices: [
            { tone: 'direct', text: '换双鞋就能切换场合。', reply: '这个思路好。', reveal: 'budget' },
            { tone: 'warm', text: '选一件你下班也愿意穿的。', reply: '我不想一件衣服只属于吧台。', reveal: 'style' },
            { tone: 'fun', text: '下班把围裙一脱，直接去约会。', reply: '被你说得像电影。', reveal: 'body' }
          ]
        }
      ]
    },

    nana: {
      tone: 'warm',
      care: '她脱下高跟鞋，脚后跟贴着一小块创可贴。',
      reaction: '她提着裙摆走了两步：“这双能撑到散场。”',
      beats: [
        {
          prompt: '婚礼还有两周，我每天都在试鞋。',
          choices: [
            { tone: 'warm', text: '别急，婚礼那天你只需要美，不需要受罪。', reply: '可我一穿高跟鞋就脚疼。', reveal: 'body' },
            { tone: 'direct', text: '敬酒要走几桌？场地是草坪吗？', reply: '二十桌，室内，但有台阶。', reveal: 'body' },
            { tone: 'fun', text: '婚礼是马拉松，不是百米冲刺。', reply: '那我不能选那双十厘米的。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '我想上镜，又不想散场时一瘸一拐。',
          choices: [
            { tone: 'warm', text: '选一双能让你笑到最后的鞋。', reply: '这句话我要记下来。', reveal: 'body' },
            { tone: 'direct', text: '粗跟、软底、裸色，最稳。', reply: '好，我试试。', reveal: 'style' },
            { tone: 'fun', text: '敬酒服可以闪，鞋必须乖。', reply: '哈哈，鞋听话一点。', reveal: 'budget' }
          ]
        },
        {
          prompt: '你觉得我穿红色会不会抢新娘风头？',
          choices: [
            { tone: 'warm', text: '你是新娘，风头本来就是你的。', reply: '对哦，我差点忘了。' },
            { tone: 'direct', text: '红色可以，选深一点的。', reply: '好，不要正红。' },
            { tone: 'fun', text: '今天你最大，谁敢说你。', reply: '那我就不客气了。' }
          ]
        }
      ]
    },

    wang: {
      tone: 'warm',
      care: '她把珍珠项链摘下来，小心地放在柜台上。',
      reaction: '她对着镜子理了理领口：“这样上台合影不怯。”',
      beats: [
        {
          prompt: '侄女结婚，我不能穿得太素，也不能太招摇。',
          choices: [
            { tone: 'warm', text: '这个分寸我懂，先看颜色。', reply: '对，我这个年纪最怕穿错。', reveal: 'body' },
            { tone: 'direct', text: '喝喜酒、室内、长辈桌，对吧？', reply: '对，还要上台合影。', reveal: 'style' },
            { tone: 'fun', text: '放心，不抢新娘，只抢红包。', reply: '哈哈，你这孩子。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '我手臂粗，不想露太多。',
          choices: [
            { tone: 'warm', text: '那就选有袖子的，照样精神。', reply: '对，别让我一直拽衣服。', reveal: 'body' },
            { tone: 'direct', text: '预算 600，新中式或复古。', reply: '新中式好，喜庆。', reveal: 'budget' },
            { tone: 'fun', text: '露不露不重要，气色最重要。', reply: '你比我侄女会说话。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '珍珠会不会太隆重？',
          choices: [
            { tone: 'warm', text: '一点珍珠刚好，像把日子过明白了。', reply: '你这话我爱听。' },
            { tone: 'direct', text: '小颗的，别戴整套。', reply: '行，听你的。' },
            { tone: 'fun', text: '隆重的是婚礼，不是你。', reply: '那我戴。' }
          ]
        }
      ]
    },

    qi: {
      tone: 'direct',
      care: '她把手机扣在桌上，终于不回消息了。',
      reaction: '她抬了抬手臂：“不用熨，这点很重要。”',
      beats: [
        {
          prompt: '月底加班，我没力气逛。',
          choices: [
            { tone: 'direct', text: '通勤、免熨、预算 500，直接看。', reply: '对，别让我做太多选择。', reveal: 'budget' },
            { tone: 'warm', text: '先坐两分钟，不着急。', reply: '……好，我确实有点累。', reveal: 'body' },
            { tone: 'fun', text: '月底还能来逛街，说明你还有救。', reply: '我的救赎是发工资。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '不能让领导觉得我穿得太随便。',
          choices: [
            { tone: 'direct', text: '有领子的上装加直筒裤，稳。', reply: '好，最好不用熨。', reveal: 'body' },
            { tone: 'warm', text: '得体不等于难受，选软一点的。', reply: '这个我同意。', reveal: 'style' },
            { tone: 'fun', text: '穿得像能随时接管公司。', reply: '那我先接管这个月的报表。', reveal: 'avoid' }
          ]
        }
      ]
    },

    su: {
      tone: 'warm',
      care: '她把水果放在脚边，怕挡住别人走路。',
      reaction: '她对着镜子笑了笑：“这样应该不会被挑毛病。”',
      beats: [
        {
          prompt: '第一次见男朋友父母，我比上课还紧张。',
          choices: [
            { tone: 'warm', text: '不用演乖，穿得像你自己就好。', reply: '可我怕他们觉得我太有主意。', reveal: 'body' },
            { tone: 'direct', text: '什么家庭？喜欢什么风格？', reply: '他妈妈是老师，家里挺传统的。', reveal: 'style' },
            { tone: 'fun', text: '见家长嘛，穿得能让他们放心，又不至于想给你介绍对象。', reply: '哈哈，那还是算了。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '不能太时髦，也不能太随便。',
          choices: [
            { tone: 'warm', text: '温婉一点，但保留你的书卷气。', reply: '这个形容我喜欢。', reveal: 'style' },
            { tone: 'direct', text: '新中式、低饱和、过膝，稳。', reply: '好，我记一下。', reveal: 'budget' },
            { tone: 'fun', text: '穿得像会给他们带水果的人。', reply: '我确实买了水果。', reveal: 'body' }
          ]
        },
        {
          prompt: '预算 700，值得买连衣裙吗？',
          choices: [
            { tone: 'warm', text: '如果穿上让你安心，就值得。', reply: '那我试试。' },
            { tone: 'direct', text: '连衣裙最省事，一双鞋就够。', reply: '好，不折腾。' },
            { tone: 'fun', text: '买完记得说是男朋友付的钱。', reply: '想得美。' }
          ]
        }
      ]
    },

    mimi: {
      tone: 'fun',
      care: '她蹲下来逗猫，狗毛沾了猫一身。',
      reaction: '她对着镜子抿嘴笑：“甜，但不傻。”',
      beats: [
        {
          prompt: '我刚从宠物店下班，身上还有狗毛。',
          choices: [
            { tone: 'fun', text: '没事，我这儿也有一只猫。', reply: '真的？它在哪？', reveal: 'body' },
            { tone: 'direct', text: '约会几点？先按时间选。', reply: '七点，我还有一小时。', reveal: 'style' },
            { tone: 'warm', text: '辛苦了，先把自己从工服里放出来。', reply: '对，我现在只想当个人。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '我想甜一点，但别像高中生。',
          choices: [
            { tone: 'fun', text: '那就“甜但有脑子”。', reply: '这个定位好。', reveal: 'style' },
            { tone: 'direct', text: '法式甜，露肤度低一点。', reply: '好，不要蕾丝太多。', reveal: 'budget' },
            { tone: 'warm', text: '选让你想转圈的那件。', reply: '那我可能真的会转。', reveal: 'body' }
          ]
        }
      ]
    },

    gu: {
      tone: 'direct',
      care: '她把水杯放在文件袋旁边，杯底没有留下水印。',
      reaction: '她看着镜子里的肩线：“客户应该会先听我说完。”',
      beats: [
        {
          prompt: '下周开庭，我需要一套让客户安心的衣服。',
          choices: [
            { tone: 'direct', text: '深色、合身、不反光，先定基调。', reply: '对，不要咄咄逼人。', reveal: 'style' },
            { tone: 'warm', text: '你看起来已经很专业了，衣服是加分。', reply: '谢谢，但我需要万无一失。', reveal: 'body' },
            { tone: 'fun', text: '要不要穿得像能赢？', reply: '我要的是客户觉得我能赢。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '不能太强势，客户会不敢说话。',
          choices: [
            { tone: 'direct', text: '线条利落，颜色放软。', reply: '比如燕麦色？', reveal: 'style' },
            { tone: 'warm', text: '专业感有很多种，不用靠垫肩。', reply: '这句话有用。', reveal: 'body' },
            { tone: 'fun', text: '那就不系最上面那颗扣子。', reply: '开庭不是时装周。', reveal: 'avoid' }
          ]
        },
        {
          prompt: '预算 1200，买一套还是分开买？',
          choices: [
            { tone: 'direct', text: '外套加下装，复用率最高。', reply: '合理。' },
            { tone: 'warm', text: '买你穿上最像自己的那套。', reply: '我需要的是像律师。' },
            { tone: 'fun', text: '买能穿去开庭，也能穿去喝一杯的。', reply: '我没有时间喝一杯。' }
          ]
        }
      ]
    }
  };

  /* 没有单独写对话的顾客，用顾客自己的资料生成一段通用对话 */
  D.getDialogue = function (customer) {
    if (D.DIALOGUES[customer.id]) { return D.DIALOGUES[customer.id]; }
    var style = (D.STYLE_LABELS[customer.styles[0]] || '简单');
    var avoid = (D.STYLE_LABELS[customer.avoid[0]] || '太花');
    return {
      tone: 'warm',
      care: '她接过水，慢慢放松下来。',
      reaction: '她对着镜子看了看，好像在重新认识自己。',
      beats: [
        {
          prompt: '你好，我想找一套' + customer.occasion + '能穿的衣服。',
          choices: [
            { tone: 'warm', text: '先坐一下，跟我说说你想要的感觉。', reply: '我想穿得舒服一点，也别太普通。', reveal: 'body' },
            { tone: 'direct', text: '预算和场合先告诉我。', reply: '预算 ' + customer.budget + '，场合你也知道了。', reveal: 'budget' },
            { tone: 'fun', text: '今天想当哪种版本的自己？', reply: '哈哈，想当' + style + '一点的。', reveal: 'style' }
          ]
        },
        {
          prompt: '我平时不太会搭，别给我太难的。',
          choices: [
            { tone: 'warm', text: '交给我，你只负责好看。', reply: '那我就不客气了。', reveal: 'avoid' },
            { tone: 'direct', text: '三件基础款，颜色压住，不会错。', reply: '行，越简单越好。', reveal: 'style' },
            { tone: 'fun', text: '难的我穿，你穿好看的。', reply: '你倒挺会分工。', reveal: 'body' }
          ]
        }
      ]
    };
  };

  D.CUSTOMER_REACTIONS = {
    like: [
      '这个风格我平时会看。',
      '这件上身应该不错。',
      '有点意思，我先摸摸料子。',
      '这个颜色我能接受。'
    ],
    avoid: [
      '这个风格我有点驾驭不了……',
      '好看是好看，但不像我。',
      '我平时不太穿这种。',
      '这个会不会太用力了？'
    ],
    color: [
      '颜色挺亮，但我平时穿得比较素。',
      '这个颜色我衣柜里没有。',
      '颜色可以，别全身都这么亮。',
      '这个色会不会显黑？'
    ],
    fit: [
      '这个版型应该能遮住我想遮的地方。',
      '看起来挺显高的。',
      '这个长度对我刚好。',
      '舒服吗？我不想一直拽衣服。'
    ],
    neutral: [
      '嗯，我再看看。',
      '这件先放一边。',
      '还有别的吗？',
      '我有点挑不出来。'
    ]
  };
})();
