export class AudioAgent {
  static async generateNarration(prompt: string): Promise<string | null> {
    try {
      const response = await fetch('/api/ai/generate-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error('Failed to generate narration via server');
      const data = await response.json();
      const base64Audio = data.base64Audio;
      if (base64Audio) {
        // The model returns raw PCM (16-bit, mono, 24000Hz).
        // Browser <audio> tags need a container like WAV.
        return this.pcmToWav(base64Audio, 24000);
      }
      return null;
    } catch (error) {
      console.error("AudioAgent error:", error);
      return null;
    }
  }

  private static pcmToWav(base64Pcm: string, sampleRate: number): string {
    const pcmData = Uint8Array.from(atob(base64Pcm), c => c.charCodeAt(0));
    const dataSize = pcmData.length;
    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + dataSize, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    this.writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, dataSize, true);

    const wavData = new Uint8Array(44 + dataSize);
    wavData.set(new Uint8Array(header), 0);
    wavData.set(pcmData, 44);

    // More robust base64 conversion
    let binary = '';
    const bytes = new Uint8Array(wavData);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Wav = btoa(binary);
    return `data:audio/wav;base64,${base64Wav}`;
  }

  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
