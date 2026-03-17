# Product Studio ver 2.4

## Background
"I am building a dedicated, high-performance virtual workspace designed to produce high-quality product commercial for marketing and e-commerce campaigns. The virtual workspace has interface mimicking that of 3D sculpting software." - Creator

## Current Challenge / Main Task
Create an agent that can converts natural language to a fascinating, professional and creative 3D product commercial film.

## Purpose
Product Studio is a high-performance virtual workspace tailored for creating high-quality 3D product imagery. It is designed specifically for marketing and e-commerce campaigns, providing users with an intuitive interface that mimics professional 3D sculpting and modeling software. The application allows users to manipulate 3D models, adjust lighting, and configure materials to achieve photorealistic or stylized renders.

## Features
- **Shading Modes**: Switch between Physical Shading (PBR) for realistic material rendering and Flat Shading (Unlit) for stylized looks.
- **Advanced Lighting**: Add and configure up to three light sources, including Directional, Point, Spot, and Rect Area lights. Adjust intensity, color, and specific light parameters.
- **Environment Maps**: Use built-in environment presets (like 'studio') or upload custom HDRI environment maps for realistic indirect lighting and reflections.
- **Material Controls**: Fine-tune the color, roughness, and metalness of the default 3D model.
- **Custom Models**: Upload and view your own 3D models within the workspace.
- **Camera Gadget**: Record and playback camera paths to create dynamic product showcases.
- **Image Capture**: Easily capture and download high-resolution images of your product renders.

## High-Level Structure
The project is built using React, TypeScript, Tailwind CSS, and Three.js (via React Three Fiber and Drei).

- `src/App.tsx`: The main application layout, integrating the Sidebar, TopBar, and Scene.
- `src/context/AppContext.tsx`: Global state management for shading modes, materials, lighting, environment, and camera controls.
- `src/components/Scene/`: Contains all 3D rendering components.
  - `Scene.tsx`: The main React Three Fiber canvas, handling environment, lights, grid, and the 3D model.
  - `CustomModel.tsx`: Component for loading and displaying user-uploaded 3D models.
  - `LightGadget.tsx`: Represents individual light sources in the 3D scene.
  - `CameraGadget.tsx`: Manages camera path recording and playback.
  - `store.ts`: Zustand store for scene-specific state and animations.
- `src/components/Sidebar/`: The user interface for controlling workspace settings.
  - `Sidebar.tsx`: Main sidebar container with tab navigation.
  - `WorkspaceTab.tsx`: Controls for materials, lighting, environment, and camera.
  - `DirectorTab.tsx`: Interface for the Director Agent, allowing natural language control of the scene.
- `src/components/TopBar/`: Contains global actions like toggling shading modes and capturing images.
- `src/services/directorAgent.ts`: Service for interacting with the Gemini API to translate natural language prompts into scene parameters.
- `src/utils/directorMath.ts`: Utility functions for converting camera-relative descriptions to world-space coordinates and parameters.
- `src/types/index.ts`: Centralized TypeScript type definitions for the application.

## Getting Started
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open the application in your browser.