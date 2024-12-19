'use client';

import { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';

interface Image {
  url: string;
  name: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export default function ImageGallery() {
  const [images, setImages] = useState<Image[]>([]);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const response = await fetch('/api/images');
    const data = await response.json();
    setImages(data);
  };

  const breakpointColumns = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
    <div>
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-gray-900"
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="mb-4 cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <img
              src={image.url}
              alt={image.name}
              className="rounded-lg hover:opacity-80 transition-opacity"
            />
          </div>
        ))}
      </Masonry>

      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full">
            <h3 className="text-xl mb-4">{selectedImage.name}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>尺寸: {selectedImage.dimensions.width} x {selectedImage.dimensions.height}</div>
              <div>大小: {Math.round(selectedImage.size / 1024)} KB</div>
            </div>
            <div className="mb-4">
              <p className="mb-2">URL:</p>
              <input
                readOnly
                value={selectedImage.url}
                className="w-full bg-gray-700 p-2 rounded"
              />
            </div>
            <div className="mb-4">
              <p className="mb-2">Markdown:</p>
              <input
                readOnly
                value={`![${selectedImage.name}](${selectedImage.url})`}
                className="w-full bg-gray-700 p-2 rounded"
              />
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 