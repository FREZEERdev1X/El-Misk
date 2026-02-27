/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  BookOpen, 
  Fingerprint, 
  Heart, 
  Settings as SettingsIcon, 
  Compass,
  Moon,
  Sun,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  MapPin
} from 'lucide-react';
import './lib/i18n';
import { useLocation } from './hooks/useLocation';
import { getPrayerTimes, calculationMethods, CalculationMethodType } from './lib/adhan';
import { morningAthkar, eveningAthkar, afterPrayerAthkar } from './data/athkar';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'prayer' | 'quran' | 'tasbeeh' | 'athkar' | 'qibla' | 'settings';

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('prayer');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [calcMethod, setCalcMethod] = useState<CalculationMethodType>(() => (localStorage.getItem('calcMethod') as CalculationMethodType) || 'Egyptian');
  const [adhanEnabled, setAdhanEnabled] = useState(() => localStorage.getItem('adhanEnabled') !== 'false');
  const [selectedAdhan, setSelectedAdhan] = useState(() => localStorage.getItem('selectedAdhan') || 'makkah');
  const [isManualLocation, setIsManualLocation] = useState(() => localStorage.getItem('isManualLocation') === 'true');
  const [manualLocation, setManualLocation] = useState<{ latitude: number, longitude: number, city: string } | null>(() => {
    const saved = localStorage.getItem('manualLocation');
    return saved ? JSON.parse(saved) : null;
  });

  const { location: gpsLocation, error: locationError } = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastAdhanPlayed, setLastAdhanPlayed] = useState<string | null>(null);

  const activeLocation = isManualLocation ? manualLocation : gpsLocation;

  const adhanSounds: Record<string, string> = {
    makkah: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
    madinah: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
    calm: 'https://www.islamcan.com/audio/adhan/azan10.mp3',
  };

  const playAdhan = (soundKey?: string) => {
    const audio = new Audio(adhanSounds[soundKey || selectedAdhan]);
    audio.play().catch(e => console.error("Audio playback failed:", e));
  };

  // RTL Support
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    const handleChangeTab = (e: any) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('changeTab', handleChangeTab);
    return () => window.removeEventListener('changeTab', handleChangeTab);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('calcMethod', calcMethod);
  }, [calcMethod]);

  useEffect(() => {
    localStorage.setItem('adhanEnabled', adhanEnabled.toString());
  }, [adhanEnabled]);

  useEffect(() => {
    localStorage.setItem('selectedAdhan', selectedAdhan);
  }, [selectedAdhan]);

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [isRTL, theme]);

  const prayerTimes = useMemo(() => {
    if (!activeLocation) return null;
    return getPrayerTimes(activeLocation.latitude, activeLocation.longitude, calcMethod, currentTime);
  }, [activeLocation, calcMethod, currentTime]);

  // Check for prayer times to play Adhan
  useEffect(() => {
    if (!adhanEnabled || !prayerTimes) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    
    for (const p of prayers) {
      const pTime = prayerTimes[p as keyof typeof prayerTimes] as Date;
      if (pTime) {
        const pMinutes = pTime.getHours() * 60 + pTime.getMinutes();
        const todayKey = `${now.toDateString()}-${p}`;

        if (currentMinutes === pMinutes && lastAdhanPlayed !== todayKey) {
          playAdhan();
          setLastAdhanPlayed(todayKey);
          break;
        }
      }
    }
  }, [currentTime, adhanEnabled, prayerTimes, lastAdhanPlayed]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300 font-sans",
      theme === 'dark' ? "bg-[#0a0a0a] text-white" : "bg-[#f8f9fa] text-slate-900"
    )}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-opacity-80 border-b border-black/5 dark:border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
            M
          </div>
          <h1 className="text-xl font-bold tracking-tight">{t('appName')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={toggleLanguage} className="text-sm font-medium px-3 py-1 rounded-full border border-black/10 dark:border-white/10">
            {i18n.language === 'ar' ? 'EN' : 'عربي'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 pt-4 px-4 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'prayer' && (
              <PrayerSection 
                prayerTimes={prayerTimes} 
                currentTime={currentTime} 
                location={activeLocation} 
                adhanEnabled={adhanEnabled}
              />
            )}
            {activeTab === 'quran' && <QuranSection />}
            {activeTab === 'tasbeeh' && <TasbeehSection />}
            {activeTab === 'athkar' && <AthkarSection />}
            {activeTab === 'qibla' && <QiblaSection location={activeLocation} />}
            {activeTab === 'settings' && (
              <SettingsSection 
                calcMethod={calcMethod} 
                setCalcMethod={setCalcMethod} 
                adhanEnabled={adhanEnabled}
                setAdhanEnabled={setAdhanEnabled}
                selectedAdhan={selectedAdhan}
                setSelectedAdhan={setSelectedAdhan}
                playAdhan={playAdhan}
                isManualLocation={isManualLocation}
                setIsManualLocation={setIsManualLocation}
                manualLocation={manualLocation}
                setManualLocation={setManualLocation}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#141414] border-t border-black/5 dark:border-white/5 px-2 py-2 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <NavButton active={activeTab === 'prayer'} onClick={() => setActiveTab('prayer')} icon={<Clock size={20} />} label={t('prayerTimes')} />
          <NavButton active={activeTab === 'quran'} onClick={() => setActiveTab('quran')} icon={<BookOpen size={20} />} label={t('quran')} />
          <NavButton active={activeTab === 'tasbeeh'} onClick={() => setActiveTab('tasbeeh')} icon={<Fingerprint size={20} />} label={t('tasbeeh')} />
          <NavButton active={activeTab === 'athkar'} onClick={() => setActiveTab('athkar')} icon={<Heart size={20} />} label={t('athkar')} />
          <NavButton active={activeTab === 'qibla'} onClick={() => setActiveTab('qibla')} icon={<Compass size={20} />} label={t('qibla')} />
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20} />} label={t('settings')} />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
        active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      {active && <motion.div layoutId="nav-indicator" className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />}
    </button>
  );
}

