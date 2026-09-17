import { useState, useEffect } from 'react';

export default function App() {
  // 1. Component State
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Form Input State
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState('BUY');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');

  // 2. GET Request: Fetches initial database records on component mount
  useEffect(() => {
    fetch('http://localhost:5000/api/transactions')
      .then((res) => {
        if (!res.ok) throw new Error('Network response failed');
        return res.json();
      })
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching transactions:', err);
        setLoading(false);
      });
  }, []); // Empty dependency array ensures this fires only once

  // 3. POST Request: Dispatches new transaction to Flask API
  const handleAddTrade = async (e) => {
    e.preventDefault();
    if (!symbol || !qty || !price) return;

    const payload = {
      symbol: symbol.toUpperCase(),
      type,
      qty: Number(qty),
      price: Number(price)
    };

    try {
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create order');

      const savedOrder = await response.json();

      // Prepend the new record returned by Flask to update UI state
      setTransactions([savedOrder, ...transactions]);

      // Reset form fields
      setSymbol('');
      setQty('');
      setPrice('');
    } catch (err) {
      console.error('Error submitting trade:', err);
    }
  };

  // 4. Derived Calculations
  const totalTrades = transactions.length;
  const executedTrades = transactions.filter((t) => t.status === 'Executed').length;
  const portfolioTurnover = transactions
    .filter((t) => t.status === 'Executed')
    .reduce((acc, curr) => acc + curr.qty * curr.price, 0);

  const filteredTransactions = transactions.filter((trade) => {
    if (filter === 'ALL') return true;
    return trade.type === filter;
  });

  // 5. JSX Markup (What gets rendered on screen)
  return (
    <div className="container py-4">
      {/* Header */}
      <header className="mb-4 pb-2 border-bottom">
        <h2 className="fw-bold">Trading Portfolio & Execution Terminal</h2>
        <p className="text-secondary mb-0">React Client connected to Python Flask REST API</p>
      </header>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-light p-3">
            <span className="text-muted small">Total Turnover</span>
            <h4 className="fw-bold mt-1 text-primary">₹{portfolioTurnover.toLocaleString('en-IN')}</h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-light p-3">
            <span className="text-muted small">Total Orders</span>
            <h4 className="fw-bold mt-1">{totalTrades}</h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-light p-3">
            <span className="text-muted small">Execution Rate</span>
            <h4 className="fw-bold mt-1 text-success">
              {totalTrades > 0 ? ((executedTrades / totalTrades) * 100).toFixed(0) : 0}%
            </h4>
          </div>
        </div>
      </div>

      {/* Order Entry Form */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <h5 className="card-title mb-3">Place Limit Order</h5>
          <form onSubmit={handleAddTrade} className="row g-2 align-items-center">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Ticker (e.g., RELIANCE)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                required
              />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Quantity"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                min="1"
                required
              />
            </div>
            <div className="col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder="Limit Price (₹)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.05"
                min="0.05"
                required
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100">Submit</button>
            </div>
          </form>
        </div>
      </div>

      {/* Execution Log Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Order Execution Log</h5>
            <div className="btn-group" role="group">
              {['ALL', 'BUY', 'SELL'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`btn btn-sm ${filter === option ? 'btn-dark' : 'btn-outline-secondary'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4 text-muted">Loading orders from Flask database...</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Timestamp</th>
                    <th>Symbol</th>
                    <th>Order Type</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((trade) => (
                    <tr key={trade.id}>
                      <td className="text-secondary">{trade.time}</td>
                      <td className="fw-semibold">{trade.symbol}</td>
                      <td>
                        <span className={`badge ${trade.type === 'BUY' ? 'bg-success' : 'bg-danger'}`}>
                          {trade.type}
                        </span>
                      </td>
                      <td>{trade.qty}</td>
                      <td>₹{Number(trade.price).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${trade.status === 'Executed' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-3">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}