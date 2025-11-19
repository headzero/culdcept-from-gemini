import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Player } from '../types';

interface StatsChartProps {
  history: { turn: number; p1Mana: number; p2Mana: number }[];
  players: Player[];
}

export const StatsChart: React.FC<StatsChartProps> = ({ history, players }) => {
  return (
    <div className="w-full h-48 bg-gray-900/50 rounded-lg p-2 border border-gray-800">
      <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">Mana History</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="turn" stroke="#9CA3AF" fontSize={10} />
          <YAxis stroke="#9CA3AF" fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#F3F4F6' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Line 
            type="monotone" 
            dataKey="p1Mana" 
            stroke={players[0].color} 
            strokeWidth={2} 
            dot={false}
            name={players[0].name}
          />
          <Line 
            type="monotone" 
            dataKey="p2Mana" 
            stroke={players[1].color} 
            strokeWidth={2} 
            dot={false}
            name={players[1].name}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};