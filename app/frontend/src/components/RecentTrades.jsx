import { useState, useEffect } from 'react';
import { Table, Badge, InputGroup } from 'react-bootstrap';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import SearchBox from './SearchBox';
import { searchTrades } from '../services/searchService';

const RecentTrades = ({ recentTrades, isLoading }) => {
  // State for search and sorting
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Initialize with provided data
  useEffect(() => {
    if (recentTrades && !searchPerformed) {
      setSearchResults(recentTrades);
    }
  }, [recentTrades, searchPerformed]);
  
  // Handle search
  const handleSearch = async (query) => {
    setIsSearching(true);
    
    try {
      // If query is empty, reset to original data
      if (!query) {
        setSearchResults(recentTrades || []);
        setSearchPerformed(false);
        setIsSearching(false);
        return;
      }
      
      // Search with MeiliSearch
      const results = await searchTrades(query);
      setSearchResults(results.hits || []);
      setSearchPerformed(true);
    } catch (error) {
      console.error('Error searching trades:', error);
      // Fallback to original data
      setSearchResults(recentTrades || []);
    } finally {
      setIsSearching(false);
    }
  };

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

  // Sort trades based on current sort settings
  const sortedTrades = [...(searchResults || [])].sort((a, b) => {
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
      <div className="mb-3">
        <SearchBox
          onSearch={handleSearch}
          placeholder="Search by symbol, type, or ID..."
        />
      </div>
      
      {isLoading || isSearching ? (
        <p className="text-center">Loading recent trades...</p>
      ) : sortedTrades.length === 0 ? (
        <p className="text-center text-muted">
          {searchPerformed ? 'No results found. Try a different search term.' : 'No trades found'}
        </p>
      ) : (
        <>
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
                {sortedTrades.map((trade, index) => (
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
          
          <div className="text-muted text-center mt-2">
            <small>
              {searchPerformed 
                ? `Found ${sortedTrades.length} matching trades` 
                : `Showing ${sortedTrades.length} trades`}
            </small>
          </div>
        </>
      )}
    </div>
  );
};

export default RecentTrades; 