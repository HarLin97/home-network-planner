# Home Network Topology Planner

[中文](./README.md) | English

---

A pure front-end home network planning and visualization system developed with React + Vite + TypeScript. It helps users intuitively design home network architectures and supports device placement on floor plans.

![Project Preview](./image.png)

### ✨ Key Features

- **Dual Mode Switching**:
  - **Logical Topology Mode**: Focuses on network architecture logic, supporting auto-layout, automatic IP allocation, and subnet inheritance.
  - **Floor Plan Mode**: Supports uploading floor plan images and dragging device icons to actual room positions for physical placement planning.
- **Smart IP Management**: Supports 192.168.x.x subnet selection and automatically inherits subnets from parent devices.
- **Visual Interaction**: Cool blue particle flow animation for connections, representing network data transmission.
- **Data Management**: Auto-saves to local storage, supports JSON import/export, and one-click Excel device list export.

### 🚀 Quick Start

1. **Install Dependencies**: `pnpm install`
2. **Start Development**: `pnpm dev`
3. **Build for Production**: `pnpm build`

### 🐳 Quick Start with Docker

Run the pre-built Docker image to get started immediately:

```bash
docker run -d -p 8080:80 harlin/home-network-planner:latest
```

Access the app at `http://localhost:8080`.

#### Using docker-compose (Local Build/Deploy)

```bash
docker-compose up -d
```

### 🛠️ Tech Stack

React 18, React Flow, Dagre, Tailwind CSS, Lucide React, SheetJS.

---

## 📄 License

MIT License
