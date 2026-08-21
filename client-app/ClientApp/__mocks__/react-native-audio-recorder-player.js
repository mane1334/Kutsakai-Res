class AudioRecorderPlayer {
  startRecorder = jest.fn(async () => 'mock-audio-path');
  stopRecorder = jest.fn(async () => 'mock-audio-path');
  startPlayer = jest.fn(async () => 'mock-audio-path');
  stopPlayer = jest.fn(async () => undefined);
  addRecordBackListener = jest.fn();
  removeRecordBackListener = jest.fn();
  addPlayBackListener = jest.fn();
  removePlayBackListener = jest.fn();
}

module.exports = AudioRecorderPlayer;
module.exports.default = AudioRecorderPlayer;
