const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
  siteId: {
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'SUSPENDED', 'TERMINATED'],
    default: 'PLANNED'
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  contactInfo: {
    phone: String,
    email: String,
    fax: String
  },
  investigators: [{
    name: String,
    role: String,
    email: String,
    phone: String,
    credentials: String,
    signature: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signature'
    }
  }],
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  startDate: Date,
  estimatedEndDate: Date,
  actualEndDate: Date,
  enrollmentTarget: Number,
  actualEnrollment: Number,
  siteType: {
    type: String,
    enum: ['HOSPITAL', 'CLINIC', 'RESEARCH_CENTER', 'PHYSICIAN_OFFICE', 'OTHER'],
    required: true
  },
  regulatoryApprovals: [{
    type: String,
    approvalDate: Date,
    expiryDate: Date,
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
SiteSchema.index({ siteId: 1 }, { unique: true });
SiteSchema.index({ trial: 1 });
SiteSchema.index({ status: 1 });
SiteSchema.index({ 'address.country': 1 });
SiteSchema.index({ siteType: 1 });
SiteSchema.index({ startDate: 1 });
SiteSchema.index({ estimatedEndDate: 1 });
SiteSchema.index({ 'investigators.email': 1 });
// Virtual for site duration
SiteSchema.virtual('duration').get(function() {
  if (!this.startDate || !this.actualEndDate) return null;
  return this.actualEndDate - this.startDate;
});
// Virtual for enrollment progress
SiteSchema.virtual('enrollmentProgress').get(function() {
  if (!this.enrollmentTarget || !this.actualEnrollment) return null;
  return (this.actualEnrollment / this.enrollmentTarget) * 100;
});
// Pre-save middleware for status updates
SiteSchema.pre('save', function(next) {
  if (this.isModified('actualEndDate') && this.actualEndDate) {
    this.status = 'COMPLETED';
  }
  next();
});
const Site = mongoose.model('Site', SiteSchema);
module.exports = Site; 