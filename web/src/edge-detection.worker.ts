// This is a TypeScript web worker
// The type is provided by worker-types.d.ts
const ctx: Worker = self as unknown as Worker;

// Downsample the image for faster processing
function downsampleImage(imageData: ImageData, scale: number = 0.5): ImageData {
    const { width, height, data } = imageData;
    const newWidth = Math.floor(width * scale);
    const newHeight = Math.floor(height * scale);
    const result = new Uint8ClampedArray(newWidth * newHeight * 4);
    
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            const srcX = Math.floor(x / scale);
            const srcY = Math.floor(y / scale);
            const srcIdx = (srcY * width + srcX) * 4;
            const dstIdx = (y * newWidth + x) * 4;
            
            // Simple box filter (average of 4 pixels)
            let r = 0, g = 0, b = 0, a = 0;
            const samples = 4;
            
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    const sampleX = Math.min(width - 1, srcX + dx);
                    const sampleY = Math.min(height - 1, srcY + dy);
                    const sampleIdx = (sampleY * width + sampleX) * 4;
                    
                    r += data[sampleIdx];
                    g += data[sampleIdx + 1];
                    b += data[sampleIdx + 2];
                    a += data[sampleIdx + 3];
                }
            }
            
            result[dstIdx] = r / samples;
            result[dstIdx + 1] = g / samples;
            result[dstIdx + 2] = b / samples;
            result[dstIdx + 3] = a / samples;
        }
    }
    
    return new ImageData(result, newWidth, newHeight);
}

// Optimized edge detection using Sobel operator
function detectEdgesSimple(imageData: ImageData): { data: Uint8ClampedArray, width: number, height: number } {
    const startTime = performance.now();
    
    // Downsample the image for faster processing (0.5 = half size)
    const downsampled = downsampleImage(imageData, 0.5);
    const { width, height, data } = downsampled;
    const result = new Uint8ClampedArray(data.length);
    
    // Initialize with black background and full opacity
    for (let i = 0; i < data.length; i += 4) {
        result[i] = 0;     // R
        result[i + 1] = 0; // G
        result[i + 2] = 0; // B
        result[i + 3] = 255; // A (fully opaque)
    }
    
    // Sobel kernels
    const sobelX = [
        -1, 0, 1,
        -2, 0, 2,
        -1, 0, 1
    ];
    
    const sobelY = [
        -1, -2, -1,
         0,  0,  0,
         1,  2,  1
    ];
    
    // Process the image (skip the border pixels)
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0, gy = 0;
            
            // Apply Sobel operator
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const idx = ((y + ky) * width + (x + kx)) * 4;
                    const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    const kernelIdx = (ky + 1) * 3 + (kx + 1);
                    
                    gx += gray * sobelX[kernelIdx];
                    gy += gray * sobelY[kernelIdx];
                }
            }
            
            // Calculate gradient magnitude
            const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));
            
            // Apply threshold (adjust as needed)
            const edgeValue = magnitude > 50 ? 255 : 0;
            
            // Set the result (grayscale)
            const idx = (y * width + x) * 4;
            result[idx] = edgeValue;     // R
            result[idx + 1] = edgeValue; // G
            result[idx + 2] = edgeValue; // B
        }
    }
    
    const endTime = performance.now();
    console.log(`Edge detection completed in ${(endTime - startTime).toFixed(2)}ms at ${width}x${height} resolution`);
    return { data: result, width, height };
}

// Handle messages from the main thread
ctx.onmessage = function(e: MessageEvent<{ imageData: ArrayBuffer, width: number, height: number }>) {
    const startTime = performance.now();
    
    try {
        const { width, height, imageData: imageBuffer } = e.data;
        
        if (!imageBuffer || !width || !height) {
            throw new Error('Invalid image data received in worker');
        }
        
        // Log when we start processing
        console.log(`Worker: Starting to process image (${width}x${height})`);
        
        // Create a Uint8ClampedArray from the buffer
        const imageData = new Uint8ClampedArray(imageBuffer);
        
        // Create an ImageData object
        const imageDataObj = new ImageData(
            new Uint8ClampedArray(imageData.buffer, 0, width * height * 4),
            width,
            height
        );
        
        // Process the image
        console.log('Worker: Starting edge detection...');
        const { data: processedData } = detectEdgesSimple(imageDataObj);
        const processTime = performance.now() - startTime;
        
        // Create a new buffer for the processed data
        const resultBuffer = processedData.buffer;
        
        // Prepare the response
        const response = {
            type: 'edgesDetected' as const,
            data: {
                processedData: resultBuffer,
                width: width,
                height: height,
                processTime: processTime
            }
        };
        
        // Send the result back to the main thread
        console.log(`Worker: Sending processed data back (took ${processTime.toFixed(2)}ms)`);
        ctx.postMessage(response, [resultBuffer]);
        
    } catch (error) {
        const errorTime = performance.now() - startTime;
        console.error('Error in worker:', error);
        
        ctx.postMessage({
            type: 'error',
            data: {
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                processTime: errorTime
            }
        });
    }
};

// Add error handler for uncaught errors
self.onerror = function(error) {
    console.error('Uncaught error in worker:', error);
    return true; // Prevent default error handling
};

console.log('Edge detection worker initialized');
