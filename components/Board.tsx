import React from 'react';
import { Tile, Player, ElementType } from '../types';
import { ELEMENT_COLORS, BOARD_SIZE } from '../constants';
import { Crown, Skull, Shield } from 'lucide-react';

interface BoardProps {
  tiles: Tile[];
  players: Player[];
}

export const Board: React.FC<BoardProps> = ({ tiles, players }) => {
  // We want to render the tiles in a loop (Rectangular path).
  // Let's define a path for 20 tiles: 6 top, 4 right, 6 bottom, 4 left.
  // Actually, easier to just position them absolutely based on index or grid.
  // Let's use a CSS Grid layout that mimics a monopoly board.
  // 6x6 Grid = 20 perimeter tiles (approx).
  // Grid rows: 1 to 6. Grid cols: 1 to 6.
  // Top row: 0, 1, 2, 3, 4, 5
  // Right col: 6, 7, 8, 9
  // Bottom row (reverse): 10, 11, 12, 13, 14, 15
  // Left col (reverse): 16, 17, 18, 19
  
  const getGridPos = (index: number) => {
    if (index < 6) return { gridColumn: index + 1, gridRow: 1 }; // Top
    if (index < 10) return { gridColumn: 6, gridRow: index - 6 + 2 }; // Right
    if (index < 16) return { gridColumn: 6 - (index - 10), gridRow: 6 }; // Bottom (reverse)
    return { gridColumn: 1, gridRow: 6 - (index - 16 + 1) }; // Left (reverse)
  };

  return (
    <div className="relative w-full max-w-3xl aspect-square mx-auto bg-gray-900/50 rounded-xl border border-gray-800 p-4 shadow-2xl">
      <div className="grid grid-cols-6 grid-rows-6 gap-2 w-full h-full">
        {/* Center Area - Empty for now, or logo */}
        <div className="col-start-2 col-end-6 row-start-2 row-end-6 flex items-center justify-center">
            <div className="text-center opacity-20 pointer-events-none">
                <h1 className="text-6xl font-black tracking-tighter text-purple-500">AETHER</h1>
                <h1 className="text-4xl font-bold tracking-widest text-white">WALKERS</h1>
            </div>
        </div>

        {tiles.map((tile, index) => {
          const pos = getGridPos(index);
          const owner = players.find(p => p.id === tile.ownerId);
          
          return (
            <div
              key={tile.id}
              style={{ ...pos }}
              className={`
                relative rounded-md border-2 flex flex-col items-center justify-center p-1 transition-all
                ${ELEMENT_COLORS[tile.type]}
                ${tile.type === 'START' ? 'border-4' : ''}
              `}
            >
              {/* Tile Content */}
              <span className="text-[10px] font-bold opacity-70">{tile.type.substring(0,1)}</span>
              
              {tile.creature ? (
                  <div className="flex flex-col items-center">
                     <div className="text-2xl transform hover:scale-110 transition-transform cursor-help" title={tile.creature.name}>
                        {tile.creature.element === ElementType.FIRE && '🔥'}
                        {tile.creature.element === ElementType.WATER && '💧'}
                        {tile.creature.element === ElementType.EARTH && '🌲'}
                        {tile.creature.element === ElementType.WIND && '🌪️'}
                        {tile.creature.element === ElementType.NEUTRAL && '💀'}
                     </div>
                     <div className="text-[10px] font-bold bg-black/50 px-1 rounded text-white">
                        {tile.creature.st}/{tile.creature.hp}
                     </div>
                  </div>
              ) : (
                <div className="h-6 w-6 rounded-full bg-white/5" />
              )}

              {/* Ownership Marker */}
              {owner && (
                 <div 
                    className="absolute -top-2 -right-2 rounded-full p-1 border-2 border-white shadow-sm"
                    style={{ backgroundColor: owner.color }}
                 >
                    {owner.isCpu ? <Skull size={12} className="text-white"/> : <Crown size={12} className="text-white" />}
                 </div>
              )}
              
               {/* Level Indicators */}
               {tile.level > 1 && (
                 <div className="absolute bottom-1 left-1 flex space-x-0.5">
                    {Array.from({length: tile.level - 1}).map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-white rounded-full shadow" />
                    ))}
                 </div>
               )}

              {/* Players on Tile */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {players.map((p, i) => {
                    if (p.position === index) {
                        return (
                            <div 
                                key={p.id}
                                className={`
                                    w-8 h-8 rounded-full border-4 border-white shadow-lg 
                                    flex items-center justify-center z-20 transform transition-all duration-500
                                    ${i === 0 ? '-translate-x-2 -translate-y-2' : 'translate-x-2 translate-y-2'}
                                `}
                                style={{ backgroundColor: p.color }}
                            >
                                <span className="text-xs font-bold text-white">{p.name[0]}</span>
                            </div>
                        );
                    }
                    return null;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};