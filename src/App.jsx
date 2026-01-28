import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Database, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  // Données fictives initiales
  const [blocks, setBlocks] = useState([
    { index: 0, hash: "0000x892...", prevHash: "0", data: "Bloc Genèse" },
    { index: 1, hash: "0000x456...", prevHash: "0000x892...", data: "Transaction A -> B" },
    { index: 2, hash: "0000x123...", prevHash: "0000x456...", data: "Transaction C -> D" },
  ]);
  
  const [mempool, setMempool] = useState(["tx_8829...", "tx_4410..."]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Simulation : Nouvelles transactions arrivant dans le mempool
  useEffect(() => {
    const interval = setInterval(() => {
      const newTx = `tx_${Math.floor(Math.random() * 10000)}...`;
      setMempool(prev => [newTx, ...prev].slice(0, 10)); // Garde les 10 dernières
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextBlock = () => currentIndex < blocks.length - 1 && setCurrentIndex(currentIndex + 1);
  const prevBlock = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      
      {/* SIDEBAR GAUCHE : MEMPOOL */}
      <aside className="w-1/4 border-r border-slate-700 bg-slate-800/50 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-6 text-yellow-500">
          <Cpu size={24} />
          <h2 className="text-xl font-bold uppercase tracking-wider">Mempool</h2>
        </div>
        <div className="space-y-3 overflow-y-auto">
          {mempool.map((tx, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={i} 
              className="p-3 bg-slate-700 rounded border border-slate-600 text-xs font-mono"
            >
              <span className="text-yellow-400">PENDING:</span> {tx}
            </motion.div>
          ))}
        </div>
      </aside>

      {/* SECTION PRINCIPALE : BLOCS */}
      <main className="flex-1 flex flex-col items-center justify-center p-10 relative">
        <div className="flex items-center gap-3 mb-10">
          <Database className="text-blue-400" size={32} />
          <h1 className="text-3xl font-extrabold tracking-tighter">BLOCKCHAIN EXPLORER</h1>
        </div>

        {/* CONTENEUR DU BLOC AVEC ANIMATION */}
        <div className="relative w-full max-w-md h-64 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="absolute w-full p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl border border-blue-400"
            >
              <div className="text-sm font-mono text-blue-200 mb-2">INDEX # {blocks[currentIndex].index}</div>
              <div className="mb-4">
                <label className="text-xs uppercase text-blue-300 block">Hash</label>
                <div className="font-mono truncate">{blocks[currentIndex].hash}</div>
              </div>
              <div className="mb-4">
                <label className="text-xs uppercase text-blue-300 block">Previous Hash</label>
                <div className="font-mono truncate text-slate-300">{blocks[currentIndex].prevHash}</div>
              </div>
              <div className="text-lg font-semibold">{blocks[currentIndex].data}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* NAVIGATION */}
        <div className="mt-20 flex gap-8">
          <button 
            onClick={prevBlock}
            disabled={currentIndex === 0}
            className="p-4 rounded-full bg-slate-800 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-800 transition-all shadow-lg"
          >
            <ArrowLeft size={32} />
          </button>

          <button 
            onClick={nextBlock}
            disabled={currentIndex === blocks.length - 1}
            className="p-4 rounded-full bg-slate-800 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-800 transition-all shadow-lg"
          >
            <ArrowRight size={32} />
          </button>
        </div>
      </main>

    </div>
  );
};

export default App;