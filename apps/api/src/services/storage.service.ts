import crypto from 'crypto';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';

export type UploadScope =
  | 'avatars'
  | 'profile'
  | 'feed'
  | 'events'
  | 'materials'
  | 'proofs'
  | 'gallery'
  | 'projects'
  | 'cinematics'
  | 'audios';

const ALLOWED_MIME_TYPES: Record<UploadScope, string[]> = {
  avatars: ['image/jpeg', 'image/png', 'image/webp'],
  profile: ['image/jpeg', 'image/png', 'image/webp'],
  feed: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  events: ['image/jpeg', 'image/png', 'image/webp'],
  materials: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  proofs: ['image/jpeg', 'image/png', 'image/webp'],
  gallery: ['image/jpeg', 'image/png', 'image/webp'],
  projects: ['image/jpeg', 'image/png', 'image/webp'],
  cinematics: ['video/mp4', 'video/webm', 'video/quicktime'],
  audios: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/aac'],
};

const MAX_BYTES: Record<UploadScope, number> = {
  avatars: 3 * 1024 * 1024,
  profile: 8 * 1024 * 1024,
  feed: 6 * 1024 * 1024,
  events: 6 * 1024 * 1024,
  materials: 10 * 1024 * 1024,
  proofs: 8 * 1024 * 1024,
  gallery: 8 * 1024 * 1024,
  projects: 6 * 1024 * 1024,
  cinematics: 80 * 1024 * 1024,
  audios: 15 * 1024 * 1024,
};

