# XpertStudio --- by ChaosStudio

**XpertStudio** is a world-class, AI-powered creative suite designed for professional designers, marketers, and product photographers. It leverages the latest Gemini models to provide a comprehensive set of tools for image generation, editing, analysis, and document intelligence.

---

## 🚀 Features

### 🎨 Creative Tools
- **Scene Gen (1)**: Place products in professional environments with realistic lighting and composition.
- **Angle Studio (2)**: Synthesize novel 3D views of objects from a single image.
- **Motion Studio (3)**: Create smooth cinematic video interpolations between images.
- **GigaXpert (4)**: High-fidelity image upscaling.
- **Magic Edit (5)**: Professional inpainting and object removal.
- **Style Transfer (6)**: Apply artistic aesthetics while preserving product identity.
- **Vectorize (7)**: Convert raster images to clean, scalable SVG code.

### 🧠 Intelligence Tools
- **PDF Intel (8)**: Chat with multiple PDF documents using visual and text analysis.
- **Design Audit (9)**: Get world-class design critiques and saliency heatmaps.
- **Results Gallery (0)**: Manage and export your generated assets.

---

## ⌨️ Keyboard Shortcuts (Desktop)

Navigate the suite instantly without your mouse:
- **1 - 9**: Switch between creative and intelligence tools.
- **0**: Open the Results Gallery.
- **, (Comma)**: Open System Settings.

---

## ☁️ Cloud Sync & Backup

XpertStudio supports **Google Drive Backup**, allowing you to:
- Securely store your Gemini API key in the cloud.
- Backup your entire workspace state (history, active inputs, generated images).
- Restore your session on any device with one click.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your credentials.

### Development
Start the development server:
```bash
npm run dev
```

### Build
Build for production:
```bash
npm run build
```

---

## 🛠️ Setup & Configuration

### 1. Gemini API Key
You will need a Gemini API key to power the AI features. You can enter this in the **System Settings** menu.

### 2. Google OAuth (for Backup/Restore)
To enable Google Login and Drive Backup, you must configure a Google Cloud project:
1. Enable the **Google Drive API** in the [Google Cloud Console](https://console.cloud.google.com/).
2. Create **OAuth 2.0 Credentials** (Web Application).
3. Add the following **Authorized Redirect URI**:
   `https://ais-dev-ygwj5yzpjiky6yy6yp5d7v-22311204047.asia-southeast1.run.app/auth/google/callback`
4. Set the following environment variables in your deployment:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `APP_URL` (Set to your current app URL)

---

## 💻 Tech Stack
- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express.
- **AI**: Google Gemini API (Flash 2.5, Pro 3.1, Veo 3.1).
- **Storage**: LocalStorage + Google Drive API.

---

© 2024 ChaosStudio. Powered by Google Gemini.
