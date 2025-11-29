import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../utils/api";
import "./StackList.css"; // CSS file import pannikonga

const StackList = () => {
  const [stacks, setStacks] = useState([]);
  const [newStack, setNewStack] = useState({
    stackId: "",
    material: "",
    totalQty: "",
    unit: "",
  });
  const [orderData, setOrderData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStacks = async () => {
    try {
      setLoading(true);
      const res = await API.get("/stacks");
      setStacks(res.data);
    } catch (err) {
      console.error("Error fetching stacks:", err);
      alert("Could not load stacks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStacks();
  }, []);

  const handleAddStack = async (e) => {
    e.preventDefault();
    try {
      await API.post("/stacks", {
        stackId: newStack.stackId,
        material: newStack.material,
        totalQty: Number(newStack.totalQty),
        unit: newStack.unit,
      });
      setNewStack({ stackId: "", material: "", totalQty: "", unit: "" });
      fetchStacks();
    } catch (err) {
      console.error("Error adding stack:", err);
      alert(err.response?.data?.error || "Failed to add stack");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this stack? This action cannot be undone.")) return;
    try {
      await API.delete(`/stacks/${id}`);
      fetchStacks();
    } catch (err) {
      console.error("Error deleting stack:", err);
      alert("Failed to delete stack");
    }
  };

  const handleAddOrder = async (id) => {
    const data = orderData[id];
    if (!data || !data.buyer || !data.qty) {
      alert("Buyer & Quantity are required.");
      return;
    }
    const qtyNum = Number(data.qty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    const stack = stacks.find((s) => s._id === id);
    const remaining = stack.totalQty - (stack.usedQty || 0);
    if (qtyNum > remaining) {
      alert(`Not enough stock. Remaining: ${remaining} ${stack.unit}`);
      return;
    }

    const advancePaid = data.advancePaid ? Number(data.advancePaid) : 0;
    if (isNaN(advancePaid) || advancePaid < 0) {
      alert("Please enter a valid advance amount.");
      return;
    }

    try {
      await API.post(`/stacks/${id}/orders`, {
        customerName: data.buyer,
        qty: qtyNum,
        advancePaid,
      });
      setOrderData((prev) => ({
        ...prev,
        [id]: { buyer: "", qty: "", advancePaid: "" },
      }));
      fetchStacks();
    } catch (err) {
      console.error("Error adding order:", err);
      alert(err.response?.data?.error || "Error adding order");
    }
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Stack Materials</h2>

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Add New Stack</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleAddStack}>
            <div className="row g-3 align-items-end">
              <div className="col-sm-6 col-md-3"><input type="text" className="form-control" placeholder="Stack ID" value={newStack.stackId} onChange={(e) => setNewStack({ ...newStack, stackId: e.target.value })} required /></div>
              <div className="col-sm-6 col-md-3"><input type="text" className="form-control" placeholder="Material Name" value={newStack.material} onChange={(e) => setNewStack({ ...newStack, material: e.target.value })} required /></div>
              <div className="col-sm-6 col-md-2"><input type="number" className="form-control" placeholder="Total Quantity" value={newStack.totalQty} onChange={(e) => setNewStack({ ...newStack, totalQty: e.target.value })} required /></div>
              <div className="col-sm-6 col-md-2"><input type="text" className="form-control" placeholder="Unit (e.g., Tons)" value={newStack.unit} onChange={(e) => setNewStack({ ...newStack, unit: e.target.value })} required /></div>
              <div className="col-12 col-md-2"><button type="submit" className="btn btn-primary w-100">Add Stack</button></div>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-bordered table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Stack ID</th>
                  <th>Material</th>
                  <th>Total / Used / Pending</th>
                  <th>Last Price</th>
                  <th>Total Balance</th>
                  <th className="order-form-cell">Add New Order</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr><td colSpan="7" className="text-center p-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></td></tr>
                ) : stacks.length > 0 ? (
                  stacks.map((stack) => {
                    const lastPrice = stack.priceHistory?.length > 0 ? stack.priceHistory.slice(-1)[0].price : 0;
                    const totalValueWithGST = (stack.orders || []).reduce((s, o) => s + ((o.totalValue || 0) + (o.gstAmount || 0)), 0);
                    const totalPaid = (stack.orders || []).reduce((s, o) => s + (o.advancePaid || 0) + (o.payments || []).reduce((a, p) => a + (p.amount || 0), 0), 0);
                    const totalBalance = totalValueWithGST - totalPaid;
                    const pendingStock = stack.totalQty - (stack.usedQty || 0);

                    return (
                      <tr key={stack._id}>
                        <td><strong>{stack.stackId}</strong></td>
                        <td>{stack.material}</td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-bold">T: {stack.totalQty} {stack.unit}</span>
                            <span>U: {stack.usedQty || 0} {stack.unit}</span>
                            <span className="text-success">P: {pendingStock} {stack.unit}</span>
                          </div>
                        </td>
                        <td>₹{lastPrice.toLocaleString('en-IN')}</td>
                        <td><span className="text-danger fw-bold">₹{Math.max(0, totalBalance).toLocaleString('en-IN')}</span></td>
                        <td>
                          <div className="d-flex flex-column gap-2">
                            <input type="text" className="form-control form-control-sm" placeholder="Buyer Name" value={orderData[stack._id]?.buyer || ""} onChange={(e) => setOrderData({ ...orderData, [stack._id]: { ...(orderData[stack._id] || {}), buyer: e.target.value } })}/>
                            <div className="d-flex gap-2">
                                <input type="number" className="form-control form-control-sm" placeholder="Qty" value={orderData[stack._id]?.qty || ""} onChange={(e) => setOrderData({ ...orderData, [stack._id]: { ...(orderData[stack._id] || {}), qty: e.target.value } })} />
                                <input type="number" className="form-control form-control-sm" placeholder="Advance" value={orderData[stack._id]?.advancePaid || ""} onChange={(e) => setOrderData({ ...orderData, [stack._id]: { ...(orderData[stack._id] || {}), advancePaid: e.target.value } })} />
                            </div>
                            <button onClick={() => handleAddOrder(stack._id)} className="btn btn-success btn-sm w-100">Submit Order</button>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-2">
                            <Link to={`/admin/stacks/${stack._id}`} className="btn btn-info btn-sm w-100">View Details</Link>
                            <button onClick={() => handleDelete(stack._id)} className="btn btn-danger btn-sm w-100">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="7" className="text-center p-4">No stacks found. Please add a new stack to begin.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StackList;