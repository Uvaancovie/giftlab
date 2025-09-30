import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Gift Lab
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/retail" className="text-gray-700 hover:text-primary-600">
              Shop
            </Link>
            <Link href="/corporate" className="text-gray-700 hover:text-primary-600">
              Corporate
            </Link>
            <Link href="/cart" className="text-gray-700 hover:text-primary-600">
              <ShoppingCart className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}