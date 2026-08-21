module.exports = {
  fetch: jest.fn(async () => ({ isConnected: true, details: { ipAddress: '127.0.0.1' } })),
  addEventListener: jest.fn(() => jest.fn()),
};
module.exports.default = module.exports;
