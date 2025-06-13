import React, { useEffect, useState } from 'react'
import { Container, Typography, Grid } from '@mui/material'

function CorrelationHeatmap() {
  const [tickers, setTickers] = useState({})
  const [prices, setPrices] = useState({})
  const [minutes] = useState(30)
  const [matrix, setMatrix] = useState([])

  useEffect(() => {
    fetch('http://20.244.56.144/evaluation-service/stocks')
      .then(res => res.json())
      .then(data => {
        setTickers(data.stocks)
        const symbols = Object.values(data.stocks)
        Promise.all(symbols.map(symbol =>
          fetch(`http://20.244.56.144/evaluation-service/stocks/${symbol}?minutes=${minutes}`)
            .then(res => res.json())
            .then(data => ({ symbol, data }))
        )).then(all => {
          const obj = {}
          all.forEach(item => obj[item.symbol] = item.data.map(i => i.price))
          setPrices(obj)
        })
      })
  }, [minutes])

  useEffect(() => {
    const keys = Object.keys(prices)
    const result = keys.map(a => keys.map(b => calculateCorrelation(prices[a], prices[b])))
    setMatrix(result)
  }, [prices])

  function calculateCorrelation(a, b) {
    const len = Math.min(a.length, b.length)
    a = a.slice(0, len)
    b = b.slice(0, len)
    const meanA = a.reduce((x, y) => x + y, 0) / len
    const meanB = b.reduce((x, y) => x + y, 0) / len
    const numerator = a.map((v, i) => (v - meanA) * (b[i] - meanB)).reduce((x, y) => x + y, 0)
    const denomA = Math.sqrt(a.map(x => (x - meanA) ** 2).reduce((x, y) => x + y, 0))
    const denomB = Math.sqrt(b.map(x => (x - meanB) ** 2).reduce((x, y) => x + y, 0))
    return (numerator / (denomA * denomB)).toFixed(2)
  }

  const symbols = Object.values(tickers)

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Correlation Heatmap</Typography>
      <Grid container spacing={0} sx={{ overflowX: 'auto' }}>
        <Grid item xs={12}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${symbols.length + 1}, 80px)` }}>
            <div></div>
            {symbols.map(label => <div key={label} style={{ textAlign: 'center', fontWeight: 'bold' }}>{label}</div>)}
            {symbols.map((rowLabel, i) => (
              <React.Fragment key={rowLabel}>
                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{rowLabel}</div>
                {symbols.map((_, j) => (
                  <div key={`${i}-${j}`} style={{
                    backgroundColor: getColor(matrix[i]?.[j]),
                    color: 'white',
                    textAlign: 'center',
                    padding: '5px'
                  }}>
                    {matrix[i]?.[j] ?? '—'}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </Grid>
      </Grid>
    </Container>
  )
}

function getColor(value) {
  if (value === undefined) return '#ccc'
  const v = parseFloat(value)
  if (v > 0.75) return '#008000'
  if (v > 0.5) return '#66bb6a'
  if (v > 0.25) return '#ffee58'
  if (v > 0) return '#ffb74d'
  if (v > -0.25) return '#ff8a65'
  if (v > -0.5) return '#ef5350'
  return '#c62828'
}

export default CorrelationHeatmap
