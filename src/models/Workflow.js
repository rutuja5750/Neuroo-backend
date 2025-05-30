const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema({
  workflowId: {
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
    enum: ['DOCUMENT_REVIEW', 'DOCUMENT_APPROVAL', 'DOCUMENT_SIGNATURE', 'DOCUMENT_ARCHIVAL'],
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'ARCHIVED', 'DEPRECATED'],
    default: 'DRAFT'
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  steps: [{
    order: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['REVIEW', 'APPROVE', 'SIGN', 'NOTIFY'],
      required: true
    },
    assignees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    deadline: Date,
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'SKIPPED'],
      default: 'PENDING'
    },
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  currentStep: {
    type: Number,
    default: 0
  },
  notifications: [{
    type: {
      type: String,
      enum: ['EMAIL', 'IN_APP', 'SMS']
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    trigger: {
      type: String,
      enum: ['STEP_START', 'STEP_COMPLETE', 'WORKFLOW_COMPLETE', 'DEADLINE_APPROACHING']
    },
    template: String,
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
WorkflowSchema.index({ workflowId: 1 }, { unique: true });
WorkflowSchema.index({ document: 1 });
WorkflowSchema.index({ type: 1 });
WorkflowSchema.index({ status: 1 });
WorkflowSchema.index({ currentStep: 1 });
WorkflowSchema.index({ 'steps.assignees': 1 });
WorkflowSchema.index({ 'steps.status': 1 });
WorkflowSchema.index({ 'steps.deadline': 1 });

// Virtual for workflow progress
WorkflowSchema.virtual('progress').get(function() {
  if (!this.steps.length) return 0;
  const completedSteps = this.steps.filter(step => step.status === 'COMPLETED').length;
  return (completedSteps / this.steps.length) * 100;
});

// Virtual for workflow status
WorkflowSchema.virtual('workflowStatus').get(function() {
  if (this.status === 'ARCHIVED') return 'ARCHIVED';
  if (this.status === 'DEPRECATED') return 'DEPRECATED';
  if (this.progress === 100) return 'COMPLETED';
  if (this.steps.some(step => step.status === 'REJECTED')) return 'REJECTED';
  if (this.steps.some(step => step.status === 'IN_PROGRESS')) return 'IN_PROGRESS';
  return 'PENDING';
});

// Pre-save middleware for step management
WorkflowSchema.pre('save', function(next) {
  if (this.isModified('steps')) {
    // Update current step based on completed steps
    const lastCompletedStep = this.steps
      .map((step, index) => ({ ...step, index }))
      .filter(step => step.status === 'COMPLETED')
      .pop();
    
    this.currentStep = lastCompletedStep ? lastCompletedStep.index + 1 : 0;
  }
  next();
});

const Workflow = mongoose.model('Workflow', WorkflowSchema);

module.exports = Workflow; 