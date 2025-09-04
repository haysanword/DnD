import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, type GameState, type CoreStats, type Item, type Quest, type RollResult, type Personality, Reputation, SurvivalStatus, OracleResult, WorldState, TimeOfDay } from './types';
import { startAdventure, sendPlayerAction } from './services/geminiService';

interface Notification {
    id: number;
    message: string;
}

const SOUND_MAP = {
    day: 'https://cdn.pixabay.com/audio/2022/02/07/audio_341434316a.mp3',
    night: 'https://cdn.pixabay.com/audio/2022/08/17/audio_34e56e43f4.mp3',
    rain: 'https://cdn.pixabay.com/audio/2022/11/17/audio_8113586b61.mp3',
};

// --- SVG Icons for Controls (Memoized for performance) ---
const SpeakerOnIcon = React.memo(() => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 4a1 1 0 00-2 0v12a1 1 0 102 0V4zM13 4a1 1 0 10-2 0v12a1 1 0 102 0V4zM10 2.5a.5.5 0 01.5.5v14a.5.5 0 01-1 0v-14a.5.5 0 01.5-.5zM3 8a1 1 0 100 2h.5a.5.5 0 01.5.5v1a.5.5 0 01-.5.5H3a1 1 0 100 2h.5A2.5 2.5 0 006 11.5v-1A2.5 2.5 0 003.5 8H3zM17 8a1 1 0 100 2h-.5a2.5 2.5 0 00-2.5 2.5v1a2.5 2.5 0 002.5 2.5H17a1 1 0 100-2h-.5a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5H17z" />
    </svg>
));

const SpeakerOffIcon = React.memo(() => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
));

const StopIcon = React.memo(() => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
));

const SpinnerIcon = React.memo(() => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
));

const MegaphoneIcon = React.memo(() => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h4v1H6a1 1 0 100 2h8a1 1 0 100-2h-1v-1h4a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM8 8a2 2 0 114 0v3H8V8z" />
    </svg>
));


// --- Thematic Icons (Memoized) ---
const PotionIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 01-.517-3.86l-2.387-.477a2 2 0 01-.547-1.806l.477-2.387a6 6 0 013.86-.517l.318.158a6 6 0 003.86-.517l2.387.477a2 2 0 011.806.547a2 2 0 01.547 1.806l-.477 2.387a6 6 0 01-3.86.517l-.318-.158a6 6 0 00-3.86.517l-2.387-.477a2 2 0 00-1.806.547" /></svg>);
const WeaponIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2z" /></svg>);
const ScrollIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
const LootBagIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>);
const QuestActiveIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
const QuestCompletedIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const CoinIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>);


// --- Ambiance Icons ---
const SunIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="ambiance-icon text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>);
const MoonIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="ambiance-icon text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>);
const CloudIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="ambiance-icon text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>);
const RainIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" className="ambiance-icon text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 10a4 4 0 00-3.446 6.032l-2 6a2 2 0 01-3.108 0l-2-6A4 4 0 006 10a4 4 0 118 0 .5.5 0 00.5-.5V3a.5.5 0 00-.5-.5a4 4 0 10-8 0v6.5a.5.5 0 00.5.5 4 4 0 118 0z" /></svg>);

const MinimalistLoadingAnimation = React.memo(() => (
    <svg width="150" height="50" viewBox="0 0 150 50" xmlns="http://www.w3.org/2000/svg" className="my-6">
        <path 
            d="M5 25 Q 25 10, 45 25 T 85 25 Q 105 40, 125 25 T 145 25" 
            stroke="#e6c382" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
            className="lontar-path"
        />
    </svg>
));

// --- UI Sub-components (Memoized for performance) ---

const Dice = React.memo<{ value: number }>(({ value }) => {
    return (
        <div className="dice-perspective">
            <div className="dice">
                {value}
            </div>
        </div>
    );
});

