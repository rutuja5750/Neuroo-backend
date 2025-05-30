const mongoose = require('mongoose');

const ProtocolSchema = new mongoose.Schema({
  protocolId: {
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
    enum: ['DRAFT', 'REVIEW', 'APPROVED', 'AMENDED', 'ARCHIVED', 'DEPRECATED'],
    default: 'DRAFT'
  },
  description: String,
  objectives: [String],
  endpoints: [{
    primary: Boolean,
    description: String,
    type: String,
    measurement: String
  }],
  design: {
    type: {
      type: String,
      enum: ['RANDOMIZED', 'NON_RANDOMIZED', 'BLINDED', 'OPEN_LABEL', 'CROSSOVER', 'PARALLEL'],
      required: true
    },
    phases: [{
      type: String,
      enum: ['PHASE_1', 'PHASE_2', 'PHASE_3', 'PHASE_4', 'PILOT', 'FEASIBILITY']
    }],
    duration: {
      planned: Number,
      unit: {
        type: String,
        enum: ['DAYS', 'WEEKS', 'MONTHS', 'YEARS']
      }
    },
    sampleSize: {
      planned: Number,
      justification: String
    }
  },
  population: {
    inclusionCriteria: [String],
    exclusionCriteria: [String],
    ageRange: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['YEARS', 'MONTHS', 'DAYS']
      }
    },
    gender: {
      type: String,
      enum: ['ALL', 'MALE', 'FEMALE', 'OTHER']
    }
  },
  interventions: [{
    name: String,
    type: {
      type: String,
      enum: ['DRUG', 'DEVICE', 'PROCEDURE', 'BEHAVIORAL', 'OTHER']
    },
    description: String,
    dosage: String,
    frequency: String,
    duration: String,
    route: String
  }],
  visits: [{
    name: String,
    type: {
      type: String,
      enum: ['SCREENING', 'BASELINE', 'TREATMENT', 'FOLLOW_UP', 'UNSCHEDULED']
    },
    day: Number,
    procedures: [String],
    assessments: [String],
    windows: {
      before: Number,
      after: Number,
      unit: {
        type: String,
        enum: ['DAYS', 'WEEKS', 'MONTHS']
      }
    }
  }],
  safety: {
    adverseEvents: [{
      type: String,
      description: String,
      reporting: String
    }],
    stoppingRules: [String],
    monitoring: {
      frequency: String,
      parameters: [String]
    }
  },
  statisticalMethods: {
    analysis: String,
    sampleSize: String,
    interimAnalysis: String
  },
  amendments: [{
    version: String,
    date: Date,
    description: String,
    changes: [String],
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  approvals: [{
    type: {
      type: String,
      enum: ['IRB', 'EC', 'REGULATORY', 'SPONSOR']
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL']
    },
    date: Date,
    reference: String,
    comments: String
  }],
  documents: [{
    type: {
      type: String,
      enum: ['PROTOCOL', 'AMENDMENT', 'APPROVAL', 'REPORT', 'OTHER']
    },
    name: String,
    url: String,
    version: String,
    date: Date
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
ProtocolSchema.index({ protocolId: 1 }, { unique: true });
ProtocolSchema.index({ trial: 1 });
ProtocolSchema.index({ version: 1 });
ProtocolSchema.index({ status: 1 });
ProtocolSchema.index({ 'design.type': 1 });
ProtocolSchema.index({ 'design.phases': 1 });
ProtocolSchema.index({ 'population.gender': 1 });
ProtocolSchema.index({ 'approvals.type': 1 });
ProtocolSchema.index({ 'approvals.status': 1 });

// Virtual for protocol validity
ProtocolSchema.virtual('isValid').get(function() {
  return this.status === 'APPROVED' || this.status === 'AMENDED';
});

// Virtual for protocol age
ProtocolSchema.virtual('age').get(function() {
  return new Date() - this.createdAt;
});

// Pre-save middleware for version management
ProtocolSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'AMENDED') {
    const currentVersion = this.version;
    const [major, minor] = currentVersion.split('.');
    this.version = `${major}.${parseInt(minor) + 1}`;
  }
  next();
});

const Protocol = mongoose.model('Protocol', ProtocolSchema);

module.exports = Protocol; 