import {useState, useEffect, useRef} from "react"
import Papa from "papaparse"
import {BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from "recharts"
import "./App.css"

export default function Dashboard() {
  const [data, setData] = useState([])
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const asciiRef = useRef(null)
  const animationTimeRef = useRef(0)
  const animationFrameRef = useRef(null)

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    setError("")
    setData([])
    setFileName("")

    if (!file) {
      setError("Please select a file to upload.")
      return
    }

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file.")
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError("File size must be less than 10MB.")
      return
    }

    setFileName(file.name)
    setIsLoading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredColumns = ["date", "product", "quantity", "revenue"]
        const headers = results.meta.fields || []

        if (!requiredColumns.every((col) => headers.includes(col))) {
          setError(`CSV must contain: ${requiredColumns.join(", ")}`)
          setIsLoading(false)
          return
        }

        if (results.data.length === 0) {
          setError("CSV file is empty.")
          setIsLoading(false)
          return
        }

        // convert string values to numbers
        const parsedData = results.data.map((row) => ({
          date: row.date,
          product: row.product,
          quantity: Number.parseFloat(row.quantity) || 0,
          revenue: Number.parseFloat(row.revenue) || 0,
        }))

        setData(parsedData)
        setIsLoading(false)
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`)
        setIsLoading(false)
      },
    })
  }

  // calculate totals, averages, and top product
  const calculateStats = () => {
    if (data.length === 0) return null

    const { totalRevenue, totalQuantity } = data.reduce(
      (acc, row) => ({
        totalRevenue: acc.totalRevenue + row.revenue,
        totalQuantity: acc.totalQuantity + row.quantity,
      }),
      { totalRevenue: 0, totalQuantity: 0 }
    )

    const revenueByProduct = getRevenueByProduct()
    const bestProduct = revenueByProduct.length > 0 
      ? revenueByProduct.reduce((max, item) => item.revenue > max.revenue ? item : max)
      : null

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalQuantity,
      numberOfTransactions: data.length,
      avgRevenue: (totalRevenue / data.length).toFixed(2),
      avgQuantity: (totalQuantity / data.length).toFixed(1),
      bestProduct: bestProduct ? bestProduct.product : "N/A",
      bestProductRevenue: bestProduct ? bestProduct.revenue.toFixed(2) : "0",
    }
  }

  // sum values by product for bar charts
  const aggregateByProduct = (field, defaultValue = 0) => {
    if (data.length === 0) {
      return [
        { product: "Product A", [field]: defaultValue },
        { product: "Product B", [field]: defaultValue },
        { product: "Product C", [field]: defaultValue },
      ]
    }

    const productMap = {}
    data.forEach((row) => {
      productMap[row.product] = (productMap[row.product] || 0) + row[field]
    })

    return Object.entries(productMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([product, value]) => ({
        product,
        [field]: field === "revenue" ? Number.parseFloat(value.toFixed(2)) : value,
      }))
  }

  const getRevenueByProduct = () => aggregateByProduct("revenue", 0)
  const getQuantityByProduct = () => aggregateByProduct("quantity", 0)

  // sort by date for line chart
  const getRevenueOverTime = () => {
    if (data.length === 0) {
      return [
        { date: "", revenue: 0 },
        { date: "", revenue: 0 },
        { date: "", revenue: 0 },
      ]
    }

    return data
      .map((row) => ({
        date: row.date,
        revenue: row.revenue,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // calculate percentage breakdown for pie chart
  const getRevenueBreakdown = () => {
    if (data.length === 0) return []

    const revenueByProduct = getRevenueByProduct()
    const total = revenueByProduct.reduce((sum, item) => sum + item.revenue, 0)
    
    return revenueByProduct.map(({ product, revenue }) => ({
      name: product,
      value: Number.parseFloat(((revenue / total) * 100).toFixed(1)),
    }))
  }

  const stats = calculateStats()
  const hasData = data.length > 0
  const PIE_COLORS = ["#60a5fa", "#34d399", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
  
  const getTooltipStyle = () => ({
    contentStyle: {
      backgroundColor: darkMode ? "#1a1a1a" : "#fff",
      border: `1px solid ${darkMode ? "#333" : "#ddd"}`,
      color: darkMode ? "#fff" : "#000",
    },
    labelStyle: { color: darkMode ? "#fff" : "#000" },
    itemStyle: { color: darkMode ? "#fff" : "#000" },
  })

  // animated ascii background using wave functions
  useEffect(() => {
    const rows = 35
    const cols = 120

    const getCharForPosition = (x, y, time) => {
      const combined = 
        Math.sin(x * 0.15 + time * 0.5) * Math.cos(y * 0.1 + time * 0.3) * 0.4 +
        Math.sin(x * 0.1 - time * 0.4) * Math.sin(y * 0.15 + time * 0.2) * 0.3 +
        Math.cos(x * 0.08 + y * 0.08 + time * 0.3) * 0.3

      if (combined > 0.5) return "#"
      if (combined > 0.2) return "+"
      if (combined > -0.2) return ":"
      if (combined > -0.5) return "·"
      return "."
    }

    const renderGrid = () => {
      if (!asciiRef.current) return
      
      let output = ""
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          output += getCharForPosition(j, i, animationTimeRef.current) + " "
        }
        output += "\n"
      }
      asciiRef.current.textContent = output
    }

    let lastTime = 0
    const animate = (currentTime) => {
      if (currentTime - lastTime >= 16) {
        animationTimeRef.current += 0.02
        renderGrid()
        lastTime = currentTime
      }
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    renderGrid()
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [])

  return (
    <div className={`dashboard ${darkMode ? "dark" : "light"}`}>
      {/* ASCII Background */}
      <div className="ascii-bg" aria-hidden="true" ref={asciiRef}></div>

      {/* Dark Mode Toggle */}
      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">
        {darkMode ? "☀" : "☾"}
      </button>

      <div className="container">
        <header className="header-banner">
          <div className="header-content">
            <h1>CSV Data Dashboard</h1>
            <p>Upload sales data to view analytics</p>
          </div>
          <div className="upload-section">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="file-input" 
              id="file-upload"
              disabled={isLoading}
            />
            <label htmlFor="file-upload" className="file-label">
              {isLoading ? "Processing..." : fileName || "Choose CSV File"}
            </label>
            {error && <div className="error">{error}</div>}
          </div>
        </header>

        {/* Statistics Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">${stats?.totalRevenue || "0.00"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Quantity</div>
            <div className="stat-value">{stats?.totalQuantity || "0"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Transactions</div>
            <div className="stat-value">{stats?.numberOfTransactions || "0"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Revenue</div>
            <div className="stat-value">${stats?.avgRevenue || "0.00"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Quantity</div>
            <div className="stat-value">{stats?.avgQuantity || "0.0"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Top Product</div>
            <div className="stat-value stat-product">{stats?.bestProduct || "N/A"}</div>
          </div>
        </section>

        {/* Charts */}
        <section className="charts">
          <div className="chart-card">
            <h3>Revenue by Product</h3>
            {!hasData && <div className="empty-state">Upload CSV to view data</div>}
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getRevenueByProduct()}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#333" : "#e0e0e0"} />
                {hasData ? (
                  <XAxis dataKey="product" stroke={darkMode ? "#999" : "#666"} />
                ) : (
                  <XAxis dataKey="product" stroke={darkMode ? "#999" : "#666"} tick={false} />
                )}
                <YAxis stroke={darkMode ? "#999" : "#666"} />
                <Tooltip {...getTooltipStyle()} />
                <Bar dataKey="revenue" fill={darkMode ? "#60a5fa" : "#3b82f6"} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Quantity by Product</h3>
            {!hasData && <div className="empty-state">Upload CSV to view data</div>}
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getQuantityByProduct()}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#333" : "#e0e0e0"} />
                {hasData ? (
                  <XAxis dataKey="product" stroke={darkMode ? "#999" : "#666"} />
                ) : (
                  <XAxis dataKey="product" stroke={darkMode ? "#999" : "#666"} tick={false} />
                )}
                <YAxis stroke={darkMode ? "#999" : "#666"} />
                <Tooltip {...getTooltipStyle()} />
                <Bar dataKey="quantity" fill={darkMode ? "#34d399" : "#10b981"} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Revenue Breakdown</h3>
            {!hasData && <div className="empty-state">Upload CSV to view data</div>}
            {hasData && (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getRevenueBreakdown()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getRevenueBreakdown().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...getTooltipStyle()} formatter={(value, name) => [`${value}%`, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card chart-full">
            <h3>Revenue Over Time</h3>
            {!hasData && <div className="empty-state">Upload CSV to view data</div>}
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={getRevenueOverTime()}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#333" : "#e0e0e0"} />
                {hasData ? (
                  <XAxis dataKey="date" stroke={darkMode ? "#999" : "#666"} />
                ) : (
                  <XAxis dataKey="date" stroke={darkMode ? "#999" : "#666"} tick={false} />
                )}
                <YAxis stroke={darkMode ? "#999" : "#666"} />
                <Tooltip {...getTooltipStyle()} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={darkMode ? "#60a5fa" : "#3b82f6"}
                  strokeWidth={2}
                  dot={{ fill: darkMode ? "#60a5fa" : "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Data Table */}
        <section className="table-section">
          <h3>Sales Data</h3>
          {!hasData ? (
            <div className="empty-table-state">Upload a CSV file to view sales data</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={index}>
                      <td>{row.date}</td>
                      <td>{row.product}</td>
                      <td>{row.quantity}</td>
                      <td>${row.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}