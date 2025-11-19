import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Player, Tile, ElementType, GamePhase, CreatureCard, 
  BattleState, LogEntry 
} from './types';
import { 
  BOARD_SIZE, INITIAL_MANA, MAX_HAND_SIZE, 
  LAP_BONUS, WIN_MANA_TARGET, FALLBACK_DECK 
} from './constants';
import { generateDeck } from './services/geminiService';
import { Board } from './components/Board';
import { Card } from './components/Card';
import { BattleModal } from './components/BattleModal';
import { StatsChart } from './components/StatsChart';
import { Dices, Coins, Scroll, RotateCcw, Sparkles, Zap } from 'lucide-react';

// --- Helpers ---
const createTiles = (): Tile[] => {
  const tiles: Tile[] = [];
  const pattern = [
    ElementType.FIRE, ElementType.FIRE, ElementType.WATER, ElementType.WATER,
    ElementType.EARTH, ElementType.EARTH, ElementType.WIND, ElementType.WIND,
    ElementType.NEUTRAL, ElementType.FIRE, ElementType.WATER, ElementType.EARTH,
    ElementType.WIND, ElementType.NEUTRAL, ElementType.FIRE, ElementType.WATER,
    ElementType.EARTH, ElementType.WIND, ElementType.NEUTRAL
  ];
  
  tiles.push({ id: 0, type: 'START', ownerId: null, creature: null, level: 1, baseToll: 0 });
  
  for (let i = 1; i < BOARD_SIZE; i++) {
    const type = pattern[(i - 1) % pattern.length];
    tiles.push({
      id: i,
      type,
      ownerId: null,
      creature: null,
      level: 1,
      baseToll: 0 // Calculated on land
    });
  }
  return tiles;
};

