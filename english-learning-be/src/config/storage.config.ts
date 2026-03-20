const defaultAllowedMimeTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
].join(',');

export default () => ({
  storage: {
    s3: {
      region: process.env.S3_REGION || 'ap-southeast-1',
      bucket: process.env.S3_BUCKET || '',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      multipartPartSize: Number.parseInt(
        process.env.S3_MULTIPART_PART_SIZE || `${10 * 1024 * 1024}`,
        10,
      ),
      presignedUrlExpiresIn: Number.parseInt(
        process.env.S3_PRESIGNED_URL_EXPIRES_IN || '900',
        10,
      ),
      uploadSessionExpiresIn:
        process.env.S3_UPLOAD_SESSION_EXPIRES_IN || '1d',
      maxUploadSizeBytes: Number.parseInt(
        process.env.S3_MAX_UPLOAD_SIZE_BYTES || `${5 * 1024 * 1024 * 1024}`,
        10,
      ),
      maxMultipartParts: Number.parseInt(
        process.env.S3_MAX_MULTIPART_PARTS || '10000',
        10,
      ),
      allowedMimeTypes: (
        process.env.S3_ALLOWED_MIME_TYPES || defaultAllowedMimeTypes
      )
        .split(',')
        .map((mimeType) => mimeType.trim())
        .filter(Boolean),
    },
  },
});
