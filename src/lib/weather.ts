/** Open-Meteo (키 없는 무료 날씨 API). 위치는 소수 둘째 자리(약 1km)로 반올림해서만 보낸다 */
export type Sky = "clear" | "partly" | "cloudy" | "fog" | "rain" | "snow" | "thunder";
export interface Weather {
  temp: number;
  max: number;
  min: number;
  sky: Sky;
  day: boolean;
  place: string;
}

export const SKY_KO: Record<Sky, string> = {
  clear: "맑음",
  partly: "구름 조금",
  cloudy: "흐림",
  fog: "안개",
  rain: "비",
  snow: "눈",
  thunder: "뇌우",
};

/** WMO 날씨 코드 → 하늘 상태 */
export function skyOf(code: number): Sky {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 95) return "thunder";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  return "rain"; // 51–67, 80–82
}

const SEOUL = { lat: 37.57, lon: 126.98, place: "서울" };
const LOC_KEY = "gioon:loc";
const CACHE_KEY = "gioon:weather";

export function savedLocation(): { lat: number; lon: number; place: string } {
  try {
    const v = JSON.parse(localStorage.getItem(LOC_KEY) ?? "null");
    if (v && typeof v.lat === "number" && typeof v.lon === "number") return { ...v, place: "내 위치" };
  } catch {}
  return SEOUL;
}

export function rememberLocation(lat: number, lon: number) {
  try {
    localStorage.setItem(LOC_KEY, JSON.stringify({ lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 }));
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

export async function fetchWeather(): Promise<Weather | null> {
  const loc = savedLocation();
  const key = `${loc.lat},${loc.lon}`;
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null");
    // 30분 안에 다시 열면 캐시 사용
    if (c && c.key === key && Date.now() - c.at < 30 * 60_000) return c.data as Weather;
  } catch {}
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
      `&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const data: Weather = {
      temp: Math.round(j.current.temperature_2m),
      max: Math.round(j.daily.temperature_2m_max[0]),
      min: Math.round(j.daily.temperature_2m_min[0]),
      sky: skyOf(j.current.weather_code),
      day: j.current.is_day === 1,
      place: loc.place,
    };
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ key, at: Date.now(), data }));
    } catch {}
    return data;
  } catch {
    return null;
  }
}
