module.exports = {
  DocumentDirectoryPath: '/tmp',
  exists: jest.fn(async () => false),
  readFile: jest.fn(async () => '{}'),
  writeFile: jest.fn(async () => undefined),
};
