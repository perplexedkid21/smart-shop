/* eslint react-refresh/only-export-components: off */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'smartshop_cart_v1'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function loadCart() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  return safeParse(raw)
}

function persistCart(value) {
  if (typeof window === 'undefined') return
  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

function getCouponDiscount(subtotal, code) {
  const normalized = (code ?? '').trim().toUpperCase()
  if (!normalized) return 0
  if (normalized === 'SMART10') return subtotal * 0.1
  if (normalized === 'FIRST15') return subtotal * 0.15
  return 0
}

export function CartProvider({ children }) {
  const [state, setState] = useState(() => {
    const loaded = loadCart()
    return (
      loaded ?? {
        items: [],
        wishlist: [],
        couponCode: '',
      }
    )
  })

  const items = state.items
  const wishlist = state.wishlist
  const couponCode = state.couponCode

  const addToCart = useCallback((product, { color, size } = {}, quantity = 1) => {
    const cartKey = `${product.id}:${color ?? 'default'}:${size ?? 'default'}`
    const qty = Math.max(1, Number(quantity) || 1)

    setState((prev) => {
      const existing = prev.items.find((it) => it.cartKey === cartKey)
      const maxQty = typeof product.inventory === 'number' ? product.inventory : 99

      if (existing) {
        const nextQty = Math.min(maxQty, existing.quantity + qty)
        const nextItems = prev.items.map((it) =>
          it.cartKey === cartKey ? { ...it, quantity: nextQty } : it
        )
        const next = { ...prev, items: nextItems }
        persistCart(next)
        return next
      }

      const next = {
        ...prev,
        items: [
          ...prev.items,
          {
            cartKey,
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] ?? '',
            quantity: Math.min(maxQty, qty),
            variant: { color: color ?? null, size: size ?? null },
          },
        ],
      }
      persistCart(next)
      return next
    })
  }, [])

  const updateQuantity = useCallback((cartKey, nextQty) => {
    const qty = Math.max(0, Number(nextQty) || 0)
    setState((prev) => {
      const nextItems = prev.items
        .map((it) => (it.cartKey === cartKey ? { ...it, quantity: qty } : it))
        .filter((it) => it.quantity > 0)
      const next = { ...prev, items: nextItems }
      persistCart(next)
      return next
    })
  }, [])

  const removeItem = useCallback((cartKey) => {
    setState((prev) => {
      const next = { ...prev, items: prev.items.filter((it) => it.cartKey !== cartKey) }
      persistCart(next)
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    setState({ items: [], wishlist, couponCode: '' })
    persistCart({ items: [], wishlist, couponCode: '' })
  }, [wishlist])

  const toggleWishlist = useCallback((productId) => {
    setState((prev) => {
      const exists = prev.wishlist.includes(productId)
      const nextWishlist = exists ? prev.wishlist.filter((id) => id !== productId) : [...prev.wishlist, productId]
      const next = { ...prev, wishlist: nextWishlist }
      persistCart(next)
      return next
    })
  }, [])

  const applyCoupon = useCallback((code) => {
    setState((prev) => {
      const next = { ...prev, couponCode: code }
      persistCart(next)
      return next
    })
  }, [])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
    const discount = getCouponDiscount(subtotal, couponCode)
    const shipping = subtotal - discount >= 80 ? 0 : subtotal > 0 ? 6.99 : 0
    const total = subtotal - discount + shipping
    return { subtotal, discount, shipping, total }
  }, [items, couponCode])

  const cartCount = items.reduce((sum, it) => sum + it.quantity, 0)

  const value = useMemo(
    () => ({
      items,
      wishlist,
      couponCode,
      cartCount,
      totals,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      toggleWishlist,
      applyCoupon,
    }),
    [
      items,
      wishlist,
      couponCode,
      cartCount,
      totals,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      toggleWishlist,
      applyCoupon,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

