import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, User, Sword, MapPin, X, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Level, GraphNode, GraphEdge, NodeType } from '../data/levels';
import { GraphSaveData } from '../App';

interface GameCanvasProps {
  level: Level;
  initialData?: GraphSaveData;
  onComplete: (data: GraphSaveData) => void;
  onBack?: () => void;
}

const typeConfig: Record<NodeType, { color: string; icon: React.ReactNode; bg: string }> = {
  character: { color: 'text-amber-100', bg: 'bg-[#151515]', icon: <User size={16} /> },
  item: { color: 'text-red-200', bg: 'bg-[#151515]', icon: <Sword size={16} /> },
  poem: { color: 'text-emerald-200', bg: 'bg-[#151515]', icon: <Book size={16} /> },
  place: { color: 'text-purple-200', bg: 'bg-[#151515]', icon: <MapPin size={16} /> },
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ level, initialData, onComplete, onBack }) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [discoveredEdges, setDiscoveredEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pendingTargetId, setPendingTargetId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customRelation, setCustomRelation] = useState<string>('');
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [showInstructions, setShowInstructions] = useState<boolean>(!initialData);
  const [errorFeedback, setErrorFeedback] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize nodes
  useEffect(() => {
    if (initialData) {
      setNodes(initialData.nodes);
      setDiscoveredEdges(initialData.edges);
      setNodePositions(initialData.nodePositions);
      setShowInstructions(false);
    } else {
      const levelNodes = level.nodes ?? [];
      setNodes(levelNodes);
      setDiscoveredEdges([]);
      setShowInstructions(true);
      
      // Set initial positions based on percentages
      const initialPos: Record<string, { x: number; y: number }> = {};
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        levelNodes.forEach(node => {
          initialPos[node.id] = {
            x: (node.x / 100) * width,
            y: (node.y / 100) * height
          };
        });
        setNodePositions(initialPos);
      }
    }

    setSelectedNodeId(null);
    setPendingTargetId(null);
    setEditingNodeId(null);
    setIsCustomMode(false);
    setCustomRelation('');
    setErrorFeedback(false);
  }, [level, initialData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const levelNodes = level.nodes ?? [];
      setNodePositions(prev => {
        const newPos = { ...prev };
        nodes.forEach(node => {
          // If it was a default node, reposition relatively
          const original = levelNodes.find(n => n.id === node.id);
          if (original) {
            newPos[node.id] = {
              x: (original.x / 100) * width,
              y: (original.y / 100) * height
            };
          }
          // Custom nodes stay where they were dragged (relative to window shift?)
          // For simplicity we just keep their pixel positions for now or they will jump
        });
        return newPos;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [level, nodes]);

  const handleDrag = (id: string, info: any) => {
    setNodePositions(prev => ({
      ...prev,
      [id]: { x: prev[id].x + info.delta.x, y: prev[id].y + info.delta.y }
    }));
  };

  const handleNodeTap = (id: string) => {
    if (editingNodeId) return; // Don't tap while editing
    if (!selectedNodeId) {
      setSelectedNodeId(id);
    } else if (selectedNodeId === id) {
      setSelectedNodeId(null); // Deselect
    } else {
      // Check if edge already exists
      const edgeExists = discoveredEdges.find(
        e => (e.source === selectedNodeId && e.target === id) || 
             (e.source === id && e.target === selectedNodeId)
      );
      if (edgeExists) {
        setSelectedNodeId(null);
        return;
      }
      setPendingTargetId(id);
    }
  };

  const handleNodeDoubleClick = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
    setEditingValue(node.label);
    setSelectedNodeId(null);
  };

  const saveLabel = () => {
    if (!editingNodeId) return;
    setNodes(prev => prev.map(n => 
      n.id === editingNodeId ? { ...n, label: editingValue || n.label } : n
    ));
    setEditingNodeId(null);
  };

  const addNewNode = () => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const newId = `custom_${Date.now()}`;
    const newNode: GraphNode = {
      id: newId,
      label: '新成员',
      type: 'character',
      x: 50,
      y: 50
    };
    
    setNodes(prev => [...prev, newNode]);
    setNodePositions(prev => ({
      ...prev,
      [newId]: { x: width / 2 - 60, y: height / 2 - 24 }
    }));
    
    // Auto-edit newly added node
    setTimeout(() => {
      setEditingNodeId(newId);
      setEditingValue('新成员');
    }, 100);
  };

  const handleCompleteClick = () => {
    onComplete({
      nodes,
      edges: discoveredEdges,
      nodePositions
    });
  };

  const handleRelationPick = (relation: string) => {
    if (!selectedNodeId || !pendingTargetId) return;

    const relToUse = relation === 'CUSTOM_INPUT' ? customRelation : relation;
    if (!relToUse) return;

    // Verify if this is a correct relationship in the level data
    const levelEdges = level.edges ?? [];
    
    // Level 6 is open-ended
    const isCorrect = level.id === 6 || levelEdges.find(
      e => (
        ((e.source === selectedNodeId && e.target === pendingTargetId) || 
         (e.source === pendingTargetId && e.target === selectedNodeId)) &&
        e.label === relToUse
      )
    );

    if (isCorrect) {
      // Correct!
      const newEdge: GraphEdge = {
        source: selectedNodeId,
        target: pendingTargetId,
        label: relToUse
      };
      const newEdges = [...discoveredEdges, newEdge];
      setDiscoveredEdges(newEdges);
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.8 },
        colors: ['#f59e0b', '#fbbf24', '#f87171', '#d97706']
      });

      if (level.id !== 6 && newEdges.length === levelEdges.length) {
        setTimeout(handleCompleteClick, 1500);
      }
    } else {
      // Incorrect feedback
      setErrorFeedback(true);
      setTimeout(() => setErrorFeedback(false), 800);
    }

    setSelectedNodeId(null);
    setPendingTargetId(null);
    setIsCustomMode(false);
    setCustomRelation('');
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden font-sans text-[#E0D8D0]">
      {/* Floating UI */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-[#151515] border border-white/10 hover:border-amber-500/50 rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            <X size={20} className="text-[#E0D8D0]" />
          </button>
        )}
        
        {level.id === 6 && (
          <button 
            onClick={addNewNode}
            title="添加新家庭成员"
            className="w-12 h-12 bg-amber-600 text-black hover:bg-amber-500 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 group"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        )}
      </div>
      <div className="absolute top-6 right-6 z-10 text-right flex flex-col items-end gap-4">
         <div className="text-sm text-amber-500 font-serif">
           {level.id === 6 ? `已建立 ${discoveredEdges.length} 条关系` : `${discoveredEdges.length} / ${(level.edges ?? []).length}`}
         </div>
         {level.id === 6 && discoveredEdges.length >= 4 && (
           <button 
             onClick={handleCompleteClick}
             className="px-6 py-2 bg-green-600 hover:bg-green-500 text-black rounded-full text-xs font-bold tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
           >
             完成图谱 <Check size={16} />
           </button>
         )}
      </div>

      {/* Progress Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 md:w-64 h-1 bg-white/10 rounded-full overflow-hidden z-10">
        <motion.div 
          className="h-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"
          initial={{ width: 0 }}
          animate={{ 
            width: `${(discoveredEdges.length / Math.max(1, (level.edges ?? []).length)) * 100}%` 
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Error Feedback */}
      <AnimatePresence>
        {errorFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/90 text-white rounded-full font-bold shadow-lg z-50 pointer-events-none"
          >
            关系不对哦，再想想！
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas Area */}
      <div 
        ref={containerRef} 
        className="flex-1 relative"
        onClick={() => {
          if (!pendingTargetId) setSelectedNodeId(null);
        }}
      >
        {/* Draw Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {discoveredEdges.map((edge, idx) => {
              const srcPos = nodePositions[edge.source];
              const tgtPos = nodePositions[edge.target];
              if (!srcPos || !tgtPos) return null;

              // Centers of the nodes (approximate, assuming node is roughly 120x40 + padding, let's say center is +60, +20)
              // Actually drag sets top-left. Let's adjust to center roughly
              const cx1 = srcPos.x + 60;
              const cy1 = srcPos.y + 24;
              const cx2 = tgtPos.x + 60;
              const cy2 = tgtPos.y + 24;

              const midX = (cx1 + cx2) / 2;
              const midY = (cy1 + cy2) / 2;

              return (
                <g key={idx}>
                  <motion.line 
                    x1={cx1} y1={cy1} x2={cx2} y2={cy2} 
                    stroke="#f59e0b" 
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  <rect 
                    x={midX - 30} y={midY - 12} 
                    width="60" height="24" 
                    rx="12" fill="#0F0F0F" 
                    stroke="#f59e0b" strokeWidth="1"
                  />
                  <text 
                    x={midX} y={midY + 4} 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="#f59e0b"
                    fontFamily="serif"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}
        </svg>

        {/* Draw Nodes */}
        {(level.nodes ?? []).map(node => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          const conf = typeConfig[node.type];
          const isSelected = selectedNodeId === node.id;
          const isPendingTarget = pendingTargetId === node.id;

          return (
            <motion.div
              key={node.id}
              className={`absolute cursor-grab active:cursor-grabbing flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] gap-2 px-4 py-2 rounded-full border-2 transition-colors select-none backdrop-blur-sm ${conf.bg} ${conf.color} ${isSelected ? 'border-amber-500 ring-4 ring-amber-500/20' : isPendingTarget ? 'border-amber-400 ring-4 ring-amber-400/20' : 'border-white/10 hover:border-amber-500/50'}`}
              style={{ x: pos.x, y: pos.y, minWidth: 120, height: 48 }}
              drag={!editingNodeId}
              dragMomentum={false}
              onDrag={(_e, info) => handleDrag(node.id, info)}
              onClick={(e) => {
                if (editingNodeId === node.id) return;
                e.stopPropagation();
                handleNodeTap(node.id);
              }}
              onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
              whileHover={editingNodeId ? {} : { scale: 1.05 }}
              whileTap={editingNodeId ? {} : { scale: 0.95 }}
            >
              <div className="shrink-0 opacity-80">{conf.icon}</div>
              {editingNodeId === node.id ? (
                <input
                  autoFocus
                  className="bg-transparent border-none outline-none font-serif text-sm w-24 text-center text-white"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={saveLabel}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveLabel();
                    if (e.key === 'Escape') setEditingNodeId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="font-serif text-sm whitespace-nowrap tracking-wide flex flex-col items-center">
                  {node.label}
                  {level.id === 6 && (node.id === 'lele' || node.id === 'baba' || node.id === 'mama' || node.id === 'yeye' || node.id === 'nainai') && node.label.includes('名') && (
                    <span className="text-[8px] opacity-40 -mt-1">双击改名</span>
                  )}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[#000000]/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#151515] p-8 mt-12 rounded-3xl border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] max-w-sm w-full text-center relative"
            >
              <div className="mx-auto w-16 h-16 bg-amber-600/20 border border-amber-600/50 rounded-full flex items-center justify-center mb-6 text-amber-500">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
              </div>
              <h3 className="text-2xl font-serif text-amber-100 mb-4">操作说明</h3>
              <ul className="text-sm text-[#E0D8D0]/70 text-left space-y-3 mb-8 font-serif leading-relaxed">
                <li className="flex gap-2"><span className="text-amber-500">•</span> <p>节点可以自由拖拽，调整布局更清晰。</p></li>
                <li className="flex gap-2"><span className="text-amber-500">•</span> <p>依次点击相关的两个节点，建立对应连线。</p></li>
                <li className="flex gap-2"><span className="text-amber-500">•</span> <p>选出它们正确的内在关系，或手动输入新关系。</p></li>
                {level.id === 6 && (
                  <li className="flex gap-2"><span className="text-amber-500">•</span> <p className="text-amber-400 font-bold">小贴士：你可以点击左上角的“+”按钮新增节点，双击节点修改姓名。</p></li>
                )}
              </ul>
              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full py-3 bg-amber-600 text-black text-xs tracking-widest font-bold uppercase rounded-full hover:bg-amber-500 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                我知道了，开始操作
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relation Picker Modal */}
      <AnimatePresence>
        {pendingTargetId && selectedNodeId && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-[#151515] rounded-3xl shadow-2xl p-8 z-50 border border-white/10"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></div>
                 <h3 className="text-xl font-serif text-amber-100">
                    选择关系
                 </h3>
              </div>
              <button onClick={() => setPendingTargetId(null)} className="p-1 rounded-full hover:bg-white/5 transition-colors">
                <X size={20} className="text-white/40" />
              </button>
            </div>
                        <div className="flex flex-col items-center gap-2 mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
               <div className="flex items-center gap-4 w-full justify-center text-amber-100 font-serif">
                 <span className="bg-[#0F0F0F] border border-white/10 px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
                    {nodes.find(n => n.id === selectedNodeId)?.label}
                 </span>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/50 shrink-0">
                   <path d="M5 12h14"></path>
                   <path d="m12 5 7 7-7 7"></path>
                 </svg>
                 <span className="bg-[#0F0F0F] border border-white/10 px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
                    {nodes.find(n => n.id === pendingTargetId)?.label}
                 </span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(level.relationOptions ?? []).map(rel => (
                <button
                  key={rel}
                  onClick={() => handleRelationPick(rel)}
                  className="py-3 px-4 rounded-xl bg-amber-600/10 text-amber-500 text-xs tracking-widest font-bold uppercase hover:bg-amber-600 hover:text-black transition-colors border border-amber-500/30 hover:border-amber-600 active:scale-95 flex justify-center items-center gap-2"
                >
                  {rel}
                </button>
              ))}
              {level.id === 6 && (
                <button
                  onClick={() => setIsCustomMode(true)}
                  className="py-3 px-4 rounded-xl bg-white/5 text-white/60 text-xs tracking-widest font-bold uppercase hover:bg-white/10 hover:text-white transition-colors border border-white/10 active:scale-95 flex justify-center items-center gap-2"
                >
                  自定义输入...
                </button>
              )}
            </div>

            {isCustomMode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 pt-6 border-t border-white/5"
              >
                <div className="flex gap-2">
                  <input
                    autoFocus
                    placeholder="输入关系名称..."
                    className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm font-serif text-white outline-none focus:border-amber-500/50"
                    value={customRelation}
                    onChange={(e) => setCustomRelation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRelationPick('CUSTOM_INPUT')}
                  />
                  <button
                    onClick={() => handleRelationPick('CUSTOM_INPUT')}
                    className="bg-amber-600 hover:bg-amber-500 text-black px-6 rounded-xl font-bold text-xs uppercase"
                  >
                    确认
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dim background when modal is open */}
      <AnimatePresence>
         {pendingTargetId && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm z-40 block transition-all relative"
               onClick={() => setPendingTargetId(null)}
            />
         )}
      </AnimatePresence>
    </div>
  );
};
