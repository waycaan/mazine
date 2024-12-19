'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadForm() {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('file', file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        // 刷新图片列表
        window.location.reload();
      }
    } catch (error) {
      console.error('上传失败:', error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-600 rounded-lg p-8 mb-8 text-center cursor-pointer hover:border-blue-500"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>将文件拖放到这里...</p>
      ) : (
        <p>点击或拖放文件到此处上传</p>
      )}
    </div>
  );
} 