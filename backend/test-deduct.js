const mongoose = require('mongoose');
const Medicine = require('./models/Medicine');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const med = await Medicine.findOne({ quantityInStock: { $gt: 0 } });
  if(!med) return console.log('No meds with stock in DB');
  
  const qty = 1;
  const updatedMed = await Medicine.findOneAndUpdate(
    { _id: med._id, quantityInStock: { $gte: qty } },
    { 
      $inc: { quantityInStock: -qty },
      $push: { 
        dispenseHistory: {
          appointmentId: new mongoose.Types.ObjectId(),
          quantity: qty,
          dispensedBy: new mongoose.Types.ObjectId(),
          dispensedAt: new Date(),
          source: 'consultation',
          recipientName: 'Test Patient'
        }
      }
    },
    { new: true }
  );
  
  if (updatedMed) {
      console.log('Update Success!', updatedMed.name, 'remaining:', updatedMed.quantityInStock);
  } else {
      console.log('Update Failed, med returned null');
  }
  process.exit();
}).catch(console.error);