// --- Sections ---

function PrayerSection({ 
  prayerTimes, 
  currentTime, 
  location, 
  adhanEnabled 
}: { 
  prayerTimes: any, 
  currentTime: Date, 
  location: any, 
  adhanEnabled: boolean 
}) {
  const { t, i18n } = useTranslation();
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const hijriDate = useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language + '-u-ca-islamic-uma', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(currentTime);
  }, [currentTime, i18n.language]);

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="p-4 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
          <MapPin size={32} />
        </div>
        <p className="text-sm font-semibold opacity-90">
          {t('errorLocation')}
        </p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'settings' }))}
          className="text-emerald-600 font-bold text-sm underline"
        >
          {t('settings')}
        </button>
      </div>
    );
  }

  const prayers = [
    { id: 'fajr', label: t('fajr'), time: prayerTimes?.fajr },
    { id: 'sunrise', label: t('sunrise'), time: prayerTimes?.sunrise },
    { id: 'dhuhr', label: t('dhuhr'), time: prayerTimes?.dhuhr },
    { id: 'asr', label: t('asr'), time: prayerTimes?.asr },
    { id: 'maghrib', label: t('maghrib'), time: prayerTimes?.maghrib },
    { id: 'isha', label: t('isha'), time: prayerTimes?.isha },
  ];

  const isFriday = currentTime.getDay() === 5;

  return (
    <div className="space-y-6">
      {/* Friday Reminder */}
      {isFriday && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
            <Sun size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">{t('fridayReminder')}</h4>
            <p className="text-xs text-amber-700 dark:text-amber-300 opacity-80">{t('fridaySunnah')}</p>
          </div>
        </motion.div>
      )}

      {/* Hero Card */}
      <div className="relative overflow-hidden bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-900/20">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">{hijriDate}</p>
              <p className="text-emerald-100 text-xs opacity-80 mb-4">{t('nextPrayer')}</p>
            </div>
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              {adhanEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            {prayerTimes?.next ? t(prayerTimes.next.toLowerCase()) : '--'}
          </h2>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-mono font-light">
              {currentTime.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Prayer List */}
      <div className="grid gap-3">
        {prayers.map((prayer) => {
          const isCurrent = prayerTimes?.current === prayer.id;
          
          return (
            <div 
              key={prayer.id}
              className={cn(
                "flex justify-between items-center p-5 rounded-2xl transition-all border",
                isCurrent 
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" 
                  : "bg-white dark:bg-[#1a1a1a] border-black/5 dark:border-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isCurrent ? "bg-emerald-500 animate-pulse" : "bg-gray-300 dark:bg-gray-700"
                )} />
                <span className={cn("font-medium", isCurrent && "text-emerald-600 dark:text-emerald-400")}>
                  {prayer.label}
                </span>
              </div>
              <span className={cn("font-mono", isCurrent && "font-bold text-emerald-600 dark:text-emerald-400")}>
                {prayer.time ? formatTime(prayer.time) : '--:--'}
              </span>
            </div>
          );
        })}
      </div>

      <PrayerLog prayerTimes={prayerTimes} />
    </div>
  );
}

