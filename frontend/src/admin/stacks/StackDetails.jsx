import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../../utils/api";
import "./StackDetails.css"; // Intha CSS file um kooda irukkanum

const StackDetails = () => {
    // State declarations
    const { id } = useParams();
    const [stack, setStack] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newPrice, setNewPrice] = useState("");
    const [newGST, setNewGST] = useState("");
    const [paymentInputs, setPaymentInputs] = useState({});
    const [deliveryInputs, setDeliveryInputs] = useState({});
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    // All your original functions, declared once
    const fetchStack = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/stacks/${id}`);
            setStack(res.data);
        } catch (err) {
            console.error("Error fetching stack:", err);
            alert("Could not fetch stack details");
        } finally {
            setLoading(false);
        }
    };

    const handlePriceUpdate = async (e) => {
        e.preventDefault();
        const priceNum = Number(newPrice);
        const gstNum = Number(newGST);
        if (!priceNum || priceNum <= 0 || isNaN(priceNum)) {
            alert("Enter valid price");
            return;
        }
        if (gstNum < 0 || gstNum > 100 || isNaN(gstNum)) {
            alert("Enter valid GST rate (0–100)");
            return;
        }
        try {
            await API.put(`/stacks/${id}/price`, { price: priceNum, gstRate: gstNum });
            setNewPrice("");
            setNewGST("");
            fetchStack();
        } catch (err) {
            console.error("Error updating price:", err);
            alert("Failed to update price");
        }
    };

    const handleAddPayment = async (orderId) => {
        const amt = Number(paymentInputs[orderId]);
        if (isNaN(amt) || amt <= 0) {
            alert("Enter valid payment amount");
            return;
        }
        const order = stack.orders.find(o => o._id === orderId);
        if (!order) {
            alert("Could not find order details to validate payment.");
            return;
        }
        const paymentsSum = (order.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
        const totalPaid = (order.advancePaid || 0) + paymentsSum;
        const totalWithGst = (order.totalValue || 0) + (order.gstAmount || 0);
        const balanceDue = totalWithGst - totalPaid;
        const roundedBalance = Math.round(balanceDue * 100) / 100;

        if (amt > roundedBalance) {
            alert(`Payment Error: Your payment of ₹${amt} is greater than the balance due of ₹${roundedBalance}.`);
            return;
        }
        try {
            await API.post(`/stacks/${id}/orders/${orderId}/payments`, { amount: amt });
            setPaymentInputs((p) => ({ ...p, [orderId]: "" }));
            fetchStack();
        } catch (err) {
            console.error("Error adding payment:", err);
            alert(err.response?.data?.error || "Failed to add payment");
        }
    };

    const handleAddDelivery = async (orderId) => {
        const qty = Number(deliveryInputs[orderId]);
        if (isNaN(qty) || qty <= 0) {
            alert("Enter valid delivery qty");
            return;
        }
        try {
            await API.post(`/stacks/${id}/orders/${orderId}/deliveries`, { qty });
            setDeliveryInputs((p) => ({ ...p, [orderId]: "" }));
            fetchStack();
        } catch (err) {
            console.error("Error adding delivery:", err);
            alert(err.response?.data?.error || "Failed to add delivery");
        }
    };

    const handleDownloadOrders = async () => {
        try {
            const res = await API.get(`/stacks/${id}/orders/export`, { responseType: "blob" });
            const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${stack.material || "stack"}_orders.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error exporting orders:", err);
            alert("Failed to download orders");
        }
    };

    const handleDownloadInvoice = async (buyer) => {
        try {
            const res = await API.get(`/stacks/${id}/orders/${encodeURIComponent(buyer)}/invoice`, { responseType: "blob" });
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${stack.material}_${buyer}_Invoice.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error downloading invoice:", err);
            alert("Failed to download invoice");
        }
    };

    const handleDownloadWord = async (order) => {
        try {
            const res = await API.get(`/stacks/${id}/orders/${order._id}/export/word`, { responseType: "blob" });
            const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${order.buyer}_Order_Log.docx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error downloading Word log:", err);
            alert("Failed to download Word log");
        }
    };

    const handleRowClick = (orderId) => {
        setSelectedOrderId(prevId => (prevId === orderId ? null : orderId));
    };

    useEffect(() => {
        fetchStack();
        // eslint-disable-next-line
    }, [id]);

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    if (!stack) return <div className="container mt-4"><div className="alert alert-danger">Stack not found. <Link to="/admin/stacks">Go back to Stacks List</Link></div></div>;

    const remainingQty = stack.totalQty - (stack.usedQty || 0);
    const selectedOrder = stack?.orders.find(o => o._id === selectedOrderId);

    return (
        <div className="container-fluid stack-details-page">
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-dark text-white">
                    <h3 className="mb-0">Stack Details: {stack.material} ({stack.stackId})</h3>
                </div>
                <div className="card-body">
                    <div className="row text-center">
                        <div className="col-md col-6"><h5>Total Quantity</h5><p className="fs-5">{stack.totalQty} {stack.unit}</p></div>
                        <div className="col-md col-6"><h5>Used Quantity</h5><p className="fs-5">{stack.usedQty || 0} {stack.unit}</p></div>
                        <div className="col-md col-12 mt-3 mt-md-0"><h5 className="text-success">Remaining Quantity</h5><p className="fs-5 text-success">{remainingQty} {stack.unit}</p></div>
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-lg-5">
                    <div className="card h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Update Price</h5>
                            <form onSubmit={handlePriceUpdate}>
                                <div className="input-group">
                                    <input type="number" className="form-control" placeholder="New Price" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
                                    <input type="number" className="form-control" placeholder="GST %" value={newGST} onChange={(e) => setNewGST(e.target.value)} required />
                                    <button type="submit" className="btn btn-primary">Update</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="col-lg-7">
                    <div className="card h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Price History</h5>
                            {stack.priceHistory?.length > 0 ? (
                                <ul className="list-group list-group-flush price-history-list">
                                    {stack.priceHistory.map((p, idx) => (
                                        <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                            <span>₹{p.price.toLocaleString('en-IN')} (GST: {p.gstRate || 0}%)</span>
                                            <small className="text-muted">{new Date(p.date).toLocaleString()}</small>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-muted">No price history yet.</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Orders <small className="text-muted fs-6">(Click a row to see details)</small></h4>
                    <button onClick={handleDownloadOrders} className="btn btn-success btn-sm">Download as Excel</button>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle mb-0 orders-table">
                            <thead className="table-light">
                                <tr className="text-center">
                                    <th>Buyer</th><th>Ordered</th><th>Delivered</th><th>Pending</th><th>Rate</th><th>Total + GST</th><th>Paid</th><th>Balance</th><th>Invoice</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stack.orders?.length > 0 ? stack.orders.map((order) => {
                                    const paymentsSum = (order.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
                                    const totalPaid = (order.advancePaid || 0) + paymentsSum;
                                    const deliveredQty = (order.deliveries || []).reduce((s, d) => s + (d.qty || 0), 0);
                                    const pendingQty = (order.qty || 0) - deliveredQty;
                                    const totalWithGst = (order.totalValue || 0) + (order.gstAmount || 0);

                                    return (
                                        <tr key={order._id} onClick={() => handleRowClick(order._id)} className={selectedOrderId === order._id ? 'table-primary' : ''}>
                                            <td>{order.buyer}</td>
                                            <td className="text-center">{order.qty}</td>
                                            <td className="text-center">{deliveredQty}</td>
                                            <td className="text-center fw-bold">{pendingQty}</td>
                                            <td className="text-end">₹{order.pricePerUnit.toLocaleString('en-IN')}</td>
                                            <td className="text-end">₹{totalWithGst.toLocaleString('en-IN')}</td>
                                            <td className="text-end text-success">₹{totalPaid.toLocaleString('en-IN')}</td>
                                            <td className="text-end text-danger">₹{Math.max(0, totalWithGst - totalPaid).toLocaleString('en-IN')}</td>
                                            <td className="text-center"><button onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(order.buyer); }} className="btn btn-outline-secondary btn-sm">PDF</button></td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="9" className="text-center p-4">No orders have been placed for this stack yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {selectedOrder && (
                <div className="card shadow-sm mt-4 selected-order-details">
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">{selectedOrder.buyer} — Order Details</h4>
                        <button onClick={() => handleDownloadWord(selectedOrder)} className="btn btn-light btn-sm">Download Word Log</button>
                    </div>
                    <div className="card-body">
                        <div className="row g-4">
                            <div className="col-lg-6">
                                <h5>Payments</h5>
                                <ul className="list-group mb-3 scrollable-list">
                                    <li className="list-group-item">Initial Advance: ₹{(selectedOrder.advancePaid || 0).toLocaleString('en-IN')}</li>
                                    {(selectedOrder.payments || []).map((p, idx) => (<li className="list-group-item" key={idx}>₹{p.amount.toLocaleString('en-IN')} — <small>{new Date(p.date).toLocaleString()}</small></li>))}
                                </ul>
                                <form onSubmit={(e) => { e.preventDefault(); handleAddPayment(selectedOrder._id); }}>
                                    <div className="input-group">
                                        <input type="number" className="form-control" placeholder="Add payment amount" value={paymentInputs[selectedOrder._id] || ""} onChange={(e) => setPaymentInputs((s) => ({ ...s, [selectedOrder._id]: e.target.value }))} />
                                        <button type="submit" className="btn btn-success">Add Payment</button>
                                    </div>
                                </form>
                            </div>
                            <div className="col-lg-6">
                                <h5>Deliveries</h5>
                                <ul className="list-group mb-3 scrollable-list">
                                    {(selectedOrder.deliveries || []).length > 0 ? 
                                     selectedOrder.deliveries.map((d, idx) => (<li className="list-group-item" key={idx}>{d.qty} {stack.unit} — <small>{new Date(d.date).toLocaleString()}</small></li>))
                                     : <li className="list-group-item">No deliveries yet.</li>   
                                    }
                                </ul>
                                <form onSubmit={(e) => { e.preventDefault(); handleAddDelivery(selectedOrder._id); }}>
                                    <div className="input-group">
                                        <input type="number" className="form-control" placeholder="Add delivery quantity" value={deliveryInputs[selectedOrder._id] || ""} onChange={(e) => setDeliveryInputs((s) => ({ ...s, [selectedOrder._id]: e.target.value }))} />
                                        <button type="submit" className="btn btn-info">Add Delivery</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card shadow-sm mt-4">
                <div className="card-header">
                    <h4 className="mb-0">Stack Summary</h4>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4"><strong>Total Value (with GST):</strong> ₹{stack.summary?.totalValueWithGST?.toLocaleString('en-IN') || 0}</div>
                        <div className="col-md-4"><strong>Total Payments Received:</strong> ₹{stack.summary?.totalAdvance?.toLocaleString('en-IN') || 0}</div>
                        <div className="col-md-4"><strong>Total Balance Owed:</strong> ₹{stack.summary?.totalBalance?.toLocaleString('en-IN') || 0}</div>
                    </div>
                    <hr/>
                    <div className="row">
                        <div className="col-md-4"><strong>Total GST in Orders:</strong> ₹{stack.summary?.totalGST?.toLocaleString('en-IN') || 0}</div>
                        <div className="col-md-4"><strong>Total Delivered Quantity:</strong> {stack.summary?.totalDelivered || 0} {stack.unit}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StackDetails;