// utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kumaransarul0@gmail.com',
        pass: 'bhas kmla iznd nnmz'
    },
    tls: {
        rejectUnauthorized: false
    }
});

// ✅ SARI SEIYAPATTADHU: Itha 'templateParams' nu illama, thani thaniya vaangurom
const sendLowStockAlert = (materialName, supplierName, availableStock, unit, threshold) => {
    const mailOptions = {
        from: 'kumaransarul0@gmail.com',
        to: 'kumaransarul4@gmail.com',
        // ✅ SARI SEIYAPATTADHU: Ippo 'materialName' sariya velai seiyum
        subject: `🚨 Low Stock Alert: ${materialName}`,
        html: `
            <h3>Stock Alert!</h3>
            <p>The stock for <strong>${materialName}</strong> from supplier <strong>${supplierName}</strong> is running low.</p>
            <p>Current Available Stock: <strong>${availableStock.toFixed(2)} ${unit}</strong></p>
            <p>The low-stock threshold is set to ${threshold} ${unit}.</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('❌ Nodemailer send error:', error.message);
        }
        console.log('✅ Email sent successfully:', info.response);
    });
};

module.exports = { sendLowStockAlert };