export const FACE_API_CONFIG = {
  // Cấu hình model an toàn cho Vite & Electron
  MODEL_URL: (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
    ? `${import.meta.env.BASE_URL}models`.replace('//', '/')
    : '/models',
  
  // Cấu hình detection
  DETECTION_OPTIONS: {
    minConfidence: 0.5,
    maxResults: 1
  },
  
  // Ngưỡng nhận diện
  MATCH_THRESHOLD: 0.6,
  
  // Timeout
  LOAD_TIMEOUT: 30000, // 30 giây
};

// Hàm tạo URL an toàn
export const getModelUrl = (fileName) => {
  return `${FACE_API_CONFIG.MODEL_URL}/${fileName}`;
};

// Danh sách models cần tải
export const REQUIRED_MODELS = [
  {
    name: 'ssd_mobilenetv1',
    files: [
      'ssd_mobilenetv1_model-shard1',
      'ssd_mobilenetv1_model-weights_manifest.json'
    ]
  },
  {
    name: 'face_landmark_68',
    files: [
      'face_landmark_68_model-shard1',
      'face_landmark_68_model-weights_manifest.json'
    ]
  },
  {
    name: 'face_recognition',
    files: [
      'face_recognition_model-shard1',
      'face_recognition_model-weights_manifest.json'
    ]
  }
];