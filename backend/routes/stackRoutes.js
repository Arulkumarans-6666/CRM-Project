// routes/stackRoutes.js
const express = require("express");
const router = express.Router();
const Stack = require("../models/Stack");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const path = require("path");
const QRCode = require("qrcode");
const { toWords } = require("number-to-words");

// ✅ NEW CHATBOT ROUTES FOR STACKS
// Find a stack by its ID
router.get("/find/by-id/:stackId", async (req, res) => {
    try {
        const stack = await Stack.findOne({ stackId: { $regex: new RegExp(req.params.stackId, "i") } });
        if (!stack) return res.status(404).json({ msg: 'Stack not found' });
        // We use the transform function to get calculated summaries
        res.json(transformStackDoc(stack));
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Calculate total balance of all stacks
router.get("/summary/all-balances", async (req, res) => {
    try {
        const stacks = await Stack.find();
        const transformedStacks = stacks.map(transformStackDoc);
        const totalBalance = transformedStacks.reduce((sum, s) => sum + (s.summary?.totalBalance || 0), 0);
        res.json({ totalBalance, count: stacks.length });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});
// ✅ END NEW ROUTES
/* -------------------- Helper: transform stack before sending -------------------- */
function transformStackDoc(stackDoc) {
  // convert to plain object
  const stack = stackDoc.toObject ? stackDoc.toObject() : JSON.parse(JSON.stringify(stackDoc));

  // per-order derived fields
  stack.orders = (stack.orders || []).map((o) => {
    const paymentsSum = (o.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
    const totalPaid = (o.advancePaid || 0) + paymentsSum;
    const deliveredQty = (o.deliveries || []).reduce((s, d) => s + (d.qty || 0), 0);
    const pendingQty = (o.qty || 0) - deliveredQty;
    const balance = (o.totalValue || 0) + (o.gstAmount || 0) - totalPaid;

    return {
      ...o,
      totalPaid,
      deliveredQty,
      pendingQty,
      balance,
    };
  });

  // stack-level aggregates
  stack.summary = {
    totalGST: (stack.orders || []).reduce((s, o) => s + (o.gstAmount || 0), 0),
    totalAdvance: (stack.orders || []).reduce((s, o) => s + ((o.advancePaid || 0) + ((o.payments || []).reduce((a, p) => a + (p.amount || 0), 0))), 0),
    totalValueWithGST: (stack.orders || []).reduce((s, o) => s + ((o.totalValue || 0) + (o.gstAmount || 0)), 0),
    totalBalance: (stack.orders || []).reduce((s, o) => s + (((o.totalValue || 0) + (o.gstAmount || 0) - ((o.advancePaid || 0) + ((o.payments || []).reduce((a, p) => a + (p.amount || 0), 0))))), 0),
    totalDelivered: (stack.orders || []).reduce((s, o) => s + ((o.deliveries || []).reduce((a, d) => a + (d.qty || 0), 0)), 0),
  };

  return stack;
}

/* -------------------- CRUD ROUTES -------------------- */
// All your other routes are unchanged...
router.post("/", async (req, res) => {
  try {
    const { stackId, material, totalQty, unit } = req.body;
    if (!stackId || !material || !totalQty || !unit) {
      return res
        .status(400)
        .json({ error: "stackId, material, totalQty, unit are required" });
    }

    const newStack = new Stack({
      stackId,
      material,
      totalQty,
      unit,
      usedQty: 0,
      orders: [],
      priceHistory: [],
    });

    await newStack.save();
    res.status(201).json(newStack);
  } catch (error) {
    console.error("Error creating stack:", error);
    res.status(500).json({ error: error.message });
  }
});
router.get("/", async (req, res) => {
  try {
    const stacks = await Stack.find().sort({ updatedAt: -1 });
    const transformed = stacks.map(transformStackDoc);
    res.json(transformed);
  } catch (error) {
    console.error("Error getting all stacks:", error);
    res.status(500).json({ error: error.message });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const stack = await Stack.findById(req.params.id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });
    res.json(transformStackDoc(stack));
  } catch (error) {
    console.error("Error fetching stack:", error);
    res.status(500).json({ error: error.message });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const stack = await Stack.findByIdAndDelete(req.params.id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });
    res.json({ message: "Stack deleted successfully" });
  } catch (error) {
    console.error("Error deleting stack:", error);
    res.status(500).json({ error: error.message });
  }
});
router.put("/:id/price", async (req, res) => {
  try {
    const { price, gstRate = 0 } = req.body;

    if (price === undefined || typeof price !== "number" || price <= 0) {
      return res.status(400).json({ error: "Invalid price" });
    }
    if (typeof gstRate !== "number" || gstRate < 0 || gstRate > 100) {
      return res.status(400).json({ error: "Invalid GST rate (0-100)" });
    }

    const stack = await Stack.findById(req.params.id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });

    stack.priceHistory.push({ price, gstRate, date: new Date() });

    await stack.save();
    res.json(transformStackDoc(stack));
  } catch (error) {
    console.error("Error updating price:", error);
    res.status(500).json({ error: error.message });
  }
});
router.post("/:id/orders", async (req, res) => {
  try {
    const { customerName, qty, advancePaid = 0 } = req.body;

    if (!customerName || typeof qty !== "number" || qty <= 0) {
      return res
        .status(400)
        .json({ error: "customerName and positive qty required" });
    }
    if (typeof advancePaid !== "number" || advancePaid < 0) {
      return res.status(400).json({ error: "advancePaid must be >= 0" });
    }

    const stack = await Stack.findById(req.params.id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });

    const availableQty = stack.totalQty - (stack.usedQty || 0);
    if (qty > availableQty) {
      return res
        .status(400)
        .json({ error: `Only ${availableQty} units available` });
    }

    const lastPriceEntry = stack.priceHistory[stack.priceHistory.length - 1];
    const pricePerUnit = lastPriceEntry ? lastPriceEntry.price : 0;
    const gstRate = lastPriceEntry ? lastPriceEntry.gstRate || 0 : 0;

    const totalValue = qty * pricePerUnit;
    const gstAmount = (totalValue * gstRate) / 100;
    const balance = totalValue + gstAmount - advancePaid;

    const orderObj = {
      buyer: customerName,
      qty,
      pricePerUnit,
      totalValue,
      gstRate,
      gstAmount,
      advancePaid,
      balance,
      date: new Date(),
      payments: [],    // empty initially (subsequent payments go here)
      deliveries: [],  // deliveries go here
    };

    stack.orders.push(orderObj);
    stack.usedQty = (stack.usedQty || 0) + qty;
    await stack.save();
    res.json(transformStackDoc(stack));
  } catch (error) {
    console.error("Error adding order:", error);
    res.status(500).json({ error: error.message });
  }
});

/* -------------------- NEW: payments & deliveries -------------------- */

// Add payment to an order
router.post("/:id/orders/:orderId/payments", async (req, res) => {
  try {
    const { id, orderId } = req.params;
    const { amount } = req.body;

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }

    const stack = await Stack.findById(id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });

    // ✅ THE ONLY FIX IS HERE: Finding the order correctly
    const order = stack.orders.find(o => o._id.toString() === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Your original logic is preserved
    order.payments.push({ amount, date: new Date() });

    const paymentsSum = (order.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
    const totalPaid = (order.advancePaid || 0) + paymentsSum;
    order.balance = (order.totalValue || 0) + (order.gstAmount || 0) - totalPaid;

    await stack.save();
    res.json(transformStackDoc(stack));
  } catch (err) {
    console.error("Error adding payment:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add delivery to an order
router.post("/:id/orders/:orderId/deliveries", async (req, res) => {
  try {
    const { id, orderId } = req.params;
    const { qty } = req.body;

    if (typeof qty !== "number" || qty <= 0) {
      return res.status(400).json({ error: "qty must be a positive number" });
    }

    const stack = await Stack.findById(id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });

    // ✅ THE ONLY FIX IS HERE: Finding the order correctly
    const order = stack.orders.find(o => o._id.toString() === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Your original logic is preserved
    const alreadyDelivered = (order.deliveries || []).reduce((s, d) => s + (d.qty || 0), 0);
    const remainingForOrder = (order.qty || 0) - alreadyDelivered;
    if (qty > remainingForOrder) {
      return res.status(400).json({ error: `Only ${remainingForOrder} units remaining for this order` });
    }

    order.deliveries.push({ qty, date: new Date() });
    await stack.save();
    res.json(transformStackDoc(stack));
  } catch (err) {
    console.error("Error adding delivery:", err);
    res.status(500).json({ error: err.message });
  }
});
// routes/stackRoutes.js

// ... (keep all your existing code before this)

const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel } = require("docx");
const { default: dummy } = require("./sdvf");

// ✨ NEW: Route to export a single order's log to a Word document
router.get("/:id/orders/:orderId/export/word", async (req, res) => {
    try {
        const { id, orderId } = req.params;
        const stack = await Stack.findById(id);
        if (!stack) return res.status(404).json({ error: "Stack not found" });

        const order = stack.orders.find(o => o._id.toString() === orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });
        
        // --- Create the Word Document Content ---

        // Payment Rows
        const paymentRows = order.payments.map(p => {
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(new Date(p.date).toLocaleString('en-IN'))] }),
                    new TableCell({ children: [new Paragraph(`₹${p.amount}`)] }),
                ],
            });
        });
        // Add initial advance to the top
        paymentRows.unshift(new TableRow({
            children: [
                new TableCell({ children: [new Paragraph(new Date(order.date).toLocaleString('en-IN'))] }),
                new TableCell({ children: [new Paragraph(`₹${order.advancePaid || 0} (Initial Advance)`)] }),
            ]
        }));


        // Delivery Rows
        const deliveryRows = order.deliveries.map(d => {
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(new Date(d.date).toLocaleString('en-IN'))] }),
                    new TableCell({ children: [new Paragraph(`${d.qty} ${stack.unit}`)] }),
                ],
            });
        });

        const totalPaid = (order.advancePaid || 0) + order.payments.reduce((s, p) => s + p.amount, 0);
        const totalValueWithGst = order.totalValue + order.gstAmount;
        const balance = totalValueWithGst - totalPaid;

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: "Order Details", heading: HeadingLevel.HEADING_1, alignment: 'center' }),
                    new Paragraph({ children: [new TextRun({ text: "Buyer Name: ", bold: true }), new TextRun(order.buyer)] }),
                    new Paragraph({ children: [new TextRun({ text: "Order Date: ", bold: true }), new TextRun(new Date(order.date).toLocaleDateString('en-IN'))] }),
                    new Paragraph({ children: [new TextRun({ text: "Material: ", bold: true }), new TextRun(stack.material)] }),
                    new Paragraph({ children: [new TextRun({ text: "Total Quantity Ordered: ", bold: true }), new TextRun(`${order.qty} ${stack.unit}`)] }),
                    
                    new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
                    new Paragraph(`Total Value (with GST): ₹${totalValueWithGst}`),
                    new Paragraph(`Total Paid: ₹${totalPaid}`),
                    new Paragraph({ children: [new TextRun({ text: "Balance Due: ", bold: true }), new TextRun({ text: `₹${balance}`, bold: true })] }),

                    new Paragraph({ text: "Payments Log", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
                    new Table({
                        rows: [
                            new TableRow({ children: [new TableCell({ children: [new Paragraph("Date & Time")] }), new TableCell({ children: [new Paragraph("Amount")] })] }),
                            ...paymentRows
                        ],
                    }),

                    new Paragraph({ text: "Deliveries Log", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
                    new Table({
                        rows: [
                            new TableRow({ children: [new TableCell({ children: [new Paragraph("Date & Time")] }), new TableCell({ children: [new Paragraph("Quantity")] })] }),
                            ...deliveryRows
                        ],
                    }),
                ],
            }],
        });
        
        const buffer = await Packer.toBuffer(doc);
        
        res.setHeader('Content-Disposition', `attachment; filename=${order.buyer}_Order_Log.docx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);

    } catch (error) {
        console.error("Error generating Word document:", error);
        res.status(500).json({ error: error.message });
    }
});

// ... (Your existing Excel export and Invoice routes come after this)
/* -------------------- Your Unchanged Export and Invoice Routes -------------------- */
router.get("/:id/orders/export", dummy)
router.get("/:id/orders/:buyer/invoice", async (req, res) => {
  try {
    const { id, buyer } = req.params;
    const stack = await Stack.findById(id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });

    const buyerOrders = stack.orders.filter(
      (o) => o.buyer.toLowerCase() === buyer.toLowerCase()
    );
    if (buyerOrders.length === 0) {
      return res.status(404).json({ error: "No orders found for this buyer" });
    }

    const totalBasic = buyerOrders.reduce((s, o) => s + o.totalValue, 0);
    const totalGST = buyerOrders.reduce((s, o) => s + o.gstAmount, 0);
    const totalInvoice = totalBasic + totalGST;
    const totalPaid = buyerOrders.reduce((s, o) => s + o.advancePaid, 0);
    const balance = buyerOrders.reduce((s, o) => s + o.balance, 0);

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const fileName = `${stack.material}_${buyer}_Invoice.pdf`;
    res.setHeader("Content-disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    const logoPath = path.join(__dirname, "../public/logo.png");
    try {
      doc.image(logoPath, 30, 20, { width: 60 });
    } catch {
      doc.fontSize(10).text("UltraTech Logo", 30, 20);
    }

    doc.fontSize(14).text("The Ramco Cements Ltd", 120, 20);
    doc.fontSize(9).text("Unit Address:NH 44, Dist, Ramaswamy Raja Nagar, Tulukkapatti, Tamil Nadu 626204", 120, 35);
    doc.text("GSTIN: 09AAACL6442L1Z8", 120, 48);
    doc.fontSize(9).text(`Invoice No.: ${Date.now()}`, 350, 65);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 350, 78);
    doc.text("CIN NO: L26941TN1957PLC003566", 350, 91);
    doc.rect(30, 110, 260, 90).stroke();
    doc.fontSize(9).text(`Recipient Code No.: ${stack.recipientCode || "N/A"}`, 35, 115);
    doc.text("Name & Address of Recipient:", 35, 130);
    doc.text(`${stack.customerName || buyer}`, 35, 145);
    doc.text(`Place of Supply: TamilNadu, State Code: 626204`, 35, 160);
    doc.text(`Recipient GSTIN/UIN: ${stack.recipientGST || "N/A"}`, 35, 175);
    doc.rect(320, 110, 260, 90).stroke();
    doc.fontSize(9).text(`D.C.No: ${stack.dcNo || "N/A"}`, 325, 115);
    doc.text("Name & Address of Delivery:", 325, 130);
    doc.text(`${stack.customerName || buyer}`, 325, 145);
    doc.text(`State: ${stack.state || "N/A"}, Code: ${stack.stateCode || "N/A"}`, 325, 160);
    doc.text(`Order No.: ${stack.orderNo || "N/A"}`, 325, 175);
    let tableTop = 220;
    const colWidths = [60, 60, 120, 40, 60, 40, 70, 70];
    const headers = ["D.C.Date", "D.C.No", "Description", "Qty", "Rate", "Unit", "Basic Value", "IGST"];
    let x = 30;
    headers.forEach((h, i) => { doc.rect(x, tableTop, colWidths[i], 20).stroke(); doc.fontSize(8).text(h, x + 2, tableTop + 5); x += colWidths[i]; });
    tableTop += 20;
    buyerOrders.forEach((order, idx) => {
      let row = [order.date.toLocaleDateString(), stack.dcNo || `DC${idx + 1}`, stack.material, order.qty, order.pricePerUnit, stack.unit, order.totalValue, order.gstAmount];
      x = 30;
      row.forEach((d, i) => { doc.rect(x, tableTop, colWidths[i], 20).stroke(); doc.fontSize(8).text(String(d), x + 2, tableTop + 5); x += colWidths[i]; });
      tableTop += 20;
    });
    doc.fontSize(9).text(`Total Invoice Value: ₹${totalInvoice}`, 400, tableTop + 10);
    doc.moveDown();
    doc.text(`Tax Amount in Words: Rupees ${toWords(totalGST)} Only`);
    doc.text(`Invoice Amount in Words: Rupees ${toWords(totalInvoice)} Only`);
    doc.moveDown();
    doc.text("Vehicle No.: TN 58 AB 1234   Driver: Q   Mob: 9090909090");
    doc.moveDown();
    doc.fontSize(8).text("Terms & Conditions:");
    doc.text("1. Subject to TamilNadu Jurisdiction.");
    doc.text("2. Payment via RTGS/NEFT/ACH/IMPS only.");
    doc.text("3. Interest @18% p.a. for delayed payment.");
    doc.text("4. TDS will be credited after certificate is received.");
    doc.moveDown();
    doc.fontSize(8).text("Registered Office: Ramamandiram, Rajapalayam – 626 117, Virudhunagar District, Tamil Nadu, India");
    let invoiceSummary = `Invoice Summary\n------------------------\nBuyer : ${buyer}\nMaterial : ${stack.material}\nTotal Invoice : ₹${totalInvoice}\nTotal GST : ₹${totalGST}\nBalance Due : ₹${balance}\nOrders:`;
    buyerOrders.forEach((o, idx) => { invoiceSummary += `\nOrder ${idx + 1}: Qty : ${o.qty} Rate : ₹${o.pricePerUnit} Total : ₹${o.totalValue} GST : ₹${o.gstAmount} Paid : ₹${o.advancePaid} Balance : ₹${o.balance} Date : ${o.date.toLocaleDateString()}`; });
    const qrInvoice = await QRCode.toDataURL(invoiceSummary);
    const qrBuffer1 = Buffer.from(qrInvoice.split(",")[1], "base64");
    const upiId = "kumaransarul0-1@okhdfcbank";
    const qrPayText = `upi://pay?pa=${upiId}&pn=${buyer}&am=${balance}&cu=INR`;
    const qrPay = await QRCode.toDataURL(qrPayText);
    const qrBuffer2 = Buffer.from(qrPay.split(",")[1], "base64");
    const qrY = doc.page.height - 200;
    doc.image(qrBuffer1, 50, qrY, { width: 120 });
    doc.fontSize(10).text("Invoice Summary QR", 60, qrY + 125, { width: 120, align: "center" });
    doc.image(qrBuffer2, 250, qrY, { width: 120 });
    doc.fontSize(10).text("Payment QR (Balance Only)", 260, qrY + 125, { width: 120, align: "center" });
    doc.fontSize(10).text("ULTRATECH CEMENT LIMITED", 420, qrY);
    doc.text("Authorised Signatory", 440, qrY + 80);
    doc.end();
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;