import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/env";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadImage = async (
  fileBuffer: Buffer,
  filename: string
): Promise<{ url: string }> => {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey) {
    throw new Error("Cloudinary is not configured");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "dynamic-forms",
        public_id: filename.replace(/\.[^.]+$/, ""),
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
        } else {
          resolve({ url: result.secure_url });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};
