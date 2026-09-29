// Etapa 12 — EntitlementSystem
// Facade peste EntitlementStore + PlayerStore + VehicleStore pentru query-uri de ownership.
// Nu duplica state — doar citeste.

export function createEntitlementSystem({ entitlementStore, playerStore, vehicleStore }) {

  return {
    hasProduct(productId) {
      return entitlementStore.hasEntitlement(productId);
    },
    hasTool(toolId) {
      return playerStore.state.owned.includes(toolId);
    },
    hasVehicle(vehicleId) {
      return vehicleStore.state.owned.includes(vehicleId);
    },
    hasAttachment(attachmentId) {
      return vehicleStore.state.ownedAttachments.includes(attachmentId);
    },
    hasSeasonPass(seasonId) {
      return entitlementStore.hasSeasonPass(seasonId);
    },
    hasCosmetic(cosmeticId) {
      return entitlementStore.hasCosmetic(cosmeticId);
    },
    getAllOwned() {
      return {
        products: [...entitlementStore.state.owned],
        cosmetics: [...entitlementStore.state.ownedCosmetics],
        tools: [...playerStore.state.owned],
        vehicles: [...vehicleStore.state.owned],
        attachments: [...vehicleStore.state.ownedAttachments],
        seasonPasses: entitlementStore.state.seasonPasses.map(sp => sp.seasonId)
      };
    }
  };
}