const shuffle = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const uuid = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  // --- State ---
  const [theme, setTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [turn, setTurn] = useState(1);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);

  // Stats history for chart
  const [manaHistory, setManaHistory] = useState<{ turn: number, p1Mana: number, p2Mana: number }[]>([]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- Lifecycle / Utils ---

  const addLog = (message: string, type: 'info' | 'combat' | 'economy' = 'info') => {
    setLogs(prev => [...prev, { turn, message, type }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- Game Actions ---

  const startGame = async () => {
    if (!theme.trim()) return;
    setIsGenerating(true);
    
    // 1. Generate Cards via Gemini
    const generatedCards = await generateDeck(theme);
    
    // 2. Create Decks
    const p1Deck = shuffle(generatedCards).map(c => ({ ...c, id: uuid() }));
    const p2Deck = shuffle(generatedCards).map(c => ({ ...c, id: uuid() }));
    
    // 3. Setup Players
    const p1: Player = {
      id: 'p1', name: 'Player', color: '#3B82F6', mana: INITIAL_MANA,
      hand: p1Deck.slice(0, 5), deck: p1Deck.slice(5), position: 0, laps: 0, isCpu: false
    };
    const p2: Player = {
      id: 'p2', name: 'Rival AI', color: '#EF4444', mana: INITIAL_MANA,
      hand: p2Deck.slice(0, 5), deck: p2Deck.slice(5), position: 0, laps: 0, isCpu: true
    };

    setPlayers([p1, p2]);
    setTiles(createTiles());
    setPhase(GamePhase.ROLL);
    setManaHistory([{ turn: 0, p1Mana: INITIAL_MANA, p2Mana: INITIAL_MANA }]);
    setIsGenerating(false);
    addLog(`Game started! Theme: ${theme}.`);
  };

  const rollDice = () => {
    if (phase !== GamePhase.ROLL) return;
    const roll = Math.ceil(Math.random() * 6);
    setDiceValue(roll);
    addLog(`${players[currentPlayerIdx].name} rolled a ${roll}.`);
    
    // Animation delay
    setTimeout(() => {
      movePlayer(roll);
    }, 800);
  };

  const movePlayer = (steps: number) => {
    setPhase(GamePhase.MOVE);
    const player = players[currentPlayerIdx];
    let newPos = player.position + steps;
    let lapsAdded = 0;
    
    if (newPos >= BOARD_SIZE) {
      newPos = newPos % BOARD_SIZE;
      lapsAdded = 1;
      // Lap Bonus
      const newMana = player.mana + LAP_BONUS;
      updatePlayer(player.id, { laps: player.laps + 1, mana: newMana });
      addLog(`${player.name} completed a lap! +${LAP_BONUS} Mana.`, 'economy');
    }
    
    updatePlayer(player.id, { position: newPos });
    
    setTimeout(() => {
      handleLandArrival(newPos, player.id);
    }, 500);
  };

  const handleLandArrival = (tileId: number, playerId: string) => {
    const tile = tiles[tileId];
    const player = players.find(p => p.id === playerId)!;

    if (tile.type === 'START') {
      endTurn();
      return;
    }

    if (tile.ownerId === null) {
      // Empty land -> Option to buy
      setPhase(GamePhase.LAND_ACTION);
      if (player.isCpu) {
        cpuLandAction(tile, player);
      }
    } else if (tile.ownerId === player.id) {
      // Own land -> Option to upgrade (Simplified: Heal creature or Boost level)
      // For this version, auto-heal if mana allows, else nothing
      if (tile.creature && tile.creature.hp < tile.creature.mhp) {
        addLog("Creature rests and recovers HP.", 'info');
        setTiles(prev => {
            const newTiles = [...prev];
            if (newTiles[tileId].creature) {
                newTiles[tileId].creature!.hp = newTiles[tileId].creature!.mhp;
            }
            return newTiles;
        });
      }
      endTurn();
    } else {
      // Enemy land
      const owner = players.find(p => p.id === tile.ownerId)!;
      const toll = calculateToll(tile);
      addLog(`Landed on ${owner.name}'s territory! Toll is ${toll}.`, 'combat');
      
      // Check if player can fight
      const canFight = player.hand.length > 0;
      
      if (canFight) {
        // If CPU, decide based on win rate? Simplified: CPU always fights if toll > 100
        if (player.isCpu) {
            if (toll > 100 || Math.random() > 0.5) {
                initiateBattle(tile, player, owner);
            } else {
                payToll(player, owner, toll);
            }
        } else {
            // Player choice handled by UI buttons
            setPhase(GamePhase.LAND_ACTION);
        }
      } else {
        payToll(player, owner, toll);
      }
    }
  };

  const calculateToll = (tile: Tile) => {
    if (!tile.creature) return 0;
    // Basic formula: (Creature Cost * Level) / 2
    return Math.floor((tile.creature.cost * tile.level) / 1.5);
  };

  const claimLand = (cardIdx: number) => {
    const player = players[currentPlayerIdx];
    const card = player.hand[cardIdx];
    const tile = tiles[player.position];
    
    if (player.mana < card.cost) {
      addLog("Not enough mana!", 'economy');
      return;
    }

    // Deduct mana, remove card, update tile
    const newHand = [...player.hand];
    newHand.splice(cardIdx, 1);
    
    setTiles(prev => {
        const newTiles = [...prev];
        newTiles[player.position] = {
            ...tile,
            ownerId: player.id,
            creature: { ...card },
            baseToll: Math.floor(card.cost / 2)
        };
        return newTiles;
    });

    updatePlayer(player.id, { mana: player.mana - card.cost, hand: newHand });
    addLog(`${player.name} summoned ${card.name} on Tile ${tile.id}.`, 'economy');
    endTurn();
  };

  const payToll = (payer: Player, owner: Player, amount: number) => {
    let actualAmount = amount;
    if (payer.mana < amount) {
      actualAmount = payer.mana; // Bankruptcy logic simplified
      addLog(`${payer.name} is bankrupt! Transferred remaining ${actualAmount} Mana.`, 'economy');
      // In full game, assets are sold. Here, we just let them go to 0.
    }
    
    updatePlayer(payer.id, { mana: payer.mana - actualAmount });
    updatePlayer(owner.id, { mana: owner.mana + actualAmount });
    addLog(`${payer.name} paid ${actualAmount} Mana toll to ${owner.name}.`, 'economy');
    endTurn();
  };

  const initiateBattle = (tile: Tile, attacker: Player, defender: Player) => {
    let attackingCard: CreatureCard;
    let cardIdx = -1;
    
    if (attacker.isCpu) {
        // Pick highest ST
        const sorted = attacker.hand.map((c, i) => ({c, i})).sort((a, b) => b.c.st - a.c.st);
        if (sorted.length === 0) return;
        attackingCard = sorted[0].c;
        cardIdx = sorted[0].i;
    } else {
        // If player clicked Fight, they must have a selected card
        if (selectedCardIdx === null) return;
        attackingCard = attacker.hand[selectedCardIdx];
        cardIdx = selectedCardIdx;
    }

    setBattle({
        attacker,
        defender,
        attackerCard: attackingCard,
        defenderCard: tile.creature!,
        tileId: tile.id,
        log: [`Battle started at Tile ${tile.id}!`],
        phase: 'START',
        result: null
    });

    // Process Battle Logic asynchronously for effect
    setTimeout(() => processBattleRound(attacker, defender, attackingCard, tile.creature!, tile, cardIdx), 1000);
  };

  const processBattleRound = (attacker: Player, defender: Player, atkCard: CreatureCard, defCard: CreatureCard, tile: Tile, handIdx: number) => {
    setBattle(prev => prev ? ({ ...prev, phase: 'ATTACK', log: [...prev.log, `${atkCard.name} prepares to strike ${defCard.name}!`] }) : null);
    
    setTimeout(() => {
        // 1. Attacker Strikes
        let defHP = defCard.hp - atkCard.st;
        const battleLog = [`${atkCard.name} attacks for ${atkCard.st} damage!`];

        if (defHP <= 0) {
            // Defender Dies
            battleLog.push(`${defCard.name} was destroyed!`);
            battleLog.push(`${attacker.name} claims the land!`);
            
            // Update Game State
            setTiles(prevTiles => {
                const newTiles = [...prevTiles];
                newTiles[tile.id] = {
                    ...tile,
                    ownerId: attacker.id,
                    creature: { ...atkCard, hp: atkCard.mhp }, 
                };
                return newTiles;
            });

            // Remove card from attacker hand
            const newHand = [...attacker.hand];
            newHand.splice(handIdx, 1);
            updatePlayer(attacker.id, { hand: newHand });

            setBattle(prev => prev ? ({ ...prev, phase: 'END', result: 'WIN', log: [...prev.log, ...battleLog] }) : null);
        } else {
            // Defender Survives and Counters
            setBattle(prev => prev ? ({ ...prev, phase: 'COUNTER', log: [...prev.log, ...battleLog, `${defCard.name} survives and counters!`] }) : null);
            
            setTimeout(() => {
                // 2. Defender Strikes
                // Land Defenders often get a boost in Culdcept. Let's add terrain bonus if element matches.
                let defST = defCard.st;
                if (defCard.element === tile.type) {
                     defST += 10; // Terrain Bonus
                }

                let atkHP = atkCard.hp - defST;
                const counterLog = [`${defCard.name} deals ${defST} damage!`];

                if (atkHP <= 0) {
                    // Attacker Dies
                    counterLog.push(`${atkCard.name} was destroyed! Attack failed.`);
                     // Remove card from attacker hand
                    const newHand = [...attacker.hand];
                    newHand.splice(handIdx, 1);
                    updatePlayer(attacker.id, { hand: newHand });
                    
                    // Update Defender HP on tile
                    setTiles(prevTiles => {
                        const newTiles = [...prevTiles];
                        if (newTiles[tile.id].creature) {
                            newTiles[tile.id].creature!.hp = defHP;
                        }
                        return newTiles;
                    });

                    setBattle(prev => prev ? ({ ...prev, phase: 'END', result: 'LOSS', log: [...prev.log, ...counterLog] }) : null);
                } else {
                    // Draw (Both survive)
                    counterLog.push("Both creatures survived. Attack repelled.");
                    
                    // Return attacker card to hand? Or discard? Usually discard in Culdcept.
                    const newHand = [...attacker.hand];
                    newHand.splice(handIdx, 1);
                    updatePlayer(attacker.id, { hand: newHand });

                    // Update Defender HP
                    setTiles(prevTiles => {
                        const newTiles = [...prevTiles];
                        if (newTiles[tile.id].creature) {
                            newTiles[tile.id].creature!.hp = defHP;
                        }
                        return newTiles;
                    });
                    
                    setBattle(prev => prev ? ({ ...prev, phase: 'END', result: 'DRAW', log: [...prev.log, ...counterLog] }) : null);
                }
            }, 1500);
        }
    }, 1500);
  };

  const cpuLandAction = (tile: Tile, cpu: Player) => {
    // Simple AI
    setTimeout(() => {
      // 1. Try to buy land
      if (tile.ownerId === null) {
        const affordable = cpu.hand.filter(c => c.cost <= cpu.mana);
        if (affordable.length > 0) {
            // Pick most expensive affordable
            const sorted = affordable.sort((a, b) => b.cost - a.cost);
            const card = sorted[0];
            const originalIdx = cpu.hand.indexOf(card); 
            
            // Inline logic for CPU claim
            const newHand = [...cpu.hand];
            newHand.splice(originalIdx, 1);
            
            setTiles(prev => {
                const newTiles = [...prev];
                newTiles[cpu.position] = {
                    ...tile,
                    ownerId: cpu.id,
                    creature: { ...card },
                    baseToll: Math.floor(card.cost / 2)
                };
                return newTiles;
            });

            updatePlayer(cpu.id, { mana: cpu.mana - card.cost, hand: newHand });
            addLog(`AI summoned ${card.name}.`, 'economy');
        } else {
            addLog("AI decided not to summon.", 'info');
        }
        endTurn();
      }
    }, 1000);
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const endTurn = () => {
    if (winner) return;

    const player = players[currentPlayerIdx];

    // Check Win Condition
    if (player.mana >= WIN_MANA_TARGET && player.position === 0) { 
         setWinner(player);
         setPhase(GamePhase.GAME_OVER);
         return;
    }

    // Draw Card if hand not full
    if (player.deck.length > 0 && player.hand.length < MAX_HAND_SIZE) {
        const newDeck = [...player.deck];
        const drawnCard = newDeck.shift()!;
        updatePlayer(player.id, { hand: [...player.hand, drawnCard], deck: newDeck });
        addLog(`${player.name} drew a card.`);
    }

    // Update History
    setManaHistory(prev => [...prev, { 
        turn: turn + 1, 
        p1Mana: players.find(p => !p.isCpu)!.mana, 
        p2Mana: players.find(p => p.isCpu)!.mana 
    }]);

    setSelectedCardIdx(null);
    setDiceValue(null);
    
    // Switch Player
    const nextIdx = (currentPlayerIdx + 1) % players.length;
    setCurrentPlayerIdx(nextIdx);
    setTurn(prev => prev + 1);
    setPhase(GamePhase.ROLL);
  };

  // CPU Trigger Effect
  useEffect(() => {
    if (phase === GamePhase.ROLL && players[currentPlayerIdx].isCpu && !winner) {
        const timer = setTimeout(() => {
            rollDice();
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [currentPlayerIdx, phase, winner]);

  const handleCardClick = (idx: number) => {
    if (players[currentPlayerIdx].isCpu) return;
    setSelectedCardIdx(idx === selectedCardIdx ? null : idx);
  };

  // --- Render ---

  if (phase === GamePhase.SETUP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        <div className="max-w-md w-full bg-gray-900/80 p-8 rounded-2xl shadow-2xl border border-purple-500/30 backdrop-blur text-center">
            <div className="mb-8 flex justify-center">
                 <div className="p-4 bg-purple-900/20 rounded-full border-2 border-purple-500">
                    <Sparkles size={48} className="text-purple-400" />
                 </div>
            </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">AETHER WALKERS</h1>
          <p className="text-gray-400 mb-8">Summon AI-generated creatures and conquer the board.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-left text-sm font-bold text-gray-500 mb-1">Deck Theme</label>
              <input 
                type="text" 
                value={theme}
                onChange={e => setTheme(e.target.value)}
                placeholder="e.g., Cyberpunk Dragons, Sushi Warriors, Eldritch Horrors"
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <button 
              onClick={startGame}
              disabled={!theme || isGenerating}
              className={`w-full py-3 rounded font-bold text-lg transition-all flex items-center justify-center
                ${!theme || isGenerating ? 'bg-gray-700 text-gray-500' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]'}
              `}
            >
              {isGenerating ? (
                  <>Generating <RotateCcw className="ml-2 animate-spin" size={20} /></>
              ) : "Start Game"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = players[currentPlayerIdx];
  const currentTile = tiles[currentPlayer.position];
  const isMyTurn = !currentPlayer.isCpu;

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top Bar: HUD */}
      <header className="h-16 border-b border-gray-800 bg-gray-900/80 backdrop-blur flex items-center justify-between px-6 z-20">
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="font-bold text-blue-400">{players[0].name}</span>
              <div className="flex items-center bg-gray-800 px-2 rounded">
                 <Coins size={14} className="text-yellow-400 mr-1" /> {players[0].mana}
              </div>
           </div>
           <div className="text-gray-600">vs</div>
           <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="font-bold text-red-400">{players[1].name}</span>
              <div className="flex items-center bg-gray-800 px-2 rounded">
                 <Coins size={14} className="text-yellow-400 mr-1" /> {players[1].mana}
              </div>
           </div>
        </div>
        
        <div className="flex items-center space-x-4">
             <div className="text-sm text-gray-400">
                 Target: <span className="text-yellow-400 font-bold">{WIN_MANA_TARGET} G</span>
             </div>
             <div className="bg-gray-800 px-4 py-1 rounded-full border border-gray-700">
                 Turn {turn}
             </div>
        </div>
      </header>

      <main className="flex-1 relative flex overflow-hidden">
        {/* Left: Board Area */}
        <section className="flex-1 relative flex flex-col items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            <Board tiles={tiles} players={players} />
            
            {/* Controls / Feedback Overlay */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center space-y-4">
                
                {/* Dice */}
                {phase === GamePhase.MOVE && (
                   <div className="bg-black/80 p-4 rounded-xl border border-gray-700 text-center animate-bounce">
                      <span className="text-gray-400 text-xs uppercase tracking-widest">Move</span>
                      <div className="text-4xl font-bold text-white">{diceValue}</div>
                   </div>
                )}

                {/* Actions */}
                {isMyTurn && phase === GamePhase.ROLL && (
                    <button 
                        onClick={rollDice}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-12 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-transform hover:scale-105 flex items-center"
                    >
                        <Dices className="mr-2" /> ROLL DICE
                    </button>
                )}

                {isMyTurn && phase === GamePhase.LAND_ACTION && currentTile.ownerId === null && (
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => selectedCardIdx !== null && claimLand(selectedCardIdx)}
                            disabled={selectedCardIdx === null || currentPlayer.mana < currentPlayer.hand[selectedCardIdx]?.cost}
                            className="bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 hover:bg-green-500 text-white font-bold py-2 px-8 rounded-full shadow-lg transition-all"
                        >
                            SUMMON ({selectedCardIdx !== null ? currentPlayer.hand[selectedCardIdx].cost : '-'} G)
                        </button>
                        <button 
                            onClick={endTurn}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full"
                        >
                            PASS
                        </button>
                    </div>
                )}

                {isMyTurn && phase === GamePhase.LAND_ACTION && currentTile.ownerId && currentTile.ownerId !== currentPlayer.id && (
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => {
                                const owner = players.find(p => p.id === currentTile.ownerId)!;
                                const toll = calculateToll(currentTile);
                                payToll(currentPlayer, owner, toll);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-full shadow-lg"
                        >
                            PAY TOLL ({calculateToll(currentTile)} G)
                        </button>
                        <button 
                            onClick={() => {
                                const owner = players.find(p => p.id === currentTile.ownerId)!;
                                if (selectedCardIdx !== null) {
                                   initiateBattle(currentTile, currentPlayer, owner);
                                }
                            }}
                            disabled={selectedCardIdx === null}
                            className="bg-red-600 disabled:bg-gray-700 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-full shadow-lg"
                        >
                            FIGHT
                        </button>
                    </div>
                )}
            </div>
        </section>

        {/* Right: Sidebar (Log + Hand) */}
        <aside className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col z-20 shadow-2xl">
            
            {/* Game Log */}
            <div className="h-1/3 bg-black/20 p-4 overflow-y-auto border-b border-gray-800 font-mono text-xs relative">
                <div className="absolute top-2 right-2 text-gray-600">LOG</div>
                {logs.map((l, i) => (
                    <div key={i} className={`mb-1 ${l.type === 'combat' ? 'text-red-400' : l.type === 'economy' ? 'text-yellow-400' : 'text-gray-400'}`}>
                        <span className="opacity-50">[{l.turn}]</span> {l.message}
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>

            {/* Charts */}
            <div className="h-48 bg-gray-800/50">
                <StatsChart history={manaHistory} players={players} />
            </div>

            {/* Player Hand */}
            <div className="flex-1 bg-gray-900 p-4 flex flex-col">
                <h3 className="text-gray-400 text-sm font-bold mb-2 uppercase flex justify-between">
                    <span>Your Hand</span>
                    <span className="text-xs normal-case bg-gray-800 px-2 rounded">{currentPlayer.id === 'p1' ? currentPlayer.hand.length : 'WAITING...'} / {MAX_HAND_SIZE}</span>
                </h3>
                
                <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-2">
                    {currentPlayer.id === 'p1' ? (
                        players[0].hand.map((card, idx) => (
                            <div key={card.id} className="transform transition-transform hover:translate-x-2">
                                <Card 
                                    card={card} 
                                    compact={true} // Use compact mode for list view? Or custom row
                                    onClick={() => handleCardClick(idx)}
                                    selected={selectedCardIdx === idx}
                                    disabled={!isMyTurn || (phase !== GamePhase.LAND_ACTION)}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-600 italic">
                            Opponent is thinking...
                        </div>
                    )}
                </div>
                 <div className="absolute bottom-0 right-0 w-96 h-64 bg-gray-900 border-t border-gray-700 p-4 overflow-x-auto flex space-x-2 pointer-events-none opacity-0">
                     {/* Hidden duplicate for layout structure reference if needed, kept clean */}
                 </div>
            </div>
        </aside>
      </main>

      {/* Modals */}
      {battle && (
        <BattleModal 
            battle={battle} 
            onClose={() => {
                setBattle(null);
                endTurn();
            }} 
        />
      )}
      
      {winner && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
              <div className="text-center animate-bounce">
                  <h1 className="text-6xl font-black text-yellow-500 mb-4">WINNER!</h1>
                  <p className="text-4xl text-white mb-8">{winner.name} dominates the board.</p>
                  <button onClick={() => window.location.reload()} className="bg-white text-black px-8 py-3 rounded-full font-bold">PLAY AGAIN</button>
              </div>
          </div>
      )}
    </div>
  );
}