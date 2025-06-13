import React from 'react'
import { Routes, Route } from 'react-router-dom'
import StockPage from './components/StockPage'
import CorrelationHeatmap from './components/CorrelationHeatmap'

function App() {
  return (
    <Routes>
      <Route path="/" element={<StockPage />} />
      <Route path="/heatmap" element={<CorrelationHeatmap />} />
    </Routes>
  )
}

export default App
