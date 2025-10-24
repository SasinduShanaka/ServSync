// src/models/InsuranceType.model.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const InsuranceTypeSchema = new Schema({

  name: { 
    type: String, 
    required: true 
  },
  nameUpper: { 
    type: String,
     unique: true 
    },
  description: { type: String, default: '' }
}, { timestamps: true });

InsuranceTypeSchema.pre('save', function(next){
  this.nameUpper = this.name.toUpperCase().trim();
  next();
});

export default model('InsuranceType', InsuranceTypeSchema);
