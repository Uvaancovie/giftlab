import Image from 'next/image'
import Link from 'next/link'
import { Product, AmrodProduct } from '@/lib/types'

interface ProductCardProps {
  product: Product | AmrodProduct
  onAddToCart: () => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const title = 'title' in product ? product.title : product.name
  const price = product.price_cents / 100
  const image = product.image_url || '/placeholder.jpg'
  const description = 'description' in product ? product.description : ''
  const category = 'category' in product ? product.category : ('category' in product ? product.category : '')

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="aspect-square relative">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        {category && <p className="text-sm text-gray-500 mb-1 capitalize">{category}</p>}
        {description && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{description}</p>}
        <p className="text-primary-600 font-bold text-xl mb-4">R{price.toFixed(2)}</p>
        <div className="flex gap-2">
          <button
            onClick={onAddToCart}
            className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Add to Cart
          </button>
          {('id' in product && product.id) ? (
            <Link href={`/retail/${product.id}`} className="flex-1 text-center bg-white border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition">
              View Details
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}