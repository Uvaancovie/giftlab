'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from '@/components/product-card'

export default function ProductDetailPage({ params }: any) {
  const { id } = params
  const [product, setProduct] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()

  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
        const res = await fetch(`${api}/products/${id}`)
        if (!res.ok) throw new Error('Failed to fetch product')
        const j = await res.json()
        setProduct(j.product ?? null)
      } catch (err) {
        console.error('Error fetching product:', err)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  if (loading) return <div className="container mx-auto py-12 text-center">Loading product...</div>
  if (!product) return <div className="container mx-auto py-12 text-center">Product not found</div>

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <button className="mb-6 text-sm text-primary-600" onClick={() => router.back()}>← Back</button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <img src={product.image_url || '/placeholder.jpg'} alt={product.title || product.name} className="w-full h-auto object-contain rounded" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.title || product.name}</h1>
          {product.category && <p className="text-sm text-gray-500 mb-2 capitalize">{product.category}</p>}
          {product.description && <p className="text-sm text-gray-700 mb-4">{product.description}</p>}
          <p className="text-primary-600 font-bold text-2xl mb-4">R{((product.price_cents||0)/100).toFixed(2)}</p>
          <button
            onClick={() => {
              const cart = JSON.parse(localStorage.getItem('cart') || '[]')
              cart.push({ id: Date.now().toString(), product_source: 'retail', product_ref: product.id, title: product.title || product.name, unit_price_cents: product.price_cents, qty: 1, image_url: product.image_url })
              localStorage.setItem('cart', JSON.stringify(cart))
              alert('Added to cart')
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  )
}
