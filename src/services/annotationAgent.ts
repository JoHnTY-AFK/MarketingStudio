export class AnnotationAgent {
  static async findFeature2D(prompt: string, imageBase64: string): Promise<{ x: number, y: number } | null> {
    try {
      const response = await fetch('/api/ai/annotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageBase64 })
      });

      if (!response.ok) throw new Error('Failed to annotate via server');
      const data = await response.json();
      const text = data.text || '';
      const match = text.match(/\[\s*\d+,\s*\d+,\s*\d+,\s*\d+\s*\]/);
      
      if (match) {
        const [ymin, xmin, ymax, xmax] = JSON.parse(match[0]);
        // Calculate center and normalize to 0-1
        const cx = ((xmin + xmax) / 2) / 1000;
        const cy = ((ymin + ymax) / 2) / 1000;
        return { x: cx, y: cy };
      }
      return null;
    } catch (error) {
      console.error("AnnotationAgent error:", error);
      return null;
    }
  }
}
