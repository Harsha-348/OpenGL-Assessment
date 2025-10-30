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
├── app/                      # Android app module
│   ├── src/main/
│   │   ├── cpp/             # Native C++ code
│   │   ├── java/            # Java/Kotlin code
│   │   └── res/             # Resources
│   └── build.gradle         # App-level build configuration
├── web/                     # Web viewer
│   ├── src/                 # TypeScript source
│   ├── public/              # Static files
│   ├── package.json         # NPM dependencies
│   └── webpack.config.js    # Webpack configuration
└── README.md                # This file
```

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
