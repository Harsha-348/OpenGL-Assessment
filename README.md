# Real-Time Edge Detection App

This Android application captures camera frames, processes them using OpenCV with C++ (via JNI), and displays the processed output using OpenGL ES. It also includes a web-based viewer for visualizing the edge detection results.

## Features

- Real-time camera capture and processing
- Edge detection using OpenCV C++
- OpenGL ES 2.0+ rendering
- Web-based viewer with TypeScript
- Toggle between original and edge-detected views
- Performance statistics (FPS, resolution)

## Prerequisites

- Android Studio (latest stable version)
- Android NDK (installed via SDK Manager)
- OpenCV for Android (included in the project)
- Node.js (for the web viewer)

## Setup Instructions

### Android App

1. Open the project in Android Studio
2. Sync the project with Gradle files
3. Build and run the app on a physical device or emulator

### Web Viewer

1. Navigate to the `web` directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
EdgeDetectionApp/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── cpp/                  # Native C++ code
│   │   │   │   ├── CMakeLists.txt    # CMake configuration
│   │   │   │   ├── edge_detector.cpp # Edge detection implementation
│   │   │   │   └── renderer.cpp      # OpenGL rendering
│   │   │   ├── java/
│   │   │   │   └── com/example/edgedetection/
│   │   │   │       ├── MainActivity.kt
│   │   │   │       ├── EdgeDetector.kt
│   │   │   │       └── gl/
│   │   │   │           ├── GLRenderer.kt
│   │   │   │           └── GLTextureView.kt
│   │   │   └── res/
│   │   │       └── layout/
│   │   │           └── activity_main.xml
│   ├── build.gradle
│   └── proguard-rules.pro
├── web/                              # Web viewer
│   ├── src/
│   │   ├── index.ts
│   │   └── edge-detection.worker.ts
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── webpack.config.js
└── build.gradle
```

## Implementation Plan

1. Native C++ Integration

a. Edge Detection (edge_detector.cpp)
- Implement using OpenCV C++ API
- Optimize for real-time performance
- Support multiple edge detection algorithms

b. OpenGL Rendering (renderer.cpp)
- Set up EGL context
- Implement texture rendering
- Handle screen orientation changes

c. JNI Interface
- Create efficient data transfer between Java/Kotlin and C++
- Handle memory management properly

2. Android Components
   
a. Camera Integration
- Use CameraX for modern camera API
- Handle permissions
- Support multiple camera resolutions
  
b. UI Implementation
- TextureView for camera preview
- Controls for algorithm selection
- Performance metrics display

c. Native Bridge
- JNI interface implementation
- Thread management
- Memory management

3. Web Viewer 

a. WebSocket Server
- Implement in Kotlin using Ktor
- Handle multiple client connections
- Stream processed frames

b. Web Client
- TypeScript implementation
- Real-time video display
- Controls and statistics
  
4. Documentation & Best Practices

a. Project Setup
- Detailed README.md
- Build instructions
- Dependencies list

b. Code Documentation
- JavaDoc/KDoc for public APIs
- Inline comments for complex logic
- Architecture overview

c. Testing
- Unit tests for critical components
- Integration tests
- Performance benchmarks

## How It Works

1. The app captures frames from the device camera using CameraX
2. Each frame is processed in native C++ code using OpenCV for edge detection
3. The processed frame is rendered using OpenGL ES for optimal performance
4. The web viewer provides a simple interface to view and interact with the processed frames

## Performance

The app is optimized for real-time performance with the following optimizations:
- Native C++ implementation for image processing
- OpenGL ES for hardware-accelerated rendering
- Background thread processing to prevent UI jank
- Efficient memory management

## Android Architecture

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/00628cde-e468-4197-b073-3482fe514a1c" />


## TypeScript Components

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/f1d51b2a-6dfc-48ef-b007-0a99bdb855b9" />


## Screenshots

/<img width="665" height="665" alt="Screenshot 2025-10-31 at 3 17 33 AM" src="https://github.com/user-attachments/assets/da822c61-3499-4666-9685-28fed11c975e" />


