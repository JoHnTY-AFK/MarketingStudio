# Agent Control Menu

This document serves as the API schema and instruction manual for the "Ultimate Agent" to understand what controls and parameters are available in the current Product Studio project. The agent can utilize these parameters to create custom cinematic scenes viewed from the viewport of the Camera Gadget.

## 1. Scene Objects
The primary 3D model in the workspace.
* **`model.position`**: `[x, y, z]` (Vector3) - The world position of the model.
* **`model.rotation`**: `[x, y, z]` (Euler) - The rotation of the model in radians.
* **`model.scale`**: `[x, y, z]` (Vector3) - The scale of the model.

## 2. Camera Gadget
The virtual camera used to record and playback cinematic paths.
* **`camera.position`**: `[x, y, z]` (Vector3) - The world position of the camera.
* **`camera.lookAt`**: `[x, y, z]` (Vector3) - The target point the camera is looking at.
* **`camera.fov`**: `number` - Field of view in degrees (default: 50).
* **`camera.near`**: `number` - Near clipping plane (default: 0.1).
* **`camera.far`**: `number` - Far clipping plane (default: 100).

## 3. Lighting Array
The workspace supports up to 3 animatable light sources. Each light has an `id` and specific properties based on its `type`.
* **`lights[i].type`**: `'directional' | 'point' | 'spot' | 'rectArea'` - The type of light source.
  * `'directional'`: Emits parallel rays like the sun. Good for global, even lighting and sharp shadows.
  * `'point'`: Emits light in all directions from a single point (like a bare bulb). Excellent for simulating an eclipse, glowing orbs, or omnidirectional fill.
  * `'spot'`: Emits a cone of light. Perfect for highlighting specific features, creating dramatic stage lighting, or focusing the viewer's attention.
  * `'rectArea'`: Emits light from a rectangular plane. Ideal for soft studio lighting, rim lights, and simulating softboxes or window light.
* **`lights[i].position`**: `[x, y, z]` (Vector3) - The world position of the light.
* **`lights[i].intensity`**: `number` - The brightness of the light (0.0 to 10.0).
* **`lights[i].color`**: `string` (Hex code) - The color of the light.
* **`lights[i].visible`**: `boolean` - Whether the light is active.
* **`lights[i].spotAngle`**: `number` (Spot Light only) - The cone angle in degrees (1 to 90). Controls how wide the spotlight beam is.
* **`lights[i].width`**: `number` (RectArea Light only) - The width of the area light plane.
* **`lights[i].height`**: `number` (RectArea Light only) - The height of the area light plane.
* **`lights[i].triggerLookAtOrigin`**: `number` - A trigger (e.g., `Date.now()`) to force the light to look at `[0, 0, 0]`. Useful for keeping spotlights or area lights aimed at the center.

## 4. Environment Light
Global illumination and reflections.
* **`indirectLightIntensity`**: `number` - The intensity of the environment map (0.0 to 1.0).
* **`envPreset`**: `string` - The selected HDRI preset (e.g., `'studio'`, `'city'`, `'sunset'`).
* **`customEnvUrl`**: `string | null` - URL to a custom HDRI map.

## 5. Material Properties
The physical properties of the default 3D model (sphere).
**CRITICAL INSTRUCTION:** The agent is PROHIBITED from parameterizing or changing material properties (color, roughness, metalness) during cinematic animations. These properties must remain static.
* **`material.color`**: `string` (Hex code) - The base color of the material.
* **`material.roughness`**: `number` - The microsurface roughness (0.0 to 1.0). 0 is perfectly smooth (mirror), 1 is completely matte.
* **`material.metalness`**: `number` - How metallic the material is (0.0 to 1.0). 0 is dielectric (plastic/wood), 1 is pure metal.

## 6. Focal Points (Regions of Interest)
User-defined points on the surface of the 3D model. These are crucial for directing the camera or lights to specific features (like a logo or engraving).
* **`markers[i].id`**: `string` - Unique identifier for the focal point.
* **`markers[i].position`**: `[x, y, z]` (Vector3) - The exact world coordinates of the marked region.

## 7. Programmatic Animation (Timeline Keyframes)
The animation engine supports programmatic control via a timeline of keyframes. The agent can generate an `AnimationTimeline` object and pass it to the `setPresetTrigger` function to create custom cinematic scenes.

**`AnimationTimeline` Structure:**
```typescript
{
  duration: number; // Total duration in seconds
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'; // Global easing function
  keyframes: [
    {
      time: number; // Normalized time (0.0 to 1.0)
      camera?: {
        position?: [x, y, z],
        lookAt?: [x, y, z]
      },
      lights?: [
        {
          id: string, // Must match an existing light's ID
          position?: [x, y, z],
          intensity?: number,
          color?: string, // Hex code
          type?: 'directional' | 'point' | 'spot' | 'rectArea'
        }
      ],
      indirectLightIntensity?: number
    },
    // ... more keyframes
  ]
}
```

### Usage in Cinematic Animation
To create a custom cinematic scene, the agent should generate a timeline of keyframes and interpolate the parameters listed above (excluding material properties). 

**Example Workflow:**
1. Read `markers[0].position` to find the user's focal point (e.g., the bottle logo).
2. Generate a keyframe at `time: 0` with the camera far away, looking at `markers[0].position`.
3. Generate a keyframe at `time: 1` with the camera pushed in tight on `markers[0].position`.
4. Trigger the animation by passing the timeline to the engine.
