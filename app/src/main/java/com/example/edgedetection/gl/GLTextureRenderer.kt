package com.example.edgedetection.gl

import android.content.Context
import android.graphics.Bitmap
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.opengl.GLUtils
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10

class GLTextureRenderer(private val context: Context) : GLSurfaceView.Renderer {
    private val vertexShaderCode =
        "attribute vec4 vPosition;\n" +
        "attribute vec2 vTexCoord;\n" +
        "varying vec2 texCoord;\n" +
        "void main() {\n" +
        "  gl_Position = vPosition;\n" +
        "  texCoord = vTexCoord;\n" +
        "}"

    private val fragmentShaderCode =
        "precision mediump float;\n" +
        "uniform sampler2D tex;\n" +
        "varying vec2 texCoord;\n" +
        "void main() {\n" +
        "  gl_FragColor = texture2D(tex, texCoord);\n" +
        "}"

    private var program = 0
    private var textureID = 0
    private var positionHandle = 0
    private var texCoordHandle = 0
    private var texSamplerHandle = 0

    private val vertices = floatArrayOf(
        -1f, -1f,  // bottom left
        1f, -1f,   // bottom right
        -1f, 1f,   // top left
        1f, 1f     // top right
    )

    private val texCoords = floatArrayOf(
        0f, 1f,  // bottom left
        1f, 1f,  // bottom right
        0f, 0f,  // top left
        1f, 0f   // top right
    )

    private var vertexBuffer: FloatBuffer = ByteBuffer.allocateDirect(vertices.size * 4)
        .order(ByteOrder.nativeOrder())
        .asFloatBuffer()
        .apply {
            put(vertices)
            position(0)
        }

    private var texCoordBuffer: FloatBuffer = ByteBuffer.allocateDirect(texCoords.size * 4)
        .order(ByteOrder.nativeOrder())
        .asFloatBuffer()
        .apply {
            put(texCoords)
            position(0)
        }

    private val mvpMatrix = FloatArray(16)
    private var initialized = false
    private var bitmap: Bitmap? = null

    fun updateTexture(bitmap: Bitmap) {
        this.bitmap = bitmap
    }

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        GLES20.glClearColor(0.0f, 0.0f, 0.0f, 1.0f)
        
        val vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, vertexShaderCode)
        val fragmentShader = loadShader(GLES20.GL_FRAGMENT_SHADER, fragmentShaderCode)
        
        program = GLES20.glCreateProgram()
        GLES20.glAttachShader(program, vertexShader)
        GLES20.glAttachShader(program, fragmentShader)
        GLES20.glLinkProgram(program)
        
        positionHandle = GLES20.glGetAttribLocation(program, "vPosition")
        texCoordHandle = GLES20.glGetAttribLocation(program, "vTexCoord")
        texSamplerHandle = GLES20.glGetUniformLocation(program, "tex")
        
        // Generate texture
        val textures = IntArray(1)
        GLES20.glGenTextures(1, textures, 0)
        textureID = textures[0]
        
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureID)
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR)
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR)
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE)
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE)
        
        initialized = true
    }

    override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
        GLES20.glViewport(0, 0, width, height)
        Matrix.setIdentityM(mvpMatrix, 0)
    }

    override fun onDrawFrame(gl: GL10?) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT or GLES20.GL_DEPTH_BUFFER_BIT)
        
        if (!initialized || bitmap == null) return
        
        GLES20.glUseProgram(program)
        
        // Update texture if needed
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureID)
        GLUtils.texImage2D(GLES20.GL_TEXTURE_2D, 0, bitmap, 0)
        GLES20.glUniform1i(texSamplerHandle, 0)
        
        // Set vertex attributes
        GLES20.glEnableVertexAttribArray(positionHandle)
        GLES20.glVertexAttribPointer(
            positionHandle, 2, GLES20.GL_FLOAT, false,
            0, vertexBuffer
        )
        
        GLES20.glEnableVertexAttribArray(texCoordHandle)
        GLES20.glVertexAttribPointer(
            texCoordHandle, 2, GLES20.GL_FLOAT, false,
            0, texCoordBuffer
        )
        
        // Draw
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)
        
        // Disable vertex array
        GLES20.glDisableVertexAttribArray(positionHandle)
        GLES20.glDisableVertexAttribArray(texCoordHandle)
    }
    
    private fun loadShader(type: Int, shaderCode: String): Int {
        val shader = GLES20.glCreateShader(type)
        GLES20.glShaderSource(shader, shaderCode)
        GLES20.glCompileShader(shader)
        return shader
    }
}
