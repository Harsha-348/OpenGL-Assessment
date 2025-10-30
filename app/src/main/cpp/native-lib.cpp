#include <jni.h>
#include <android/bitmap.h>
#include <opencv2/opencv.hpp>
#include <opencv2/imgproc.hpp>

using namespace cv;

extern "C" {

JNIEXPORT void JNICALL
Java_com_example_edgedetection_EdgeDetector_processFrame(
        JNIEnv *env,
        jobject /* this */,
        jlong matAddrInput,
        jlong matAddrResult) {

    // Get the input and output matrices
    Mat &input = *(Mat *) matAddrInput;
    Mat &result = *(Mat *) matAddrResult;
    
    // Convert to grayscale
    Mat gray;
    cvtColor(input, gray, COLOR_RGBA2GRAY);
    
    // Apply Gaussian blur to reduce noise
    GaussianBlur(gray, gray, Size(5, 5), 0);
    
    // Apply Canny edge detection
    Canny(gray, result, 50, 150);
    
    // Convert back to RGBA for display
    cvtColor(result, result, COLOR_GRAY2RGBA);
}

} // extern "C"
