import { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Video,
  Square,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Volume2,
  VolumeX,
  Zap,
  ZapOff,
  Maximize2,
  Minimize2,
  Download,
  RefreshCw,
  Sun,
  Grid3x3,
  Timer,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  Save
} from 'lucide-react';

const CameraModal = ({ isOpen, onClose, onCapture, mode = 'photo' }) => {
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraMode, setCameraMode] = useState('user');
  const [isMuted, setIsMuted] = useState(false);
  
  // Multiple photos support
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit controls
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlip, setImageFlip] = useState({ horizontal: 1, vertical: 1 });
  
  // Enhanced features
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(3);
  const [countdown, setCountdown] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [captureEffect, setCaptureEffect] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const editCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Get available cameras
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(cameras[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  };

  // Initialize camera
  const startCamera = async (deviceMode = cameraMode, deviceId = selectedCamera) => {
    try {
      setCameraReady(false);
      setCameraError(null);
      
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: deviceId ? 
          { deviceId: { exact: deviceId } } :
          { 
            facingMode: deviceMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
        audio: mode === 'video' ? !isMuted : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }

      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      if (capabilities.zoom) {
        await videoTrack.applyConstraints({
          advanced: [{ zoom: zoom }]
        });
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setCameraReady(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  // Switch camera
  const switchCamera = () => {
    const currentIndex = availableCameras.findIndex(cam => cam.deviceId === selectedCamera);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedCamera(nextCamera.deviceId);
    startCamera(cameraMode, nextCamera.deviceId);
  };

  // Toggle flash
  const toggleFlash = async () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      
      if (capabilities.torch) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !flashEnabled }]
          });
          setFlashEnabled(!flashEnabled);
        } catch (err) {
          console.error('Flash not supported:', err);
        }
      }
    }
  };

  // Handle zoom
  const handleZoomChange = async (newZoom) => {
    setZoom(newZoom);
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      
      if (capabilities.zoom) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ zoom: newZoom }]
          });
        } catch (err) {
          console.error('Zoom error:', err);
        }
      }
    }
  };

  // Timer countdown
  const startCountdown = () => {
    setCountdown(timerSeconds);
    let count = timerSeconds;
    
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        if (mode === 'photo') {
          capturePhoto();
        } else {
          startVideoRecording();
        }
      }
    }, 1000);
  };

  // Capture photo and add to gallery
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setCaptureEffect(true);
      setTimeout(() => setCaptureEffect(false), 200);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.filter = `brightness(${brightness}%)`;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        const newPhoto = {
          id: Date.now(),
          blob,
          url: imageUrl,
          rotation: 0,
          flip: { horizontal: 1, vertical: 1 },
          brightness: 100,
          timestamp: new Date().toISOString()
        };
        
        setCapturedPhotos(prev => [...prev, newPhoto]);
        setShowGallery(true);
      }, 'image/jpeg', 0.95);
    }
  };

  // Start video recording
  const startVideoRecording = async () => {
    try {
      if (!mediaStream) return;

      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm; codecs=vp9'
      });
      
      setMediaRecorder(recorder);
      setRecordedChunks([]);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks(prev => [...prev, e.data]);
        }
      };

      recorder.onstop = () => {
        if (recordedChunks.length > 0) {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(blob);
          onCapture(blob, videoUrl, 'video');
          onClose();
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  // Stop video recording
  const stopVideoRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Edit selected photo
  const editPhoto = (index) => {
    setSelectedPhotoIndex(index);
    setIsEditing(true);
    const photo = capturedPhotos[index];
    setImageRotation(photo.rotation);
    setImageFlip(photo.flip);
    setBrightness(photo.brightness);
  };

  // Apply edits to photo
  const applyEdits = () => {
    if (selectedPhotoIndex === null || !editCanvasRef.current) return;

    const photo = capturedPhotos[selectedPhotoIndex];
    const canvas = editCanvasRef.current;
    const context = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      context.save();
      context.filter = `brightness(${brightness}%)`;
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((imageRotation * Math.PI) / 180);
      context.scale(imageFlip.horizontal, imageFlip.vertical);
      context.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      context.restore();

      canvas.toBlob((blob) => {
        const newUrl = URL.createObjectURL(blob);
        const updatedPhotos = [...capturedPhotos];
        updatedPhotos[selectedPhotoIndex] = {
          ...photo,
          blob,
          url: newUrl,
          rotation: imageRotation,
          flip: imageFlip,
          brightness
        };
        setCapturedPhotos(updatedPhotos);
        setIsEditing(false);
        setSelectedPhotoIndex(null);
      }, 'image/jpeg', 0.95);
    };
    
    img.src = photo.url;
  };

  // Delete photo
  const deletePhoto = (index) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
    if (selectedPhotoIndex === index) {
      setIsEditing(false);
      setSelectedPhotoIndex(null);
    }
  };

  // Download photo
  const downloadPhoto = (photo) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `photo_${photo.id}.jpg`;
    link.click();
  };

  // Save all photos and close
  const saveAllPhotos = () => {
    capturedPhotos.forEach(photo => {
      onCapture(photo.blob, photo.url, 'image');
    });
    onClose();
  };

  // Image editing functions
  const rotateImage = () => setImageRotation((prev) => (prev + 90) % 360);
  const flipHorizontal = () => setImageFlip(prev => ({ ...prev, horizontal: prev.horizontal * -1 }));
  const flipVertical = () => setImageFlip(prev => ({ ...prev, vertical: prev.vertical * -1 }));
  const resetImage = () => {
    setImageRotation(0);
    setImageFlip({ horizontal: 1, vertical: 1 });
    setBrightness(100);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        const newPhoto = {
          id: Date.now() + Math.random(),
          blob: file,
          url: imageUrl,
          rotation: 0,
          flip: { horizontal: 1, vertical: 1 },
          brightness: 100,
          timestamp: new Date().toISOString()
        };
        setCapturedPhotos(prev => [...prev, newPhoto]);
        setShowGallery(true);
      } else if (file.type.startsWith('video/')) {
        onCapture(file, URL.createObjectURL(file), 'video');
      }
    });
    e.target.value = '';
  };

  // Effects
  useEffect(() => {
    if (isOpen) {
      getAvailableCameras();
      startCamera();
    } else {
      stopCamera();
      setCapturedPhotos([]);
      setIsEditing(false);
      setSelectedPhotoIndex(null);
      setImageRotation(0);
      setImageFlip({ horizontal: 1, vertical: 1 });
      setBrightness(100);
      setZoom(1);
      setShowGallery(false);
    }

    return () => stopCamera();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-2 sm:p-4 z-[100]">
      <div 
        ref={containerRef}
        className="bg-gradient-to-br from-gray-900 to-black rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-800"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-sm p-3 sm:p-4 text-white border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mode === 'photo' ? <Camera className="h-5 w-5 sm:h-6 sm:w-6" /> : <Video className="h-5 w-5 sm:h-6 sm:w-6" />}
              <div>
                <h3 className="text-lg sm:text-xl font-bold">
                  {mode === 'photo' ? 'Camera' : 'Video Recorder'}
                  {isEditing && ' • Edit Photo'}
                </h3>
                {cameraReady && !isEditing && (
                  <p className="text-xs sm:text-sm text-gray-300">
                    {capturedPhotos.length > 0 && `${capturedPhotos.length} photo${capturedPhotos.length > 1 ? 's' : ''} captured • `}
                    {availableCameras.find(cam => cam.deviceId === selectedCamera)?.label || 'Camera active'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {capturedPhotos.length > 0 && (
                <button
                  onClick={() => setShowGallery(!showGallery)}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Gallery ({capturedPhotos.length})</span>
                  <span className="sm:hidden">{capturedPhotos.length}</span>
                </button>
              )}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 max-h-[calc(95vh-100px)] overflow-y-auto">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-white text-lg mb-4">{cameraError}</p>
              <button
                onClick={() => startCamera()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Retry
              </button>
            </div>
          ) : isEditing && selectedPhotoIndex !== null ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="relative bg-black rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: '300px', maxHeight: '60vh' }}>
                <img
                  src={capturedPhotos[selectedPhotoIndex].url}
                  alt="Editing"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `rotate(${imageRotation}deg) scaleX(${imageFlip.horizontal}) scaleY(${imageFlip.vertical})`,
                    filter: `brightness(${brightness}%)`
                  }}
                />
                <canvas ref={editCanvasRef} className="hidden" />
              </div>
              
              {/* Edit Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <button
                  onClick={rotateImage}
                  className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCw className="h-5 w-5" />
                  <span className="hidden sm:inline">Rotate</span>
                </button>
                <button
                  onClick={flipHorizontal}
                  className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FlipHorizontal className="h-5 w-5" />
                  <span className="hidden sm:inline">Flip H</span>
                </button>
                <button
                  onClick={flipVertical}
                  className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FlipVertical className="h-5 w-5" />
                  <span className="hidden sm:inline">Flip V</span>
                </button>
                <button
                  onClick={resetImage}
                  className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>

              {/* Brightness Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-white text-sm">
                  <span className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Brightness
                  </span>
                  <span>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedPhotoIndex(null);
                    resetImage();
                  }}
                  className="px-4 py-3 border border-gray-600 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyEdits}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Apply Changes
                </button>
              </div>
            </div>
          ) : (
            // Camera Mode
            <div className="space-y-3 sm:space-y-4">
              {/* Camera Preview */}
              <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '60vh' }}>
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
                  </div>
                )}
                
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    filter: `brightness(${brightness}%)`,
                    transform: `scale(${zoom})`
                  }}
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Grid Overlay */}
                {gridEnabled && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="border border-white/20" />
                    ))}
                  </div>
                )}

                {/* Capture Effect */}
                {captureEffect && (
                  <div className="absolute inset-0 bg-white animate-pulse" />
                )}

                {/* Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-9xl font-bold animate-ping">
                      {countdown}
                    </div>
                  </div>
                )}

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full shadow-lg">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
                  </div>
                )}

                {/* Camera Info */}
                <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full">
                  {cameraMode === 'user' ? '📱 Front' : '📷 Back'} • Zoom: {zoom.toFixed(1)}x
                </div>
              </div>

              {/* Photo Gallery Preview */}
              {showGallery && capturedPhotos.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Captured Photos ({capturedPhotos.length})
                    </h4>
                    <button
                      onClick={() => setShowGallery(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                    {capturedPhotos.map((photo, index) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg cursor-pointer hover:ring-2 ring-purple-500"
                          onClick={() => editPhoto(index)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editPhoto(index);
                            }}
                            className="p-1 bg-blue-600 rounded hover:bg-blue-700"
                            title="Edit"
                          >
                            <RotateCw className="h-3 w-3 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPhoto(photo);
                            }}
                            className="p-1 bg-green-600 rounded hover:bg-green-700"
                            title="Download"
                          >
                            <Download className="h-3 w-3 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePhoto(index);
                            }}
                            className="p-1 bg-red-600 rounded hover:bg-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={saveAllPhotos}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save All Photos ({capturedPhotos.length})
                  </button>
                </div>
              )}

              {/* Zoom Control */}
              <div className="flex items-center gap-3 text-white">
                <span className="text-sm whitespace-nowrap">Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => handleZoomChange(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-mono">{zoom.toFixed(1)}x</span>
              </div>

              {/* Camera Controls */}
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                <button
                  onClick={switchCamera}
                  className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex flex-col items-center justify-center gap-1"
                  title="Switch camera"
                  disabled={availableCameras.length <= 1}
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-xs hidden sm:block">Switch</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex flex-col items-center justify-center gap-1"
                  title="Upload"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-xs hidden sm:block">Upload</span>
                </button>

                <button
                  onClick={toggleFlash}
                  className={`p-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 ${
                    flashEnabled ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-800 hover:bg-gray-700'
                  } text-white`}
                  title={flashEnabled ? 'Flash on' : 'Flash off'}
                >
                  {flashEnabled ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
                  <span className="text-xs hidden sm:block">Flash</span>
                </button>

                <button
                  onClick={() => setGridEnabled(!gridEnabled)}
                  className={`p-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 ${
                    gridEnabled ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-800 hover:bg-gray-700'
                  } text-white`}
                  title="Grid"
                >
                  <Grid3x3 className="h-5 w-5" />
                  <span className="text-xs hidden sm:block">Grid</span>
                </button>

                <button
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={`p-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 ${
                    timerEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700'
                  } text-white`}
                  title={`Timer ${timerSeconds}s`}
                >
                  <Timer className="h-5 w-5" />
                  <span className="text-xs hidden sm:block">{timerSeconds}s</span>
                </button>

                {mode === 'video' && (
                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (mediaStream) {
                        mediaStream.getAudioTracks().forEach(track => {
                          track.enabled = isMuted;
                        });
                      }
                    }}
                    className={`p-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 ${
                      isMuted ? 'bg-gray-800 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    <span className="text-xs hidden sm:block">Audio</span>
                  </button>
                )}
              </div>

              {/* Capture Button */}
              <div className="flex justify-center pt-2">
                {mode === 'photo' ? (
                  <button
                    onClick={timerEnabled ? startCountdown : capturePhoto}
                    disabled={!cameraReady}
                    className="relative p-5 bg-white rounded-full hover:bg-gray-100 transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                  >
                    <Camera className="h-10 w-10 text-black" />
                    {timerEnabled && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {timerSeconds}
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={isRecording ? stopVideoRecording : (timerEnabled ? startCountdown : startVideoRecording)}
                    disabled={!cameraReady}
                    className={`relative p-5 rounded-full transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 ${
                      isRecording 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {isRecording ? (
                      <Square className="h-10 w-10 text-white" />
                    ) : (
                      <Video className="h-10 w-10 text-black" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={mode === 'photo' ? 'image/*' : 'video/*'}
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default CameraModal;