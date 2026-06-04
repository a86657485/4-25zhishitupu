import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Check,
  Heart,
  Link2,
  MapPin,
  Package,
  RefreshCw,
  Sparkles,
  Trophy,
  User,
  X,
  Zap,
} from 'lucide-react';

interface BonusGameProps {
  onClose: () => void;
}

type NodeKind = 'character' | 'item' | 'place' | 'work';
type GameScreen = 'start' | 'playing' | 'end';

interface FruitOption {
  label: string;
  kind: NodeKind;
}

interface SliceChallenge {
  source: string;
  sourceKind: NodeKind;
  relation: string;
  answer: string;
  answerKind: NodeKind;
  options: FruitOption[];
  explanation: string;
}

interface SavedEdge {
  source: string;
  relation: string;
  target: string;
}

const kindConfig = {
  character: { label: '人物', color: '#60a5fa', icon: User, glow: 'shadow-blue-500/25' },
  item: { label: '物品', color: '#f59e0b', icon: Package, glow: 'shadow-amber-500/25' },
  place: { label: '地点', color: '#34d399', icon: MapPin, glow: 'shadow-emerald-500/25' },
  work: { label: '作品', color: '#c084fc', icon: BookOpen, glow: 'shadow-purple-500/25' },
} satisfies Record<NodeKind, {
  label: string;
  color: string;
  icon: React.ElementType;
  glow: string;
}>;

const challenges: SliceChallenge[] = [
  {
    source: '孙悟空',
    sourceKind: 'character',
    relation: '使用',
    answer: '金箍棒',
    answerKind: 'item',
    options: [
      { label: '金箍棒', kind: 'item' },
      { label: '贾府', kind: 'place' },
      { label: '《春望》', kind: 'work' },
      { label: '林黛玉', kind: 'character' },
    ],
    explanation: '金箍棒是孙悟空使用的法宝，这条边是“人物 -> 使用 -> 物品”。',
  },
  {
    source: '唐僧',
    sourceKind: 'character',
    relation: '骑乘',
    answer: '白龙马',
    answerKind: 'item',
    options: [
      { label: '梁山泊', kind: 'place' },
      { label: '白龙马', kind: 'item' },
      { label: '刘备', kind: 'character' },
      { label: '《静夜思》', kind: 'work' },
    ],
    explanation: '唐僧骑乘白龙马，关系标签要说明两个节点怎样相连。',
  },
  {
    source: '李白',
    sourceKind: 'character',
    relation: '创作',
    answer: '《静夜思》',
    answerKind: 'work',
    options: [
      { label: '《静夜思》', kind: 'work' },
      { label: '九齿钉耙', kind: 'item' },
      { label: '大观园', kind: 'place' },
      { label: '猪八戒', kind: 'character' },
    ],
    explanation: '人物和作品之间可以用“创作”连接。',
  },
  {
    source: '杜甫',
    sourceKind: 'character',
    relation: '好友',
    answer: '李白',
    answerKind: 'character',
    options: [
      { label: '赤壁', kind: 'place' },
      { label: '紧箍儿', kind: 'item' },
      { label: '李白', kind: 'character' },
      { label: '《西游记》', kind: 'work' },
    ],
    explanation: '李白和杜甫都可以作为人物节点，用“好友”关系相连。',
  },
  {
    source: '刘备',
    sourceKind: 'character',
    relation: '结拜兄弟',
    answer: '张飞',
    answerKind: 'character',
    options: [
      { label: '张飞', kind: 'character' },
      { label: '金箍棒', kind: 'item' },
      { label: '长安', kind: 'place' },
      { label: '《红楼梦》', kind: 'work' },
    ],
    explanation: '刘备、关羽、张飞是桃园结义的兄弟关系。',
  },
  {
    source: '宋江',
    sourceKind: 'character',
    relation: '首领',
    answer: '梁山泊',
    answerKind: 'place',
    options: [
      { label: '《将进酒》', kind: 'work' },
      { label: '梁山泊', kind: 'place' },
      { label: '林黛玉', kind: 'character' },
      { label: '袈裟', kind: 'item' },
    ],
    explanation: '地点也能成为节点，宋江和梁山泊之间可以连“首领”。',
  },
  {
    source: '贾宝玉',
    sourceKind: 'character',
    relation: '居住',
    answer: '贾府',
    answerKind: 'place',
    options: [
      { label: '孙悟空', kind: 'character' },
      { label: '《春望》', kind: 'work' },
      { label: '贾府', kind: 'place' },
      { label: '借书证', kind: 'item' },
    ],
    explanation: '贾府是地点节点，能承载人物居住、生活等关系。',
  },
  {
    source: '小明',
    sourceKind: 'character',
    relation: '借阅',
    answer: '《西游记》',
    answerKind: 'work',
    options: [
      { label: '图书馆', kind: 'place' },
      { label: '《西游记》', kind: 'work' },
      { label: '金箍棒', kind: 'item' },
      { label: '杜甫', kind: 'character' },
    ],
    explanation: '生活场景也能建图谱：小明借阅《西游记》。',
  },
  {
    source: '小明',
    sourceKind: 'character',
    relation: '使用',
    answer: '借书证',
    answerKind: 'item',
    options: [
      { label: '借书证', kind: 'item' },
      { label: '梁山泊', kind: 'place' },
      { label: '李白', kind: 'character' },
      { label: '《静夜思》', kind: 'work' },
    ],
    explanation: '同一个人物节点可以通过不同关系连接多个节点。',
  },
  {
    source: '图书馆',
    sourceKind: 'place',
    relation: '收藏',
    answer: '《西游记》',
    answerKind: 'work',
    options: [
      { label: '猪八戒', kind: 'character' },
      { label: '《西游记》', kind: 'work' },
      { label: '白龙马', kind: 'item' },
      { label: '赤壁', kind: 'place' },
    ],
    explanation: '地点和作品也可以建立关系，比如图书馆收藏某本书。',
  },
];

