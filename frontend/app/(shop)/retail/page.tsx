'use client'

import React from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'

export default function RetailPage() {
  const [list, setList] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')
  const [categories, setCategories] = React.useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = React.useState('')
  const [priceMin, setPriceMin] = React.useState('')
  const [priceMax, setPriceMax] = React.useState('')
  const [sort, setSort] = React.useState('')

  React.useEffect(() => {
    let canceled = false
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
        const params = new URLSearchParams()
        if (query) params.append('search', query)
        if (categoryFilter) params.append('category', categoryFilter)
        if (priceMin) params.append('price_min', (Math.round(Number(priceMin) * 100)).toString())
        if (priceMax) params.append('price_max', (Math.round(Number(priceMax) * 100)).toString())
        if (sort) params.append('sort', sort)
        const url = `${api}/products${params.toString() ? `?${params.toString()}` : ''}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch products')
        const j = await res.json()
        if (!canceled) setList(j.products ?? [])
      } catch (err) {
        console.error('Error fetching products:', err)
        if (!canceled) setList([])
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    const id = setTimeout(fetchProducts, 300)
    return () => {
      canceled = true
      clearTimeout(id)
    }
  }, [query, categoryFilter, priceMin, priceMax, sort])

  React.useEffect(() => {
    // load categories
    const load = async () => {
      try {
        const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
        const res = await fetch(`${api}/products/categories`)
        if (!res.ok) return
        const j = await res.json()
        setCategories(j.categories ?? [])
      } catch (e) { console.error(e) }
    }
    load()
  }, [])

  const addToCart = (p: any) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push({ id: Date.now().toString(), product_source: 'retail', product_ref: p.id, title: p.title || p.name, unit_price_cents: p.price_cents, qty: 1, image_url: p.image_url })
    localStorage.setItem('cart', JSON.stringify(cart))
    alert('Added to cart')
  }

  if (loading) return <div className="container mx-auto py-12 text-center">Loading products...</div>

  return (
    <div className="container mx-auto py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Retail Products</h1>
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded shadow">
          <input className="border rounded px-3 py-2 flex-1 min-w-[200px]" placeholder="Search products..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border rounded px-3 py-2">
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="border rounded px-3 py-2 w-28" placeholder="Min R" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
          <input className="border rounded px-3 py-2 w-28" placeholder="Max R" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
          <select value={sort} onChange={e => setSort(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Relevance</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="newest">Newest</option>
          </select>
          <Link href="/retail/add" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">Add Product</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {(list ?? []).map((p: any) => (
          <ProductCard key={p.id || p.sku || p.amrod_id || JSON.stringify(p)} product={p} onAddToCart={() => addToCart(p)} />
        ))}
      </div>
    </div>
  )
}
