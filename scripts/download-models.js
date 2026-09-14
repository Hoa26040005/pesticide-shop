const fs = require('fs');
const https = require('https');
const path = require('path');

console.log('📥 Bắt đầu tải face recognition models...');

const modelsDir = path.join(__dirname, '..', 'public', 'models');

// Tạo thư mục
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log('✅ Đã tạo thư mục:', modelsDir);
}

// Files cần tải
const files = [
  {
    name: 'ssd_mobilenetv1_model-shard1',
    url: 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/ssd_mobilenetv1_model-shard1'
  },
  {
    name: 'ssd_mobilenetv1_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json'
  },
  {
    name: 'face_landmark_68_model-shard1',
    url: 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-shard1'
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json'
  },
  {
    name: 'face_recognition_model-shard1',
    url: 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-shard1'
  },
  {
    name: 'face_recognition_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} cho ${url}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadAll() {
  for (const file of files) {
    const dest = path.join(modelsDir, file.name);
    console.log(`⬇️  Đang tải ${file.name}...`);
    
    try {
      await downloadFile(file.url, dest);
      console.log(`✅ Đã tải xong ${file.name}`);
    } catch (error) {
      console.error(`❌ Lỗi tải ${file.name}:`, error.message);
    }
  }
  
  console.log('\n🎉 Hoàn thành tải models!');
  console.log('📁 Vị trí:', modelsDir);
}

downloadAll().catch(console.error);