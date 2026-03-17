export class ImageAgent {
  static async generateImage(prompt: string): Promise<string | null> {
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error('Failed to generate image via server');
      const data = await response.json();
      const base64Image = data.base64Image;
      if (base64Image) {
        return `data:image/jpeg;base64,${base64Image}`;
      }
      return null;
    } catch (error) {
      console.error("ImageAgent error:", error);
      return null;
    }
  }
}
