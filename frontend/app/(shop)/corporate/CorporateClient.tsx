'use client'

import React from 'react'
import api from '@/lib/api'
import { ProductCard } from '@/components/product-card'

export default function CorporateClient(){
  const [products, setProducts] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(()=>{
    let cancelled = false
    async function load(){
      try{
        const res = await api.get('/amrod/products')
        if(!cancelled) setProducts(res.data.products ?? [])
      }catch(err:any){
        console.error('Error loading amrod products', err)
        setError(err?.message || 'Failed to load products')
      }finally{
        if(!cancelled) setLoading(false)
      }
    }
    load()
    return ()=>{ cancelled = true }
  },[])

  if(loading) return <div className="container mx-auto py-12 text-center">Loading corporate products...</div>
  if(error) return <div className="container mx-auto py-12 text-center text-red-600">Error: {error}</div>

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Corporate (Amrod) Products</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {products.map((p:any)=> (
          <ProductCard key={p.amrod_id || p.id} product={{ ...p, name: p.name ?? p.title, price_cents: p.price_cents }} onAddToCart={()=>{}} />
        ))}
      </div>
    </div>
  )
}
