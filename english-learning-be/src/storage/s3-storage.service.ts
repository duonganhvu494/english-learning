import { randomUUID } from 'crypto';
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { parseDurationToSeconds } from 'src/common/utils/duration.util';

@Injectable()
export class S3StorageService {
  private readonly client: S3Client;

  constructor(private readonly config: ConfigService) {
    this.client = new S3Client({
      region: this.config.get<string>('storage.s3.region', 'ap-southeast-1'),
      credentials: {
        accessKeyId: this.config.get<string>('storage.s3.accessKeyId', ''),
        secretAccessKey: this.config.get<string>('storage.s3.secretAccessKey', ''),
      },
      endpoint: this.config.get<string | undefined>('storage.s3.endpoint'),
      forcePathStyle: this.config.get<boolean>('storage.s3.forcePathStyle', false),
    });
  }

  get bucket(): string {
    return this.config.get<string>('storage.s3.bucket', '');
  }

  get multipartPartSize(): number {
    return this.config.get<number>('storage.s3.multipartPartSize', 10 * 1024 * 1024);
  }

  get presignedUrlExpiresIn(): number {
    return this.config.get<number>('storage.s3.presignedUrlExpiresIn', 900);
  }

  get uploadSessionExpiresInSeconds(): number {
    return parseDurationToSeconds(
      this.config.get<string>('storage.s3.uploadSessionExpiresIn', '1d'),
      24 * 60 * 60,
    );
  }

  get maxUploadSizeBytes(): number {
    return this.config.get<number>(
      'storage.s3.maxUploadSizeBytes',
      5 * 1024 * 1024 * 1024,
    );
  }

  get maxMultipartParts(): number {
    return this.config.get<number>('storage.s3.maxMultipartParts', 10000);
  }

  get allowedMimeTypes(): string[] {
    return this.config.get<string[]>('storage.s3.allowedMimeTypes', []);
  }

  async createMultipartUpload(input: {
    objectKey: string;
    mimeType?: string;
  }): Promise<{ bucket: string; uploadId: string }> {
    const result = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: input.objectKey,
        ContentType: input.mimeType,
      }),
    );

    if (!result.UploadId) {
      throw new Error('S3 did not return uploadId');
    }

    return {
      bucket: this.bucket,
      uploadId: result.UploadId,
    };
  }

  async signUploadPart(input: {
    objectKey: string;
    uploadId: string;
    partNumber: number;
  }): Promise<string> {
    return getSignedUrl(
      this.client,
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: input.objectKey,
        UploadId: input.uploadId,
        PartNumber: input.partNumber,
      }),
      { expiresIn: this.presignedUrlExpiresIn },
    );
  }

  async completeMultipartUpload(input: {
    objectKey: string;
    uploadId: string;
    parts: Array<{ partNumber: number; etag: string }>;
  }): Promise<void> {
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: input.objectKey,
        UploadId: input.uploadId,
        MultipartUpload: {
          Parts: input.parts.map((part) => ({
            ETag: part.etag,
            PartNumber: part.partNumber,
          })),
        },
      }),
    );
  }

  async abortMultipartUpload(input: {
    objectKey: string;
    uploadId: string;
  }): Promise<void> {
    await this.client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: input.objectKey,
        UploadId: input.uploadId,
      }),
    );
  }

  async deleteObject(input: {
    bucket?: string | null;
    objectKey: string;
  }): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: input.bucket || this.bucket,
        Key: input.objectKey,
      }),
    );
  }

  async createSignedDownloadUrl(input: {
    bucket?: string | null;
    objectKey: string;
    fileName: string;
  }): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: input.bucket || this.bucket,
        Key: input.objectKey,
        ResponseContentDisposition: `attachment; filename="${input.fileName}"`,
      }),
      { expiresIn: this.presignedUrlExpiresIn },
    );
  }

  buildMaterialObjectKey(input: {
    workspaceId: string;
    category: string;
    fileName: string;
    now?: Date;
  }): string {
    const now = input.now ?? new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const extension = extname(input.fileName);
    return `workspace/${input.workspaceId}/${input.category}/${year}/${month}/${randomUUID()}${extension}`;
  }
}
