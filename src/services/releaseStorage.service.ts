import { S3Client, PutObjectCommand, GetObjectCommand, type GetObjectCommandOutput } from '@aws-sdk/client-s3';

// Reuses the same S3-compatible object storage (Cloud.ru) already used for backups, under its own
// `releases/vspyshka/` prefix, so Вспышка's own binaries can be hosted from arlist.ru instead of
// depending on npm or GitHub Releases as the source of truth.
const BUCKET = process.env.RELEASES_S3_BUCKET || '';
const PREFIX = 'releases/vspyshka';

function client(): S3Client {
  const keyId = process.env.RELEASES_S3_ACCESS_KEY;
  const secretAccessKey = process.env.RELEASES_S3_SECRET_KEY;
  const tenantId = process.env.RELEASES_S3_TENANT_ID;
  if (!keyId || !secretAccessKey || !BUCKET) {
    throw new Error('RELEASES_S3_ACCESS_KEY/RELEASES_S3_SECRET_KEY/RELEASES_S3_BUCKET not configured');
  }
  // Cloud.ru's S3E requires the access key id to be prefixed with the tenant id
  // (`<tenant_id>:<key_id>`), unlike plain access keys used elsewhere (e.g. the backup script).
  const accessKeyId = tenantId ? `${tenantId}:${keyId}` : keyId;
  return new S3Client({
    endpoint: process.env.RELEASES_S3_ENDPOINT || 'https://s3.cloud.ru',
    region: process.env.RELEASES_S3_REGION || 'ru-central-1',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

function objectKey(version: string, filename: string): string {
  return `${PREFIX}/${version}/${filename}`;
}

export async function uploadReleaseAsset(version: string, filename: string, body: Buffer): Promise<void> {
  await client().send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: objectKey(version, filename),
    Body: body,
  }));
}

export async function setLatestVersion(version: string): Promise<void> {
  await client().send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `${PREFIX}/latest.json`,
    Body: Buffer.from(JSON.stringify({ version })),
    ContentType: 'application/json',
  }));
}

export async function getLatestVersion(): Promise<string | null> {
  try {
    const response = await client().send(new GetObjectCommand({ Bucket: BUCKET, Key: `${PREFIX}/latest.json` }));
    const body = await streamToString(response);
    return (JSON.parse(body) as { version: string }).version;
  } catch {
    return null;
  }
}

export interface Announcement {
  message: string;
  minVersion?: string;
  maxVersion?: string;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const response = await client().send(new GetObjectCommand({ Bucket: BUCKET, Key: `${PREFIX}/announcements.json` }));
    const body = await streamToString(response);
    const parsed = JSON.parse(body) as { announcements?: Announcement[] };
    return parsed.announcements ?? [];
  } catch {
    return [];
  }
}

export async function setAnnouncements(announcements: Announcement[]): Promise<void> {
  await client().send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `${PREFIX}/announcements.json`,
    Body: Buffer.from(JSON.stringify({ announcements })),
    ContentType: 'application/json',
  }));
}

export async function getReleaseAsset(version: string, filename: string): Promise<GetObjectCommandOutput | null> {
  try {
    return await client().send(new GetObjectCommand({ Bucket: BUCKET, Key: objectKey(version, filename) }));
  } catch {
    return null;
  }
}

async function streamToString(response: GetObjectCommandOutput): Promise<string> {
  const chunks: Uint8Array[] = [];
  const body = response.Body as NodeJS.ReadableStream;
  for await (const chunk of body) {
    chunks.push(chunk as Uint8Array);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
