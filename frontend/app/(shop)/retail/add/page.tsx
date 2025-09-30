'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function RetailAddPage(){
  const [title, setTitle] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [sku, setSku] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<string | null>(null)
  const [imageUrl, setImageUrl] = React.useState('')

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault();
    setLoading(true)
    try{
      const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
      const fd = new FormData()
      fd.append('title', title)
      fd.append('price_cents', Math.round(Number(price)*100).toString())
      fd.append('sku', sku)
      fd.append('description', description)
      fd.append('category', category)
      if (file) {
        fd.append('image', file)
      } else if (imageUrl) {
        // send image_url as a simple field when no file is uploaded
        fd.append('image_url', imageUrl)
      }
      const res = await fetch(`${api}/admin/products`,{
        method: 'POST',
        headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '' },
        body: fd
      })
      const j = await res.json()
      setLoading(false)
      if(!j.ok) return alert('Error: '+(j.error||'unknown'))
      alert('Created')
      setTitle(''); setPrice(''); setSku(''); setDescription(''); setCategory('')
      setFile(null); setPreview(null)
  setImageUrl('')
    }catch(err:any){
      setLoading(false)
      alert('Error: '+(err.message||String(err)))
    }
  }

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Add Retail Product</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" value={sku} onChange={e=>setSku(e.target.value)} placeholder="Unique SKU" required />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Product Title" required />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price (R)</Label>
            <Input id="price" type="number" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00" required />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="books">Books</SelectItem>
                <SelectItem value="home">Home & Garden</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Product description" rows={4} />
        </div>
        <div>
          <Label htmlFor="image">Image</Label>
          <input id="image" type="file" accept="image/*" onChange={e=>{
            const f = e.target.files?.[0] ?? null
            setFile(f)
            if (f) setPreview(URL.createObjectURL(f)); else setPreview(null)
          }} />
          {preview && <img src={preview} alt="preview" className="mt-2 max-h-48 object-contain" />}
          <div className="mt-4">
            <Label htmlFor="image_url">Or image URL</Label>
            <Input id="image_url" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating...' : 'Create Product'}
        </Button>
      </form>
    </div>
  )
}
