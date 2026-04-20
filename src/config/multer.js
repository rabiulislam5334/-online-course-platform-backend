const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for course thumbnails (images only)
const thumbnailStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'course-platform/thumbnails',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 800, height: 450, crop: 'fill' }],
  },
});

// Storage for lesson files (pdf, video, etc)
const lessonFileStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder:         'course-platform/lessons',
      resource_type:  isVideo ? 'video' : 'raw',
      allowed_formats: ['pdf', 'mp4', 'webm', 'jpg', 'jpeg', 'png'],
    };
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf|mp4|webm/;
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (allowed.test(ext)) return cb(null, true);
  cb(new Error('File type not allowed'));
};

// Multer instances
const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});

const uploadLessonFile = multer({
  storage: lessonFileStorage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for lesson files
});

// Default upload (thumbnail)
const upload = uploadThumbnail;

module.exports = upload;
module.exports.uploadThumbnail  = uploadThumbnail;
module.exports.uploadLessonFile = uploadLessonFile;
module.exports.cloudinary       = cloudinary;