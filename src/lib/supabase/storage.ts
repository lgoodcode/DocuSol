import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "documents";
const EXPIRATION_TIME = 3600;

/**
 * Storage service for the documents bucket. This will handle specifying
 * the bucket name and providing methods to interact with the bucket.
 *
 * @param supabase - Supabase client
 */
export class StorageService {
  private bucket: string;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.bucket = BUCKET_NAME;
    this.supabase = supabase;
  }

  private getUserPath(userId: string) {
    return `users/${userId}`;
  }

  getFilePath(userId: string, fileName: string, version: number) {
    return `${this.getUserPath(userId)}/${fileName}_V${version}`;
  }

  async getPresignedUrl(
    userId: string,
    fileName: string,
    version: number,
  ): Promise<string> {
    const filePath = this.getFilePath(userId, fileName, version);
    const { error, data } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(filePath);

    if (error) throw error;
    if (!data.signedUrl) throw new Error("No signed URL returned");

    return data.signedUrl;
  }

  async uploadFile(
    userId: string,
    fileName: string,
    fileData: Buffer | Blob,
    contentType: string,
    version: number,
  ) {
    const filePath = this.getFilePath(userId, fileName, version);
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, fileData, {
        contentType,
        upsert: false,
      });

    if (error) throw error;
  }

  async verifyFileExists(filePath: string): Promise<boolean> {
    const { error, data: exists } = await this.supabase.storage
      .from(this.bucket)
      .exists(filePath);

    if (error) throw error;
    return exists;
  }

  async deleteFiles(filePaths: string[]): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove(filePaths);

    if (error) throw error;
  }

  async getDocument(userId: string, documentName: string, version: number) {
    const filePath = this.getFilePath(userId, documentName, version);
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(filePath);

    if (error) throw error;
    return data;
  }

  async getDownloadUrl(filePath: string) {
    const { error, data } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(filePath, EXPIRATION_TIME, {
        download: true,
      });

    if (error) throw error;
    return data.signedUrl;
  }

  async listUserFiles(userId: string) {
    const { error, data } = await this.supabase.storage
      .from(this.bucket)
      .list(this.getUserPath(userId));

    if (error) throw error;
    return data;
  }
}