const ProgressBar = React.memo< { value: number; max: number; label: string; color: string } >(({ value, max, label, color }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-mono text-gray-400">{value} / {max}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4">
        <div className={`${color} h-4 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
});

const StatDisplay = React.memo<{ stats: CoreStats }>(({ stats }) => (
  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
    {Object.entries(stats).map(([key, value]) => {
      const modifier = Math.floor((value - 10) / 2);
      return (
        <div key={key} className="bg-gray-800 p-3 rounded-lg shadow-md">
          <div className="text-lg font-bold text-cyan-400">{key}</div>
          <div className="text-2xl font-mono">{value}</div>
          <div className={`text-sm font-mono ${modifier >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {modifier >= 0 ? `+${modifier}` : modifier}
          </div>
        </div>
      );
    })}
  </div>
));

const CollapsiblePanel = React.memo<{ title: string; children: React.ReactNode }>(({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-gray-800 rounded-lg shadow-inner">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left p-4 font-bold text-lg text-cyan-400 border-b border-gray-700 flex justify-between items-center">
                <span>{title}</span>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="p-4 max-h-60 overflow-y-auto space-y-2">
                    {children}
                </div>
            )}
        </div>
    );
});


const PersonalityPanel = React.memo<{ personality: Personality }>(({ personality }) => (
    <div className="space-y-3">
        <div>
            <h4 className="font-semibold text-gray-200">Ciri Khas:</h4>
            <p className="text-sm text-gray-400 italic">{personality.traits.join(', ')}</p>
        </div>
        <div>
            <h4 className="font-semibold text-gray-200">Cita-cita:</h4>
            <p className="text-sm text-gray-400 italic">{personality.ideals.join(', ')}</p>
        </div>
        <div>
            <h4 className="font-semibold text-gray-200">Ikatan:</h4>
            <p className="text-sm text-gray-400 italic">{personality.bonds.join(', ')}</p>
        </div>
        <div>
            <h4 className="font-semibold text-gray-200">Kelemahan:</h4>
            <p className="text-sm text-gray-400 italic">{personality.flaws.join(', ')}</p>
        </div>
    </div>
));

const SurvivalPanel = React.memo<{ survival: SurvivalStatus }>(({ survival }) => (
    <div className="space-y-2">
        <ProgressBar value={survival.hunger} max={100} label="Lapar" color="bg-yellow-500" />
        <ProgressBar value={survival.thirst} max={100} label="Haus" color="bg-blue-500" />
        <ProgressBar value={survival.fatigue} max={100} label="Lelah" color="bg-indigo-500" />
    </div>
));

const ReputationPanel = React.memo<{ reputation: Reputation[] }>(({ reputation }) => (
    reputation.length === 0 ? <p className="text-gray-400 italic">Kamu belum punya reputasi.</p> :
    <ul className="space-y-2">
        {reputation.map((rep, i) => (
            <li key={i} className="text-sm flex justify-between">
                <span className="font-semibold text-gray-200">{rep.faction}</span>
                <span className={`font-mono ${rep.standing > 0 ? 'text-green-400' : 'text-red-400'}`}>{rep.standing}</span>
            </li>
        ))}
    </ul>
));

const InventoryPanel = React.memo<{ inventory: Item[] }>(({ inventory }) => {
    const getIconForItem = (itemName: string) => {
        const lowerName = itemName.toLowerCase();
        if (lowerName.includes('ramuan') || lowerName.includes('potion') || lowerName.includes('obat')) return <PotionIcon />;
        if (lowerName.includes('keris') || lowerName.includes('pedang') || lowerName.includes('tombak') || lowerName.includes('senjata')) return <WeaponIcon />;
        if (lowerName.includes('gulungan') || lowerName.includes('surat') || lowerName.includes('catatan') || lowerName.includes('peta')) return <ScrollIcon />;
        return <LootBagIcon />;
    };

    return inventory.length === 0 ? <p className="text-gray-400 italic">Inventaris kosong.</p> : (
        <>
            {inventory.map((item, i) => (
                 <div key={i} className="flex items-start gap-3 bg-gray-900/50 p-3 rounded-md border border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <div className="flex-shrink-0 mt-1">{getIconForItem(item.name)}</div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-center">
                            <strong className="text-gray-200">{item.name} (x{item.quantity})</strong>
                             <span className="text-xs font-mono text-yellow-400 flex items-center gap-1">
                                {item.value} <CoinIcon />
                            </span>
                        </div>
                        <p className="text-sm text-gray-400">{item.description}</p>
                    </div>
                </div>
            ))}
        </>
    );
});

