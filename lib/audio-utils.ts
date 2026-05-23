/**
 * Audio processing and optimization utility helpers.
 * Provides client-side extraction of the audio track from video/audio files
 * and downsamples to highly optimized 16kHz mono WAV format (ideal for speech-to-text / Whisper).
 */

/**
 * Converts a standard AudioBuffer into a highly optimized 16-bit signed PCM WAV Blob.
 */
export function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // 1 = Raw uncompressed PCM
  const bitDepth = 16;
  
  const resultLength = buffer.length * numOfChan * 2 + 44; // 44 bytes header
  const bufferArr = new ArrayBuffer(resultLength);
  const view = new DataView(bufferArr);
  
  let pos = 0;

  // Write WAV/RIFF Header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(resultLength - 8);                   // File size minus 8 bytes
  setUint32(0x45564157);                         // "WAVE"
  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // Format chunk length (16 bytes)
  setUint16(format);                             // Sample format (1 = PCM)
  setUint16(numOfChan);                          // Channel count
  setUint32(sampleRate);                         // Sample rate
  setUint32(sampleRate * numOfChan * (bitDepth / 8)); // Byte rate
  setUint16(numOfChan * (bitDepth / 8));         // Block align
  setUint16(bitDepth);                           // Bits per sample
  setUint32(0x61746164);                         // "data" chunk header
  setUint32(buffer.length * numOfChan * (bitDepth / 8)); // Data chunk size

  // Write interleaved audio channel data
  const channels = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  const length = buffer.length;
  for (let offset = 0; offset < length; offset++) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = channels[i][offset];
      
      // Clamp value between -1.0 and 1.0 to avoid clipping distortion
      if (sample > 1) sample = 1;
      else if (sample < -1) sample = -1;
      
      // Scale float sample to 16-bit signed integer range [-32768, 32767]
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, intSample, true);
      pos += 2;
    }
  }

  return new Blob([bufferArr], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

/**
 * Extracts the audio track from any browser-decodable audio or video file,
 * downsamples it to a standard 16000Hz mono stream, and encodes it into
 * a highly optimized WAV format.
 */
export async function extractAndDownsampleAudio(
  file: File,
  targetSampleRate: number = 16000
): Promise<Blob> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  const audioCtx = new AudioContextClass();
  
  try {
    // 1. Read file bytes as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 2. Decode the full media file (handles MP4, MOV, MP3, WAV, WebM, etc.)
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // 3. Setup OfflineAudioContext for extremely fast downsampling to 16kHz mono in the background
    const offlineCtx = new OfflineAudioContext(
      1, // 1 channel = Mono
      Math.round(audioBuffer.duration * targetSampleRate),
      targetSampleRate
    );

    // 4. Connect source buffer
    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(offlineCtx.destination);
    sourceNode.start(0);

    // 5. Render audio track downsampled
    const downsampledBuffer = await offlineCtx.startRendering();

    // 6. Encode downsampled buffer to WAV Blob
    return bufferToWav(downsampledBuffer);
  } finally {
    // Clean up AudioContext resource
    await audioCtx.close().catch(() => {});
  }
}
