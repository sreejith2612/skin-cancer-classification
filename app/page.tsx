'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Upload, Activity } from 'lucide-react'
import Image from 'next/image'
import { Progress } from "@/components/ui/progress"

interface AnalysisResult {
  classification: string;
  confidence: number;
  description: string;
}

export default function SkinLesionClassifier() {
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null)

  const onDrop = async (acceptedFiles: File[]) => {
    setError(null)
    setResult(null)
    const file = acceptedFiles[0]
    if (file && file.type.startsWith('image/')) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (response.ok) {
          setUploadedFilename(data.filename)
        } else {
          setError(data.error || 'Failed to upload image')
        }
      } catch {
        setError('Failed to upload image')
      }
    } else {
      setError('Please upload a valid image file.')
    }
  }
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
    },
    multiple: false,
    onDragEnter: () => {},
    onDragLeave: () => {},
    onDragOver: () => {},
  })
  
  const handleScan = async () => {
    if (!uploadedFilename) {
      setError('Please upload an image before scanning.')
      return
    }

    setIsLoading(true)
    setProgress(0)

    try {
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: uploadedFilename }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze image')
      }

      const result = await response.json()
      setResult(result)
    } catch {
      setError('Failed to analyze image')
    } finally {
      setIsLoading(false)
      setProgress(100)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white bg-opacity-90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">DermaScan AI</h1>
            <nav>
              <ul className="flex space-x-6">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Home</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Skin Lesion Classifier</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload an image of a skin lesion for instant AI-powered classification and analysis.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-white shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input {...(getInputProps() as React.InputHTMLAttributes<HTMLInputElement>)} />
                {preview ? (
                  <div className="relative h-64 w-full">
                    <Image
                      src={preview}
                      alt="Uploaded skin lesion"
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Upload className="mx-auto h-16 w-16 mb-4 text-blue-500" />
                    <p className="text-lg font-medium mb-2">Drag and drop your image here</p>
                    <p className="text-sm">or click to select a file</p>
                    <p className="text-xs mt-2 text-gray-400">Supported formats: JPEG, PNG, GIF</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center mt-4 text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-6">
                <Button 
                  onClick={handleScan} 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-105"
                  disabled={!uploadedFilename || isLoading}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Image'}
                </Button>
              </div>

              {isLoading && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Analysis in Progress</h3>
                  <Progress value={progress} className="w-full h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {result && (
            <Card className="bg-white shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Activity className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Classification</h4>
                      <p className="text-xl font-medium text-blue-600">{result.classification}</p>
                      <p className="text-sm text-gray-500">Confidence: {(result.confidence * 100).toFixed(2)}%</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700">{result.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="bg-white bg-opacity-90 backdrop-blur-md border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; 2023 DermaScan AI. All rights reserved. For educational purposes only.
          </p>
        </div>
      </footer>
    </div>
  )
}