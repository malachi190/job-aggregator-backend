import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageService } from './interfaces/storage.interface';
import { EnvService } from 'src/config/env.service';

@Injectable()
export class R2StorageService implements StorageService {
  private readonly client: S3Client;

  constructor(private readonly env: EnvService) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: this.env.r2Endpoint,
      credentials: {
        accessKeyId: this.env.r2AccessKeyId,
        secretAccessKey: this.env.r2SecretAccessKey,
      },
    });
  }

  async upload(
    file: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.env.r2BucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      }),
    );
    return `${this.env.r2PublicUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.env.r2BucketName,
        Key: key,
      }),
    );
  }
}
