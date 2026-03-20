import { BadRequestException } from '@nestjs/common';
import { errorPayload } from 'src/common/utils/error-payload.util';

interface ValidateMultipartUploadRequestInput {
  size: number;
  mimeType?: string;
  partSize: number;
  maxUploadSizeBytes: number;
  maxMultipartParts: number;
  allowedMimeTypes: string[];
}

interface ValidateMultipartUploadRequestResult {
  mimeType: string;
  totalParts: number;
}

export function validateMultipartUploadRequest(
  input: ValidateMultipartUploadRequestInput,
): ValidateMultipartUploadRequestResult {
  const mimeType = input.mimeType?.trim().toLowerCase();
  if (!mimeType) {
    throw new BadRequestException(
      errorPayload(
        'mimeType is required',
        'STORAGE_UPLOAD_MIME_TYPE_REQUIRED',
      ),
    );
  }

  if (input.size > input.maxUploadSizeBytes) {
    throw new BadRequestException(
      errorPayload(
        `size exceeds max upload size of ${input.maxUploadSizeBytes} bytes`,
        'STORAGE_UPLOAD_SIZE_EXCEEDED',
      ),
    );
  }

  if (!isMimeTypeAllowed(mimeType, input.allowedMimeTypes)) {
    throw new BadRequestException(
      errorPayload(
        'mimeType is not allowed',
        'STORAGE_UPLOAD_MIME_TYPE_NOT_ALLOWED',
      ),
    );
  }

  const totalParts = Math.ceil(input.size / input.partSize);
  if (totalParts > input.maxMultipartParts) {
    throw new BadRequestException(
      errorPayload(
        'Upload requires too many parts. Increase part size or reduce file size',
        'STORAGE_UPLOAD_TOO_MANY_PARTS',
      ),
    );
  }

  return {
    mimeType,
    totalParts,
  };
}

function isMimeTypeAllowed(
  mimeType: string,
  allowedMimeTypes: string[],
): boolean {
  return allowedMimeTypes.some((allowedMimeType) => {
    const normalizedAllowedMimeType = allowedMimeType.trim().toLowerCase();
    if (!normalizedAllowedMimeType) {
      return false;
    }

    if (normalizedAllowedMimeType.endsWith('/*')) {
      return mimeType.startsWith(normalizedAllowedMimeType.slice(0, -1));
    }

    return mimeType === normalizedAllowedMimeType;
  });
}
