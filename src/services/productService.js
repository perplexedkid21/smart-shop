import products from '../assets/data/products.json'

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function listProducts({
  query = '',
  category = 'All',
  minPrice = null,
  maxPrice = null,
  minRating = null,
  page = 1,
  pageSize = 9,
} = {}) {
  await wait(550)

  const q = query.trim().toLowerCase()

  const filtered = products.filter((p) => {
    const matchesQuery =
      !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    const matchesCategory = category === 'All' || p.category === category
    const matchesMinPrice = minPrice == null || p.price >= Number(minPrice)
    const matchesMaxPrice = maxPrice == null || p.price <= Number(maxPrice)
    const matchesRating = minRating == null || p.rating >= Number(minRating)
    return matchesQuery && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesRating
  })

  const total = filtered.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const items = filtered.slice(start, end)

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: end < total,
  }
}

export async function getProductById(id) {
  await wait(450)
  const product = products.find((p) => p.id === id)
  if (!product) throw new Error('Product not found')
  return product
}

export async function getFeaturedProducts(limit = 8) {
  await wait(300)
  return products.filter((p) => p.featured).slice(0, limit)
}

export function getAllCategories() {
  return ['All', ...Array.from(new Set(products.map((p) => p.category))).sort()]
}

