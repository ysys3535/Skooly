// src/constants/regionData.js
import { RAW_REGION_DATA } from "./regionRaw";

/**
 * RAW_REGION_DATA:
 *   시/도 → 시/군/구 → 읍/면/동 → [도로명 리스트]
 *
 * REGION_DATA:
 *   시/도 → 시/군/구 → [읍/면/동 리스트]
 *   (도로명은 완전히 제거)
 */
export const REGION_DATA = Object.fromEntries(
  Object.entries(RAW_REGION_DATA).map(([sido, sigunguObj]) => [
    sido,
    Object.fromEntries(
      Object.entries(sigunguObj).map(([sigungu, dongObj]) => [
        sigungu,
        Object.keys(dongObj), // 읍/면/동 이름만 남김
      ])
    ),
  ])
);
