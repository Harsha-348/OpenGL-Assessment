package com.example.edgedetection

import android.graphics.Bitmap
import org.opencv.android.Utils
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

class EdgeDetector {
    private var edgeMat = Mat()
    private var grayMat = Mat()

    init {
        System.loadLibrary("opencv_java4")
        System.loadLibrary("native-lib")
    }

    external fun processFrame(matAddrInput: Long, matAddrResult: Long)

    fun process(bitmap: Bitmap): Bitmap {
        val mat = Mat()
        val bmp32 = bitmap.copy(Bitmap.Config.ARGB_8888, true)
        Utils.bitmapToMat(bmp32, mat)
        
        // Convert to RGBA if needed
        if (mat.channels() == 3) {
            Imgproc.cvtColor(mat, mat, Imgproc.COLOR_RGB2RGBA)
        }
        
        // Process frame in native code
        processFrame(mat.nativeObjAddr, edgeMat.nativeObjAddr)
        
        // Convert result back to bitmap
        val resultBitmap = Bitmap.createBitmap(edgeMat.cols(), edgeMat.rows(), Bitmap.Config.ARGB_8888)
        Utils.matToBitmap(edgeMat, resultBitmap)
        
        return resultBitmap
    }
}
