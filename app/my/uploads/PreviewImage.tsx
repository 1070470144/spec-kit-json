'use client'

import { useState } from 'react'

export default function PreviewImage({ previewUrl, title }: { previewUrl?: string | null; title: string }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  return (
    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative">
      {previewUrl && !imageError ? (
        <>
          <img 
            src={previewUrl} 
            alt={title}
            className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
        </>
      ) : (
        <div className="text-xs text-gray-400 text-center px-1">
          无图片
        </div>
      )}
    </div>
  )
}