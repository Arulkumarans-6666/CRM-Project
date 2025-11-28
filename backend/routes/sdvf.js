const dummy = async (req, res) => {
  try {
    const stack = await Stack.findById(req.params.id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    worksheet.columns = [
      { header: "Buyer", key: "buyer", width: 20 },
      { header: "Qty (Ordered)", key: "qty", width: 12 },
      { header: "Qty (Delivered)", key: "delivered", width: 12 },
      { header: "Price/Unit", key: "pricePerUnit", width: 15 },
      { header: "Total Value", key: "totalValue", width: 15 },
      { header: "GST Rate (%)", key: "gstRate", width: 10 },
      { header: "GST Amount", key: "gstAmount", width: 15 },
      { header: "Advance Paid", key: "advancePaid", width: 15 },
      { header: "Payments (sum)", key: "paymentsSum", width: 15 },
      { header: "Balance", key: "balance", width: 15 },
      { header: "Date", key: "date", width: 20 },
    ];

    stack.orders.forEach((order) => {
      const paymentsSum = (order.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
      const delivered = (order.deliveries || []).reduce((s, d) => s + (d.qty || 0), 0);
      const totalPaid = (order.advancePaid || 0) + paymentsSum;
      const balance = (order.totalValue || 0) + (order.gstAmount || 0) - totalPaid;

      worksheet.addRow({
        buyer: order.buyer,
        qty: order.qty,
        delivered,
        pricePerUnit: order.pricePerUnit,
        totalValue: order.totalValue,
        gstRate: order.gstRate,
        gstAmount: order.gstAmount,
        advancePaid: order.advancePaid,
        paymentsSum,
        balance,
        date: order.date.toLocaleString(),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${stack.material || "stack"}_orders.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting orders:", error);
    res.status(500).json({ error: error.message });
  }

};

export default dummy;