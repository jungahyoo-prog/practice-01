# 파일 스토리지 패턴

## 버킷 생성

마이그레이션 파일에 추가 후 `supabase db push`로 적용하거나, Dashboard에서 직접 생성.

**방법 1 — 마이그레이션 파일로 생성 (권장)**

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_storage_buckets.sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;
```

```bash
supabase db push
```

**방법 2 — Dashboard에서 생성**

Supabase Dashboard → Storage → New bucket에서 생성.

---

## 파일 업로드

```typescript
import { supabase } from '@/db/client'

const uploadImage = async (file: File) => {
  const filePath = `public/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, file)

  if (error) throw error
  return data.path
}
```

---

## 공개 URL 획득

```typescript
const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}
```

---

## 파일 삭제

```typescript
const { error } = await supabase.storage
  .from('images')
  .remove([filePath])
```

---

## 전체 파일 목록 조회

```typescript
const { data, error } = await supabase.storage
  .from('images')
  .list('public', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
```

---

## 파일 업로드 컴포넌트 패턴

```typescript
export const ImageUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleChangeFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const path = await uploadImage(file)
      setImageUrl(getPublicUrl(path))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleChangeFileInput} disabled={uploading} />
      {imageUrl && <img src={imageUrl} alt="업로드된 이미지" />}
    </div>
  )
}
```
