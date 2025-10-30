// Import the worker using worker-loader
import EdgeWorker from 'worker-loader!./edge-detection.worker';

interface WorkerMessage {
    type: 'edgesDetected' | 'error';
    data: {
        processedData?: ArrayBuffer;
        width?: number;
        height?: number;
        processTime?: number;
        message?: string;
    };
}

class EdgeDetectionViewer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private worker: Worker;
    private originalImageData: ImageData | null = null;
    private isProcessing = false;
    private edgeDetectionEnabled = false;
    private currentImage: HTMLImageElement | null = null;
    private lastFrameTime = 0;
    private frameCount = 0;
    private frameTimes: number[] = [];
    private lastFpsUpdate = 0;
    private currentFps = 0;
    private fpsUpdateInterval: ReturnType<typeof setInterval> | null = null;
    private stream: MediaStream | null = null;
    private animationId: number | null = null;

    constructor() {
        const canvas = document.getElementById('output');
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('Canvas element not found');
        }
        this.canvas = canvas;
        
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2D context');
        }
        this.ctx = context;
        
        // Initialize worker
        try {
            this.worker = new EdgeWorker();
            this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => this.handleWorkerMessage(event);
            this.worker.onerror = (error) => {
                console.error('Worker error:', error);
                this.updateStatus('Worker error');
                this.isProcessing = false;
            };
        } catch (error) {
            console.error('Failed to create worker:', error);
            this.updateStatus('Failed to initialize worker');
            throw error;
        }
        
        // Initialize FPS counter
        this.lastFpsUpdate = performance.now();
        this.updateFps(0); // Initialize with 0 processing time
        
        this.setupEventListeners();
        this.updateStatus('Ready');
        console.log('EdgeDetectionViewer initialized');
    }


    private updateStatus(text: string) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = text;
            console.log('Status:', text);
        }
    }
    
    private updateFps(processingTime: number): number {
        const now = performance.now();
        const delta = now - this.lastFpsUpdate;
        
        // Calculate the time since the last frame
        const frameTime = Math.max(1, processingTime); // Ensure we don't divide by zero
        
        // Store the frame time for averaging (in milliseconds)
        this.frameTimes.push(frameTime);
        
        // Keep only the last 30 frames for averaging
        if (this.frameTimes.length > 30) {
            this.frameTimes.shift();
        }
        
        // Calculate average frame time in milliseconds
        const totalFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0);
        const avgFrameTime = totalFrameTime / this.frameTimes.length;
        
        // Calculate FPS (frames per second) - limit to a reasonable range
        this.currentFps = Math.min(999, Math.max(1, Math.round(1000 / avgFrameTime)));
        
        // Update FPS display every 100ms for smoother updates
        if (delta > 100) {
            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.textContent = this.currentFps.toString();
            }
            
            // Update status with current FPS and frame time
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.textContent = `${this.currentFps} FPS (${avgFrameTime.toFixed(1)}ms)`;
            }
            
            this.lastFpsUpdate = now;
            
            // Log FPS for debugging
            console.log(`FPS: ${this.currentFps}, Frame time: ${avgFrameTime.toFixed(1)}ms`);
        }
        
        return this.currentFps;
    }

    private updateResolution(width: number, height: number) {
        const resolutionElement = document.getElementById('resolution');
        if (resolutionElement) {
            resolutionElement.textContent = `${width}×${height}`;
        }
    }

    private loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = url;
        });
    }

    private drawImageToCanvas(img: HTMLImageElement) {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        this.updateResolution(img.width, img.height);
        
        // Store the original image data for processing
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.originalImageData = imageData;
        
        if (this.edgeDetectionEnabled) {
            this.processImage();
        }
    }

    private processImage() {
        if (!this.originalImageData || this.isProcessing || !this.edgeDetectionEnabled) {
            return;
        }
        
        this.isProcessing = true;
        this.updateStatus('Processing...');
        
        try {
            // Create a copy of the image data to avoid transferring the original
            const imageData = this.originalImageData.data;
            const imageDataCopy = new Uint8ClampedArray(imageData.length);
            imageDataCopy.set(imageData);
            
            // Get dimensions
            const width = this.originalImageData.width;
            const height = this.originalImageData.height;
            
            // Send the copy to the worker
            this.worker.postMessage({
                imageData: imageDataCopy.buffer,
                width: width,
                height: height
            }, [imageDataCopy.buffer]);
            
            // Store the start time for FPS calculation
            this.lastFrameTime = performance.now();
            
            // Log that we've sent the image for processing
            console.log(`Sent image (${width}x${height}) to worker for processing`);
        } catch (error) {
            console.error('Error processing image:', error);
            this.updateStatus('Error: ' + (error instanceof Error ? error.message : 'Processing failed'));
            this.isProcessing = false;
        }
    }

    private handleWorkerMessage(event: MessageEvent<WorkerMessage>) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'edgesDetected':
                if (!data || !data.processedData || data.width === undefined || data.height === undefined) {
                    console.error('Invalid data received from worker:', data);
                    this.isProcessing = false;
                    this.updateStatus('Error: Invalid data from worker');
                    return;
                }
                
                try {
                    const processingTime = data.processTime || 0;
                    const width = Math.max(1, data.width);
                    const height = Math.max(1, data.height);
                    
                    console.log(`Main: Received processed data (${width}x${height}) in ${processingTime.toFixed(2)}ms`);
                    
                    // Create a new ImageData object with the processed data
                    const processedData = new Uint8ClampedArray(data.processedData);
                    
                    // Create a new ImageData object
                    const imageData = new ImageData(processedData, width, height);
                    
                    // Update FPS counter with the processing time
                    const fps = this.updateFps(processingTime);
                    
                    // Get canvas context again in case it was lost
                    const ctx = this.canvas.getContext('2d');
                    if (!ctx) {
                        throw new Error('Could not get 2D context');
                    }
                    
                    // Store a reference to 'this' for use in the animation frame callback
                    const self = this;
                    
                    // Draw the processed image data to the canvas
                    requestAnimationFrame(() => {
                        try {
                            const startDrawTime = performance.now();
                            
                            // Set canvas dimensions to match the image
                            if (self.canvas.width !== width || self.canvas.height !== height) {
                                console.log(`Resizing canvas to ${width}x${height}`);
                                self.canvas.width = width;
                                self.canvas.height = height;
                            }
                            
                            // Clear and draw the processed image
                            ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
                            ctx.putImageData(imageData, 0, 0);
                            
                            const drawTime = performance.now() - startDrawTime;
                            
                            // Update status with processing time
                            self.updateStatus(`Processed in ${processingTime.toFixed(1)}ms`);
                            
                            // Log processing time for debugging
                            console.log(`Frame drawn in ${drawTime.toFixed(1)}ms, total ${(processingTime + drawTime).toFixed(1)}ms, FPS: ${fps}`);
                        } catch (error) {
                            console.error('Error in animation frame:', error);
                            self.updateStatus('Error: Failed to draw image');
                        } finally {
                            // Always reset processing flag
                            self.isProcessing = false;
                            
                            // Process next frame if edge detection is still enabled
                            if (self.edgeDetectionEnabled && self.originalImageData) {
                                // Use setTimeout to avoid blocking the main thread
                                setTimeout(() => self.processImage(), 0);
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error processing worker response:', error);
                    this.isProcessing = false;
                    this.updateStatus('Error: ' + (error instanceof Error ? error.message : 'Processing failed'));
                }
                break;
                
            case 'error':
                console.error('Error from worker:', data);
                this.isProcessing = false;
                this.updateStatus('Error processing image');
                alert('Error processing image: ' + (data?.message || 'Unknown error'));
                break;
                
            default:
                console.warn('Unknown message type from worker:', type, data);
        }
    }

    private setupEventListeners() {
        // Load sample image
        document.getElementById('loadSample')?.addEventListener('click', async () => {
            try {
                this.updateStatus('Loading sample image...');
                const img = await this.loadImage('https://picsum.photos/800/600');
                this.currentImage = img;
                this.drawImageToCanvas(img);
                this.updateStatus('Sample image loaded');
            } catch (error) {
                console.error('Error loading sample image:', error);
                this.updateStatus('Error loading image');
            }
        });

        // Toggle edge detection
        document.getElementById('toggleEffect')?.addEventListener('click', () => {
            this.edgeDetectionEnabled = !this.edgeDetectionEnabled;
            
            if (this.edgeDetectionEnabled) {
                this.updateStatus('Edge detection enabled');
                // Start FPS counter
                this.frameTimes = [];
                this.lastFpsUpdate = performance.now();
                this.updateFps(0); // Initialize with 0 processing time
                
                if (this.originalImageData) {
                    this.processImage();
                }
            } else {
                this.updateStatus('Edge detection disabled');
                // Redraw original image
                if (this.originalImageData) {
                    this.ctx.putImageData(this.originalImageData, 0, 0);
                }
                // Reset FPS
                const fpsElement = document.getElementById('fps');
                if (fpsElement) {
                    fpsElement.textContent = '0';
                }
            }
        });
        
        // Add camera button if not exists
        const toggleButton = document.getElementById('toggleEffect');
        if (toggleButton && !document.getElementById('toggleCamera')) {
            const cameraButton = document.createElement('button');
            cameraButton.id = 'toggleCamera';
            cameraButton.textContent = 'Start Camera';
            cameraButton.style.marginLeft = '10px';
            toggleButton.insertAdjacentElement('afterend', cameraButton);
            
            cameraButton.addEventListener('click', async () => {
                if (this.stream) {
                    // Stop camera
                    this.stopCamera();
                    cameraButton.textContent = 'Start Camera';
                    this.updateStatus('Camera stopped');
                } else {
                    try {
                        await this.startCamera();
                        cameraButton.textContent = 'Stop Camera';
                        this.updateStatus('Camera started');
                    } catch (error) {
                        console.error('Error accessing camera:', error);
                        this.updateStatus('Error accessing camera');
                    }
                }
            });
        }
    }

    private async startCamera() {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        const video = document.createElement('video');
        video.srcObject = this.stream;
        await video.play();
        
        // Update canvas size to match video
        this.canvas.width = video.videoWidth;
        this.canvas.height = video.videoHeight;
        this.updateResolution(video.videoWidth, video.videoHeight);
        
        // Process video frames
        const processFrame = () => {
            if (!this.stream) return;
            
            // Draw video frame to canvas
            this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Store current frame as original
            this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Process frame if edge detection is enabled
            if (this.edgeDetectionEnabled) {
                this.processImage();
            }
            
            // Continue processing frames
            this.animationId = requestAnimationFrame(processFrame);
        };
        
        processFrame();
    }
    
    private stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOM loaded, initializing app...');
        new EdgeDetectionViewer();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('Failed to initialize application. See console for details.');
    }
});
