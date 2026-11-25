import { expect, it } from "vitest";
import { skyOf } from "../weather";

it("WMO 날씨 코드를 하늘 상태로", () => {
  expect([0, 2, 3, 45, 53, 63, 81, 73, 86, 95].map(skyOf)).toEqual([
    "clear", "partly", "cloudy", "fog", "rain", "rain", "rain", "snow", "snow", "thunder",
  ]);
});
