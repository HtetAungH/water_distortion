# 💧 Interactive Water Distortion (React + WebGL)

A high-performance WebGL liquid distortion effect ported to **React** and **Vite**. This project uses custom GLSL shaders to create interactive water-like ripples and surface distortions on images, controlled via a GUI.

![Project Preview](https://cdn.shopify.com/s/files/1/0185/5999/1872/files/hero--desktop.webp?v=1759340146)
*(The default image used in the project)*

## 🚀 Tech Stack

* **Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Graphics:** Raw WebGL (Custom Shaders)
* **Controls:** [lil-gui](https://lil-gui.georgealways.com/)

## ✨ Features

* **Custom Shaders:** Implements `snoise` (Simplex Noise) and surface distortion algorithms in GLSL.
* **Interactive Controls:** Real-time adjustment of effect parameters (Scale, Illumination, Distortion strength) using a floating GUI.
* **Image Upload:** Users can upload their own local images to test the effect immediately.
* **Responsive:** Canvas automatically resizes and adjusts the aspect ratio to fit the screen while maintaining image cover.
* **React Architecture:** Clean separation of concerns with shaders isolated from the component logic.

## 🛠️ Installation & Setup

### 1. Prerequisites
Ensure you have Node.js installed.

### 2. Create Project (if not done)
```bash
npm create vite@latest water-distortion -- --template react
cd water-distortion
