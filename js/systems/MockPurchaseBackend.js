// Etapa 12 — MockPurchaseBackend
// DEV ONLY. Simuleaza platform IAP (App Store / Google Play) fara backend real.
// Nu se activeaza in production build — real IAP este BLOCKED pana la platform config + backend receipt validation.

export function createMockPurchaseBackend(opts = {}) {
  const delay = typeof opts.delay === 'number' ? opts.delay : 500;
  const failRate = typeof opts.failRate === 'number' ? opts.failRate : 0.05;

  return {
    isMock: true,

    async processPurchase(productId, price) {
      await new Promise(r => setTimeout(r, delay));
      if (Math.random() < failRate) {
        return { ok: false, reason: 'mock_random_fail' };
      }
      return {
        ok: true,
        transactionId: 'mock_tx_' + Date.now() + '_' + Math.floor(Math.random() * 100000).toString(36),
        receipt: 'mock_receipt_' + productId,
        platform: 'mock'
      };
    },

    async restore() {
      await new Promise(r => setTimeout(r, delay));
      // Mock: n-are nimic sa restaureze
      return [];
    },

    getPlatform() { return 'mock'; }
  };
}
