'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from '@/lib/types'

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  getTotal: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.product_ref === item.product_ref && i.product_source === item.product_source)
        if (existing) {
          return {
            items: state.items.map(i =>
              i.id === existing.id ? { ...i, qty: i.qty + item.qty } : i
            )
          }
        }
        return { items: [...state.items, { ...item, id: Date.now().toString() }] }
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
      updateQty: (id, qty) => set((state) => ({
        items: state.items.map(i => i.id === id ? { ...i, qty } : i)
      })),
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, item) => sum + item.unit_price_cents * item.qty, 0)
    }),
    { name: 'cart-storage' }
  )
)

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}