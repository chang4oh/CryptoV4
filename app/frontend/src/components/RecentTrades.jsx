import { useState } from 'react';
import { Table, Badge, Form, InputGroup } from 'react-bootstrap';
import { FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const RecentTrades = ({ recentTrades, isLoading }) => {
  // Default/placeholder values
  const trades = recentTrades || [];
  
  // State for search and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return 'Unknown';
    }
  };

  // Format currency with commas and proper decimals
  const formatCurrency = (value, decimals = 2) => {
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Get badge color based on trade type
  const getTradeTypeColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'buy': return 'success';
      case 'sell': return 'danger';
      default: return 'secondary';
    }
  };

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Filter and sort trades
  const filteredAndSortedTrades = [...trades]
    .filter(trade => 
      trade.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.type?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      // Handle different field types
      if (sortField === 'timestamp') {
        comparison = new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortField === 'price' || sortField === 'amount' || sortField === 'total') {
        comparison = parseFloat(a[sortField]) - parseFloat(b[sortField]);
      } else {
        comparison = String(a[sortField]).localeCompare(String(b[sortField]));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="recent-trades">
      {isLoading ? (
        <p className="text-center">Loading recent trades...</p>
      ) : (
        <>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by symbol or type..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </InputGroup>
          
          {filteredAndSortedTrades.length === 0 ? (
            <p className="text-center text-muted">No trades found</p>
          ) : (
            <div className="table-responsive">
              <Table hover size="sm" className="trades-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('timestamp')} style={{ cursor: 'pointer' }}>
                      Time {getSortIcon('timestamp')}
                    </th>
                    <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>
                      Type {getSortIcon('type')}
                    </th>
                    <th onClick={() => handleSort('symbol')} style={{ cursor: 'pointer' }}>
                      Symbol {getSortIcon('symbol')}
                    </th>
                    <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                      Price {getSortIcon('price')}
                    </th>
                    <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                      Amount {getSortIcon('amount')}
                    </th>
                    <th onClick={() => handleSort('total')} style={{ cursor: 'pointer' }}>
                      Total {getSortIcon('total')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedTrades.map((trade, index) => (
                    <tr key={trade.id || index}>
                      <td>{formatTimestamp(trade.timestamp)}</td>
                      <td>
                        <Badge bg={getTradeTypeColor(trade.type)}>
                          {trade.type?.toUpperCase()}
                        </Badge>
                      </td>
                      <td>{trade.symbol}</td>
                      <td>${formatCurrency(trade.price)}</td>
                      <td>{formatCurrency(trade.amount, 8)}</td>
                      <td>${formatCurrency(trade.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          
          <div className="text-muted text-center mt-2">
            <small>Showing {filteredAndSortedTrades.length} of {trades.length} trades</small>
          </div>
        </>
      )}
    </div>
  );
};

export default RecentTrades; 