const fruitPositions = [
  { left: 17, endTop: 38, rotate: -9, duration: 2.4 },
  { left: 39, endTop: 28, rotate: 7, duration: 2.15 },
  { left: 62, endTop: 40, rotate: -6, duration: 2.3 },
  { left: 82, endTop: 52, rotate: 10, duration: 2.55 },
];

const fruitSkins = [
  { icon: '🍎', bg: 'from-red-400 via-rose-500 to-red-700', shine: 'bg-red-100/50' },
  { icon: '🍊', bg: 'from-orange-300 via-orange-500 to-amber-700', shine: 'bg-orange-100/50' },
  { icon: '🍐', bg: 'from-lime-300 via-green-500 to-emerald-700', shine: 'bg-lime-100/50' },
  { icon: '🍇', bg: 'from-purple-300 via-violet-500 to-fuchsia-800', shine: 'bg-purple-100/50' },
];

const MISS_TIMEOUT_MS = 7000;

export const BonusGame: React.FC<BonusGameProps> = ({ onClose }) => {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [slicedLabels, setSlicedLabels] = useState<string[]>([]);
  const [savedEdges, setSavedEdges] = useState<SavedEdge[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'good' | 'bad'; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [roundId, setRoundId] = useState(0);
  const fruitRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const arenaRef = useRef<HTMLElement | null>(null);
  const current = challenges[challengeIndex];

  const progress = useMemo(() => {
    return ((challengeIndex + (slicedLabels.includes(current?.answer) ? 1 : 0)) / challenges.length) * 100;
  }, [challengeIndex, current?.answer, slicedLabels]);

  const startGame = () => {
    setScreen('playing');
    setChallengeIndex(0);
    setScore(0);
    setLives(3);
    setCombo(0);
    setSlicedLabels([]);
    setSavedEdges([]);
    setFeedback(null);
    setTrail([]);
    setRoundId(prev => prev + 1);
  };

  const finishGame = () => {
    setScreen('end');
    confetti({ particleCount: 180, spread: 80, origin: { y: 0.65 } });
  };

  const nextChallenge = () => {
    setSlicedLabels([]);
    setFeedback(null);
    setRoundId(prev => prev + 1);
    if (challengeIndex < challenges.length - 1) {
      setChallengeIndex(prev => prev + 1);
    } else {
      finishGame();
    }
  };

  const loseLife = (text: string) => {
    const nextLives = lives - 1;
    setLives(nextLives);
    setCombo(0);
    setFeedback({ type: 'bad', text });

    if (nextLives <= 0) {
      window.setTimeout(() => {
        setFeedback({ type: 'bad', text: '三条生命用完，挑战自动重新开始。' });
        window.setTimeout(startGame, 750);
      }, 700);
      return;
    }

    window.setTimeout(() => {
      setSlicedLabels([]);
      setFeedback(null);
      setRoundId(prev => prev + 1);
    }, 950);
  };

  useEffect(() => {
    if (screen !== 'playing' || !current || feedback) return;

    const timer = window.setTimeout(() => {
      if (!slicedLabels.includes(current.answer)) {
        loseLife(`没切到正确水果“${current.answer}”，扣除一条生命。`);
      }
    }, MISS_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [screen, challengeIndex, roundId, feedback, current, slicedLabels]);

  const sliceOption = (option: FruitOption) => {
    if (screen !== 'playing' || slicedLabels.includes(option.label) || feedback?.type === 'good') return;

    if (option.label === current.answer) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setScore(prev => prev + 220 + nextCombo * 35);
      setSlicedLabels(prev => [...prev, option.label]);
      setSavedEdges(prev => [...prev, { source: current.source, relation: current.relation, target: current.answer }]);
      setFeedback({ type: 'good', text: current.explanation });
      confetti({ particleCount: 55, spread: 58, origin: { y: 0.55 }, colors: ['#fbbf24', '#34d399', '#60a5fa'] });
      window.setTimeout(nextChallenge, 1050);
      return;
    }

    setSlicedLabels(prev => [...prev, option.label]);
    loseLife(`${option.label} 不能补全“${current.source} ${current.relation} ?”，扣除一条生命。`);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || screen !== 'playing') return;

    const point = { x: event.clientX, y: event.clientY };
    const arenaRect = arenaRef.current?.getBoundingClientRect();
    if (arenaRect) {
      setTrail(prev => [
        ...prev.slice(-6),
        { x: point.x - arenaRect.left, y: point.y - arenaRect.top },
      ]);
    }

    current.options.forEach(option => {
      const element = fruitRefs.current[option.label];
      if (!element || slicedLabels.includes(option.label)) return;

      const rect = element.getBoundingClientRect();
      const hit = point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
      if (hit) sliceOption(option);
    });
  };

  const renderNodeBadge = (label: string, kind: NodeKind) => {
    const config = kindConfig[kind];
    const Icon = config.icon;

    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/28 px-4 py-2 font-serif text-sm text-white">
        <Icon size={15} style={{ color: config.color }} />
        {label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#07100f] text-[#E0D8D0]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,_rgba(245,158,11,0.18)_0%,_transparent_32%),radial-gradient(circle_at_80%_80%,_rgba(52,211,153,0.18)_0%,_transparent_36%),linear-gradient(135deg,_#07100f_0%,_#141014_54%,_#070b13_100%)]" />

      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/55 transition-colors hover:border-amber-400/40 hover:text-white"
        aria-label="关闭小游戏"
      >
        <X size={22} />
      </button>

      <AnimatePresence mode="wait">
        {screen === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
          >
            <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-amber-400/40 bg-amber-500/15 shadow-[0_0_45px_rgba(245,158,11,0.2)]">
              <Zap size={48} className="text-amber-300" />
            </div>
            <h1 className="mb-4 font-serif text-4xl text-amber-100 md:text-5xl">知识飞果</h1>
            <p className="mb-8 max-w-xl font-serif text-base leading-relaxed text-white/62 md:text-lg">
              关系式出现后，切中能补全图谱的节点。切对会生成一条关系边，切错会损失能量。
            </p>
            <div className="mb-9 grid max-w-2xl gap-3 text-left text-sm text-white/52 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">看清源节点和关系词</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">用鼠标或手指划过正确飞果</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">把正确关系收入图谱档案</div>
            </div>
            <button
              onClick={startGame}
              className="inline-flex items-center gap-3 rounded-full bg-amber-500 px-9 py-4 text-sm font-bold tracking-widest text-black shadow-[0_0_26px_rgba(245,158,11,0.3)] transition-all hover:bg-amber-400 active:scale-95"
            >
              <Sparkles size={18} /> 开始切图谱
            </button>
          </motion.div>
        )}

        {screen === 'playing' && current && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex min-h-screen flex-col p-5 md:p-8"
            onPointerDown={event => {
              setIsDragging(true);
              const arenaRect = arenaRef.current?.getBoundingClientRect();
              setTrail(arenaRect
                ? [{ x: event.clientX - arenaRect.left, y: event.clientY - arenaRect.top }]
                : []);
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={() => {
              setIsDragging(false);
              window.setTimeout(() => setTrail([]), 130);
            }}
            onPointerCancel={() => {
              setIsDragging(false);
              setTrail([]);
            }}
          >
            <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
                  <Zap size={14} /> 第 {challengeIndex + 1} / {challenges.length} 刀
                </div>
                <h2 className="font-serif text-2xl text-amber-100 md:text-3xl">切中正确节点，补全关系边</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">得分</div>
                  <div className="font-serif text-2xl text-white tabular-nums">{score}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300">连切</div>
                  <div className="font-serif text-2xl text-white tabular-nums">x{combo}</div>
                </div>
                <div className="flex rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-red-300">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Heart key={index} size={18} fill={index < lives ? 'currentColor' : 'transparent'} className={index < lives ? '' : 'opacity-30'} />
                  ))}
                </div>
              </div>
            </header>

            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-300 to-blue-400"
                animate={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>

            <main className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.75fr)]">
              <section ref={arenaRef} className="relative min-h-[430px] overflow-hidden rounded-2xl border border-white/10 bg-black/24 pb-36">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:34px_34px] opacity-[0.06]" />

                <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full">
                  {trail.length > 1 && (
                    <motion.polyline
                      points={trail.map(point => `${point.x},${point.y}`).join(' ')}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.86"
                    />
                  )}
                </svg>

                {current.options.map((option, index) => {
                  const config = kindConfig[option.kind];
                  const position = fruitPositions[index];
                  const fruit = fruitSkins[index % fruitSkins.length];
                  const isSliced = slicedLabels.includes(option.label);

                  return (
                    <motion.button
                      key={`${challengeIndex}-${roundId}-${option.label}`}
                      ref={element => {
                        fruitRefs.current[option.label] = element;
                      }}
                      initial={{ opacity: 0, top: '-18%', scale: 0.72, rotate: position.rotate - 18 }}
                      animate={{
                        opacity: isSliced ? 0 : 1,
                        top: isSliced ? `${position.endTop}%` : ['-18%', `${position.endTop}%`, `${position.endTop}%`, '112%'],
                        y: isSliced ? -22 : [0, -8, -8, 18],
                        scale: isSliced ? 1.45 : 1,
                        rotate: isSliced ? position.rotate + 38 : [position.rotate - 14, position.rotate + 10, position.rotate],
                      }}
                      transition={{
                        top: {
                          duration: isSliced ? 0.25 : position.duration + 3.8,
                          delay: isSliced ? 0 : index * 0.16,
                          ease: ['easeOut', 'linear', 'easeIn'],
                          times: isSliced ? undefined : [0, 0.34, 0.66, 1],
                        },
                        y: { duration: isSliced ? 0.25 : position.duration + 3.8, delay: isSliced ? 0 : index * 0.16, ease: 'easeInOut', times: isSliced ? undefined : [0, 0.34, 0.66, 1] },
                        rotate: { duration: 1.2, repeat: isSliced ? 0 : Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                        opacity: { duration: isSliced ? 0.25 : 0.3 },
                        scale: { duration: isSliced ? 0.25 : 0.35 },
                      }}
                      onClick={event => {
                        event.stopPropagation();
                        sliceOption(option);
                      }}
                      disabled={isSliced || feedback?.type === 'good'}
                      className={`absolute z-20 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/20 bg-gradient-to-br ${fruit.bg} p-2 text-center shadow-2xl ${config.glow} transition-transform hover:scale-105 active:scale-95 md:h-32 md:w-32`}
                      style={{ left: `${position.left}%` }}
                    >
                      <span className={`absolute left-5 top-4 h-5 w-8 rounded-full blur-[1px] ${fruit.shine}`} />
                      <span className="text-4xl leading-none drop-shadow-md md:text-5xl">{fruit.icon}</span>
                      <span className="mt-2 max-w-[92px] rounded-full bg-black/42 px-2 py-1 text-balance font-serif text-xs leading-tight text-white shadow-lg">
                        {option.label}
                      </span>
                      <span className="mt-1 rounded-full bg-black/24 px-2 py-0.5 text-[9px] text-white/70">{config.label}</span>
                    </motion.button>
                  );
                })}

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.96 }}
                      className={`absolute bottom-40 left-1/2 z-40 w-[min(92%,620px)] -translate-x-1/2 rounded-2xl border px-5 py-4 text-sm leading-relaxed shadow-2xl backdrop-blur-md ${
                        feedback.type === 'good'
                          ? 'border-emerald-300/35 bg-emerald-500/16 text-emerald-50'
                          : 'border-red-300/35 bg-red-500/16 text-red-50'
                      }`}
                    >
                      {feedback.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute bottom-4 left-1/2 z-20 w-[min(94%,760px)] -translate-x-1/2 rounded-3xl border border-amber-400/30 bg-[#10100d]/92 p-4 text-center shadow-2xl backdrop-blur-md md:p-5">
                  <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">看题目，切正确水果</div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {renderNodeBadge(current.source, current.sourceKind)}
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-black">
                      <Link2 size={15} /> {current.relation}
                    </span>
                    <span className="rounded-full border border-dashed border-white/30 px-5 py-2 font-serif text-sm text-white/70">?</span>
                  </div>
                </div>
              </section>

              <aside className="flex min-h-[430px] flex-col rounded-2xl border border-white/10 bg-[#111111]/90 p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">图谱档案</div>
                    <h3 className="mt-1 font-serif text-xl text-white">已切出的关系边</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-300">
                    <Check size={20} />
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {savedEdges.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-sm leading-relaxed text-white/35">
                      切中正确飞果后，关系边会收进这里。
                    </div>
                  ) : (
                    savedEdges.map((edge, index) => (
                      <motion.div
                        key={`${edge.source}-${edge.relation}-${edge.target}-${index}`}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2 font-serif text-sm text-white">
                          <span>{edge.source}</span>
                          <span className="rounded-full bg-amber-400/15 px-2 py-1 text-xs text-amber-200">{edge.relation}</span>
                          <span>{edge.target}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/24 p-4 text-xs leading-relaxed text-white/45">
                  小提示：知识图谱不是只连起来就够了，关系标签要能准确说明两个节点之间发生了什么。
                </div>
              </aside>
            </main>
          </motion.div>
        )}

        {screen === 'end' && (
          <motion.div
            key="end"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            className="relative z-10 flex min-h-screen items-center justify-center px-6"
          >
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111111]/92 p-8 text-center shadow-2xl">
              <div className="mx-auto mb-6 flex h-20 w-20 rotate-3 items-center justify-center rounded-3xl border border-amber-400/45 bg-amber-400/15">
                <Trophy size={40} className="text-amber-300" />
              </div>
              <h2 className="mb-2 font-serif text-3xl text-amber-100">飞果图谱完成</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/55">
                你切出了 {savedEdges.length} 条关系边。每一刀都在练习“节点 + 关系 + 节点”的图谱思维。
              </p>
              <div className="mb-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">最终分数</div>
                  <div className="mt-1 font-serif text-4xl text-white">{score}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">剩余能量</div>
                  <div className="mt-1 font-serif text-4xl text-white">{lives}</div>
                </div>
              </div>
              <div className="grid gap-3">
                <button
                  onClick={startGame}
                  className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold tracking-widest text-black transition-colors hover:bg-emerald-400"
                >
                  <RefreshCw size={18} /> 再切一次
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold tracking-widest text-white transition-colors hover:bg-white/10"
                >
                  返回关卡表
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
