import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const BUCKET = "navicore-files";

@Injectable()
export class StorageService {
  private client: SupabaseClient | null = null;

  private getClient(): SupabaseClient {
    if (this.client) return this.client;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new InternalServerErrorException(
        "File storage isn't configured — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are unset. " +
          "This endpoint needs a real Supabase project to function; see .env.example.",
      );
    }

    this.client = createClient(url, key);
    return this.client;
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    const { error } = await this.getClient()
      .storage.from(BUCKET)
      .upload(key, buffer, { contentType: mimeType, upsert: false });

    if (error) {
      throw new InternalServerErrorException(`Storage upload failed: ${error.message}`);
    }
  }

  /** Short-lived signed URL — files aren't served through a public bucket. */
  async getSignedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
    const { data, error } = await this.getClient()
      .storage.from(BUCKET)
      .createSignedUrl(key, expiresInSeconds);

    if (error || !data) {
      throw new InternalServerErrorException(`Failed to sign download URL: ${error?.message}`);
    }

    return data.signedUrl;
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.getClient().storage.from(BUCKET).remove([key]);
    if (error) {
      throw new InternalServerErrorException(`Storage delete failed: ${error.message}`);
    }
  }

  /**
   * Deterministic, collision-resistant key for a workspace-scoped upload.
   * Keeping storage keys workspace-prefixed makes bucket-level access policy
   * (if this ever moves to per-workspace RLS-style rules) straightforward.
   */
  buildKey(workspaceId: string, fileName: string): string {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `${workspaceId}/${Date.now()}-${randomUUID()}-${safeName}`;
  }
}
