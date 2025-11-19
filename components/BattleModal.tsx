import React, { useEffect, useState } from 'react';
import { BattleState } from '../types';
import { Sword, Shield, Zap } from 'lucide-react';

interface BattleModalProps {
  battle: BattleState;
  onClose: () => void;
}

export const BattleModal: React.FC<BattleModalProps> = ({ battle, onClose }) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (battle.result) {
        const timer = setTimeout(() => {
            // Allow user to read result before closing or require click?
            // Let's just wait for manual close via button to be safe
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, [battle.result]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-red-500/50 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-gray-900 p-4 text-center border-b border-red-500/30">
          <h2 className="text-2xl font-black text-red-500 tracking-widest">BATTLE ENGAGED</h2>
        </div>

        {/* Arena */}
        <div className="flex justify-between items-center p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          
          {/* Attacker */}
          <div className={`flex flex-col items-center space-y-4 transition-all duration-300 ${battle.phase === 'ATTACK' ? 'translate-x-8 scale-110' : ''}`}>
            <div className="w-24 h-24 rounded-full border-4 border-blue-500 flex items-center justify-center bg-blue-900 text-4xl shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              🤺
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-blue-400">{battle.attacker.name}</div>
              <div className="text-sm text-gray-400">Attacker</div>
            </div>
             <div className="bg-gray-800 p-2 rounded flex items-center space-x-2">
                 <Sword size={16} className="text-red-400"/>
                 <span className="text-xl font-mono font-bold">{battle.attackerCard.st}</span>
             </div>
          </div>

          {/* VS */}
          <div className="text-4xl font-black italic text-gray-600">VS</div>

          {/* Defender */}
          <div className={`flex flex-col items-center space-y-4 transition-all duration-300 ${battle.phase === 'COUNTER' ? '-translate-x-8 scale-110' : ''}`}>
            <div className="w-24 h-24 rounded-full border-4 border-red-500 flex items-center justify-center bg-red-900 text-4xl shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              🛡️
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-red-400">{battle.defender.name}</div>
              <div className="text-sm text-gray-400">Defender</div>
            </div>
             <div className="bg-gray-800 p-2 rounded flex items-center space-x-2">
                 <Shield size={16} className="text-green-400"/>
                 <span className="text-xl font-mono font-bold">
                     {battle.defenderCard.hp} 
                 </span>
             </div>
          </div>

        </div>

        {/* Log */}
        <div className="bg-black/50 p-4 h-48 overflow-y-auto border-t border-gray-800 font-mono text-sm space-y-2">
          {battle.log.map((log, i) => (
            <div key={i} className={`
                ${log.includes("destroyed") ? 'text-red-400 font-bold' : ''}
                ${log.includes("Victory") ? 'text-yellow-400 font-bold text-lg' : 'text-gray-300'}
            `}>
              {'>'} {log}
            </div>
          ))}
          {battle.result && (
              <div className="mt-4 text-center animate-pulse">
                  <button 
                    onClick={onClose}
                    className="bg-white text-black font-bold py-2 px-6 rounded hover:bg-gray-200 transition-colors"
                  >
                      CLOSE BATTLE
                  </button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};