const QuestPanel = React.memo<{ quests: Quest[] }>(({ quests }) => (
    quests.length === 0 ? <p className="text-gray-400 italic">Tidak ada misi aktif.</p> : (
        <>
            {quests.map((quest, i) => (
                <div key={i} className={`flex items-start gap-3 bg-gray-900/50 p-3 rounded-md border border-gray-700 ${quest.status === 'completed' ? 'opacity-60' : ''}`}>
                    <div className="flex-shrink-0 mt-1">
                        {quest.status === 'completed' ? <QuestCompletedIcon /> : <QuestActiveIcon />}
                    </div>
                    <div>
                        <strong className={`text-gray-200 ${quest.status === 'completed' ? 'line-through' : ''}`}>{quest.name}</strong>
                        <p className="text-sm text-gray-400">{quest.description}</p>
                    </div>
                </div>
            ))}
        </>
    )
));

const WorldStatePanel = React.memo<{ worldState: WorldState }>(({ worldState }) => (
    <div className="space-y-4 text-sm">
        <div>
            <h4 className="font-semibold text-gray-200 mb-2">Fakta yang Diketahui:</h4>
            {worldState.knownFacts.length === 0 ? <p className="text-gray-400 italic">Belum ada fakta dunia yang tercatat.</p> :
            <ul className="space-y-1 list-disc list-inside text-gray-300">
                {worldState.knownFacts.map((fact, i) => <li key={i}>{fact}</li>)}
            </ul>
            }
        </div>
        <div>
            <h4 className="font-semibold text-gray-200 mb-2">Hubungan dengan NPC:</h4>
            {worldState.npcRelationships.length === 0 ? <p className="text-gray-400 italic">Belum ada hubungan khusus dengan NPC.</p> :
            <ul className="space-y-1 text-gray-300">
                {worldState.npcRelationships.map((rel, i) => (
                    <li key={i} className="flex justify-between">
                        <span>{rel.name}</span>
                        <span className="font-semibold">{rel.status}</span>
                    </li>
                ))}
            </ul>
            }
        </div>
    </div>
));

const LogPanel = React.memo<{ log: string[] }>(({ log }) => (
    log.length === 0 ? <p className="text-gray-400 italic">Log masih kosong.</p> : (
        <ul className="space-y-1 text-sm text-gray-400">
            {/* Show newest log entry first */}
            {log.slice().reverse().map((entry, index) => (
                <li key={index}>{entry}</li>
            ))}
        </ul>
    )
));


