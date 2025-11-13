
import React, { useState, useCallback } from 'react';
import { editImageWithGemini } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { ImageIcon, SparklesIcon, DownloadIcon, UploadIcon, XIcon, LoadingSpinner } from './components/icons';

interface ImageState {
  file: File;
  url: string;
}

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, etc.).');
        return;
      }
      setError(null);
      setEditedImageUrl(null);
      const url = await fileToBase64(file);
      setOriginalImage({ file, url });
    }
  };
  
  const handleRemoveImage = () => {
    setOriginalImage(null);
    setEditedImageUrl(null);
    setError(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!originalImage || !prompt.trim()) {
      setError('Please upload an image and enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);

    try {
      const { url, file } = originalImage;
      const base64Data = url.split(',')[1];
      const mimeType = file.type;

      const newImageBase64 = await editImageWithGemini(base64Data, mimeType, prompt);
      setEditedImageUrl(`data:${mimeType};base64,${newImageBase64}`);

    } catch (e) {
      console.error(e);
      setError('Failed to edit image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);

  const ImagePlaceholder: React.FC<{ onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ onFileChange }) => (
    <div className="relative w-full aspect-square border-2 border-dashed border-gray-600 rounded-2xl flex flex-col justify-center items-center text-center p-6 bg-gray-800/50 hover:border-indigo-500 transition-colors duration-300">
      <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
      <h3 className="text-gray-300 font-semibold mb-2">Upload an Image</h3>
      <p className="text-gray-500 text-sm">Drag and drop or click to select a file</p>
      <input 
        id="file-upload" 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        onChange={onFileChange} 
        accept="image/*" 
      />
    </div>
  );

  const ResultPlaceholder: React.FC = () => (
    <div className="w-full aspect-square border-2 border-gray-700 rounded-2xl flex flex-col justify-center items-center text-center p-6 bg-gray-800/50">
      <SparklesIcon className="w-12 h-12 text-gray-500 mb-4" />
      <h3 className="text-gray-300 font-semibold mb-2">Edited Image Appears Here</h3>
      <p className="text-gray-500 text-sm">Your AI-powered creation will be displayed once generated.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl text-center mb-8">
         <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">
          Nano Banana AI Editor
        </h1>
        <p className="text-gray-400 mt-3 text-lg">Use text prompts to edit your images with Gemini 2.5 Flash Image.</p>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Control Panel */}
        <div className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl flex flex-col space-y-6">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-500/20 p-2 rounded-full">
              <ImageIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-200">1. Your Image</h2>
          </div>

          {originalImage ? (
            <div className="relative group">
              <img src={originalImage.url} alt="Original" className="w-full rounded-xl shadow-lg" />
              <button 
                onClick={handleRemoveImage} 
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                aria-label="Remove image"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <ImagePlaceholder onFileChange={handleFileChange} />
          )}

          <div className="flex items-center space-x-3 pt-4">
            <div className="bg-indigo-500/20 p-2 rounded-full">
              <SparklesIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-200">2. Describe Your Edit</h2>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='e.g., "Add a retro filter" or "Remove the person in the background"'
            className="w-full h-28 p-4 bg-gray-700/50 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 placeholder-gray-500"
            disabled={isLoading || !originalImage}
          />
          
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !originalImage || !prompt.trim()}
            className="w-full flex items-center justify-center py-4 px-6 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="w-5 h-5 mr-3" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-3" />
                Generate
              </>
            )}
          </button>
        </div>

        {/* Result Panel */}
        <div className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl flex flex-col items-center justify-center relative">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-900/50 rounded-2xl flex flex-col items-center justify-center z-10">
              <LoadingSpinner className="w-16 h-16 text-indigo-400" />
              <p className="mt-4 text-lg">AI is working its magic...</p>
            </div>
          )}
          {editedImageUrl ? (
            <div className="w-full flex flex-col items-center space-y-4">
              <img src={editedImageUrl} alt="Edited" className="w-full rounded-xl shadow-lg" />
              <a
                href={editedImageUrl}
                download={`edited-${originalImage?.file.name || 'image.png'}`}
                className="w-full mt-4 flex items-center justify-center py-3 px-6 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 disabled:bg-gray-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <DownloadIcon className="w-5 h-5 mr-3" />
                Download Image
              </a>
            </div>
          ) : (
            !isLoading && <ResultPlaceholder />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
