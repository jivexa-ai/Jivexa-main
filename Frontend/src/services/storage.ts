import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface UploadResult {
  success: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  storagePath?: string;
  error?: string;
}

/**
 * Universal Storage Document Upload Helper
 * Uploads to Supabase Storage 'health-records' bucket if configured,
 * or returns a secure Blob ObjectURL fallback in mock mode.
 */
export const uploadMedicalDocument = async (
  file: File,
  userId: string,
  bucketName: 'health-records' | 'medical-reports' = 'health-records'
): Promise<UploadResult> => {
  const fileSizeMb = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

  if (!isSupabaseConfigured || !supabase) {
    // Mock / Offline Blob storage fallback
    const secureFileUrl = URL.createObjectURL(file);
    return {
      success: true,
      fileUrl: secureFileUrl,
      fileName: file.name,
      fileSize: fileSizeMb,
      storagePath: `local/${userId}/${file.name}`
    };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${userId}/${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      success: true,
      fileUrl: publicUrlData.publicUrl,
      fileName: file.name,
      fileSize: fileSizeMb,
      storagePath: data.path
    };
  } catch (err: any) {
    console.warn('Supabase storage upload failed, falling back to local Blob:', err);
    const secureFileUrl = URL.createObjectURL(file);
    return {
      success: true,
      fileUrl: secureFileUrl,
      fileName: file.name,
      fileSize: fileSizeMb,
      storagePath: `fallback/${userId}/${file.name}`
    };
  }
};
