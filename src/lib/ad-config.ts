// Ad banner config — Full-width AdMob/Yandex banner anchored to the top header zone.
// Stretches edge-to-edge (width: 100%, zero side margins) per Trivo Elite V6 spec.
export const BANNER_HEIGHT = 50;

export const AD_CONFIG = {
  BANNER_HEIGHT,
  BANNER_WIDTH: 320, // legacy reference only — runtime layout uses 100% width
  FULL_WIDTH: true,
  Z_INDEX: 10,
  TOP_OFFSET: 0,
  BOTTOM_NAV_HEIGHT: 60,
} as const;

export const getBottomNavOffset = () => `${AD_CONFIG.BOTTOM_NAV_HEIGHT}px`;

export const getAppTopOffset = () => `${BANNER_HEIGHT + AD_CONFIG.TOP_OFFSET}px`;
