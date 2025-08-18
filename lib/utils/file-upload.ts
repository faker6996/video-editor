// lib/utils/file-upload.ts
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export interface UploadConfig {
  maxSize: number;           // Max file size in bytes
  allowedTypes: string[];    // Allowed MIME types
  uploadDir: string;         // Base upload directory
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
}

export interface UploadResult {
  path: string;              // Relative path: /uploads/2024/01/abc123.jpg
  originalName: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  thumbnailPath?: string;    // If thumbnail generated
}

export class FileUploadService {
  private config: UploadConfig;

  constructor(config: UploadConfig) {
    this.config = config;
    this.ensureUploadDir();
  }

  // Ensure upload directory exists
  private ensureUploadDir(): void {
    if (!fs.existsSync(this.config.uploadDir)) {
      fs.mkdirSync(this.config.uploadDir, { recursive: true });
    }
  }

  // Generate relative path with date structure + UUID
  private generatePath(originalName: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const ext = path.extname(originalName).toLowerCase();
    // Use UUID for consistent naming
    const filename = `${uuidv4()}${ext}`;
    
    return `/uploads/${year}/${month}/${day}/${filename}`;
  }

  // Validate file
  private validateFile(file: File | Buffer, originalName: string, mimeType: string): void {
    // Check file size
    const fileSize = file instanceof File ? file.size : file.length;
    if (fileSize > this.config.maxSize) {
      throw new Error(`File too large. Max size: ${this.config.maxSize / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!this.config.allowedTypes.includes(mimeType)) {
      throw new Error(`File type not allowed. Allowed: ${this.config.allowedTypes.join(', ')}`);
    }
  }

  // Upload file from File object (browser)
  async uploadFile(file: File): Promise<UploadResult> {
    const buffer = Buffer.from(await file.arrayBuffer());
    return this.uploadBuffer(buffer, file.name, file.type);
  }

  // Upload file from Buffer (server)
  async uploadBuffer(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult> {
    this.validateFile(buffer, originalName, mimeType);

    const relativePath = this.generatePath(originalName);
    const fullPath = path.join(this.config.uploadDir, relativePath);
    
    // Ensure directory exists
    const dirPath = path.dirname(fullPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    let width: number | undefined;
    let height: number | undefined;
    let thumbnailPath: string | undefined;

    // Handle image files
    if (mimeType.startsWith('image/')) {
      try {
        const metadata = await sharp(buffer).metadata();
        width = metadata.width;
        height = metadata.height;

        // Generate thumbnail if requested
        if (this.config.generateThumbnail && this.config.thumbnailSize) {
          const thumbRelativePath = relativePath.replace(/(\.[^.]+)$/, '_thumb$1');
          const thumbFullPath = path.join(this.config.uploadDir, thumbRelativePath);
          
          await sharp(buffer)
            .resize(this.config.thumbnailSize.width, this.config.thumbnailSize.height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 80 })
            .toFile(thumbFullPath);
            
          thumbnailPath = thumbRelativePath;
        }

        // Optimize original image
        const optimizedBuffer = await sharp(buffer)
          .jpeg({ quality: 90, progressive: true })
          .png({ compressionLevel: 9 })
          .webp({ quality: 90 })
          .toBuffer();

        fs.writeFileSync(fullPath, optimizedBuffer);
      } catch (error) {
        // If sharp fails, save original buffer
        fs.writeFileSync(fullPath, buffer);
      }
    } else {
      // Non-image files
      fs.writeFileSync(fullPath, buffer);
    }

    return {
      path: relativePath,
      originalName,
      size: buffer.length,
      mimeType,
      width,
      height,
      thumbnailPath
    };
  }

  // Delete file
  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = path.join(this.config.uploadDir, relativePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Also delete thumbnail if exists
    const thumbPath = relativePath.replace(/(\.[^.]+)$/, '_thumb$1');
    const thumbFullPath = path.join(this.config.uploadDir, thumbPath);
    if (fs.existsSync(thumbFullPath)) {
      fs.unlinkSync(thumbFullPath);
    }
  }

  // Get file info
  getFileInfo(relativePath: string): { exists: boolean; size?: number; mtime?: Date } {
    const fullPath = path.join(this.config.uploadDir, relativePath);
    
    try {
      const stats = fs.statSync(fullPath);
      return {
        exists: true,
        size: stats.size,
        mtime: stats.mtime
      };
    } catch {
      return { exists: false };
    }
  }
}

// Default config for images
export const imageUploadConfig: UploadConfig = {
  maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // Default 10MB in bytes
  allowedTypes: process.env.ALLOWED_FILE_TYPES 
    ? process.env.ALLOWED_FILE_TYPES.split(',')
    : [
        'image/jpeg',
        'image/png', 
        'image/webp',
        'image/gif',
        'image/bmp'
      ],
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  generateThumbnail: true,
  thumbnailSize: { width: 300, height: 300 }
};

// Singleton instance
export const fileUploadService = new FileUploadService(imageUploadConfig);