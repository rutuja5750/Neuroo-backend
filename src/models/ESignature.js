const mongoose = require('mongoose');

const ESignatureSchema = new mongoose.Schema({
  eSignatureId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  type: {
    type: String,
    enum: ['ELECTRONIC', 'DIGITAL', 'WET'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SIGNED', 'EXPIRED', 'REVOKED'],
    default: 'PENDING'
  },
  signedAt: Date,
  expiresAt: Date,
  signatureData: {
    type: String,
    required: true
  },
  certificate: {
    issuer: String,
    serialNumber: String,
    validFrom: Date,
    validTo: Date
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimized queries
ESignatureSchema.index({ eSignatureId: 1 }, { unique: true });
ESignatureSchema.index({ user: 1 });
ESignatureSchema.index({ document: 1 });
ESignatureSchema.index({ type: 1 });
ESignatureSchema.index({ status: 1 });
ESignatureSchema.index({ signedAt: 1 });
ESignatureSchema.index({ expiresAt: 1 });

// Virtual for signature validity
ESignatureSchema.virtual('isValid').get(function() {
  if (this.status !== 'SIGNED') return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
});

// Pre-save middleware for status updates
ESignatureSchema.pre('save', function(next) {
  if (this.isModified('signedAt') && this.signedAt) {
    this.status = 'SIGNED';
  }
  if (this.isModified('expiresAt') && this.expiresAt && this.expiresAt < new Date()) {
    this.status = 'EXPIRED';
  }
  next();
});

const ESignature = mongoose.model('ESignature', ESignatureSchema);

module.exports = ESignature; 