function mimeToExt(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'application/pdf':
      return 'pdf';
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    case 'video/quicktime':
      return 'mov';
    case 'audio/mpeg':
      return 'mp3';
    case 'audio/ogg':
      return 'ogg';
    case 'audio/wav':
      return 'wav';
    case 'audio/mp4':
      return 'm4a';
    case 'audio/aac':
      return 'aac';
    default:
      return 'bin';
  }
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export class StorageService {
  private s3Client: S3Client | null = null;
  private radioFilesCache: { expiresAt: number; files: string[] } | null = null;
  private radioFilesRequest: Promise<string[]> | null = null;

  isConfigured(): boolean {
    return Boolean(
      env.STORAGE_ENDPOINT &&
        env.STORAGE_BUCKET &&
        env.STORAGE_ACCESS_KEY &&
        env.STORAGE_SECRET_KEY
    );
  }

  private getS3Client(): S3Client {
    if (!this.isConfigured()) {
      throw new AppError('Armazenamento externo S3 não configurado.', 503, 'STORAGE_NOT_CONFIGURED');
    }

    if (!this.s3Client) {
      this.s3Client = new S3Client({
        endpoint: env.STORAGE_ENDPOINT,
        region: 'auto',
        forcePathStyle: true,
        credentials: {
          accessKeyId: env.STORAGE_ACCESS_KEY,
          secretAccessKey: env.STORAGE_SECRET_KEY,
        },
      });
    }

    return this.s3Client;
  }

  private getRadioObjectKey(relativePath: string): string {
    if (
      !relativePath ||
      relativePath.includes('\\') ||
      relativePath.startsWith('/') ||
      relativePath.split('/').some((part) => !part || part === '.' || part === '..') ||
      !relativePath.toLowerCase().endsWith('.mp3')
    ) {
      throw new AppError('Caminho da música inválido.', 400, 'INVALID_AUDIO_PATH');
    }

    return `musicas/${relativePath}`;
  }

  async uploadRadioFile(relativePath: string, buffer: Buffer): Promise<void> {
    const client = this.getS3Client();
    const key = this.getRadioObjectKey(relativePath);

    try {
      await client.send(new HeadObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }));
      throw new AppError('Já existe um arquivo com esse nome nesta pasta.', 409, 'AUDIO_FILE_EXISTS');
    } catch (error) {
      if (error instanceof AppError) throw error;
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      const name = (error as { name?: string }).name;
      if (status !== 404 && name !== 'NotFound' && name !== 'NoSuchKey') throw error;
    }

    await client.send(new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'audio/mpeg',
    }));
    this.radioFilesCache = null;
  }

  async listRadioFiles(): Promise<string[]> {
    if (this.radioFilesCache && this.radioFilesCache.expiresAt > Date.now()) {
      return [...this.radioFilesCache.files];
    }
    if (this.radioFilesRequest) return [...await this.radioFilesRequest];

    this.radioFilesRequest = (async () => {
      const client = this.getS3Client();
      const files: string[] = [];
      let continuationToken: string | undefined;

      do {
        const response = await client.send(new ListObjectsV2Command({
          Bucket: env.STORAGE_BUCKET,
          Prefix: 'musicas/',
          ContinuationToken: continuationToken,
        }));

        for (const object of response.Contents || []) {
          const key = object.Key;
          if (key?.startsWith('musicas/') && key.toLowerCase().endsWith('.mp3')) {
            files.push(key.slice('musicas/'.length));
          }
        }
        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
      } while (continuationToken);

      return files.sort((a, b) => a.localeCompare(b));
    })();

    try {
      const files = await this.radioFilesRequest;
      this.radioFilesCache = { files, expiresAt: Date.now() + 300_000 };
      return [...files];
    } finally {
      this.radioFilesRequest = null;
    }
  }

  async assertRadioFileExists(relativePath: string): Promise<void> {
    try {
      await this.getS3Client().send(new HeadObjectCommand({
        Bucket: env.STORAGE_BUCKET,
        Key: this.getRadioObjectKey(relativePath),
      }));
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      const name = (error as { name?: string }).name;
      if (status === 404 || name === 'NotFound' || name === 'NoSuchKey') {
        throw new AppError('Arquivo de áudio não encontrado.', 404, 'AUDIO_FILE_NOT_FOUND');
      }
      throw error;
    }
  }

  async getRadioFileUrl(relativePath: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: this.getRadioObjectKey(relativePath),
    });
    return getSignedUrl(this.getS3Client(), command, { expiresIn: 3600 });
  }

  async deleteRadioFile(relativePath: string): Promise<void> {
    await this.getS3Client().send(new DeleteObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: this.getRadioObjectKey(relativePath),
    }));
    this.radioFilesCache = null;
  }

  getStatus() {
    return {
      configured: this.isConfigured(),
      provider: this.isConfigured() ? 's3-compatible' : 'unconfigured',
      bucket: env.STORAGE_BUCKET ? env.STORAGE_BUCKET : null,
    };
  }

  validateFile(scope: UploadScope, mimeType: string, buffer: Buffer) {
    const allowed = ALLOWED_MIME_TYPES[scope];
    if (!allowed.includes(mimeType)) {
      throw new AppError(
        `Tipo de arquivo não permitido (${mimeType}). Permitidos: ${allowed.join(', ')}`,
        400,
        'INVALID_FILE_TYPE'
      );
    }

    const max = MAX_BYTES[scope];
    if (!buffer || buffer.length === 0) {
      throw new AppError('Arquivo vazio.', 400, 'EMPTY_FILE');
    }
    if (buffer.length > max) {
      throw new AppError(
        `Arquivo excede o limite de ${Math.round(max / (1024 * 1024))}MB.`,
        400,
        'FILE_TOO_LARGE'
      );
    }

    // Magic-byte verification for common formats
    if (mimeType === 'image/png' && !buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
      throw new AppError('Conteúdo do arquivo não corresponde a um PNG válido.', 400, 'INVALID_SIGNATURE');
    }
    if (mimeType === 'image/jpeg' && !(buffer[0] === 0xff && buffer[1] === 0xd8)) {
      throw new AppError('Conteúdo do arquivo não corresponde a um JPEG válido.', 400, 'INVALID_SIGNATURE');
    }
    if (mimeType === 'application/pdf' && buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
      throw new AppError('Conteúdo do arquivo não corresponde a um PDF válido.', 400, 'INVALID_SIGNATURE');
    }
  }

  async uploadBuffer(params: {
    scope: UploadScope;
    mimeType: string;
    buffer: Buffer;
    ownerId: string;
  }): Promise<{ key: string; url: string; isPrivate: boolean }> {
    if (!this.isConfigured()) {
      throw new AppError(
        'Armazenamento externo S3 não configurado (STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY). Upload permanente indisponível no momento.',
        503,
        'STORAGE_NOT_CONFIGURED'
      );
    }

    this.validateFile(params.scope, params.mimeType, params.buffer);

    const ext = mimeToExt(params.mimeType);
    const id = crypto.randomUUID();
    const isPrivate = params.scope === 'proofs';
    const key = `${params.scope}/${params.ownerId}/${id}.${ext}`;

    const endpointUrl = new URL(env.STORAGE_ENDPOINT);
    const host = endpointUrl.host;
    const basePath = endpointUrl.pathname.replace(/\/$/, '');
    const objectPath = `${basePath}/${env.STORAGE_BUCKET}/${key}`;
    const targetUrl = `${endpointUrl.origin}${objectPath}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';
    const payloadHash = sha256Hex(params.buffer);

    const canonicalHeaders =
      `content-type:${params.mimeType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      'PUT',
      objectPath,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const kDate = hmacSha256(`AWS4${env.STORAGE_SECRET_KEY}`, dateStamp);
    const kRegion = hmacSha256(kDate, region);
    const kService = hmacSha256(kRegion, service);
    const kSigning = hmacSha256(kService, 'aws4_request');
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authorization = `AWS4-HMAC-SHA256 Credential=${env.STORAGE_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': params.mimeType,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        Authorization: authorization,
      },
      body: new Uint8Array(params.buffer),
    });

    if (!response.ok) {
      throw new AppError(
        `Falha ao enviar arquivo para o storage S3 (HTTP ${response.status}).`,
        502,
        'STORAGE_UPLOAD_FAILED'
      );
    }

    return {
      key,
      url: isPrivate
        ? `/api/uploads/private/${encodeURIComponent(key)}`
        : ['gallery', 'avatars', 'profile'].includes(params.scope)
          ? `uploads/${key}`
          : targetUrl,
      isPrivate,
    };
  }

  async fetchPrivateObject(key: string): Promise<{ buffer: Buffer; contentType: string }> {
    if (!this.isConfigured()) {
      throw new AppError('Storage S3 não configurado.', 503, 'STORAGE_NOT_CONFIGURED');
    }

    const endpointUrl = new URL(env.STORAGE_ENDPOINT);
    const host = endpointUrl.host;
    const basePath = endpointUrl.pathname.replace(/\/$/, '');
    const objectPath = `${basePath}/${env.STORAGE_BUCKET}/${key}`;
    const targetUrl = `${endpointUrl.origin}${objectPath}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';
    const payloadHash = sha256Hex('');

    const canonicalHeaders =
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = ['GET', objectPath, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');

    const kDate = hmacSha256(`AWS4${env.STORAGE_SECRET_KEY}`, dateStamp);
    const kRegion = hmacSha256(kDate, region);
    const kService = hmacSha256(kRegion, service);
    const kSigning = hmacSha256(kService, 'aws4_request');
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        Authorization: `AWS4-HMAC-SHA256 Credential=${env.STORAGE_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      },
    });

    if (!response.ok) {
      throw new AppError('Arquivo privado não encontrado no storage.', 404, 'FILE_NOT_FOUND');
    }

    const arrayBuf = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuf),
      contentType: response.headers.get('content-type') || 'application/octet-stream',
    };
  }
}

export const storageService = new StorageService();
