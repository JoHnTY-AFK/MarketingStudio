// @ts-ignore
import filmDirectorPrompt from '../../docs/film_director_agent_prompt.md?raw';
// @ts-ignore
import presetDescriptions from '../../docs/preset_descriptions.md?raw';

export interface DirectorAction {
  action: 'frame_important_features' | 'adjust_screen_fill_and_alignment' | 'place_light_relative_to_focus' | 'set_light_properties';
  params: any;
}

export interface DirectorPlan {
  actions: DirectorAction[];
}

export interface FilmPlan {
  backdropPreset?: string;
  backdropPrompt?: string;
  presets: {
    name: string;
    duration: number;
    params?: any;
    animatedProp?: string;
    backgroundMusic?: string;
    narrationPrompt?: string;
    narrationAudio?: string;
  }[];
}

export class DirectorAgent {
  /**
   * Agent 1: Refines raw product details into a creative cinematic brief.
   */
  static async refineBrief(projectDetails: string): Promise<string> {
    try {
      const response = await fetch('/api/ai/refine-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectDetails })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to refine brief via server: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      return data.text || projectDetails;
    } catch (error) {
      console.error("Failed to refine brief:", error);
      return projectDetails;
    }
  }

  /**
   * Agent 2: Converts a refined brief into a structured FilmPlan.
   */
  static async parseFilmPrompt(brief: string, availableFocalPoints: string[] = []): Promise<FilmPlan> {
    const systemInstruction = `You are a world-class Film Director and Scene Designer specializing in high-end product cinematography.
Your task is to convert a cinematic brief into a detailed, valid JSON film plan that looks like a professional marketing video.

${filmDirectorPrompt}

${presetDescriptions}

## Cinematic Principles to Follow:
1. **The Reveal**: ALWAYS start with a "Cinematic Reveal", "Rim Light Reveal", or "Eclipse Reveal" to build anticipation. Start dark and transition to light.
2. **The Detail**: Use "Macro Detail" or "Macro Pan" to show off textures and craftsmanship. Don't zoom too close; keep it elegant.
3. **The Hero**: End with "Product Hero" or "Low Angle Hero" to establish the product's status.
4. **Pacing**: Use shorter durations (2-3s) for detail shots and longer durations (5-6s) for hero shots.
5. **Lighting**: Use "Spotlight Sweep" for high-contrast, moody sections.

## Critical Instructions:
1. Output ONLY a valid JSON array of scene objects.
2. The total duration of all scenes MUST be exactly 15 seconds.
3. Use the available focal points: ${availableFocalPoints.join(', ')}.
4. Choose the most appropriate digital backdrop, animated props, and background music based on the brief.
5. Ensure each scene has a clear purpose and follows cinematic principles.`;

    const response = await fetch('/api/ai/generate-film-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, availableFocalPoints, systemInstruction })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to generate film plan via server: ${errorData.error || response.statusText}`);
    }
    const data = await response.json();
    return JSON.parse(data.text || '{}');
  }

  static async parsePrompt(prompt: string): Promise<DirectorPlan> {
    const systemInstruction = `You are a 3D Scene Director Agent. Parse the following natural language prompt into a sequence of high-level API commands (actions) to set up the camera and lighting.
      
      Prompt: "${prompt}"
      
      You control 1 camera and up to 3 lights (index 0, 1, 2). The scene contains a central 3D subject with user-defined markers (features).
      You must output a JSON object with 'actions' (array of actions).
      
      Available Actions:
      1. "frame_important_features": Frames the important region and features of the target model by generating a set of candidate camera snapshots.
         params: { 
           "northPoleAngle": number (0 to 360, angle of the North Pole of bounding sphere around Z-axis),
           "targetFeatures": string[] (list of marker labels to keep in view),
           "stepDistance": number (interval distance between snapshots, e.g., 0.5 or 1.0)
         }
      2. "adjust_screen_fill_and_alignment": Filters and adjusts the candidate camera snapshots based on screen fill proportion, alignment, and feature dispersion.
         params: {
           "fillRatio": number (0.25, 0.5, 0.75, or 1.0),
           "alignment": "center" | "top_left" | "top" | "top_right" | "left" | "right" | "bottom_left" | "bottom" | "bottom_right",
           "dispersionMin": number (0 to 1),
           "dispersionMax": number (0 to 1)
         }
      3. "place_light_relative_to_focus": Places a light relative to the camera-to-focus line of sight.
         params: { 
           "lightIndex": number (0, 1, or 2), 
           "distanceMode": "behind_subject" | "front_subject", 
           "verticalOffset": "obscured" | "revealed_top" | "revealed_bottom", 
           "horizontalOffset": "center" | "revealed_left" | "revealed_right" 
         }
      4. "set_light_properties": Sets the type and intensity of a light.
         params: { "lightIndex": number, "type": "point" | "directional" | "spot", "intensity": number }
         
      Example Prompt: "Show the 'logo' and 'screen' features filling half the screen on the top right, with moderate dispersion. Place a point light behind the subject, revealed on the top left."
      
      Example Output:
      {
        "actions": [
          { "action": "frame_important_features", "params": { "northPoleAngle": 0, "targetFeatures": ["logo", "screen"], "stepDistance": 0.5 } },
          { "action": "adjust_screen_fill_and_alignment", "params": { "fillRatio": 0.5, "alignment": "top_right", "dispersionMin": 0.25, "dispersionMax": 0.75 } },
          { "action": "set_light_properties", "params": { "lightIndex": 0, "type": "point", "intensity": 5 } },
          { "action": "place_light_relative_to_focus", "params": { "lightIndex": 0, "distanceMode": "behind_subject", "verticalOffset": "revealed_top", "horizontalOffset": "revealed_left" } }
        ]
      }
      `;

    const response = await fetch('/api/ai/parse-director-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to parse director prompt via server: ${errorData.error || response.statusText}`);
    }
    const data = await response.json();
    return JSON.parse(data.text || '{}');
  }
}
