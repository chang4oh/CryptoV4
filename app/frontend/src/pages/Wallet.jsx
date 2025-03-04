import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Tabs, Tab, Badge } from 'react-bootstrap';
import { FaWallet, FaExchangeAlt, FaHistory } from 'react-icons/fa';
import apiService from '../services/api';

const Wallet = () => {
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState({
    balances: true,
    transactions: true
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('balances');

  // Fetch wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      setLoading({
        balances: true,
        transactions: true
      });
      setError(null);
      
      try {
        // Fetch balances
        const balancesResponse = await apiService.getBalances().catch(() => ({ data: [] }));
        setBalances(balancesResponse.data || []);
        
        // Fetch transactions
        const transactionsResponse = await apiService.getTransactions().catch(() => ({ data: [] }));
        setTransactions(transactionsResponse.data || []);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError('Failed to load wallet data. Using placeholder data.');
        // Use placeholder data
        setBalances(placeholderBalances);
        setTransactions(placeholderTransactions);
      } finally {
        setLoading({
          balances: false,
          transactions: false
        });
      }
    };

    fetchWalletData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchWalletData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate total balance in USD
  const calculateTotalBalance = () => {
    return balances.reduce((total, balance) => {
      // For simplicity, we're assuming the USD value is in the 'usdValue' field
      return total + parseFloat(balance.usdValue || 0);
    }, 0).toFixed(2);
  };

  // Placeholder data
  const placeholderBalances = [
    { asset: 'USDT', available: '10,423.45', locked: '0', total: '10,423.45', usdValue: '10423.45' },
    { asset: 'BTC', available: '0.256', locked: '0', total: '0.256', usdValue: '11145.78' },
    { asset: 'ETH', available: '2.34', locked: '0', total: '2.34', usdValue: '7589.32' },
    { asset: 'SOL', available: '45.67', locked: '2.5', total: '48.17', usdValue: '4932.21' }
  ];
  
  const placeholderTransactions = [
    { id: '1', type: 'DEPOSIT', asset: 'USDT', amount: '5000.00', status: 'COMPLETED', timestamp: '2023-05-20 10:23:45', txid: '0x123...abc' },
    { id: '2', type: 'TRADE', asset: 'BTC', amount: '0.12', status: 'COMPLETED', timestamp: '2023-05-21 14:56:12', txid: 'Internal' },
    { id: '3', type: 'WITHDRAWAL', asset: 'ETH', amount: '1.5', status: 'PENDING', timestamp: '2023-05-22 09:34:21', txid: '0x456...def' },
    { id: '4', type: 'TRADE', asset: 'SOL', amount: '25.0', status: 'COMPLETED', timestamp: '2023-05-23 16:45:33', txid: 'Internal' }
  ];

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge bg="success">Completed</Badge>;
      case 'PENDING':
        return <Badge bg="warning">Pending</Badge>;
      case 'FAILED':
        return <Badge bg="danger">Failed</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Get transaction type badge
  const getTypeBadge = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return <Badge bg="primary">Deposit</Badge>;
      case 'WITHDRAWAL':
        return <Badge bg="danger">Withdrawal</Badge>;
      case 'TRADE':
        return <Badge bg="info">Trade</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-4"><FaWallet className="me-2" /> Wallet</h2>
          
          {error && (
            <Alert variant="warning" className="mb-4">
              {error}
            </Alert>
          )}
          
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">Total Balance</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-0">${calculateTotalBalance()}</h2>
                  <small className="text-muted">Estimated Value</small>
                </div>
                <div>
                  <Badge bg="success" className="p-2">
                    <FaExchangeAlt className="me-1" /> Trading Enabled
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
          
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="balances" title="Balances">
              <Card className="shadow-sm">
                <Card.Body className="p-0">
                  {loading.balances ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </Spinner>
                    </div>
                  ) : (
                    <Table responsive hover className="mb-0">
                      <thead>
                        <tr>
                          <th>Asset</th>
                          <th>Available</th>
                          <th>Locked</th>
                          <th>Total</th>
                          <th>USD Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balances.length > 0 ? (
                          balances.map((balance, index) => (
                            <tr key={index}>
                              <td><strong>{balance.asset}</strong></td>
                              <td>{balance.available}</td>
                              <td>{balance.locked}</td>
                              <td>{balance.total}</td>
                              <td>${parseFloat(balance.usdValue || 0).toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-3">
                              No balances found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="transactions" title="Transactions">
              <Card className="shadow-sm">
                <Card.Body className="p-0">
                  {loading.transactions ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </Spinner>
                    </div>
                  ) : (
                    <Table responsive hover className="mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Asset</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Transaction ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.length > 0 ? (
                          transactions.map((tx, index) => (
                            <tr key={index}>
                              <td>{tx.timestamp}</td>
                              <td>{getTypeBadge(tx.type)}</td>
                              <td>{tx.asset}</td>
                              <td>{tx.amount}</td>
                              <td>{getStatusBadge(tx.status)}</td>
                              <td>
                                <small className="text-muted">{tx.txid}</small>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-3">
                              No transactions found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default Wallet; 