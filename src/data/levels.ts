export type NodeType = 'character' | 'item' | 'poem' | 'place';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  x: number; // initial relative x (0-100)
  y: number; // initial relative y (0-100)
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export interface DialogueLine {
  role: string;
  content: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // 0, 1, 2, 3
}

export interface Level {
  id: number;
  title: string;
  description: string;
  storyScript: DialogueLine[];
  nodes?: GraphNode[];
  edges?: GraphEdge[]; // The correct answers for graph levels
  relationOptions?: string[]; // Options presented to the player
  questions?: QuizQuestion[]; // For quiz levels
  type: 'graph' | 'quiz';
}

export const levels: Level[] = [
  {
    id: 1,
    title: "初识图谱：唐代诗人朋友圈",
    type: 'graph',
    description: "知识图谱是用‘节点’和‘连线’来表示事物之间关系的网络。让我们先来看看唐代诗人们的关系吧！",
    storyScript: [
      { role: "旁白", content: "唐朝可是古代诗人们的“大聚会”！那时候的诗人最喜欢互相写诗、交朋友了。" },
      { role: "杜甫", content: "李白大哥真是太酷了！我得写首诗送给他：‘秋收之后我想念李兄，我的诗写得不如他，真不好意思呢。’" },
      { role: "李白", content: "（哈哈大笑）杜老弟太客气啦！来来来，我也回赠你一首。咱们这些写诗的人，就是要互相欣赏嘛！" },
      { role: "旁白", content: "过了很多年后，又出现了一位叫白居易的小粉丝。" },
      { role: "白居易", content: "我小时候就是读着李白爷爷的诗长大的。虽然他不在了，但我可以去他的墓前读诗给他听，他一定能感受到的！" }
    ],
    nodes: [
      { id: "libai", label: "李白", type: "character", x: 20, y: 30 },
      { id: "dufu", label: "杜甫", type: "character", x: 80, y: 30 },
      { id: "baijuyi", label: "白居易", type: "character", x: 50, y: 80 },
    ],
    edges: [
      { source: "dufu", target: "libai", label: "崇拜" },
      { source: "libai", target: "dufu", label: "好友" },
    ],
    relationOptions: ["好友", "崇拜", "师徒", "敌人"],
  },
  {
    id: 2,
    title: "西游取经：师徒与法宝",
    type: 'graph',
    description: "西游记里不仅有师徒四人，还有厉害的武器、坐骑，甚至还有约束悟空的‘紧箍儿’！快来构建完整的关系图！",
    storyScript: [
      { role: "唐僧", content: "悟空，咱们路途遥远。为师穿着观音菩萨送的‘锦襕袈裟’，骑着‘白龙马’，总算能走稳一些。" },
      { role: "孙悟空", content: "师父放心！俺老孙手里这根‘如意金箍棒’，可是东海龙宫的宝贝！不过……哎哟，头上这‘紧箍儿’又紧了！" },
      { role: "猪八戒", content: "猴哥，我的‘九齿钉耙’也不弱呀，这可是太上老君爷爷亲自打造的，重着呢！" },
      { role: "沙和尚", content: "二哥莫夸口，我的‘降妖宝杖’虽然沉稳，保护师父也是妥妥的。" },
      { role: "旁白", content: "师徒、坐骑、法宝，这些节点连在一起，就是一个完整的西游世界！" }
    ],
    nodes: [
      { id: "tangseng", label: "唐僧", type: "character", x: 50, y: 50 },
      { id: "wukong", label: "孙悟空", type: "character", x: 20, y: 30 },
      { id: "bajie", label: "猪八戒", type: "character", x: 80, y: 30 },
      { id: "shaseng", label: "沙和尚", type: "character", x: 50, y: 15 },
      { id: "jinbubang", label: "如意金箍棒", type: "item", x: 15, y: 60 },
      { id: "dingpa", label: "九齿钉耙", type: "item", x: 85, y: 60 },
      { id: "baozhang", label: "降妖宝杖", type: "item", x: 50, y: 85 },
      { id: "jiasha", label: "锦襕袈裟", type: "item", x: 35, y: 40 },
      { id: "bailongma", label: "白龙马", type: "character", x: 65, y: 40 },
      { id: "jingu", label: "紧箍儿", type: "item", x: 20, y: 10 },
    ],
    edges: [
      { source: "wukong", target: "tangseng", label: "徒弟" },
      { source: "bajie", target: "tangseng", label: "徒弟" },
      { source: "shaseng", target: "tangseng", label: "徒弟" },
      { source: "wukong", target: "jinbubang", label: "使用" },
      { source: "bajie", target: "dingpa", label: "使用" },
      { source: "shaseng", target: "baozhang", label: "使用" },
      { source: "tangseng", target: "jiasha", label: "穿戴" },
      { source: "tangseng", target: "bailongma", label: "骑乘" },
      { source: "wukong", target: "jingu", label: "戴着" },
      { source: "tangseng", target: "jingu", label: "控制" },
    ],
    relationOptions: ["徒弟", "使用", "穿戴", "骑乘", "戴着", "控制", "师父"],
  },
  {
    id: 3,
    title: "桃园结义：三国风云",
    type: 'graph',
    description: "《三国演义》中经典的结义情，刘关张的关系网是怎样的呢？",
    storyScript: [
      { role: "刘备", content: "关二弟、张三弟，咱们就在这满屋子的桃花下结成兄弟。以后谁有困难，咱们都一起帮！" },
      { role: "关羽", content: "大哥放心，以后我关羽一定保护好大哥，绝不后退一步！" },
      { role: "张飞", content: "我也是！大哥、二哥，咱们喝了这碗酒，从此就是亲兄弟啦！" },
      { role: "旁白", content: "桃花飞舞，刘备、关羽、张飞成了最好的结拜兄弟，一起去闯天下！" }
    ],
    nodes: [
      { id: "liubei", label: "刘备", type: "character", x: 50, y: 20 },
      { id: "guanyu", label: "关羽", type: "character", x: 20, y: 70 },
      { id: "zhangfei", label: "张飞", type: "character", x: 80, y: 70 },
      { id: "shuguo", label: "蜀汉", type: "place", x: 50, y: 50 },
    ],
    edges: [
      { source: "liubei", target: "guanyu", label: "结拜兄弟" },
      { source: "liubei", target: "zhangfei", label: "结拜兄弟" },
      { source: "guanyu", target: "zhangfei", label: "结拜兄弟" },
      { source: "liubei", target: "shuguo", label: "君主" },
      { source: "guanyu", target: "shuguo", label: "臣子" },
      { source: "zhangfei", target: "shuguo", label: "臣子" },
    ],
    relationOptions: ["结拜兄弟", "君主", "臣子", "敌人", "路人"],
  },
  {
    id: 4,
    title: "梁山聚义：水浒英雄",
    type: 'graph',
    description: "《水浒传》一百单八将！我们来看看这几位核心人物的关系图谱。",
    storyScript: [
      { role: "宋江", content: "各位好兄弟，我是宋江。咱们梁山泊就是大家的家，以后大家都是相亲相爱的一家人！" },
      { role: "吴用", content: "宋江哥哥，我吴用最爱出主意了，以后我就是咱们梁山的小军师。" },
      { role: "李逵", content: "虽然我有时候傻，但我最听宋大哥的话了！谁欺负哥哥，我就用斧头教训他！" },
      { role: "旁白", content: "在这个叫梁山的地方，108位英雄好汉聚在了一起，像织网一样连成了一个大家庭。" }
    ],
    nodes: [
      { id: "songjiang", label: "宋江", type: "character", x: 50, y: 20 },
      { id: "wuyong", label: "吴用", type: "character", x: 20, y: 50 },
      { id: "likui", label: "李逵", type: "character", x: 80, y: 50 },
      { id: "liangshan", label: "梁山泊", type: "place", x: 50, y: 80 },
    ],
    edges: [
      { source: "songjiang", target: "liangshan", label: "首领" },
      { source: "wuyong", target: "liangshan", label: "军师" },
      { source: "likui", target: "liangshan", label: "头领" },
      { source: "songjiang", target: "likui", label: "主仆/兄弟" },
      { source: "songjiang", target: "wuyong", label: "搭档" },
    ],
    relationOptions: ["首领", "军师", "头领", "主仆/兄弟", "搭档", "敌人"],
  },
  {
    id: 5,
    title: "红楼遗梦：贾府缩影",
    type: 'graph',
    description: "《红楼梦》庞大的人物关系网中，宝黛钗的纠葛是核心之一。",
    storyScript: [
      { role: "贾母", content: "哎哟我的宝贝黛玉，快来外祖母身边。宝玉，你要多照顾一下这位新来的妹妹呀。" },
      { role: "林黛玉", content: "（很有礼貌地行礼）谢谢外祖母。以后我也能在这漂亮的大院子里和大家一起玩吗？" },
      { role: "贾宝玉", content: "（眼睛亮闪闪的）这位妹妹看起来好亲切呀，感觉以前在哪儿见过一样！" },
      { role: "薛宝钗", content: "（温柔地笑着）宝玉别乱开玩笑。林妹妹，以后咱们就是好伙伴了，有空一起看书写字呀。" },
      { role: "旁白", content: "在一个叫贾府的大房子里，住着好多好多的人。他们之间的故事，就像这张复杂的图谱一样精彩。" }
    ],
    nodes: [
      { id: "baoyu", label: "贾宝玉", type: "character", x: 50, y: 50 },
      { id: "daiyu", label: "林黛玉", type: "character", x: 20, y: 20 },
      { id: "baochai", label: "薛宝钗", type: "character", x: 80, y: 20 },
      { id: "jiamu", label: "贾母", type: "character", x: 50, y: 80 },
      { id: "jiafu", label: "贾府", type: "place", x: 15, y: 70 },
    ],
    edges: [
      { source: "jiamu", target: "baoyu", label: "祖孙" },
      { source: "jiamu", target: "daiyu", label: "祖孙" },
      { source: "baoyu", target: "daiyu", label: "木石前盟" },
      { source: "baoyu", target: "baochai", label: "金玉良缘" },
      { source: "jiamu", target: "jiafu", label: "最高权威" },
      { source: "baoyu", target: "jiafu", label: "少爷" },
    ],
    relationOptions: ["祖孙", "表兄妹", "木石前盟", "金玉良缘", "最高权威", "少爷", "兄妹"],
  },
  {
    id: 6,
    title: "生活应用：我的超级大家庭",
    type: 'graph',
    description: "知识图谱也可以用来整理我们的家谱！看看乐乐一家人的关系吧。",
    storyScript: [
      { role: "乐乐", content: "爸爸妈妈，我发现我、爷爷、奶奶，还有你们，就像一个大网格一样连在一起！" },
      { role: "妈妈", content: "是呀乐乐，这就是我们的‘家谱图谱’。你看，爸爸是爷爷的儿子，我是你的妈妈。" },
      { role: "旁白", content: "家谱就是一种最常见的知识图谱。它让我们清晰地看到每一个家人的身份。" }
    ],
    nodes: [
      { id: "lele", label: "你的名字", type: "character", x: 50, y: 15 },
      { id: "baba", label: "你爸爸的名字", type: "character", x: 25, y: 45 },
      { id: "mama", label: "妈妈", type: "character", x: 75, y: 45 },
      { id: "yeye", label: "爷爷", type: "character", x: 15, y: 80 },
      { id: "nainai", label: "奶奶", type: "character", x: 35, y: 80 },
    ],
    edges: [
      { source: "lele", target: "baba", label: "父子" },
      { source: "lele", target: "mama", label: "母子" },
      { source: "baba", target: "yeye", label: "父子" },
      { source: "baba", target: "nainai", label: "母子" },
    ],
    relationOptions: ["父子", "母子", "兄妹", "邻居", "敌人"],
  },
  {
    id: 7,
    title: "终极挑战：知识图谱大考验",
    type: 'quiz',
    description: "学了这么多，你真的了解知识图谱了吗？来试试这15道挑战题吧！",
    storyScript: [
      { role: "旁白", content: "欢迎来到‘图谱博士’的小课堂。这里有15道关于知识图谱的小秘密，只有最细心的小朋友才能全部答对哦！准备好了吗？点击开始挑战吧！" }
    ],
    questions: [
      { question: "什么是知识图谱？", options: ["一张普通的画", "表达事物关系的网", "一本厚厚的书", "一个电子玩具"], answer: 1 },
      { question: "知识图谱中的“节点”通常代表什么？", options: ["连接线", "具体的事物或人", "背景颜色", "好听的声音"], answer: 1 },
      { question: "知识图谱中的“连线”代表什么？", options: ["事物之间的关系", "马路上的道路", "晾衣服的绳子", "两点间的距离"], answer: 0 },
      { question: "在“唐僧师徒”的图谱中，谁处于师父这个位置？", options: ["孙悟空", "猪八戒", "唐僧", "沙和尚"], answer: 2 },
      { question: "如果我们要表示“苹果属于水果”，它们之间该用什么连线？", options: ["敌人", "属于", "喜欢", "朋友"], answer: 1 },
      { question: "知识图谱最大的用处是可以帮我们？", options: ["梳理复杂的关系", "练习写漂亮的字", "学习如何跑步", "画一张自画像"], answer: 0 },
      { question: "在西游记图谱中，金箍棒这个“节点”和谁连在一起？", options: ["唐僧", "孙悟空", "老龙王", "白骨精"], answer: 1 },
      { question: "下面哪种情况最适合写成知识图谱？", options: ["写一篇优美的作文", "记录家族亲戚的关系", "记录今天的午餐吃什么", "数一数家里有几个苹果"], answer: 1 },
      { question: "知识图谱中的连线通常用来表示？", options: ["谁是谁的什么关系", "哪里路最宽", "谁的力气最大", "谁长得最高"], answer: 0 },
      { question: "“刘备”和“张飞”在三国图谱中的连线标签是？", options: ["邻居", "结拜兄弟", "陌生人", "父子"], answer: 1 },
      { question: "贾宝玉和林黛玉在红楼梦图谱中都住在哪？", options: ["贾府", "大圣的小屋", "美丽的原始森林", "一艘大海船上"], answer: 0 },
      { question: "智能超市用知识图谱管理商品是为了？", options: ["让货架更好看", "方便分类和寻找商品", "增加超市的电费", "让苹果自动跳舞"], answer: 1 },
      { question: "建立一个简单的知识图谱，第一步通常是？", options: ["确定所有的节点（事物）", "闭上眼睛随便画线", "给纸张涂满颜色", "把草稿纸撕掉"], answer: 0 },
      { question: "在一个知识图谱里，节点可以有多少个？", options: ["只能有一个", "最多只能有五个", "根据需要可以有很多个", "必须是双数才可以"], answer: 2 },
      { question: "学习建立知识图谱主要能提高我们的？", options: ["跑步速度", "逻辑思维和梳理能力", "吃饭的胃口", "打球的技术"], answer: 1 }
    ]
  }
];
