import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getOrderStatus } from '../services/SMMService';
import '../styles/Orders.css';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, in-progress, completed, partial, canceled

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const ordersRef = collection(db, 'users', user.uid, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      let ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter orders if needed
      if (filter !== 'all') {
        ordersList = ordersList.filter(order => {
          const status = order.status?.toLowerCase() || 'pending';
          return status === filter.toLowerCase();
        });
      }

      setOrders(ordersList);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const refreshOrderStatus = async (order) => {
    try {
      if (!order.orderId) return;

      const statusData = await getOrderStatus(parseInt(order.orderId));
      
      if (statusData && !statusData.error) {
        // Update order in Firestore
        const orderRef = doc(db, 'users', user.uid, 'orders', order.id);
        const newStatus = statusData.status || order.status;
        
        await updateDoc(orderRef, {
          status: newStatus,
          charge: statusData.charge || order.charge,
          startCount: statusData.start_count || order.startCount,
          remains: statusData.remains || order.remains,
          currency: statusData.currency || order.currency || 'USD',
          updatedAt: new Date(),
        });

        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(o =>
            o.id === order.id
              ? {
                  ...o,
                  status: newStatus,
                  charge: statusData.charge || o.charge,
                  startCount: statusData.start_count || o.startCount,
                  remains: statusData.remains || o.remains,
                  currency: statusData.currency || o.currency || 'USD',
                }
              : o
          )
        );
      }
    } catch (err) {
      console.error('Error refreshing order status:', err);
    }
  };

  const refreshAllOrders = async () => {
    try {
      setRefreshing(true);
      setError('');

      // Refresh status for all pending/in-progress orders
      const ordersToRefresh = orders.filter(
        order => order.status === 'Pending' || 
                 order.status === 'In progress' || 
                 order.status === 'Partial'
      );

      for (const order of ordersToRefresh) {
        await refreshOrderStatus(order);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Reload orders to get updated data
      await loadOrders();
    } catch (err) {
      console.error('Error refreshing orders:', err);
      setError('Failed to refresh some orders');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || 'pending').toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'complete':
        return 'status-completed';
      case 'in progress':
      case 'in-progress':
      case 'processing':
        return 'status-progress';
      case 'partial':
        return 'status-partial';
      case 'pending':
        return 'status-pending';
      case 'canceled':
      case 'cancelled':
        return 'status-canceled';
      default:
        return 'status-pending';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1>My Orders</h1>
          <p className="subtitle">View and track your SMM service orders</p>
        </div>
        <button
          className="refresh-btn"
          onClick={refreshAllOrders}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <div className="spinner-small"></div>
              Refreshing...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Refresh Status
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`filter-tab ${filter === 'in-progress' ? 'active' : ''}`}
          onClick={() => setFilter('in-progress')}
        >
          In Progress
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`filter-tab ${filter === 'partial' ? 'active' : ''}`}
          onClick={() => setFilter('partial')}
        >
          Partial
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h2>No Orders Found</h2>
          <p>You haven't placed any orders yet. Start by ordering a service!</p>
        </div>
      ) : (
        <div className="orders-container">
          {/* Desktop Table View */}
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Service</th>
                  <th>Link</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Cost</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const progress = order.remains !== undefined && order.quantity
                    ? Math.round(((order.quantity - order.remains) / order.quantity) * 100)
                    : order.status === 'Completed' ? 100 : 0;

                  return (
                    <tr key={order.id}>
                      <td className="order-id">#{order.orderId}</td>
                      <td>
                        <div className="service-info">
                          <div className="service-name">{order.serviceName}</div>
                          <div className="service-category">{order.serviceCategory}</div>
                        </div>
                      </td>
                      <td>
                        <a
                          href={order.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="order-link"
                        >
                          {order.link?.length > 30 ? `${order.link.substring(0, 30)}...` : order.link}
                        </a>
                      </td>
                      <td>{order.quantity?.toLocaleString() || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>
                        <div className="progress-info">
                          {order.remains !== undefined && order.quantity ? (
                            <>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="progress-text">
                                {order.quantity - order.remains} / {order.quantity}
                              </span>
                            </>
                          ) : (
                            <span className="progress-text">-</span>
                          )}
                        </div>
                      </td>
                      <td className="cost-cell">
                        {order.cost ? `${(order.cost / 100).toLocaleString('en-TZ', { minimumFractionDigits: 2 })} TZS` : 'N/A'}
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <button
                          className="refresh-order-btn"
                          onClick={() => refreshOrderStatus(order)}
                          title="Refresh status"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="orders-cards">
            {orders.map((order) => {
              const progress = order.remains !== undefined && order.quantity
                ? Math.round(((order.quantity - order.remains) / order.quantity) * 100)
                : order.status === 'Completed' ? 100 : 0;

              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div>
                      <div className="order-id">Order #{order.orderId}</div>
                      <div className="order-date">{formatDate(order.createdAt)}</div>
                    </div>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="order-card-body">
                    <div className="order-detail">
                      <span className="detail-label">Service:</span>
                      <span className="detail-value">{order.serviceName}</span>
                    </div>
                    <div className="order-detail">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{order.serviceCategory}</span>
                    </div>
                    <div className="order-detail">
                      <span className="detail-label">Link:</span>
                      <a
                        href={order.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="order-link"
                      >
                        {order.link?.length > 40 ? `${order.link.substring(0, 40)}...` : order.link}
                      </a>
                    </div>
                    <div className="order-detail">
                      <span className="detail-label">Quantity:</span>
                      <span className="detail-value">{order.quantity?.toLocaleString() || 'N/A'}</span>
                    </div>
                    {order.remains !== undefined && order.quantity && (
                      <div className="order-detail">
                        <span className="detail-label">Progress:</span>
                        <div className="mobile-progress">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {order.quantity - order.remains} / {order.quantity} ({progress}%)
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="order-detail">
                      <span className="detail-label">Cost:</span>
                      <span className="detail-value cost">
                        {order.cost ? `${(order.cost / 100).toLocaleString('en-TZ', { minimumFractionDigits: 2 })} TZS` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <button
                      className="refresh-order-btn"
                      onClick={() => refreshOrderStatus(order)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                      </svg>
                      Refresh Status
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

