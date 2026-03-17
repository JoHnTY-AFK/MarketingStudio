# Cinematic Preset Descriptions

This document explains the mathematical and programmatic logic behind each cinematic preset available in the Product Studio workspace. It is designed to help the ultimate agent understand how time-parameterized changes (using a normalized time variable `t` from 0.0 to 1.0) are applied to various object parameters (Camera, Lights, Materials, Objects) to achieve specific visual effects.

All presets support up to 3 lights and control indirect illumination.

**Focal Point Support:** All presets now support an optional `focalPoint` parameter. When provided (either automatically from the workspace or explicitly by the Film Design Director Agent via `focalPointLabel`), the preset will dynamically adjust its camera path, look-at target, and lighting to emphasize the specified focal point. If no focal point is provided, the presets fall back to targeting the center of the object's bounding box.

## 1. Turntable
* **Visual Purpose:** A classic 360-degree orbit around the product to showcase it from all angles.
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Uses `Math.sin(t * Math.PI * 2)` and `Math.cos(t * Math.PI * 2)` multiplied by a calculated `radius` to orbit the Y-axis.
  * **Camera Target:** Looks at the center of the target model's bounding box.
  * **Light Position:** Up to 3 lights orbit slightly faster than the camera (`t * Math.PI * 4`) with offset angles to create dynamic, sweeping reflections across the surface.
  * **Indirect Illumination:** Constant 0.5.

## 2. Vertical Sweep
* **Visual Purpose:** A smooth, slow pan down the side of the product, emphasizing height, scale, and curvature (similar to 0:12 in the reference video).
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Interpolates the Y-coordinate from a high point (`startY`) to a lower point (`endY`) using linear interpolation. X and Z remain fixed.
  * **Camera Target:** Moves synchronously with the camera's Y position to keep a tight framing.
  * **Light Position:** Up to 3 lights stay high and fixed, offset in X and Z, to emphasize the curvature and create a consistent gradient as the camera moves down.
  * **Indirect Illumination:** Constant 0.4.

## 3. Top-Down
* **Visual Purpose:** A direct bird's-eye view that slowly descends, with a light sweeping across to reveal top details like engravings or logos (similar to 0:20 in the reference video).
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Positioned directly above the center on the Y-axis, looking straight down.
  * **Camera Target:** Looks directly at the center.
  * **Light Position:** Up to 3 lights sweep linearly across the X-axis from left to right, offset in Z, casting moving shadows that highlight surface details.
  * **Indirect Illumination:** Constant 0.6.

## 4. Macro Pan
* **Visual Purpose:** An extreme close-up that pans horizontally across the surface of the product, highlighting textures and fine details.
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Z is set very close to the object (`macroRadius`). X interpolates from left to right across the bounding box width.
  * **Camera Target:** The look-at target moves synchronously with the camera's X position, keeping the camera perpendicular to the surface.
  * **Light Position:** Up to 3 lights move in the opposite direction of the camera (right to left), offset in Y, to create a dramatic, shifting shadow effect.
  * **Indirect Illumination:** Constant 0.3.

## 5. Spiral Reveal
* **Visual Purpose:** A dynamic, energetic shot that spirals upwards and inwards, revealing the product in a dramatic fashion.
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Combines a 450-degree rotation (`t * Math.PI * 2.5`), a shrinking radius (spiraling inwards), and an ascending Y-coordinate.
  * **Camera Target:** Looks at the center.
  * **Light Position:** Up to 3 lights spiral with the camera but at a wider radius and offset angles.
  * **Indirect Illumination:** Starts at 0.1 and increases to 0.6.

## 6. Dynamic Push-In
* **Visual Purpose:** A fast, aggressive zoom towards the product that slows down as it gets closer, creating a sense of impact (similar to 0:17 in the reference video).
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Uses an easing function `easeT = 1 - Math.pow(1 - t, 3)` (ease-out cubic) to interpolate the Z-coordinate from far away to very close.
  * **Camera Target:** Looks at the center.
  * **Light Position:** Up to 3 lights move in with the camera, offset in X and Y.
  * **Indirect Illumination:** Starts at 0.2 and increases to 0.5.

