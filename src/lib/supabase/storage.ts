import { captureException } from "@sentry/nextjs";

import type { UploadResult } from "@/lib/types/upload";
import { withRetry } from "@/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "documents";
const EXPIRATION_TIME = 3600;

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

  private getFilePath(userId: string, fileName: string) {
    return `${this.getUserPath(userId)}/${fileName}`;
  }

  async getPresignedUrl(userId: string, fileName: string): Promise<string> {
    const filePath = this.getFilePath(userId, fileName);
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
  ): Promise<UploadResult> {
    try {
      return withRetry(async () => {
        const filePath = this.getFilePath(userId, fileName);

        const { error } = await this.supabase.storage
          .from(this.bucket)
          .upload(filePath, fileData, {
            contentType,
            upsert: false,
          });

        if (error) throw error;
        return { success: true, filePath };
      });
    } catch (err) {
      const error = err as Error;
      console.error(error);
      captureException(error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }
  }

  async verifyFileExists(filePath: string): Promise<boolean> {
    try {
      const { error, data: exists } = await this.supabase.storage
        .from(this.bucket)
        .exists(filePath);

      return !error && exists;
    } catch (err) {
      const error = err as Error;
      console.error(error);
      captureException(error);
      return false;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([filePath]);

      return !error;
    } catch {
      return false;
    }
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
