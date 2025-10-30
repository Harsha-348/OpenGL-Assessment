package com.example.edgedetection

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Bundle
import android.util.Log
import android.view.TextureView
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.edgedetection.databinding.ActivityMainBinding
import com.example.edgedetection.gl.GLTextureRenderer
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var textureView: TextureView
    private lateinit var edgeDetector: EdgeDetector
    private lateinit var glRenderer: GLTextureRenderer
    private val isProcessing = AtomicBoolean(false)
    private val cameraExecutor = Executors.newSingleThreadExecutor()
    
    companion object {
        private const val TAG = "EdgeDetectionApp"
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        textureView = binding.textureView
        edgeDetector = EdgeDetector()
        
        // Initialize OpenGL renderer
        glRenderer = GLTextureRenderer(this)
        binding.glSurfaceView.setEGLContextClientVersion(2)
        binding.glSurfaceView.setRenderer(glRenderer)
        binding.glSurfaceView.renderMode = GLSurfaceView.RENDERMODE_WHEN_DIRTY
        
        // Request camera permissions
        if (allPermissionsGranted()) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(
                this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS
            )
        }
        
        // Toggle button to switch between camera and edge detection
        binding.toggleButton.setOnCheckedChangeListener { _, isChecked ->
            binding.toggleButton.text = if (isChecked) "Show Edges" else "Show Camera"
        }
    }
    
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        
        cameraProviderFuture.addListener({
            try {
                val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
                }
                
                val imageAnalyzer = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also {
                        it.setAnalyzer(cameraExecutor) { image ->
                            if (isProcessing.compareAndSet(false, true)) {
                                processImage(image)
                                image.close()
                            }
                        }
                    }
                
                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
                
                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        this, cameraSelector, preview, imageAnalyzer
                    )
                } catch(exc: Exception) {
                    Log.e(TAG, "Use case binding failed", exc)
                }
                
            } catch(exc: Exception) {
                Log.e(TAG, "Camera initialization failed", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }
    
    private fun processImage(imageProxy: ImageProxy) {
        try {
            val bitmap = textureView.bitmap ?: return
            
            // Process the image on a background thread
            cameraExecutor.execute {
                try {
                    val processedBitmap = if (binding.toggleButton.isChecked) {
                        edgeDetector.process(bitmap)
                    } else {
                        bitmap
                    }
                    
                    // Update the UI on the main thread
                    runOnUiThread {
                        glRenderer.updateTexture(processedBitmap)
                        binding.glSurfaceView.requestRender()
                    }
                } finally {
                    isProcessing.set(false)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing image", e)
            isProcessing.set(false)
        }
    }
    
    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera()
            } else {
                Toast.makeText(this, "Permissions not granted by the user.", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}
