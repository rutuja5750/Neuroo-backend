const mongoose = require('mongoose');

const DeviationSchema = new mongoose.Schema({
  deviationId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  trial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trial',
    required: true
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  type: {
    type: String,
    enum: ['PROTOCOL', 'PROCEDURE', 'REGULATORY', 'SAFETY', 'QUALITY', 'OTHER'],
    required: true
  },
  severity: {
    type: String,
    enum: ['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL'],
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'],
    default: 'DRAFT'
  },
  description: {
    type: String,
    required: true
  },
  impact: {
    type: String,
    required: true
  },
  rootCause: String,
  correctiveAction: {
    planned: String,
    implemented: String,
    effectiveness: String
  },
  preventiveAction: String,
  reportedDate: {
    type: Date,
    required: true
  },
  discoveredDate: Date,
  resolvedDate: Date,
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
    role: String,
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
    role: String,
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED']
    },
    comments: String,
    approvedAt: Date
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['EMAIL', 'IN_APP', 'SMS']
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    sentAt: Date,
    status: String
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
DeviationSchema.index({ deviationId: 1 }, { unique: true });
DeviationSchema.index({ trial: 1 });
DeviationSchema.index({ site: 1 });
DeviationSchema.index({ subject: 1 });
DeviationSchema.index({ type: 1 });
DeviationSchema.index({ severity: 1 });
DeviationSchema.index({ status: 1 });
DeviationSchema.index({ reportedDate: 1 });
DeviationSchema.index({ resolvedDate: 1 });

// Virtual for deviation duration
DeviationSchema.virtual('duration').get(function() {
  if (!this.reportedDate || !this.resolvedDate) return null;
  return this.resolvedDate - this.reportedDate;
});

// Virtual for deviation age
DeviationSchema.virtual('age').get(function() {
  if (!this.reportedDate) return null;
  return new Date() - this.reportedDate;
});

// Pre-save middleware for status updates
DeviationSchema.pre('save', function(next) {
  if (this.isModified('resolvedDate') && this.resolvedDate) {
    this.status = 'CLOSED';
  }
  next();
});

const Deviation = mongoose.model('Deviation', DeviationSchema);

module.exports = Deviation; 