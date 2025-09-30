'use client'

import React from 'react'

export default function CartPage() {
  const [cart, setCart] = React.useState<any[]>([])
  React.useEffect(()=>{
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'))
  },[])

  const createOrder = async () => {
    const user_id = '00000000-0000-0000-0000-000000000000' // stub user
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL ?? '') + '/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, items: cart, shipping_cents: 0 })
    })
    const j = await res.json();
    if (!j.ok) return alert('Error: '+(j.error||'unknown'))
    alert('Order created. Invoice: '+(j.invoice?.number||'n/a'))
    localStorage.removeItem('cart')
    setCart([])
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Cart</h1>
      <div className="space-y-4">
        {cart.map(c=> (
          <div key={c.id} className="p-4 border rounded flex justify-between">
            <div>
              <div className="font-semibold">{c.title}</div>
              <div>R{(c.unit_price_cents/100).toFixed(2)} x {c.qty}</div>
            </div>
            <div className="flex items-center gap-2">
              <div>R{((c.unit_price_cents*c.qty)/100).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button onClick={createOrder} className="btn btn-primary">Checkout / Create Invoice</button>
      </div>
    </div>
  )
}
