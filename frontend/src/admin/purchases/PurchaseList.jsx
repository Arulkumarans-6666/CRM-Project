// src/admin/purchases/PurchaseList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../utils/api";

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [newPurchase, setNewPurchase] = useState({ materialName: "", supplierName: "", unit: "" });
  const [orderData, setOrderData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await API.get("/purchases");
      setPurchases(res.data);
    } catch (err) {
      console.error("Error fetching purchases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    try {
      await API.post("/purchases", newPurchase);
      setNewPurchase({ materialName: "", supplierName: "", unit: "" });
      fetchPurchases();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add purchase record");
    }
  };
  
  const handleAddOrder = async (purchaseId) => {
    const data = orderData[purchaseId];
    if (!data || !data.orderedQty || !data.pricePerUnit) {
        alert("Quantity and Price are required.");
        return;
    }
    try {
        await API.post(`/purchases/${purchaseId}/orders`, {
            orderedQty: Number(data.orderedQty),
            pricePerUnit: Number(data.pricePerUnit),
            gstRate: Number(data.gstRate || 0),
            advancePaid: Number(data.advancePaid || 0)
        });
        setOrderData(prev => ({ ...prev, [purchaseId]: {} }));
        fetchPurchases();
    } catch (err) {
        alert(err.response?.data?.error || "Failed to add purchase order");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will delete all orders for this material-supplier pair.")) return;
    try {
      await API.delete(`/purchases/${id}`);
      fetchPurchases();
    } catch (err) {
      alert("Failed to delete record");
    }
  };


  return (
    <div className="container-fluid">
      <h2 className="mb-4">Material Purchases</h2>

      <div className="card shadow-sm mb-4">
        <div className="card-header"><h5 className="mb-0">Add New Purchase Record</h5></div>
        <div className="card-body">
          <form onSubmit={handleAddPurchase}>
            <div className="row g-3 align-items-end">
              <div className="col-md-3"><input type="text" className="form-control" placeholder="Material Name" value={newPurchase.materialName} onChange={(e) => setNewPurchase({ ...newPurchase, materialName: e.target.value })} required /></div>
              <div className="col-md-3"><input type="text" className="form-control" placeholder="Supplier Name" value={newPurchase.supplierName} onChange={(e) => setNewPurchase({ ...newPurchase, supplierName: e.target.value })} required /></div>
              <div className="col-md-2"><input type="text" className="form-control" placeholder="Unit (e.g., Tons)" value={newPurchase.unit} onChange={(e) => setNewPurchase({ ...newPurchase, unit: e.target.value })} required /></div>
              <div className="col-md-2"><button type="submit" className="btn btn-primary w-100">Add Record</button></div>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Material</th>
                  <th>Supplier</th>
                  <th>Received / Used / Available</th>
                  <th>Total Balance Due</th>
                  <th style={{minWidth: '300px'}}>Add New Purchase Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr><td colSpan="6" className="text-center p-5"><div className="spinner-border"></div></td></tr>
                ) : purchases.length > 0 ? (
                  purchases.map((p) => {
                    return (
                        <tr key={p._id}>
                            <td><strong>{p.materialName}</strong></td>
                            <td>{p.supplierName}</td>
                            <td>
                                <div className="text-info">R: {p.summary.totalReceived || 0} {p.unit}</div>
                                <div className="text-warning">U: {p.summary.totalUsed || 0} {p.unit}</div>
                                <div className="text-success fw-bold">A: {p.availableStock?.toFixed(2) || 0} {p.unit}</div>
                            </td>
                            <td><span className="text-danger fw-bold">₹{p.summary.totalBalance?.toLocaleString('en-IN') || 0}</span></td>
                            <td>
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex gap-2">
                                        <input type="number" className="form-control form-control-sm" placeholder="Qty" value={orderData[p._id]?.orderedQty || ""} onChange={e => setOrderData({...orderData, [p._id]: {...orderData[p._id], orderedQty: e.target.value}})} />
                                        <input type="number" className="form-control form-control-sm" placeholder="Price/Unit" value={orderData[p._id]?.pricePerUnit || ""} onChange={e => setOrderData({...orderData, [p._id]: {...orderData[p._id], pricePerUnit: e.target.value}})} />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <input type="number" className="form-control form-control-sm" placeholder="GST %" value={orderData[p._id]?.gstRate || ""} onChange={e => setOrderData({...orderData, [p._id]: {...orderData[p._id], gstRate: e.target.value}})} />
                                        <input type="number" className="form-control form-control-sm" placeholder="Advance" value={orderData[p._id]?.advancePaid || ""} onChange={e => setOrderData({...orderData, [p._id]: {...orderData[p._id], advancePaid: e.target.value}})} />
                                    </div>
                                    <button onClick={() => handleAddOrder(p._id)} className="btn btn-success btn-sm">Submit PO</button>
                                </div>
                            </td>
                            <td>
                                <div className="d-flex flex-column gap-2">
                                    <Link to={`/admin/purchases/${p._id}`} className="btn btn-info btn-sm">View Details</Link>
                                    <button onClick={() => handleDelete(p._id)} className="btn btn-danger btn-sm">Delete</button>
                                </div>
                            </td>
                        </tr>
                    )
                  })
                ) : (
                  <tr><td colSpan="6" className="text-center p-4">No purchase records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseList;