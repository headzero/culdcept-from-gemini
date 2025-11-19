import React from 'react';
import { CreatureCard, ElementType } from '../types';
import { Sword, Heart, Hexagon } from 'lucide-react';

interface CardProps {
  card: CreatureCard;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

const ELEMENT_BG: Record<ElementType, string> = {
  [ElementType.FIRE]: 'bg-gradient-to-br from-red-900 to-red-700',
  [ElementType.WATER]: 'bg-gradient-to-br from-blue-900 to-blue-700',
  [ElementType.EARTH]: 'bg-gradient-to-br from-emerald-900 to-emerald-700',
  [ElementType.WIND]: 'bg-gradient-to-br from-yellow-700 to-yellow-600',
  [ElementType.NEUTRAL]: 'bg-gradient-to-br from-gray-700 to-gray-600',
};

export const Card: React.FC<CardProps> = ({ card, onClick, selected, disabled, compact }) => {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative rounded-lg shadow-lg border-2 transition-all cursor-pointer
        ${compact ? 'w-24 h-32 text-xs' : 'w-40 h-56'}
        ${selected ? 'border-white ring-2 ring-yellow-400 scale-105 z-10' : 'border-gray-700 hover:scale-105'}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
        ${ELEMENT_BG[card.element]}
        flex flex-col justify-between overflow-hidden text-white
      `}
    >
      {/* Header */}
      <div className="px-2 py-1 bg-black/40 flex justify-between items-center">
        <span className="font-bold truncate">{card.name}</span>
        <div className="flex items-center space-x-1">
          <Hexagon size={compact ? 10 : 14} className="text-yellow-400 fill-yellow-400/20" />
          <span>{card.cost}</span>
        </div>
      </div>

      {/* Art / Icon Placeholder */}
      <div className="flex-1 flex items-center justify-center bg-black/20">
         {/* In a real app, we'd use card.imageUrl. For now, using placeholder based on element */}
         <div className={`text-4xl opacity-80 ${compact ? 'scale-75' : ''}`}>
            {card.element === ElementType.FIRE && '🔥'}
            {card.element === ElementType.WATER && '💧'}
            {card.element === ElementType.EARTH && '🌲'}
            {card.element === ElementType.WIND && '🌪️'}
            {card.element === ElementType.NEUTRAL && '💀'}
         </div>
      </div>

      {/* Stats */}
      <div className="bg-black/60 p-2">
        <div className="flex justify-between mb-1 font-mono font-bold">
          <div className="flex items-center text-red-400">
            <Sword size={compact ? 10 : 14} className="mr-1" /> {card.st}
          </div>
          <div className="flex items-center text-green-400">
            <Heart size={compact ? 10 : 14} className="mr-1" /> {card.hp}
          </div>
        </div>
        {!compact && (
          <p className="text-[10px] text-gray-300 italic leading-tight h-8 overflow-hidden">
            {card.description}
          </p>
        )}
      </div>
    </div>
  );
};