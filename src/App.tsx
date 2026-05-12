import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { levels, Level, GraphEdge, GraphNode } from './data/levels';
import { GameCanvas } from './components/GameCanvas';
import { BookOpen, Map, Sparkles, Play, ChevronRight, Unlock, ArrowRight, ArrowLeft, Settings } from 'lucide-react';

export interface GraphSaveData {
  edges: GraphEdge[];
  nodes: GraphNode[];
  nodePositions: Record<string, { x: number; y: number }>;
}

type AppState = 'intro' | 'map' | 'story' | 'game' | 'success';

function ScriptReader({ script, onComplete }: { script: { role: string; content: string }[], onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const currentLine = script[currentIndex];

  useEffect(() => {
    setDisplayText("");
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < currentLine.content.length) {
        setDisplayText((prev) => prev + currentLine.content.charAt(i));
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [currentIndex, currentLine.content]);

  const next = () => {
    if (isTyping) {
      setDisplayText(currentLine.content);
      setIsTyping(false);
      return;
    }
    if (currentIndex < script.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="flex flex-col h-full justify-center max-w-2xl mx-auto px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="relative"
        >
          {currentLine.role !== '旁白' && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-amber-500 rotate-45"></div>
              <span className="text-amber-500 font-bold text-sm tracking-widest">{currentLine.role}</span>
            </div>
          )}
          
          <div className={`p-8 rounded-3xl font-serif text-2xl leading-relaxed shadow-2xl border border-white/5 relative bg-[#1A1A1A]/80 backdrop-blur-sm ${
            currentLine.role === '旁白' 
              ? 'italic text-amber-100/60 text-center border-amber-500/10' 
              : 'text-[#E0D8D0] after:content-[""] after:absolute after:left-10 after:-top-3 after:w-6 after:h-6 after:bg-[#1A1A1A] after:border-t after:border-l after:border-white/5 after:rotate-45'
          }`}>
            {displayText}
            {isTyping && <span className="inline-block w-1 h-6 bg-amber-500 ml-1 animate-pulse align-middle"></span>}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-12">
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          className={`px-6 py-2 rounded-full border border-white/10 text-xs tracking-widest transition-all ${
            currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-white/5 opacity-40 hover:opacity-100'
          }`}
        >
          上一页
        </button>
        
        <div className="flex gap-2">
          {script.map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? 'bg-amber-500 w-4' : 'bg-white/10'}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="flex items-center gap-2 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black rounded-full font-bold text-sm shadow-lg shadow-amber-900/20 transition-all active:scale-95 group"
        >
          {currentIndex === script.length - 1 ? '开始挑战' : '点击继续'}
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function QuizView({ questions, onComplete }: { questions: any[], onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];

  const handleOptionClick = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    const correct = index === currentQuestion.answer;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        onComplete();
      }
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-6 pt-10">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <span className="text-amber-500 font-bold text-xs uppercase tracking-widest block mb-2">问题 {currentIndex + 1} / {questions.length}</span>
          <h3 className="text-2xl font-serif text-[#E0D8D0]">{currentQuestion.question}</h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase opacity-40 block">得分</span>
          <span className="text-2xl font-serif text-amber-500">{score}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {currentQuestion.options.map((option: string, i: number) => {
          const isSelected = selectedOption === i;
          const isWrong = isSelected && !isCorrect;
          const isRight = (isSelected && isCorrect) || (selectedOption !== null && i === currentQuestion.answer);

          return (
            <motion.button
              key={i}
              whileHover={selectedOption === null ? { x: 10 } : {}}
              onClick={() => handleOptionClick(i)}
              className={`p-6 rounded-2xl border text-left transition-all relative ${
                selectedOption === null 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-amber-500/50' 
                  : isRight 
                    ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                    : isWrong 
                      ? 'bg-red-500/20 border-red-500/50 text-red-400'
                      : 'bg-white/5 border-white/5 opacity-40'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full border border-current flex items-center justify-center text-sm font-bold uppercase">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-lg font-serif">{option}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-12 w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-amber-500" 
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('intro');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [completedGraphs, setCompletedGraphs] = useState<Record<number, GraphSaveData>>({});
  const [readingTimeLeft, setReadingTimeLeft] = useState<number>(15);
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
  const [testPassword, setTestPassword] = useState('');
  const [isAuthTest, setIsAuthTest] = useState(false);

  const currentLevel = levels.find(l => l.id === currentLevelId) || levels[0];

  useEffect(() => {
    if (appState === 'story') {
      setReadingTimeLeft(15);
      const timer = setInterval(() => {
        setReadingTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [appState, currentLevelId]);

  const handleLevelComplete = (graphData?: GraphSaveData) => {
    if (graphData) {
      setCompletedGraphs(prev => ({
        ...prev,
        [currentLevelId]: graphData
      }));
    }
    if (!unlockedLevels.includes(currentLevelId + 1) && currentLevelId < levels.length) {
      setUnlockedLevels(prev => [...prev, currentLevelId + 1]);
    }
    setAppState('success');
  };

  return (
    <div className="w-full h-screen bg-[#0F0F0F] text-[#E0D8D0] font-sans flex flex-col overflow-hidden relative">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/10 bg-[#0F0F0F]/80 backdrop-blur-md z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-700 flex items-center justify-center rounded-sm rotate-45 border border-amber-400">
            <span className="-rotate-45 text-white font-bold text-xl">枢</span>
          </div>
          <div>
            <h1 className="text-lg font-serif italic tracking-wide text-amber-100/90">古典文学枢纽 · 知识图谱</h1>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></div>
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#201A15_0%,_#0F0F0F_100%)] overflow-hidden">
        {/* Dynamic Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <AnimatePresence mode="wait">
        {appState === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10"
          >
            <div className="bg-[#151515] p-8 rounded-3xl border border-white/10 shadow-2xl max-w-lg w-full text-center">
              <div className="mx-auto w-20 h-20 bg-amber-600/20 border border-amber-600/50 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                <Map className="text-amber-500 w-10 h-10" />
              </div>
              <h1 className="text-4xl font-serif text-amber-100/90 mb-4 tracking-wide">知识图谱来帮忙</h1>
              <p className="text-[#E0D8D0]/80 text-lg mb-8 leading-relaxed">
                生活中看似毫无关系的人或物，实际上可能存在某种内在联系。<br/><br/>
                探索《四大名著》和唐代诗人的朋友圈，用<span className="text-amber-500 font-serif italic">节点</span>和<span className="text-amber-500 font-serif italic">连线</span>发现知识的奥秘！
              </p>
              
              <button 
                onClick={() => setAppState('map')}
                className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-black bg-amber-600 rounded-full text-xs uppercase tracking-widest hover:bg-amber-500 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                <span className="mr-2">开启探索</span>
                <Play fill="currentColor" size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {appState === 'map' && (
          <motion.div 
            key="map"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col items-center p-6 z-10 pt-20 overflow-y-auto"
          >
            <div className="max-w-3xl w-full pb-20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-serif text-amber-100/90 mb-2">选择探索章节</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {levels.map((level, index) => {
                  const isUnlocked = unlockedLevels.includes(level.id);
                  return (
                    <motion.div 
                      key={level.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => {
                        if (isUnlocked) {
                          setCurrentLevelId(level.id);
                          if (completedGraphs[level.id]) {
                            setAppState('game');
                          } else {
                            setAppState('story');
                          }
                        }
                      }}
                      className={`group relative p-6 rounded-2xl border transition-colors ${
                        isUnlocked 
                          ? 'bg-white/5 border-white/10 hover:border-amber-500/50 cursor-pointer shadow-lg' 
                          : 'bg-white/5 border-white/5 cursor-not-allowed opacity-50 grayscale'
                      }`}
                    >
                      <div className="flex flex-col h-full justify-between">
                         <div>
                            <h3 className="text-xl font-serif text-amber-100 block mb-3">
                              {level.title}
                           </h3>
                           <p className={`text-xs leading-relaxed ${isUnlocked ? 'text-[#E0D8D0]/60' : 'text-[#E0D8D0]/40'}`}>
                              {level.description}
                           </p>
                         </div>
                         {isUnlocked && (
                           <div className="mt-4 flex items-center gap-2 text-amber-500/0 group-hover:text-amber-500 transition-colors text-xs font-bold uppercase tracking-widest">
                             进入阅读 <ArrowRight size={14} />
                           </div>
                         )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {appState === 'story' && (
          <motion.div 
            key="story"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex z-10"
          >
            <div className="flex-1 flex max-w-4xl mx-auto items-stretch h-full overflow-hidden">
               {/* Content Area */}
               <div className="flex-1 flex flex-col p-12 overflow-y-auto">
                 <button 
                    onClick={() => setAppState('map')}
                    className="self-start text-[10px] uppercase font-bold tracking-widest text-amber-500/70 hover:text-amber-500 mb-8 border border-amber-500/30 px-4 py-2 rounded-full hover:bg-amber-500/10 transition-colors"
                  >
                    返回关卡表
                  </button>
                  <h2 className="text-4xl font-serif text-amber-100 mb-8 tracking-wide leading-tight">
                    {currentLevel.title}
                  </h2>
                   <div className="flex-1 min-h-0">
                      <ScriptReader 
                        script={currentLevel.storyScript} 
                        onComplete={() => setAppState('game')}
                      />
                   </div>
               </div>
            </div>
          </motion.div>
        )}

        {appState === 'game' && (
           <motion.div 
             key="game"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="absolute inset-0 z-20 flex bg-[#0F0F0F]"
           >
             {/* Story/Quiz Sidebar or main area */}
             {currentLevel.type === 'graph' ? (
               <>
                 <aside className="w-80 lg:w-96 border-r border-white/10 bg-[#0A0A0A] flex flex-col z-30 shrink-0">
                   <div className="p-8 pb-4">
                     <button 
                        onClick={() => setAppState('story')}
                        className="group flex items-center gap-2 text-xs font-bold tracking-widest text-[#E0D8D0]/50 hover:text-amber-500 mb-6 transition-colors"
                      >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 返回阅读
                      </button>
                     <h2 className="text-2xl lg:text-3xl font-serif text-amber-100">{currentLevel.title}</h2>
                   </div>
                      <div className="mt-4">
                        <ScriptReader 
                          script={currentLevel.storyScript} 
                          onComplete={() => {}} 
                        />
                      </div>
                 </aside>

                 <section className="flex-1 relative bg-[radial-gradient(circle_at_center,_#201A15_0%,_#0F0F0F_100%)] overflow-hidden">
                   <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                   <GameCanvas 
                     level={currentLevel} 
                     initialData={completedGraphs[currentLevelId]}
                     onComplete={handleLevelComplete}
                   />
                 </section>
               </>
             ) : (
               <div className="flex-1 flex flex-col relative">
                  <div className="absolute top-8 left-8 z-30">
                    <button 
                      onClick={() => setAppState('story')}
                      className="group flex items-center gap-2 text-xs font-bold tracking-widest text-[#E0D8D0]/50 hover:text-amber-500 transition-colors"
                    >
                      <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 返回介绍
                    </button>
                  </div>
                  <QuizView 
                    questions={currentLevel.questions || []} 
                    onComplete={handleLevelComplete}
                  />
               </div>
             )}
           </motion.div>
        )}

        {appState === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center z-30 p-6 backdrop-blur-md bg-[#0F0F0F]/80"
          >
            <div className="bg-[#151515] p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-white/10">
              <div className="w-20 h-20 bg-amber-600/20 border border-amber-600/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                <Sparkles size={40} className="text-amber-500" />
              </div>
              <h2 className="text-3xl font-serif text-amber-100 mb-2">解析成功</h2>
              <p className="text-xs opacity-70 mb-8 italic">
                你成功构建了这部分知识图谱！核心关系已被记录入档案室。
              </p>
              
              <div className="space-y-3">
                {currentLevelId < levels.length && (
                  <button 
                    onClick={() => {
                      setCurrentLevelId(prev => prev + 1);
                      setAppState('story');
                    }}
                    className="w-full py-3 bg-amber-600 text-black text-xs tracking-widest uppercase font-bold rounded-full hover:bg-amber-500 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  >
                    挑战下一关
                  </button>
                )}
                <button 
                  onClick={() => setAppState('map')}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white text-xs tracking-widest uppercase font-bold rounded-full hover:bg-white/10 transition-colors"
                >
                  返回关卡表
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discrete Testing Panel Trigger */}
      <div className="absolute bottom-6 right-6 z-[60] flex items-end justify-end pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {isTestPanelOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-[#151515] border border-white/10 p-4 rounded-2xl shadow-2xl w-64 backdrop-blur-xl"
            >
              {!isAuthTest ? (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-widest text-amber-500/70 font-bold">管理认证</div>
                  <input 
                    type="password"
                    placeholder="输入访问密钥"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && testPassword === '112233') {
                        setIsAuthTest(true);
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (testPassword === '112233') {
                        setIsAuthTest(true);
                      }
                    }}
                    className="w-full bg-amber-600 text-black text-[10px] font-bold py-2 rounded-lg hover:bg-amber-500 transition-colors uppercase tracking-widest"
                  >
                    授权
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-widest text-amber-500/70 font-bold">跳转关卡</div>
                  <div className="grid grid-cols-3 gap-2">
                    {levels.map(l => (
                      <button 
                        key={l.id}
                        onClick={() => {
                          setCurrentLevelId(l.id);
                          setAppState('story');
                          setIsTestPanelOpen(false);
                          if (!unlockedLevels.includes(l.id)) {
                            setUnlockedLevels(prev => [...prev, l.id]);
                          }
                        }}
                        className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs hover:border-amber-500/50 transition-colors"
                      >
                        {l.id}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setIsAuthTest(false);
                      setTestPassword('');
                    }}
                    className="w-full text-[8px] uppercase tracking-[0.2em] opacity-40 hover:opacity-100 py-1"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </motion.div>
          )}
          <button 
            onClick={() => setIsTestPanelOpen(!isTestPanelOpen)}
            className="w-8 h-8 rounded-full bg-[#151515] border border-white/5 flex items-center justify-center opacity-20 hover:opacity-100 hover:border-amber-500/30 transition-all"
          >
            <Settings size={14} className={isAuthTest ? "text-amber-500" : "text-white"} />
          </button>
        </div>
      </div>
      </div>

      {/* Bottom Status Bar removed as requested */}
    </div>
  );
}