## 7. Low Angle Hero
* **Visual Purpose:** A shot from below looking up at the product, making it appear monumental, dominant, and heroic.
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Y is fixed below the center. Z interpolates closer to the object.
  * **Camera Target:** Looks slightly above the center to maintain the upward angle.
  * **Light Position:** Up to 3 lights are positioned high and behind the object for rim lighting, offset in X.
  * **Indirect Illumination:** Constant 0.3.

## 8. Diagonal Slide
* **Visual Purpose:** A smooth, diagonal tracking shot that provides a dynamic perspective, often used in modern tech commercials.
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Both X and Y coordinates interpolate simultaneously from top-left to bottom-right, while Z remains fixed at a medium distance.
  * **Camera Target:** Looks at the center.
  * **Light Position:** Up to 3 lights cross the opposite diagonal, offset in X and Y.
  * **Indirect Illumination:** Constant 0.5.

## 9. Eclipse Reveal
* **Visual Purpose:** Simulates a dramatic sunrise or eclipse. The camera is static while a light source moves from behind the object to the top, creating a rim light that slowly reveals the silhouette before flaring over (similar to 0:00 - 0:07 in the reference video).
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Static, positioned low and looking up at the focal point (or center).
  * **Light Type & Position:** Converts up to 3 lights to `rectArea` lights (to create a wide, cinematic rim light). Interpolates vertically from behind and below the object to above it, offset in height.
  * **Light Intensity:** Increases linearly up to the maximum allowed intensity.
  * **Indirect Illumination:** Starts at 0.02 (near pitch black) and eases in to 0.4, simulating the environment brightening as the 'eclipse' ends.

## 10. Variant Transition
* **Visual Purpose:** Showcases the product seamlessly while slowly pushing in (similar to 0:24 - 0:35 in the reference video).
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Performs a slow, dramatic push-in on the Z-axis.
  * **Light Position:** Up to 3 lights sweep in a wide arc (`Math.sin(t * Math.PI)`), offset in angle and height, to highlight the transition of the material.
  * **Indirect Illumination:** Constant 0.4.

## 11. Product Hero
* **Visual Purpose:** A slow, dramatic orbit with sweeping highlights and vertical oscillation. Perfect for high-end marketing.
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Slow orbit (`t * Math.PI * 0.5`) with vertical oscillation (`Math.sin(t * Math.PI)`).
  * **Light Position:** Up to 3 lights move in a way that creates sweeping highlights.
  * **Indirect Illumination:** Oscillates between 0.3 and 0.7.

## 12. Cinematic Reveal
* **Visual Purpose:** Starts in complete darkness and slowly reveals the product with intensifying light and a slow push-in.
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Slow push-in on the Z-axis.
  * **Light Intensity:** Ramps up from 0 to 1.5x the base intensity using a quadratic curve (`t * t`).
  * **Indirect Illumination:** Ramps up from 0.05 to 0.5.

## 13. Macro Detail
* **Visual Purpose:** A slow, high-quality detail shot that focuses on a specific feature without zooming too close.
* **Region Emphasis:** Focuses on a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Static or slow "breathing" motion around the focal point.
  * **Light Position:** Lights orbit the focal point to show off surface texture.
  * **Indirect Illumination:** Constant 0.4.

## 14. Spotlight Sweep
* **Visual Purpose:** The camera stays static while a powerful spotlight sweeps across the product, creating dramatic highlights.
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Static, positioned at a medium distance.
  * **Light Position:** Lights sweep across the product linearly.
  * **Light Intensity:** Lights pulse in intensity as they pass over the product.
  * **Indirect Illumination:** Constant 0.2.

## 15. Rim Light Reveal
* **Visual Purpose:** Focuses on the product's silhouette with backlighting before revealing the front.
* **Region Emphasis:** Can focus on the entire object or a specific focal point.
* **Parameterization (Math):**
  * **Camera Position:** Moves from a side/back angle to a front angle.
  * **Light Position:** Rim lights are placed behind the object. One light moves to the front to reveal the product's face.
  * **Light Intensity:** Ramps up as the reveal progresses.
  * **Indirect Illumination:** Starts very low (0.02) and increases to 0.2.
