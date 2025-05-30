const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  milestoneId: {
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
    ref: 'Site'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'REGULATORY',
      'ENROLLMENT',
      'SAFETY',
      'EFFICACY',
      'QUALITY',
      'DOCUMENTATION',
      'OTHER'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED'],
    default: 'PENDING'
  },
  description: String,
  dueDate: {
    type: Date,
    required: true
  },
  completedDate: Date,
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  }],
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
    frequency: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'ON_DUE_DATE']
    },
    enabled: {
      type: Boolean,
      default: true
    }
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
MilestoneSchema.index({ milestoneId: 1 }, { unique: true });
MilestoneSchema.index({ trial: 1 });
MilestoneSchema.index({ site: 1 });
MilestoneSchema.index({ type: 1 });
MilestoneSchema.index({ status: 1 });
MilestoneSchema.index({ dueDate: 1 });
MilestoneSchema.index({ priority: 1 });
MilestoneSchema.index({ assignedTo: 1 });

// Virtual for milestone status
MilestoneSchema.virtual('isOverdue').get(function() {
  return this.status !== 'COMPLETED' && this.dueDate < new Date();
});

// Virtual for completion status
MilestoneSchema.virtual('completionStatus').get(function() {
  if (this.status === 'COMPLETED') return 'COMPLETED';
  if (this.isOverdue) return 'OVERDUE';
  if (this.status === 'IN_PROGRESS') return 'IN_PROGRESS';
  return 'PENDING';
});

// Pre-save middleware for status updates
MilestoneSchema.pre('save', function(next) {
  if (this.isModified('completedDate') && this.completedDate) {
    this.status = 'COMPLETED';
  }
  next();
});

const Milestone = mongoose.model('Milestone', MilestoneSchema);

module.exports = Milestone; 