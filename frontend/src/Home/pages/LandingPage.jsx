import React from 'react'
import { useNavigate } from 'react-router-dom'
import Hero         from '../../components/hero'
import Categories   from '../../components/Categories'
import HowItWorks   from '../../components/HowItWorks'
import LiveTracking from '../../components/LiveTracking'
import Testimonials from '../../components/Testimonials'
import Footer       from '../../components/Footer'

/**
 * LandingPage
 * Props:
 *  - onAddToCart(product, qty, size) – hoisted cart handler (e.g. from App.jsx)
 *  - toggleCart – opens the cart drawer
 */
const LandingPage = ({ onAddToCart, toggleCart }) => {
  const navigate = useNavigate()

  // When user clicks a category → scroll to products or navigate to filtered list
  const handleCategoryClick = (cat) => {
    navigate(`/products?category=${cat.id}`)
  }

  // "Commander maintenant" from the product detail
  const handleOrder = ({ product, qty, size }) => {
    navigate('/checkout', { state: { items: [{ product, qty, size }] } })
  }

  return (
    <>
      <main>
        <Hero />

        {/* Categories now pull real data from /categories */}
        <Categories onCategoryClick={handleCategoryClick} />

        <HowItWorks />
        <LiveTracking />

        <Testimonials />
      </main>
      <Footer />
    </>
  )
}

export default LandingPage
