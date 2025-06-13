import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js'
import { Container, Typography, Select, MenuItem, CircularProgress, Alert } from '@mui/material'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement)

// API configuration
const API_BASE_URL = 'http://20.244.56.144/evaluation-service'

// Token management
let authToken = null
let tokenExpiry = null

// Helper function to get authentication token
const getAuthToken = async () => {
  // Return cached token if it's still valid
  if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
    return authToken
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'sivanesagi.subu05@gmail.com',
        name: 'sivanesagi',
        rollNo: '211722243164',
        accessCode: 'pTTqxm',
        clientID: '71252641-38e7-4fdf-ab11-90ae113c0855',
        clientSecret: 'zhNqQhVnwavzuYcB'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get authentication token')
    }

    const data = await response.json()
    authToken = data.access_token
    tokenExpiry = data.expires_in * 1000 // Convert to milliseconds
    return authToken
  } catch (error) {
    console.error('Authentication error:', error)
    throw error
  }
}

// Helper function to make authenticated API calls
const fetchWithAuth = async (url, options = {}) => {
  try {
    const token = await getAuthToken()
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }

    const response = await fetch(url, { ...options, headers })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

function StockPage() {
  const [stockData, setStockData] = useState([])
  const [minutes, setMinutes] = useState(30)
  const [selectedTicker, setSelectedTicker] = useState('')
  const [stockList, setStockList] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchWithAuth(`${API_BASE_URL}/stocks`)
      .then(data => {
        setStockList(data.stocks || {})
        // Set initial ticker if available
        const firstTicker = Object.values(data.stocks || {})[0]
        if (firstTicker) setSelectedTicker(firstTicker)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedTicker) return

    setLoading(true)
    setError(null)
    fetchWithAuth(`${API_BASE_URL}/stocks/${selectedTicker}?minutes=${minutes}`)
      .then(data => setStockData(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedTicker, minutes])

  if (loading && !stockData.length) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    )
  }

  const prices = stockData.map(item => item.price)
  const average = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0

  const chartData = {
    labels: stockData.map(item => new Date(item.lastUpdatedAt).toLocaleTimeString()),
    datasets: [
      {
        label: 'Stock Price',
        data: prices,
        borderColor: 'blue',
        fill: false,
      },
      {
        label: 'Average Price',
        data: Array(prices.length).fill(average),
        borderColor: 'red',
        borderDash: [5, 5],
        fill: false,
      },
    ],
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Stock Page</Typography>
      <Select 
        value={selectedTicker} 
        onChange={e => setSelectedTicker(e.target.value)} 
        fullWidth
        displayEmpty
      >
        <MenuItem value="" disabled>Select a stock</MenuItem>
        {Object.entries(stockList).map(([name, ticker]) => (
          <MenuItem key={ticker} value={ticker}>{name}</MenuItem>
        ))}
      </Select>
      <Select 
        value={minutes} 
        onChange={e => setMinutes(e.target.value)} 
        fullWidth 
        sx={{ mt: 2 }}
      >
        {[10, 30, 50, 100].map(min => (
          <MenuItem key={min} value={min}>{min} minutes</MenuItem>
        ))}
      </Select>
      {stockData.length > 0 ? (
        <Line data={chartData} />
      ) : (
        <Typography sx={{ mt: 2 }}>No data available</Typography>
      )}
    </Container>
  )
}

export default StockPage
