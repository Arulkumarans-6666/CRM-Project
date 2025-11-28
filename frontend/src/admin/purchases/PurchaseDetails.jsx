// src/admin/purchases/PurchaseDetails.jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../../utils/api";

const PurchaseDetails = () => {
    const { id } = useParams();
    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentInputs, setPaymentInputs] = useState({});
    const [deliveryInputs, setDeliveryInputs] = useState({});
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [usageInput, setUsageInput] = useState({ usedQty: "", date: new Date().toISOString().split('T')[0] });
    const [editingUsage, setEditingUsage] = useState(null);

    const fetchPurchase = async () => {
        try {
            setLoading(true);
            const res = await API.get(`/purchases/${id}`);
            setPurchase(res.data);
        } catch (err) {
            console.error("Error fetching purchase details:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPurchase(); }, [id]);

    const handleAddPayment = async (orderId) => {
        const amount = Number(paymentInputs[orderId]);
        if (!amount || amount <= 0) return alert("Enter a valid payment amount.");
        
        const order = purchase.purchaseOrders.find(o => o._id === orderId);
        if (amount > order.balanceAmount) {
            return alert(`Payment (₹${amount}) exceeds the balance due of ₹${order.balanceAmount.toFixed(2)}.`);
        }

        try {
            await API.post(`/purchases/${id}/orders/${orderId}/payments`, { amount });
            setPaymentInputs(p => ({ ...p, [orderId]: "" }));
            fetchPurchase();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add payment");
        }
    };
    
    const handleAddDelivery = async (orderId) => {
        const qty = Number(deliveryInputs[orderId]);
        if (!qty || qty <= 0) return alert("Enter a valid delivery quantity.");
        try {
            await API.post(`/purchases/${id}/orders/${orderId}/deliveries`, { qty });
            setDeliveryInputs(p => ({ ...p, [orderId]: "" }));
            fetchPurchase();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add delivery");
        }
    };
    
    const handleAddOrUpdateUsage = async (e) => {
        e.preventDefault();
        const payload = { usedQty: Number(usageInput.usedQty), date: usageInput.date };
        if (!payload.usedQty || payload.usedQty <= 0) return alert("Please enter a valid quantity.");
        
        if (!editingUsage && payload.usedQty > purchase.availableStock) {
            return alert(`Usage quantity (${payload.usedQty}) exceeds the available stock of ${purchase.availableStock}.`);
        }

        try {
            if (editingUsage) {
                await API.put(`/purchases/${id}/usage/${editingUsage._id}`, payload);
            } else {
                await API.post(`/purchases/${id}/usage`, payload);
            }
            setEditingUsage(null);
            setUsageInput({ usedQty: "", date: new Date().toISOString().split('T')[0] });
            fetchPurchase();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update usage.");
        }
    };

    const handleEditUsageClick = (log) => {
        setEditingUsage(log);
        setUsageInput({ usedQty: log.usedQty, date: new Date(log.date).toISOString().split('T')[0] });
    };
    
    const handleCancelEdit = () => {
        setEditingUsage(null);
        setUsageInput({ usedQty: "", date: new Date().toISOString().split('T')[0] });
    };

    const handleDeleteUsage = async (usageId) => {
        if (!window.confirm("Are you sure you want to delete this usage log?")) return;
        try {
            await API.delete(`/purchases/${id}/usage/${usageId}`);
            fetchPurchase();
        } catch (err) {
             alert("Failed to delete usage log.");
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border"></div></div>;
    if (!purchase) return <div className="alert alert-danger">Purchase record not found.</div>;

    const selectedOrder = purchase?.purchaseOrders.find(o => o._id === selectedOrderId);

    return (
        <div className="container-fluid">
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                    <div><h3 className="mb-0 d-inline-block me-3">{purchase.materialName} <small className="text-muted">from {purchase.supplierName}</small></h3></div>
                    <h4 className={`mb-0 p-2 rounded ${purchase.availableStock <= purchase.lowStockThreshold ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                        Available Stock: {purchase.availableStock?.toFixed(2) || 0} {purchase.unit}
                    </h4>
                </div>
                 <div className="card-body">
                     <div className="row text-center">
                         <div className="col"><h5>Total Received</h5><p className="text-info fs-5">{purchase.summary.totalReceived} {purchase.unit}</p></div>
                         <div className="col"><h5>Total Used</h5><p className="text-warning fs-5">{purchase.summary.totalUsed} {purchase.unit}</p></div>
                         <div className="col"><h5>Total Paid</h5><p className="text-success fs-5">₹{purchase.summary.totalPaid.toLocaleString('en-IN')}</p></div>
                         <div className="col"><h5>Total Balance Due</h5><p className="text-danger fs-5">₹{purchase.summary.totalBalance.toLocaleString('en-IN')}</p></div>
                     </div>
                 </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-lg-5">
                    <div className="card h-100">
                        <div className="card-header"><h5 className="mb-0">{editingUsage ? "Edit" : "Add"} Stock Usage</h5></div>
                        <div className="card-body">
                            <form onSubmit={handleAddOrUpdateUsage}>
                                <div className="mb-3">
                                    <label className="form-label">Quantity Used ({purchase.unit})</label>
                                    <input type="number" step="any" className="form-control" value={usageInput.usedQty} onChange={e => setUsageInput({...usageInput, usedQty: e.target.value})} required/>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Usage Date</label>
                                    <input type="date" className="form-control" value={usageInput.date} onChange={e => setUsageInput({...usageInput, date: e.target.value})} required/>
                                </div>
                                <button type="submit" className="btn btn-primary me-2">{editingUsage ? "Update Usage" : "Add Usage"}</button>
                                {editingUsage && <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>}
                            </form>
                        </div>
                    </div>
                </div>
                <div className="col-lg-7">
                    <div className="card h-100">
                        <div className="card-header"><h5 className="mb-0">Usage History</h5></div>
                        <div className="card-body" style={{maxHeight: '400px', overflowY: 'auto'}}>
                            <ul className="list-group list-group-flush">
                                {purchase.usageLogs?.length > 0 ? (
                                    [...purchase.usageLogs].reverse().map(log => (
                                        <li key={log._id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div><strong>{log.usedQty} {purchase.unit}</strong><small className="d-block text-muted">{new Date(log.date).toLocaleDateString()}</small></div>
                                            <div>
                                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEditUsageClick(log)}>✏️ Edit</button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUsage(log._id)}>🗑️ Delete</button>
                                            </div>
                                        </li>
                                    ))
                                ) : (<li className="list-group-item text-center text-muted">No usage recorded yet.</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-header"><h4 className="mb-0">Purchase Orders <small className="text-muted">(Click a row for payment/delivery details)</small></h4></div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                           <thead className="table-light text-center">
                               <tr><th>Order Date</th><th>Qty Ordered</th><th>Qty Received</th><th>Pending</th><th>Rate</th><th>Total + GST</th><th>Paid</th><th>Balance</th></tr>
                           </thead>
                           <tbody className="text-center">
                               {purchase.purchaseOrders.map(order => (
                                   <tr key={order._id} onClick={() => setSelectedOrderId(prev => (prev === order._id ? null : order._id))} className={selectedOrderId === order._id ? 'table-primary' : ''} style={{cursor: 'pointer'}}>
                                       <td>{new Date(order.orderDate).toLocaleDateString()}</td><td>{order.orderedQty}</td><td className="text-success">{order.totalReceived}</td>
                                       <td className="text-warning">{order.pendingDelivery}</td><td>₹{order.pricePerUnit.toLocaleString('en-IN')}</td><td>₹{(order.totalValue + order.gstAmount).toLocaleString('en-IN')}</td>
                                       <td className="text-success">₹{order.totalPaid.toLocaleString('en-IN')}</td><td className="text-danger">₹{order.balanceAmount.toLocaleString('en-IN')}</td>
                                   </tr>
                               ))}
                           </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedOrder && (
                <div className="card shadow-sm mt-4">
                   <div className="card-header bg-primary text-white"><h4 className="mb-0">Details for Order on {new Date(selectedOrder.orderDate).toLocaleDateString()}</h4></div>
                   <div className="card-body"><div className="row">
                       <div className="col-lg-6">
                           <h5>Payments Made</h5>
                           <ul className="list-group mb-3" style={{maxHeight: '200px', overflowY: 'auto'}}>
                               <li className="list-group-item">Initial Advance: ₹{(selectedOrder.advancePaid || 0).toLocaleString('en-IN')}</li>
                               {selectedOrder.payments.map((p, i) => <li key={i} className="list-group-item">₹{p.amount.toLocaleString('en-IN')} on {new Date(p.date).toLocaleString()}</li>)}
                           </ul>
                           <form onSubmit={e => {e.preventDefault(); handleAddPayment(selectedOrder._id)}}>
                               <div className="input-group"><input type="number" className="form-control" placeholder="Add payment" value={paymentInputs[selectedOrder._id] || ""} onChange={e => setPaymentInputs({...paymentInputs, [selectedOrder._id]: e.target.value})} /><button className="btn btn-success">Add Payment</button></div>
                           </form>
                       </div>
                       <div className="col-lg-6">
                           <h5>Deliveries Received</h5>
                           <ul className="list-group mb-3" style={{maxHeight: '200px', overflowY: 'auto'}}>
                             {selectedOrder.deliveriesReceived.length > 0 ? selectedOrder.deliveriesReceived.map((d, i) => <li key={i} className="list-group-item">{d.qty} {purchase.unit} on {new Date(d.date).toLocaleString()}</li>) : <li className="list-group-item">No deliveries received yet.</li>}
                           </ul>
                           <form onSubmit={e => {e.preventDefault(); handleAddDelivery(selectedOrder._id)}}>
                               <div className="input-group"><input type="number" className="form-control" placeholder="Add received qty" value={deliveryInputs[selectedOrder._id] || ""} onChange={e => setDeliveryInputs({...deliveryInputs, [selectedOrder._id]: e.target.value})} /><button className="btn btn-info">Add Delivery</button></div>
                           </form>
                       </div>
                   </div></div>
                </div>
            )}
        </div>
    );
};

export default PurchaseDetails;