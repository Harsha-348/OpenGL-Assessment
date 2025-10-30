cmake_minimum_required(VERSION 3.18.1)

# Set OpenCV_DIR to your OpenCV Android SDK path
set(OpenCV_DIR ${CMAKE_SOURCE_DIR}/../sdk/native/jni)
find_package(OpenCV REQUIRED)

add_library(native-lib SHARED
    native-lib.cpp
)

target_include_directories(native-lib PRIVATE
    ${OpenCV_INCLUDE_DIRS}
)

target_link_libraries(native-lib
    android
    log
    jnigraphics
    ${OpenCV_LIBS}
)