const RollResultDisplay = React.memo<{ result: RollResult; animationTrigger: number }>(({ result, animationTrigger }) => {
    const successColor = result.success ? 'text-green-400' : 'text-red-400';
    const critClass = result.critical === 'success' ? 'border-yellow-400 animate-pulse' : result.critical === 'failure' ? 'border-red-600 animate-pulse' : 'border-gray-600';

    return (
        <div className={`bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg border-2 ${critClass} shadow-lg`}>
            <h4 className="font-bold text-cyan-300 text-center">{result.reason}</h4>
            <div className="flex justify-center items-center gap-4 font-mono text-2xl my-2 flex-wrap">
                <Dice key={`d20-${animationTrigger}`} value={result.roll} />
                <div className="flex items-center gap-2">
                    <span className={result.modifier >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {result.modifier >= 0 ? `+${result.modifier}` : result.modifier}
                    </span>
                    <span>=</span>
                    <span className={`font-bold text-3xl ${successColor}`}>{result.total}</span>
                </div>
                <span className="text-gray-400 text-xl self-end">vs DC {result.dc}</span>
            </div>
            <p className={`text-center font-bold text-xl ${successColor}`}>
                {result.critical === 'success' ? 'SUKSES KRITIS!' : result.critical === 'failure' ? 'GAGAL TOTAL!' : result.success ? 'Sukses' : 'Gagal'}
            </p>
        </div>
    );
});

const OracleResultDisplay = React.memo<{ result: OracleResult; animationTrigger: number }>(({ result, animationTrigger }) => {
    const answerColor = result.answer === 'Ya' ? 'text-green-400' : result.answer === 'Tidak' ? 'text-red-400' : 'text-yellow-400';
    return (
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg border-2 border-purple-400 shadow-lg">
            <p className="text-sm text-gray-400 text-center italic">Kamu bertanya pada Oracle: "{result.question}"</p>
            <div className="flex justify-center items-center gap-4 my-2">
                <Dice key={`d6-${animationTrigger}`} value={result.roll} />
                <span className="text-3xl font-thin text-gray-400">→</span>
                <span className={`font-bold text-3xl ${answerColor}`}>{result.answer}</span>
            </div>
            <p className="text-center text-gray-300">"{result.interpretation}"</p>
        </div>
    );
});

const EventAnnouncer = React.memo<{ notifications: Notification[] }>(({ notifications }) => {
    return (
        <div className="toast-container">
            {notifications.map(notification => (
                <div key={notification.id} className="toast">
                    {notification.message}
                </div>
            ))}
        </div>
    );
});

const ObjectiveTracker = React.memo<{ quests: Quest[] }>(({ quests }) => {
    const activeQuest = quests.find(q => q.status === 'active');
    if (!activeQuest) {
        return null;
    }
    return (
        <div className="objective-tracker">
            <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">Tujuan Saat Ini:</h3>
            <p className="text-lg text-gray-200">{activeQuest.name}</p>
        </div>
    );
});

const WorldAmbiance = React.memo<{ timeOfDay: TimeOfDay, weather: string }>(({ timeOfDay, weather }) => {
    const GetTimeIcon = () => {
        switch (timeOfDay) {
            case 'Pagi':
            case 'Siang':
                return <SunIcon />;
            case 'Sore': // Could add a sunset icon later
                return <SunIcon />;
            case 'Malam':
                return <MoonIcon />;
            default:
                return <SunIcon />;
        }
    };

    const GetWeatherIcon = () => {
        const lowerWeather = weather.toLowerCase();
        if (lowerWeather.includes('hujan') || lowerWeather.includes('gerimis')) return <RainIcon />;
        if (lowerWeather.includes('berawan') || lowerWeather.includes('mendung') || lowerWeather.includes('kabut')) return <CloudIcon />;
        // Add more specific icons for storm, etc. later
        return <CloudIcon />;
    }

    return (
        <div className="world-ambiance-container">
            <div className="ambiance-item">
                <GetTimeIcon />
                <span>{timeOfDay}</span>
            </div>
            <div className="ambiance-item">
                <GetWeatherIcon />
                <span>{weather}</span>
            </div>
        </div>
    );
});


const Header = React.memo(() => (
    <header className="text-center py-4 border-b border-gray-700 mb-6">
        <h1 className="text-3xl font-bold text-yellow-300 font-serif">Mesin Petualangan D&D</h1>
        <p className="text-gray-400">Edisi Cerita Rakyat Nusantara</p>
    </header>
));

const InteractiveNarrative = React.memo(({ text, onInteractiveClick }: { text: string; onInteractiveClick: (text: string) => void; }) => {
    const sanitizedText = text.replace(/(\*\*|__|\*|_)/g, '');
    const parts = sanitizedText.split(/(\[\w+:.*?\])/g).filter(Boolean);
    const keywordRegex = /\[(\w+):([^\]]+)\]/;

    return (
        <p className="whitespace-pre-wrap">
            {parts.map((part, index) => {
                const match = part.match(keywordRegex);
                if (match) {
                    const [_, type, content] = match;
                    if (type === 'interaksi') {
                        return (
                            <span
                                key={index}
                                className="interactive-object"
                                onClick={() => onInteractiveClick(`[${content}]`)}
                                title="Klik untuk berinteraksi"
                            >
                                {content}
                            </span>
                        );
                    }
                    return (
                        <span key={index} className="keyword" data-tooltip={type}>
                            {content}
                        </span>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </p>
    );
});

// --- Main App Component ---

const App: React.FC = () => {
    const [status, setStatus] = useState<GameStatus>(GameStatus.Start);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userInput, setUserInput] = useState('');
    const [oracleQuery, setOracleQuery] = useState('');
    const [directorInput, setDirectorInput] = useState('');
    const [isMuted, setIsMuted] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showCritFlash, setShowCritFlash] = useState(false);
    const [animationTrigger, setAnimationTrigger] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const narrativeEndRef = useRef<HTMLDivElement>(null);
    const prevLogRef = useRef<string[]>([]);
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
    const fadeIntervals = useRef<{ [key: string]: number }>({});


    // Effect for initializing background audio
    useEffect(() => {
        Object.entries(SOUND_MAP).forEach(([key, src]) => {
            const audio = new Audio(src);
            audio.loop = true;
            audio.volume = 0;
            audioRefs.current[key] = audio;
        });

        return () => {
            Object.values(audioRefs.current).forEach(audio => {
                audio.pause();
                audio.src = '';
            });
            Object.values(fadeIntervals.current).forEach(clearInterval);
        };
    }, []);

    // Helper function for fading audio in and out
    const fadeAudio = useCallback((key: string, targetVolume: number, duration: number = 2000) => {
        const audio = audioRefs.current[key];
        if (!audio) return;

        if (fadeIntervals.current[key]) {
            clearInterval(fadeIntervals.current[key]);
        }

        if (targetVolume > 0 && audio.paused) {
            audio.play().catch(e => console.error(`Audio play failed for ${key}:`, e));
        }

        const stepTime = 50;
        const steps = duration / stepTime;
        const volumeStep = (targetVolume - audio.volume) / steps;

        fadeIntervals.current[key] = window.setInterval(() => {
            let newVolume = audio.volume + volumeStep;

            if ((volumeStep > 0 && newVolume >= targetVolume) || (volumeStep < 0 && newVolume <= targetVolume)) {
                newVolume = targetVolume;
                clearInterval(fadeIntervals.current[key]);
                if (newVolume === 0) {
                    audio.pause();
                }
            }
            audio.volume = Math.max(0, Math.min(1, newVolume));
        }, stepTime);
    }, []);


    // Effect for managing background audio based on game state
    useEffect(() => {
        if (!gameState) return;

        const timeOfDay = gameState.timeOfDay;
        const weather = gameState.currentWeather?.toLowerCase() || '';

        const activeSounds: string[] = [];
        if (timeOfDay === 'Pagi' || timeOfDay === 'Siang' || timeOfDay === 'Sore') {
            activeSounds.push('day');
        } else if (timeOfDay === 'Malam') {
            activeSounds.push('night');
        }

        if (weather.includes('hujan') || weather.includes('gerimis')) {
            activeSounds.push('rain');
        }

        Object.keys(audioRefs.current).forEach(key => {
            const shouldBeActive = activeSounds.includes(key) && !isMuted;
            const targetVolume = shouldBeActive ? (key === 'rain' ? 0.4 : 0.6) : 0;
            fadeAudio(key, targetVolume);
        });

    }, [gameState?.timeOfDay, gameState?.currentWeather, isMuted, fadeAudio, gameState]);


    // Effect for handling notifications
    useEffect(() => {
        if (gameState && gameState.log.length > prevLogRef.current.length) {
            const newLogEntries = gameState.log.slice(prevLogRef.current.length);
            const newNotifications = newLogEntries.map(entry => ({ id: Date.now() + Math.random(), message: entry }));
            
            setNotifications(prev => [...prev, ...newNotifications]);

            newNotifications.forEach(notification => {
                setTimeout(() => {
                    setNotifications(current => current.filter(n => n.id !== notification.id));
                }, 5000); // Duration matches CSS animation
            });
        }
        prevLogRef.current = gameState?.log || [];
    }, [gameState?.log]);

    // Effect for Text-to-Speech
    useEffect(() => {
        if (!isMuted && gameState?.narrative) {
            let cleanNarrative = gameState.narrative.replace(/(\*\*|__|\*|_)/g, '');
            cleanNarrative = cleanNarrative.replace(/\[\w+:([^\]]+)\]/g, '$1');

            const utterance = new SpeechSynthesisUtterance(cleanNarrative);
            utterance.lang = 'id-ID';
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            speechSynthesis.speak(utterance);
        }
        return () => {
            speechSynthesis.cancel();
            setIsSpeaking(false);
        };
    }, [gameState?.narrative, isMuted]);
    
    // Effect for scrolling narrative
    useEffect(() => {
        narrativeEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [gameState?.narrative]);
    
    // Effect for dynamic background based on location AND time
    useEffect(() => {
        const location = gameState?.location?.toLowerCase() || '';
        const timeOfDay = gameState?.timeOfDay || 'Siang';
        
        let baseColor, endColor;

        if (location.includes('hutan') || location.includes('alas')) { [baseColor, endColor] = ['#2a4d3e', '#1a2a22']; }
        else if (location.includes('gua') || location.includes('terowongan')) { [baseColor, endColor] = ['#3d3d4d', '#1a1a22']; }
        else if (location.includes('desa') || location.includes('kampung')) { [baseColor, endColor] = ['#5a4d3e', '#2a221a']; }
        else if (location.includes('kerajaan') || location.includes('istana')) { [baseColor, endColor] = ['#6a5a3a', '#3a2a1a']; }
        else if (location.includes('gunung') || location.includes('puncak')) { [baseColor, endColor] = ['#4a5a6a', '#2a3a4a']; }
        else if (location.includes('pantai') || location.includes('laut')) { [baseColor, endColor] = ['#3a5a6a', '#1a2a3a']; }
        else { [baseColor, endColor] = ['#2c2c2c', '#1a1a1a']; }

        // Adjust colors based on time of day for immersion
        let timeOverlay = 'rgba(0,0,0,0)';
        if (timeOfDay === 'Sore') timeOverlay = 'rgba(255, 150, 50, 0.1)';
        else if (timeOfDay === 'Malam') timeOverlay = 'rgba(10, 20, 80, 0.3)';
        
        document.body.style.backgroundImage = `
            radial-gradient(circle at center, ${timeOverlay}, ${timeOverlay}),
            radial-gradient(circle at center, ${baseColor} 0%, ${endColor} 80%)
        `;

    }, [gameState?.location, gameState?.timeOfDay]);

    // Effect for critical hit flash
    useEffect(() => {
        if (gameState?.rollResult?.critical === 'success') {
            setShowCritFlash(true);
            const timer = setTimeout(() => setShowCritFlash(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState?.rollResult]);

    // Effect for triggering dice animation
    useEffect(() => {
        if (gameState?.rollResult || gameState?.oracleResult) {
            setAnimationTrigger(prev => prev + 1);
        }
    }, [gameState?.rollResult, gameState?.oracleResult]);


    const handleStart = useCallback(async () => {
        setStatus(GameStatus.Creating);
        setError(null);
        try {
            const initialState = await startAdventure();
            setGameState(initialState);
            setStatus(GameStatus.Playing);
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat memulai petualangan.');
            setStatus(GameStatus.Error);
        }
    }, []);

    const handleSubmit = useCallback(async (action: string) => {
        if (!action.trim()) return;
        setStatus(GameStatus.Creating);
        setError(null);
        setUserInput('');
        setOracleQuery('');
        setDirectorInput('');

        try {
            const newState = await sendPlayerAction(action);
            setGameState(newState);
            setStatus(GameStatus.Playing);
        } catch (err: any) {
            setError(err.message || 'Gagal mengirim aksi.');
            setStatus(GameStatus.Error);
        }
    }, []);

    const handleActionFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit(userInput);
    };
    
    const handleOracleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit(`[ORACLE_QUERY] ${oracleQuery}`);
    };

    const handleDirectorFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit(`[SUTRADARA] ${directorInput}`);
    };
    
    const handleInteractiveClick = (text: string) => {
        setUserInput(prev => `${prev} ${text}`.trim());
    };
    
    const toggleMute = () => {
        if (!isMuted) {
             speechSynthesis.cancel();
             setIsSpeaking(false);
        }
        setIsMuted(!isMuted);
    };

    const stopSpeech = () => {
        speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const renderContent = () => {
        if (status === GameStatus.Start) {
            return (
                <div className="start-screen-minimalist">
                    <h1 className="title-main">Mesin Petualangan</h1>
                    <p className="subtitle-descriptive">
                        Sebuah Kanvas Cerita Tanpa Batas, Ditenagai Imajinasimu.
                    </p>
                    <button onClick={handleStart} className="button-modern-start">
                        Ciptakan Dunia
                    </button>
                </div>
            );
        }

        if (status === GameStatus.Creating && !gameState) {
             return (
                <div className="loading-container-minimalist">
                    <h2 className="text-3xl text-yellow-300 mb-2 loading-text-pulse">Merajut Takdir...</h2>
                    <MinimalistLoadingAnimation />
                    <p className="text-gray-400">Sang Dalang sedang mempersiapkan ceritamu.</p>
                </div>
            );
        }
        
        if (status === GameStatus.Error) {
            return (
                <div className="text-center p-8 bg-red-900/50 border border-red-700 rounded-lg">
                    <h2 className="text-3xl text-red-400 mb-4">Waduh, Ada Masalah!</h2>
                    <p className="text-red-300 mb-6">{error}</p>
                    <button onClick={handleStart} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg">
                        Coba Mulai Lagi
                    </button>
                </div>
            );
        }
        
        if (gameState && (status === GameStatus.Playing || status === GameStatus.Creating)) {
            const isSubmitting = status === GameStatus.Creating;
            const { character, narrative, location, choices, rollResult, oracleResult, log, worldState, timeOfDay, currentWeather } = gameState;
            return (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Character Sheet */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-bold text-yellow-300">{character.name}</h2>
                                    <p className="text-gray-400">{character.race} {character.class} - Level {character.level}</p>
                                </div>
                                <div className="text-lg font-mono text-yellow-300 bg-black/30 px-3 py-1 rounded-md flex items-center gap-2">
                                    <CoinIcon />
                                    <span>{character.uangKepeng}</span>
                                </div>
                            </div>
                        </div>
                        <ProgressBar value={character.hp} max={character.maxHp} label="HP" color="bg-red-600" />
                        <ProgressBar value={character.exp} max={character.expToNextLevel} label="EXP" color="bg-green-500" />
                        <StatDisplay stats={character.stats} />
                         <CollapsiblePanel title="Kepribadian & Kelangsungan Hidup">
                            <div className="space-y-4">
                                <PersonalityPanel personality={character.personality} />
                                <hr className="border-gray-700 my-4" />
                                <SurvivalPanel survival={character.survival} />
                            </div>
                        </CollapsiblePanel>
                        <CollapsiblePanel title="Inventaris">
                           <InventoryPanel inventory={character.inventory} />
                        </CollapsiblePanel>
                        <CollapsiblePanel title="Misi">
                           <QuestPanel quests={character.quests} />
                        </CollapsiblePanel>
                         <CollapsiblePanel title="Reputasi">
                           <ReputationPanel reputation={character.reputation} />
                        </CollapsiblePanel>
                        <CollapsiblePanel title="Kondisi Dunia">
                           <WorldStatePanel worldState={worldState} />
                        </CollapsiblePanel>
                         <CollapsiblePanel title="Log Lengkap">
                            <LogPanel log={log} />
                        </CollapsiblePanel>
                    </div>

                    {/* Right Column: Narrative & Actions */}
                    <div className="lg:col-span-2 space-y-4">
                         <div className="bg-gray-800 p-6 rounded-lg shadow-lg relative">
                            <div className="absolute top-2 right-2 flex space-x-2">
                                <button onClick={toggleMute} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
                                    {isMuted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
                                </button>
                                {isSpeaking && (
                                    <button onClick={stopSpeech} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
                                        <StopIcon />
                                    </button>
                                )}
                            </div>
                            <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                                <h3 className="text-xl font-semibold text-cyan-400">{location}</h3>
                                <WorldAmbiance timeOfDay={timeOfDay} weather={currentWeather} />
                            </div>
                            <div className="narrative-container max-w-none max-h-[50vh] overflow-y-auto pr-2">
                              <InteractiveNarrative text={narrative} onInteractiveClick={handleInteractiveClick} />
                              <div ref={narrativeEndRef}></div>
                            </div>
                        </div>
                        
                        <ObjectiveTracker quests={character.quests} />

                        {rollResult && <RollResultDisplay result={rollResult} animationTrigger={animationTrigger} />}
                        {oracleResult && <OracleResultDisplay result={oracleResult} animationTrigger={animationTrigger} />}

                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg space-y-4">
                            <div>
                                <h3 className="text-lg font-bold mb-3 text-gray-200">Apa yang akan kamu lakukan?</h3>
                                <form onSubmit={handleActionFormSubmit} className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="text"
                                        value={userInput}
                                        onChange={e => setUserInput(e.target.value)}
                                        placeholder="Ketik aksimu di sini..."
                                        className="flex-grow bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        disabled={isSubmitting}
                                    />
                                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center" disabled={isSubmitting}>
                                        {isSubmitting ? <><SpinnerIcon /> Mengirim...</> : 'Kirim'}
                                    </button>
                                </form>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {choices.map((choice, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleSubmit(choice)}
                                        className="text-left w-full bg-gray-700 hover:bg-gray-600 text-gray-300 p-3 rounded-md text-sm transition-colors duration-200 disabled:bg-gray-800 disabled:text-gray-500"
                                        disabled={isSubmitting}
                                    >
                                        {choice}
                                    </button>
                                ))}
                            </div>

                            <hr className="border-gray-700"/>

                            <div className="space-y-4">
                                <h3 className="text-md font-semibold text-gray-300">Meta-Aksi</h3>
                                <form onSubmit={handleOracleFormSubmit} className="flex gap-2">
                                     <input
                                        type="text"
                                        value={oracleQuery}
                                        onChange={e => setOracleQuery(e.target.value)}
                                        placeholder="Tanya pada Oracle (Ya/Tidak)..."
                                        className="flex-grow bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                        disabled={isSubmitting}
                                    />
                                    <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed text-sm" disabled={isSubmitting || !oracleQuery}>
                                        Tanya
                                    </button>
                                </form>
                                 <form onSubmit={handleDirectorFormSubmit} className="flex gap-2">
                                     <input
                                        type="text"
                                        value={directorInput}
                                        onChange={e => setDirectorInput(e.target.value)}
                                        placeholder="Instruksi untuk Dalang..."
                                        className="flex-grow director-input border rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-sm"
                                        disabled={isSubmitting}
                                    />
                                    <button type="submit" className="director-button font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed text-sm flex items-center" disabled={isSubmitting || !directorInput}>
                                        <MegaphoneIcon /> Arahkan
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        
        return null;
    };
    
    return (
        <div className="container mx-auto p-2 sm:p-4 max-w-screen-xl">
             {showCritFlash && <div className="crit-flash-overlay"></div>}
             <EventAnnouncer notifications={notifications} />
            {status !== GameStatus.Start && <Header />}
            <main>
                {renderContent()}
            </main>
        </div>
    );
};

export default App;