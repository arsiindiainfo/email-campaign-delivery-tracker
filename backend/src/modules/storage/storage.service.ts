// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const aws = configService.get('aws', { infer: true })!;
    this.bucket = configService.get('s3.uploadsBucket', { infer: true })!;
    this.client = new S3Client({
      region: aws.region,
      endpoint: aws.endpoint,
      forcePathStyle: !!aws.endpoint,
      credentials:
        aws.accessKeyId && aws.secretAccessKey
          ? {
              accessKeyId: aws.accessKeyId,
              secretAccessKey: aws.secretAccessKey,
            }
          : undefined,
    });
  }

  /** §16 — the frontend uploads the CSV directly to S3 with this URL; the API only registers the key. */
  async createUploadUrl(
    organizationId: string,
    filename: string,
  ): Promise<{ uploadUrl: string; s3Key: string }> {
    const s3Key = `uploads/${organizationId}/${randomUUID()}-${filename}`;
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        ContentType: 'text/csv',
      }),
      { expiresIn: 300 },
    );
    return { uploadUrl, s3Key };
  }

  /** An org may only import a key under its own upload prefix (§16 validation). */
  belongsToOrganization(organizationId: string, s3Key: string): boolean {
    return s3Key.startsWith(`uploads/${organizationId}/`);
  }

  async getObjectStream(s3Key: string): Promise<Readable> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: s3Key }),
    );
    return result.Body as Readable;
  }

  async putObject(
    s3Key: string,
    body: string,
    contentType: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }
}
