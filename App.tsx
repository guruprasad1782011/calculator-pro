
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Calculator as CalcIcon, 
  Brain, 
  History, 
  Trash2, 
  Send, 
  X, 
  ChevronRight, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { geminiService } from './services/gemini';
import { HistoryItem, ChatMessage, CalculationState } from './types';

// Accessing mathjs from global window
declare const math: any;

const App: React.FC = () => {
  const [calcState, setCalcState] = useState<CalculationState>({
    expression: '',
    result: '',
    error: null
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiChat, setAiChat] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiChat]);

  const handleEvaluate = useCallback(() => {
    if (!calcState.expression.trim()) return;
    try {
      const res = math.evaluate(calcState.expression);
      const formattedResult = typeof res === 'number' ? math.format(res, { precision: 14 }) : String(res);
      
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        expression: calcState.expression,
        result: formattedResult,
        timestamp: Date.now()
      };

      setCalcState(prev => ({ ...prev, result: formattedResult, error: null }));
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));
    } catch (err: any) {
      setCalcState(prev => ({ ...prev, error: 'Invalid Expression' }));
    }
  }, [calcState.expression]);

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setCalcState({ expression: '', result: '', error: null });
    } else if (key === '=') {
      handleEvaluate();
    } else if (key === '⌫') {
      setCalcState(prev => ({ ...prev, expression: prev.expression.slice(0, -1) }));
    } else {
      setCalcState(prev => ({ ...prev, expression: prev.expression + key }));
    }
  };

  const handleExplain = async () => {
    if (!calcState.result) return;
    setIsAiPanelOpen(true);
    setIsAiLoading(true);
    const explanation = await geminiService.getMathExplanation(calcState.expression, calcState.result);
    setAiChat(prev => [...prev, { role: 'model', content: explanation }]);
    setIsAiLoading(false);
  };

  const handleSendAi = async () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput;
    setAiInput('');
    setAiChat(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiLoading(true);

    const explanation = await geminiService.getMathExplanation(calcState.expression, calcState.result || 'Not computed yet', userMsg);
    setAiChat(prev => [...prev, { role: 'model', content: explanation }]);
    setIsAiLoading(false);
  };

  const buttonGroups = [
    ['sin(', 'cos(', 'tan(', 'log(', 'ln('],
    ['sqrt(', '(', ')', '^', '/'],
    ['7', '8', '9', '*', '⌫'],
    ['4', '5', '6', '-', 'C'],
    ['1', '2', '3', '+', '='],
    ['0', '.', 'pi', 'e', 'exp(']
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar - History (Desktop) */}
      <div className="hidden lg:flex w-72 bg-slate-900/50 border-r border-slate-800 flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-slate-200">History</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {history.length === 0 ? (
            <p className="text-slate-500 text-sm text-center mt-10">No recent calculations</p>
          ) : (
            history.map(item => (
              <div 
                key={item.id} 
                className="p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 transition-colors cursor-pointer"
                onClick={() => setCalcState({ expression: item.expression, result: item.result, error: null })}
              >
                <div className="text-xs text-slate-400 mb-1 math-font truncate">{item.expression}</div>
                <div className="text-sm font-bold text-indigo-300 math-font">= {item.result}</div>
              </div>
            ))
          )}
        </div>
        {history.length > 0 && (
          <button 
            onClick={() => setHistory([])}
            className="p-4 text-xs text-slate-500 hover:text-red-400 flex items-center justify-center gap-2 transition-colors border-t border-slate-800"
          >
            <Trash2 className="w-3 h-3" /> Clear History
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <CalcIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">MathNexus AI</h1>
              <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">Scientific Intelligence</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 transition-all text-slate-200 hover:text-white rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-700 hover:border-indigo-400"
            >
              <Brain className="w-4 h-4" /> AI Tutor
            </button>
          </div>
        </motion.header>

        {/* Calculator Body */}
        <motion.div 
          layout
          className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 relative z-10"
        >
          {/* Display */}
          <div className="mb-6 p-6 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-col items-end min-h-[120px] justify-center gap-2">
            <input 
              type="text" 
              value={calcState.expression}
              onChange={(e) => setCalcState(prev => ({ ...prev, expression: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleEvaluate()}
              placeholder="0"
              className="w-full bg-transparent text-right text-3xl math-font text-slate-100 placeholder-slate-800 focus:outline-none"
            />
            <div className="flex items-center gap-2 w-full justify-end min-h-[40px]">
              {calcState.error ? (
                <span className="text-red-500 text-sm font-medium">{calcState.error}</span>
              ) : (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={calcState.result}
                  className="text-4xl font-bold text-indigo-400 math-font"
                >
                  {calcState.result && `= ${calcState.result}`}
                </motion.span>
              )}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-5 gap-3">
            {buttonGroups.flat().map((key) => {
              const isOperator = ['/', '*', '-', '+', '='].includes(key);
              const isSpecial = ['C', '⌫'].includes(key);
              const isFunction = key.includes('(');
              
              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className={`
                    h-14 md:h-16 rounded-2xl flex items-center justify-center text-lg font-semibold transition-all duration-150 active:scale-95
                    ${key === '=' ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/30' : 
                      isOperator ? 'bg-slate-800 text-indigo-400 hover:bg-slate-700' : 
                      isSpecial ? 'bg-slate-800 text-red-400 hover:bg-slate-700' :
                      isFunction ? 'bg-slate-800/50 text-emerald-400 hover:bg-slate-800 text-sm' :
                      'bg-slate-800/30 text-slate-300 hover:bg-slate-800 hover:text-white'}
                    border border-slate-800 hover:border-slate-700
                  `}
                >
                  {key}
                </button>
              );
            })}
          </div>

          {/* Context Actions */}
          {calcState.result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex gap-3"
            >
              <button 
                onClick={handleExplain}
                className="flex-1 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" /> Explain Steps
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Info Decorations */}
        <div className="mt-8 text-slate-600 text-xs flex gap-6 opacity-40">
          <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Radian Mode</span>
          <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Precision: 14 Digits</span>
        </div>
      </main>

      {/* AI Assistant Drawer */}
      <AnimatePresence>
        {isAiPanelOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Brain className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">Math Assistant</h3>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Gemini 3 Pro Powered</p>
                </div>
              </div>
              <button onClick={() => setIsAiPanelOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {aiChat.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                    <p className="text-slate-300 text-sm font-medium">Hello! I'm your mathematical intelligence partner.</p>
                    <p className="text-slate-500 text-xs mt-2 italic">Try calculating something and asking for an explanation, or ask me any theory question.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full text-xs">
                    {["Explain Pythagorean Theorem", "What is an Integral?", "Steps for quadratic formula"].map(q => (
                      <button key={q} onClick={() => { setAiInput(q); }} className="p-3 bg-slate-800/30 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-slate-400 text-left transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {aiChat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed
                    ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}
                  `}>
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Computing logic...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAi()}
                  placeholder="Ask a question..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-5 pr-14 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button 
                  onClick={handleSendAi}
                  disabled={!aiInput.trim() || isAiLoading}
                  className="absolute right-2 p-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 rounded-xl text-white transition-all shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-3 uppercase tracking-widest font-bold">
                Knowledge limit: Current Date • AI can make mistakes
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
};

export default App;
