const API_URL = 'http://localhost:5000/api/sarvam';

export const sarvamService = {
  /**
   * Speech-to-Text: sends audio Blob to proxy, returns transcript string
   */
  async transcribeAudio(audioBlob: Blob, language?: string): Promise<string> {
    const form = new FormData();
    form.append('file', audioBlob, 'audio.wav');
    if (language) form.append('language_code', language);

    const response = await fetch(`${API_URL}/stt`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'STT request failed' }));
      throw new Error(err.error || 'STT failed');
    }

    const data = await response.json();
    return data.transcript || '';
  },

  /**
   * Text-to-Speech: sends text to proxy, returns an HTMLAudioElement ready to play
   */
  async speak(text: string, language?: string, speaker?: string): Promise<HTMLAudioElement> {
    const response = await fetch(`${API_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language, speaker }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'TTS request failed' }));
      throw new Error(err.error || 'TTS failed');
    }

    const data = await response.json();
    const audioBase64 = data.audio_base64;
    const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
    return audio;
  },
};
