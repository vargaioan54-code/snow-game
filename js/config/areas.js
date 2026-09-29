// Etapa 4 — Areas. Fiecare Area = cerc (x, z, radius) pe harta, aliniat cu contract.area.
// Un Area apartine unei Location; un Contract se leaga de un Area prin areaId.

export const AREAS = [
  // ===== STARTER: loc_residential =====
  { id: 'area_house_alba',     locationId: 'loc_residential',    name: 'Casa Alba',       bounds: { x: -6,  z: 12, radius: 4 } },
  { id: 'area_house_bra',      locationId: 'loc_residential',    name: 'Casa Bra',        bounds: { x: -12, z: 18, radius: 4 } },
  { id: 'area_driveway_carp',  locationId: 'loc_residential',    name: 'Alee Carpen',     bounds: { x: -22, z: 4,  radius: 3 } },

  // ===== STARTER: loc_village_center =====
  { id: 'area_shop_entrance',  locationId: 'loc_village_center', name: 'Intrare Magazin', bounds: { x: 4,   z: -4, radius: 3 } },
  { id: 'area_market_square',  locationId: 'loc_village_center', name: 'Piateta',         bounds: { x: -3,  z: 2,  radius: 4 } },

  // ===== STARTER: loc_small_parking =====
  { id: 'area_parking_small',  locationId: 'loc_small_parking',  name: 'Parcare Mica',    bounds: { x: 16,  z: 8,  radius: 5 } },

  // ===== TOWN =====
  { id: 'area_market_street',  locationId: 'loc_market',         name: 'Market Street',   bounds: { x: 22,  z: -14, radius: 5 } },
  { id: 'area_school_yard',    locationId: 'loc_school_yard',    name: 'School Yard',     bounds: { x: -22, z: -18, radius: 6 } },

  // ===== INDUSTRIAL =====
  { id: 'area_warehouse_ramp', locationId: 'loc_warehouse',      name: 'Warehouse Ramp',  bounds: { x: -32, z: -4, radius: 7 } },
  { id: 'area_dock',           locationId: 'loc_loading_dock',   name: 'Loading Dock',    bounds: { x: 24,  z: 22, radius: 6 } },

  // ===== MOUNTAIN =====
  { id: 'area_lodge_drive',    locationId: 'loc_lodge_drive',    name: 'Lodge Drive',     bounds: { x: -28, z: 12, radius: 5.5 } },
  { id: 'area_ski_park',       locationId: 'loc_ski_parking',    name: 'Ski Parking',     bounds: { x: -18, z: 24, radius: 6.5 } }
];

export const AREA_BY_ID = Object.fromEntries(AREAS.map(a => [a.id, a]));

export function getAreasByLocation(locationId) {
  return AREAS.filter(a => a.locationId === locationId);
}
