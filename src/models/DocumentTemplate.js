const mongoose = require('mongoose');

const DocumentTemplateSchema = new mongoose.Schema({
  templateId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['TRIAL', 'SITE', 'SUBJECT', 'SAFETY', 'QUALITY', 'GENERAL'],
    required: true
  },
  category: {
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
  content: {
    type: String,
    required: true
  },
  placeholders: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['TEXT', 'DATE', 'NUMBER', 'SELECT', 'MULTISELECT', 'REFERENCE'],
      required: true
    },
    description: String,
    required: {
      type: Boolean,
      default: false
    },
    options: [String], // For SELECT and MULTISELECT types
    validation: {
      pattern: String,
      min: Number,
      max: Number,
      format: String
    }
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  effectiveDate: Date,
  expiryDate: Date,
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
DocumentTemplateSchema.index({ templateId: 1 }, { unique: true });
DocumentTemplateSchema.index({ name: 1 });
DocumentTemplateSchema.index({ type: 1 });
DocumentTemplateSchema.index({ category: 1 });
DocumentTemplateSchema.index({ version: 1 });
DocumentTemplateSchema.index({ status: 1 });
DocumentTemplateSchema.index({ effectiveDate: 1 });
DocumentTemplateSchema.index({ expiryDate: 1 });

// Virtual for template validity
DocumentTemplateSchema.virtual('isValid').get(function() {
  if (this.status !== 'APPROVED') return false;
  if (this.expiryDate && this.expiryDate < new Date()) return false;
  return true;
});

// Pre-save middleware for status updates
DocumentTemplateSchema.pre('save', function(next) {
  if (this.isModified('expiryDate') && this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'DEPRECATED';
  }
  next();
});

const DocumentTemplate = mongoose.model('DocumentTemplate', DocumentTemplateSchema);

module.exports = DocumentTemplate; 