import { Coordinates, CalculationMethod, PrayerTimes, Prayer } from 'adhan';
import { formatInTimeZone } from 'date-fns-tz';

export type CalculationMethodType = keyof typeof CalculationMethod;

export const getPrayerTimes = (
  latitude: number,
  longitude: number,
  method: CalculationMethodType = 'Egyptian',
  date: Date = new Date()
) => {
  const coords = new Coordinates(latitude, longitude);
  const params = CalculationMethod[method]();
  const prayerTimes = new PrayerTimes(coords, date, params);

  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
    current: prayerTimes.currentPrayer(),
    next: prayerTimes.nextPrayer(),
    timeForNext: prayerTimes.timeForPrayer(prayerTimes.nextPrayer()),
  };
};

export const calculationMethods = [
  { id: 'Egyptian', name: 'Egyptian General Authority of Survey' },
  { id: 'UmmAlQura', name: 'Umm Al-Qura University, Makkah' },
  { id: 'MuslimWorldLeague', name: 'Muslim World League' },
  { id: 'NorthAmerica', name: 'ISNA (North America)' },
  { id: 'Dubai', name: 'Dubai' },
  { id: 'Kuwait', name: 'Kuwait' },
  { id: 'Qatar', name: 'Qatar' },
  { id: 'Singapore', name: 'Singapore' },
  { id: 'Turkey', name: 'Turkey' },
];
