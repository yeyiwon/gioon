"use client";
import { useEffect, useState } from "react";
import { fetchWeather, rememberLocation, SKY_KO, type Sky, type Weather } from "@/lib/weather";

/** 앱 캐릭터와 같은 톤의 동글동글한 날씨 아이콘 (살짝 움직임, 동작 줄이기 설정 시 정지) */
export function WeatherIcon({ sky, day = true, size = 30 }: { sky: Sky; day?: boolean; size?: number }) {
  const cloud = (x: number, y: number, s: number, fill: string) => (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M7 18h10.5a4.5 4.5 0 0 0 .6-8.96A6 6 0 0 0 6.3 10.2 4 4 0 0 0 7 18z"
      fill={fill}
      stroke="rgba(17,18,22,0.12)"
      strokeWidth={1 / s}
    />
  );
  const sun = (cx: number, cy: number, r: number) => (
    <g className="wx-spin" style={{ transformOrigin: `${cx}px ${cy}px` }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={cx - 0.9} y={cy - r - 3.6} width="1.8" height="2.6" rx="0.9" fill="#ffb800" transform={`rotate(${i * 45} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="#ffc628" />
    </g>
  );
  // 초승달: 22×22 기준 경로를 위치·크기만 바꿔 쓴다
  const moon = (cx: number, cy: number, r: number) => (
    <path transform={`translate(${cx - r} ${cy - r}) scale(${r / 11})`} d="M13 0a11 11 0 1 0 9 16.5A9 9 0 0 1 13 0z" fill="#ffd86b" />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="wx">
      {sky === "clear" && (day ? sun(16, 16, 6.5) : moon(14, 16, 8))}
      {sky === "partly" && (
        <>
          {day ? sun(12, 12, 5) : moon(11, 11, 6)}
          {cloud(6, 9, 1, "#ffffff")}
        </>
      )}
      {(sky === "cloudy" || sky === "fog") && (
        <>
          {cloud(9, 4, 0.85, "#dfe4ee")}
          {cloud(3, 8, 1, "#f1f3f8")}
        </>
      )}
      {sky === "fog" && (
        <g stroke="#b5bccb" strokeWidth="1.8" strokeLinecap="round">
          <path d="M6 26h14M10 29.5h14" />
        </g>
      )}
      {sky === "rain" && (
        <>
          {cloud(3, 2, 1, "#e6eaf3")}
          {[9, 15, 21].map((x, i) => (
            <path key={x} className="wx-drop" style={{ animationDelay: `${i * 0.25}s` }} d={`M${x} 22c1.4 2 2 3 2 3.8a2 2 0 0 1-4 0c0-.8.6-1.8 2-3.8z`} fill="#4f8bff" />
          ))}
        </>
      )}
      {sky === "snow" && (
        <>
          {cloud(3, 2, 1, "#eef1f7")}
          {[9, 15.5, 22].map((x, i) => (
            <circle key={x} className="wx-drop" style={{ animationDelay: `${i * 0.3}s` }} cx={x} cy={25} r="1.9" fill="#9fc0ff" />
          ))}
        </>
      )}
      {sky === "thunder" && (
        <>
          {cloud(3, 2, 1, "#c9cfdc")}
          <path className="wx-flash" d="M16.5 19l-4 6.5h3.5l-1.5 5 5.5-7.5h-3.6l1.6-4z" fill="#ffc628" stroke="#e0a400" strokeWidth="0.6" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/** 오늘 화면 상단의 날씨 칩. 기본은 서울, 누르면 내 위치로 바꾼다 */
export function WeatherChip() {
  const [w, setW] = useState<Weather | null>(null);
  const [failed, setFailed] = useState(false);
  const load = () =>
    fetchWeather().then((d) => {
      setW(d);
      setFailed(!d);
    });
  useEffect(() => {
    let alive = true;
    fetchWeather().then((d) => {
      if (!alive) return;
      setW(d);
      setFailed(!d);
    });
    return () => {
      alive = false;
    };
  }, []);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        rememberLocation(p.coords.latitude, p.coords.longitude);
        load();
      },
      () => {},
      { maximumAge: 30 * 60_000, timeout: 8000 },
    );
  };

  if (failed) return null;
  if (!w) return <span className="wx-chip wx-skel" aria-hidden />;
  return (
    <button
      className="wx-chip"
      onClick={w.place === "내 위치" ? load : useMyLocation}
      aria-label={`${w.place} ${SKY_KO[w.sky]} ${w.temp}도, 최고 ${w.max}도 최저 ${w.min}도${w.place === "내 위치" ? "" : ". 눌러서 내 위치 날씨 보기"}`}
    >
      <WeatherIcon sky={w.sky} day={w.day} />
      <span className="wx-text">
        <b>{w.temp}°</b>
        <small>
          {w.place} · {w.max}°/{w.min}°
        </small>
      </span>
    </button>
  );
}
