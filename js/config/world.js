// Constante pentru topologia lumii — importate atat de environment.js
// (pentru a plasa entitatile), cat si de main.js (pentru triggere).

export const MAP_BOUNDS = 40;                       // gard perimetral: +/-40

export const SHOP_POSITIONS = {
  tool:    { x: 34, z: -36 },                       // NEXT TOOL sign
  upgrade: { x: 37, z: -36 }                        // UPGRADE sign
};

export const CABIN_POSITION = { x: 0, z: -8 };

export const SHOP_TRIGGER_R2  = 6.25;               // raza 2.5m (r^2)
export const CABIN_TRIGGER_R2 = 12;                 // raza ~3.46m
export const ICE_ZONE_RADIUS  = 2.2;                // gheata langa fiecare shop
