import { createClient } from "@/lib/supabase/client";
import { createServerClient } from "@/lib/supabase/server";
import path from "path";

const BUCKET_NAME = "documents";

export class StorageService {
  private bucket: string;
  private clientType: "server" | "browser";

  constructor(clientType: "server" | "browser") {
    this.bucket = BUCKET_NAME;
    this.clientType = clientType;
  }

  // Generate consistent path for user files
  private getUserPath(userId: string, fileName: string) {
    const sanitizedUniqueFileName = this.generateUniqueFileName(fileName);
    return `users/${userId}/${sanitizedUniqueFileName}`;
  }

  // Generate a unique file name to prevent collisions
  private generateUniqueFileName(originalPath: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    const timestamp = Date.now();
    return path.join(dir, `${basename}_${timestamp}${ext}`);
  }

  private async getClient() {
    if (this.clientType === "server") {
      return await createServerClient();
    }
    return createClient();
  }

  async uploadFile(
    userId: string,
    fileName: string,
    fileData: Buffer,
    contentType: string,
  ) {
    const supabase = await this.getClient();
    const filePath = this.getUserPath(userId, fileName);

    const { error, data } = await supabase.storage
      .from(this.bucket)
      .upload(filePath, fileData, {
        contentType,
      });

    if (error) throw error;
    return data;
  }

  async getUploadUrl(userId: string, fileName: string) {
    const supabase = await this.getClient();
    const filePath = this.getUserPath(userId, fileName);

    const { error, data } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  }

  // Get a file's download URL
  async getDownloadUrl(userId: string, fileName: string) {
    const supabase = await this.getClient();
    const filePath = this.getUserPath(userId, fileName);

    const { error, data } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(filePath, 3600, {
        download: true,
        transform: {
          // Optional: Add transformations if needed
          // width: 800,
          // height: 600,
        },
      });

    if (error) throw error;
    return data.signedUrl;
  }

  // List files for a user
  async listUserFiles(userId: string) {
    const supabase = await this.getClient();
    const { error, data } = await supabase.storage
      .from(this.bucket)
      .list(`users/${userId}`);

    if (error) throw error;
    return data;
  }

  // Delete a file
  async deleteFile(userId: string, fileName: string) {
    const supabase = await this.getClient();
    const filePath = this.getUserPath(userId, fileName);

    const { error } = await supabase.storage
      .from(this.bucket)
      .remove([filePath]);

    if (error) throw error;
    return true;
  }
}
