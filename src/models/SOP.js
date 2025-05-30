const mongoose = require('mongoose');

const SOPSchema = new mongoose.Schema({
  sopId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED', 'DEPRECATED'],
    default: 'DRAFT'
  },
  description: String,
  content: {
    type: String,
    required: true
  },
  effectiveDate: Date,
  expiryDate: Date,
  department: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  keywords: [String],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  reviewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED']
    },
    comments: String,
    reviewedAt: Date
  }],
  approvers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED']
    },
    comments: String,
    approvedAt: Date
  }],
  relatedSOPs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SOP'
  }],
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
SOPSchema.index({ sopId: 1 }, { unique: true });
SOPSchema.index({ title: 1 });
SOPSchema.index({ version: 1 });
SOPSchema.index({ status: 1 });
SOPSchema.index({ department: 1 });
SOPSchema.index({ category: 1 });
SOPSchema.index({ keywords: 1 });
SOPSchema.index({ effectiveDate: 1 });
SOPSchema.index({ expiryDate: 1 });

// Virtual for SOP validity
SOPSchema.virtual('isValid').get(function() {
  if (this.status !== 'APPROVED') return false;
  if (this.expiryDate && this.expiryDate < new Date()) return false;
  return true;
});

// Pre-save middleware for status updates
SOPSchema.pre('save', function(next) {
  if (this.isModified('expiryDate') && this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'DEPRECATED';
  }
  next();
});

const SOP = mongoose.model('SOP', SOPSchema);

module.exports = SOP; 