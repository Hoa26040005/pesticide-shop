import * as faceapi from '@vladmandic/face-api';

// Lấy đường dẫn đúng cho Electron và Web
const isElectron = window && window.process && window.process.type;
let MODEL_URL = '';

if (isElectron) {
  // Trong Electron: dùng đường dẫn file://
  const path = window.require('path');
  MODEL_URL = path.join(__dirname, '../../public/models').replace(/\\/g, '/');
} else {
  // Trong Web: dùng public URL
  MODEL_URL = '/models';
}

console.log('📁 Model URL:', MODEL_URL);

let modelsLoaded = false;
let loadingPromise = null;

export const loadFaceModels = async () => {
  if (modelsLoaded) return true;
  
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('🔄 Loading face models from:', MODEL_URL);
      
      // Trong Electron, cần chuyển đổi đường dẫn
      let actualModelUrl = MODEL_URL;
      if (isElectron && !MODEL_URL.startsWith('file://')) {
        actualModelUrl = 'file://' + MODEL_URL;
      }
      
      // Load models
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(actualModelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(actualModelUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(actualModelUrl)
      ]);
      
      console.log('✅ Face models loaded successfully');
      modelsLoaded = true;
      resolve(true);
    } catch (error) {
      console.error('❌ Failed to load face models:', error);
      
      // Fallback: thử với đường dẫn tương đối
      try {
        console.log('🔄 Trying fallback model path...');
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        
        console.log('✅ Face models loaded with fallback');
        modelsLoaded = true;
        resolve(true);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        reject(error);
      }
    } finally {
      loadingPromise = null;
    }
  });
  
  return loadingPromise;
};

export const detectFace = async (imageElement) => {
  if (!modelsLoaded) {
    await loadFaceModels();
  }
  
  return faceapi
    .detectSingleFace(imageElement)
    .withFaceLandmarks()
    .withFaceDescriptor();
};

export const createFaceMatcher = (descriptor, label = 'Admin', threshold = 0.6) => {
  const float32Descriptor = new Float32Array(descriptor);
  const labeledDescriptors = new faceapi.LabeledFaceDescriptors(
    label, 
    [float32Descriptor]
  );
  return new faceapi.FaceMatcher(labeledDescriptors, threshold);
};

export const isFaceRegistered = () => {
  try {
    const data = localStorage.getItem('admin_face_descriptor');
    return !!data;
  } catch {
    return false;
  }
};

export const getFaceDescriptor = () => {
  try {
    const data = localStorage.getItem('admin_face_descriptor');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const clearFaceData = () => {
  localStorage.removeItem('admin_face_descriptor');
  localStorage.removeItem('face_register_time');
  localStorage.removeItem('face_confidence');
  localStorage.removeItem('face_samples');
};

export const checkModelsExist = async () => {
  try {
    const response = await fetch('/models/ssd_mobilenetv1_model-weights_manifest.json');
    return response.ok;
  } catch {
    return false;
  }
};