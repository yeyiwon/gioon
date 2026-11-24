import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // R3F는 useFrame 안에서 three 객체(uniform, 행렬, 머티리얼)를 직접 바꾸는 방식이 기본이다
    files: ["src/three/**/*.{ts,tsx}"],
    rules: { "react-hooks/immutability": "off", "react-hooks/purity": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
