# Uploading files to Contentful

## Contentful Uploads

### Prerequisites

- Contentful Management API token (different from Delivery API)
- Appropriate permissions for asset creation

### Environment Variables

```env
# .env.local
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token
CONTENTFUL_ENVIRONMENT=master
```

### Install Dependencies

```bash
npm install contentful-management
```

### Contentful Management Client

```typescript
// lib/contentful/management.ts
import { createClient } from 'contentful-management'

if (!process.env.CONTENTFUL_MANAGEMENT_TOKEN) {
  throw new Error('CONTENTFUL_MANAGEMENT_TOKEN is not set')
}

export const managementClient = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
})

export async function getEnvironment() {
  const space = await managementClient.getSpace(process.env.CONTENTFUL_SPACE_ID!)
  return space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT || 'master')
}
```

### API Route for Contentful Upload

```typescript
// app/api/contentful-upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getEnvironment } from '@/lib/contentful/management'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    const environment = await getEnvironment()

    // Convert File to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create upload
    const upload = await environment.createUpload({
      file: buffer,
    })

    // Create asset
    const asset = await environment.createAsset({
      fields: {
        title: {
          'en-US': title || file.name,
        },
        file: {
          'en-US': {
            contentType: file.type,
            fileName: file.name,
            uploadFrom: {
              sys: {
                type: 'Link',
                linkType: 'Upload',
                id: upload.sys.id,
              },
            },
          },
        },
      },
    })

    // Process and publish asset
    const processedAsset = await asset.processForAllLocales()
    const publishedAsset = await processedAsset.publish()

    return NextResponse.json({
      id: publishedAsset.sys.id,
      url: `https:${publishedAsset.fields.file['en-US'].url}`,
      title: publishedAsset.fields.title['en-US'],
    })
  } catch (error) {
    console.error('Error uploading to Contentful:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
```

### Client-Side Contentful Upload

```typescript
// lib/contentful/upload.ts
export async function uploadToContentful(
  file: File,
  title?: string
): Promise<{ id: string; url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  if (title) {
    formData.append('title', title)
  }

  const response = await fetch('/api/contentful-upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Upload failed')
  }

  return response.json()
}
```

### Contentful Upload Component

```tsx
// components/contentful-upload.tsx
'use client'

import { useState, useRef } from 'react'
import { uploadToContentful } from '@/lib/contentful/upload'

type ContentfulUploadProps = {
  onUpload: (asset: { id: string; url: string; title: string }) => void
}

export function ContentfulUpload({ onUpload }: ContentfulUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      const result = await uploadToContentful(file, title || file.name)
      onUpload({ ...result, title: title || file.name })
      setTitle('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Asset title (optional)"
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
        disabled={isUploading}
        style={{ display: 'none' }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading to Contentful...' : 'Upload Image'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
```

## Combined Upload Strategy

### Unified Upload Hook

```typescript
// hooks/use-file-upload.ts
'use client'

import { useState, useCallback } from 'react'
import { uploadToS3 } from '@/lib/s3/upload'
import { uploadToContentful } from '@/lib/contentful/upload'

type UploadTarget = 's3' | 'contentful'

type UploadResult = {
  url: string
  id?: string
}

export function useFileUpload(target: UploadTarget = 's3') {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (
    file: File,
    options?: { title?: string }
  ): Promise<UploadResult | null> => {
    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      if (target === 's3') {
        const url = await uploadToS3(file)
        setProgress(100)
        return { url }
      } else {
        const result = await uploadToContentful(file, options?.title)
        setProgress(100)
        return { url: result.url, id: result.id }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return null
    } finally {
      setIsUploading(false)
    }
  }, [target])

  const reset = useCallback(() => {
    setIsUploading(false)
    setProgress(0)
    setError(null)
  }, [])

  return {
    upload,
    isUploading,
    progress,
    error,
    reset,
  }
}
```

### Using Upload with Metafields

```tsx
// components/product-customization.tsx
'use client'

import { useState } from 'react'
import { useFileUpload } from '@/hooks/use-file-upload'
import { useSubblyCart } from '@subbly/react'

export function ProductCustomization({ productId }: { productId: number }) {
  const { upload, isUploading } = useFileUpload('s3')
  const { addToCart } = useSubblyCart()
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)

  const handleImageUpload = async (file: File) => {
    const result = await upload(file)
    if (result) {
      setUploadedImageUrl(result.url)
    }
  }

  const handleAddToCart = () => {
    addToCart({
      productId,
      quantity: 1,
      metadata: uploadedImageUrl ? [
        {
          id: 123, // Custom image metafield ID
          values: [{ value: uploadedImageUrl }]
        }
      ] : undefined
    })
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageUpload(file)
        }}
        disabled={isUploading}
      />

      {uploadedImageUrl && (
        <img src={uploadedImageUrl} alt="Custom" style={{ maxWidth: 200 }} />
      )}

      <button onClick={handleAddToCart}>
        Add to Cart
      </button>
    </div>
  )
}
```