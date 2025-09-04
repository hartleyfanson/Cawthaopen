import { useState, useRef } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
// CSS imports removed to avoid Vite build issues
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
  directFileInput?: boolean; // When true, opens file browser directly instead of modal
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  directFileInput = false,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: directFileInput, // Auto-proceed when using direct file input
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
      })
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Clear existing files and add new ones
      uppy.getFiles().forEach(file => uppy.removeFile(file.id));
      
      Array.from(files).forEach(file => {
        try {
          uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
          });
        } catch (err) {
          console.error('Error adding file:', err);
        }
      });
      
      // Reset input value to allow same file selection again
      event.target.value = '';
    }
  };

  const handleButtonClick = () => {
    if (directFileInput) {
      fileInputRef.current?.click();
    } else {
      setShowModal(true);
    }
  };

  return (
    <div>
      <Button onClick={handleButtonClick} className={buttonClassName}>
        {children}
      </Button>

      {directFileInput && (
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          accept="image/*"
          multiple={maxNumberOfFiles > 1}
          onChange={handleFileSelect}
        />
      )}

      {!directFileInput && (
        <DashboardModal
          uppy={uppy}
          open={showModal}
          onRequestClose={() => setShowModal(false)}
          proudlyDisplayPoweredByUppy={false}
        />
      )}
    </div>
  );
}