function QuranSection() {
  const { t, i18n } = useTranslation();
  const [surahs, setSurahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<any>(null);
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState(false);

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(data => {
        setSurahs(data.data);
        setLoading(false);
      });
  }, []);

  const fetchAyahs = (number: number) => {
    setLoadingAyahs(true);
    fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.alafasy`)
      .then(res => res.json())
      .then(data => {
        setAyahs(data.data.ayahs);
        setLoadingAyahs(false);
      });
  };

  const handleSurahClick = (surah: any) => {
    setSelectedSurah(surah);
    fetchAyahs(surah.number);
  };

  const filteredSurahs = surahs.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.englishName.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedSurah) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedSurah(null)}
          className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-4"
        >
          <ChevronLeft size={16} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
          {t('back')}
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold mb-2">{selectedSurah.name}</h2>
          <p className="text-sm font-bold opacity-80 dark:opacity-95">{selectedSurah.englishName} • {selectedSurah.revelationType}</p>
        </div>

        {loadingAyahs ? (
          <div className="py-20 text-center opacity-70 dark:opacity-90">{t('loading')}</div>
        ) : (
          <div className="space-y-8">
            {selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
              <div className="text-center text-2xl font-serif py-4 opacity-80">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-8 text-right" dir="rtl">
              {ayahs.map((ayah) => (
                <div key={ayah.number} className="text-2xl font-serif leading-[2.5] text-justify w-full">
                  {ayah.text}
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-emerald-500/30 text-xs font-mono mx-2 text-emerald-600">
                    {ayah.numberInSurah}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input 
          type="text"
          placeholder={t('searchSurah')}
          className="w-full bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm placeholder:text-slate-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-3">
        {loading ? (
          <div className="py-10 text-center opacity-70 dark:opacity-90">{t('loading')}</div>
        ) : (
          filteredSurahs.map((surah) => (
            <button 
              key={surah.number}
              onClick={() => handleSurahClick(surah)}
              className="flex justify-between items-center p-5 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/5 hover:border-emerald-500/30 transition-all text-start"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold text-sm">
                  {surah.number}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{i18n.language === 'ar' ? surah.name : surah.englishName}</h3>
                  <p className="text-xs opacity-80 dark:opacity-95 font-medium">{surah.englishNameTranslation} • {surah.numberOfAyahs} {t('ayahs')}</p>
                </div>
              </div>
              <div className="text-emerald-600 dark:text-emerald-400">
                <ChevronRight size={20} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function TasbeehSection() {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
    setTotal(prev => prev + 1);
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-12">
      <div className="text-center">
        <p className="text-sm font-bold opacity-80 dark:opacity-95 mb-2">{t('total')}: {total}</p>
        <motion.div 
          key={count}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-8xl font-mono font-light tracking-tighter"
        >
          {count}
        </motion.div>
      </div>

      <button 
        onClick={handleIncrement}
        className="w-64 h-64 rounded-full bg-emerald-600 shadow-2xl shadow-emerald-900/30 flex items-center justify-center active:scale-95 transition-transform border-8 border-emerald-500/30"
      >
        <div className="w-56 h-56 rounded-full border-2 border-white/20 flex items-center justify-center">
          <Fingerprint size={80} className="text-white opacity-80" />
        </div>
      </button>

      <button 
        onClick={handleReset}
        className="px-8 py-3 bg-black/5 dark:bg-white/5 rounded-full text-sm font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        {t('reset')}
      </button>
    </div>
  );
}

function AthkarSection() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<'morning' | 'evening' | 'afterPrayer'>('morning');

  const currentAthkar = category === 'morning' ? morningAthkar : category === 'evening' ? eveningAthkar : afterPrayerAthkar;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <CategoryTab active={category === 'morning'} onClick={() => setCategory('morning')} label={t('morningAthkar')} />
        <CategoryTab active={category === 'evening'} onClick={() => setCategory('evening')} label={t('eveningAthkar')} />
        <CategoryTab active={category === 'afterPrayer'} onClick={() => setCategory('afterPrayer')} label={t('afterPrayerAthkar')} />
      </div>

      <div className="grid gap-4">
        {currentAthkar.map((thikr) => (
          <ThikrCard key={thikr.id} thikr={thikr} />
        ))}
      </div>
    </div>
  );
}

function CategoryTab({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition-all",
        active 
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
          : "bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5"
      )}
    >
      {label}
    </button>
  );
}

function ThikrCard({ thikr }: any) {
  const [count, setCount] = useState(thikr.count);
  const isDone = count === 0;

  const handleDecrement = () => {
    if (count > 0) {
      setCount(prev => prev - 1);
      if ('vibrate' in navigator) navigator.vibrate(30);
    }
  };

  return (
    <button 
      onClick={handleDecrement}
      disabled={isDone}
      className={cn(
        "p-6 rounded-3xl border transition-all text-start relative overflow-hidden",
        isDone 
          ? "bg-gray-100 dark:bg-[#1a1a1a] border-transparent opacity-50" 
          : "bg-white dark:bg-[#1a1a1a] border-black/5 dark:border-white/5 hover:border-emerald-500/30"
      )}
    >
      <p className="text-lg leading-relaxed mb-4 font-serif font-medium text-slate-900 dark:text-white">{thikr.text}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs opacity-80 dark:opacity-95 font-bold">{thikr.reference}</span>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
          isDone ? "bg-emerald-500 text-white" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        )}>
          {count}
        </div>
      </div>
      {isDone && <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="absolute bottom-0 left-0 h-1 bg-emerald-500" />}
    </button>
  );
}

function PrayerLog({ prayerTimes }: { prayerTimes: any }) {
  const { t } = useTranslation();
  const [log, setLog] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('prayerLog');
    return saved ? JSON.parse(saved) : {};
  });

  const today = new Date().toISOString().split('T')[0];

  const togglePrayer = (prayerId: string) => {
    const key = `${today}-${prayerId}`;
    const newLog = { ...log, [key]: !log[key] };
    setLog(newLog);
    localStorage.setItem('prayerLog', JSON.stringify(newLog));
  };

  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 border border-black/10 dark:border-white/10 space-y-4 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider opacity-70 dark:opacity-90">{t('prayerTracker')}</h3>
      <div className="flex justify-between gap-2">
        {prayers.map((p) => {
          const isDone = log[`${today}-${p}`];
          return (
            <button 
              key={p}
              onClick={() => togglePrayer(p)}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border",
                isDone 
                  ? "bg-emerald-500 border-emerald-500 text-white" 
                  : "bg-gray-50 dark:bg-black/20 border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-300"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                isDone ? "border-white" : "border-gray-300 dark:border-gray-700"
              )}>
                {isDone && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className="text-[10px] font-bold uppercase">{t(p)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QiblaSection({ location }: { location: any }) {
  const { t } = useTranslation();
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    const handleOrientation = (e: any) => {
      if (e.webkitCompassHeading) {
        setHeading(e.webkitCompassHeading);
      } else if (e.alpha) {
        setHeading(360 - e.alpha);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Simple Qibla calculation (Makkah is approx 21.4225° N, 39.8262° E)
  const qiblaAngle = useMemo(() => {
    if (!location) return 0;
    const phiK = 21.4225 * Math.PI / 180;
    const lambdaK = 39.8262 * Math.PI / 180;
    const phi = location.latitude * Math.PI / 180;
    const lambda = location.longitude * Math.PI / 180;
    
    const y = Math.sin(lambdaK - lambda);
    const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
    let qibla = Math.atan2(y, x) * 180 / Math.PI;
    return (qibla + 360) % 360;
  }, [location]);

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-12">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold mb-2">{t('qibla')}</h2>
        <p className="text-sm font-medium opacity-80 dark:opacity-95">{t('rotatePhone')}</p>
      </div>

      <div className="relative w-64 h-64">
        <motion.div 
          animate={{ rotate: -heading }}
          className="absolute inset-0 border-4 border-black/5 dark:border-white/5 rounded-full"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full" />
          <div className="absolute inset-4 border border-dashed border-black/10 dark:border-white/10 rounded-full" />
        </motion.div>
        
        <motion.div 
          animate={{ rotate: qiblaAngle - heading }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-1 h-32 bg-emerald-500 rounded-full relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-8 border-r-8 border-b-12 border-l-transparent border-r-transparent border-b-emerald-500" />
          </div>
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white dark:bg-[#1a1a1a] rounded-full shadow-lg flex items-center justify-center border border-black/5 dark:border-white/5">
            <Compass size={24} className="text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="text-center font-mono text-xl">
        {Math.round(qiblaAngle)}°
      </div>
    </div>
  );
}

function SettingsSection({ 
  calcMethod, 
  setCalcMethod, 
  adhanEnabled, 
  setAdhanEnabled, 
  selectedAdhan, 
  setSelectedAdhan, 
  playAdhan,
  isManualLocation,
  setIsManualLocation,
  manualLocation,
  setManualLocation
}: { 
  calcMethod: CalculationMethodType, 
  setCalcMethod: (m: CalculationMethodType) => void,
  adhanEnabled: boolean,
  setAdhanEnabled: (v: boolean) => void,
  selectedAdhan: string,
  setSelectedAdhan: (v: string) => void,
  playAdhan: (s?: string) => void,
  isManualLocation: boolean,
  setIsManualLocation: (v: boolean) => void,
  manualLocation: any,
  setManualLocation: (v: any) => void
}) {
  const { t } = useTranslation();
  const [cityInput, setCityInput] = useState(manualLocation?.city || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const adhanOptions = [
    { id: 'makkah', name: t('adhanMakkah') },
    { id: 'madinah', name: t('adhanMadinah') },
    { id: 'calm', name: t('adhanCalm') },
  ];

  const handleSearchCity = async () => {
    if (!cityInput.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityInput)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLocation = { latitude: parseFloat(lat), longitude: parseFloat(lon), city: display_name };
        setManualLocation(newLocation);
        localStorage.setItem('manualLocation', JSON.stringify(newLocation));
        localStorage.setItem('isManualLocation', 'true');
        setIsManualLocation(true);
      } else {
        setSearchError('City not found');
      }
    } catch (err) {
      setSearchError('Error searching city');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleManualLocation = (val: boolean) => {
    setIsManualLocation(val);
    localStorage.setItem('isManualLocation', val.toString());
  };

  return (
    <div className="space-y-8">
      {/* Location Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider opacity-80 dark:opacity-95 px-2">{t('location')}</h3>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-black/10 dark:border-white/10 p-5 space-y-6 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium">{t('useGPS')}</span>
            <button 
              onClick={() => toggleManualLocation(false)}
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                !isManualLocation ? "border-emerald-500 bg-emerald-500" : "border-gray-300 dark:border-gray-700"
              )}
            >
              {!isManualLocation && <div className="w-2 h-2 bg-white rounded-full" />}
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('manualLocation')}</span>
              <button 
                onClick={() => toggleManualLocation(true)}
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  isManualLocation ? "border-emerald-500 bg-emerald-500" : "border-gray-300 dark:border-gray-700"
                )}
              >
                {isManualLocation && <div className="w-2 h-2 bg-white rounded-full" />}
              </button>
            </div>

            {isManualLocation && (
              <div className="space-y-3">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder={t('city')}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleSearchCity}
                  disabled={isSearching}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isSearching ? t('searching') : t('updateLocation')}
                </button>
                {searchError && <p className="text-xs text-red-500 px-1">{searchError}</p>}
                {manualLocation && (
                  <p className="text-[10px] opacity-60 px-1 truncate">
                    {manualLocation.city}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adhan Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider opacity-80 dark:opacity-95 px-2">{t('adhanSettings')}</h3>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-black/10 dark:border-white/10 p-5 space-y-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Volume2 size={20} />
              </div>
              <span className="font-medium">{t('enableAdhan')}</span>
            </div>
            <button 
              onClick={() => setAdhanEnabled(!adhanEnabled)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                adhanEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"
              )}
            >
              <motion.div 
                animate={{ x: adhanEnabled ? 24 : 2 }}
                className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          {adhanEnabled && (
            <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
              <div className="grid grid-cols-3 gap-2">
                {adhanOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedAdhan(opt.id)}
                    className={cn(
                      "py-2 px-1 rounded-xl text-[10px] font-bold border transition-all",
                      selectedAdhan === opt.id 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "bg-gray-50 dark:bg-black/20 border-black/5 dark:border-white/5 text-gray-400"
                    )}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => playAdhan()}
                className="w-full py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <Volume2 size={18} />
                {t('testAdhan')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider opacity-80 dark:opacity-95 px-2">{t('calculationMethod')}</h3>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-black/10 dark:border-white/10 overflow-hidden shadow-sm">
          {calculationMethods.map((method) => (
            <button 
              key={method.id}
              onClick={() => setCalcMethod(method.id as CalculationMethodType)}
              className={cn(
                "w-full flex justify-between items-center p-5 border-b border-black/5 dark:border-white/5 last:border-0 transition-colors",
                calcMethod === method.id ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400" : "hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <span className="text-sm font-medium">{method.name}</span>
              {calcMethod === method.id && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-emerald-600 rounded-3xl text-white">
        <h3 className="font-bold mb-2">Maskuna (مسكُنا) v1.0</h3>
        <p className="text-sm opacity-80 leading-relaxed">
          Designed to be your peaceful companion for daily worship. May Allah accept your good deeds.
        </p>
      </div>
    </div>
  );
}
