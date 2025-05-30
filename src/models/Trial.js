const mongoose = require('mongoose');

const trialSchema = new mongoose.Schema({
  // Core Information
  studyId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  // Study Details
  protocolNumber: {
    type: String,
    required: true,
    unique: true
  },
  phase: {
    type: String,
    enum: ['PHASE_1', 'PHASE_2', 'PHASE_3', 'PHASE_4', 'POST_MARKETING'],
    required: true
  },
  therapeuticArea: {
    type: String,
    required: true
  },
  indication: {
    type: String,
    required: true
  },
  // Status and Timeline
  status: {
    type: String,
    enum: [
      'PLANNING',
      'ACTIVE',
      'ON_HOLD',
      'COMPLETED',
      'TERMINATED',
      'ARCHIVED'
    ],
    default: 'PLANNING'
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date']
  },
  estimatedCompletionDate: Date,
  // Organization
  sponsor: {
    type: String,
    required: true
  },
  cro: {
    name: String,
    contractNumber: String
  },
  // Study Team
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Trial must belong to a user']
  },
  studyTeam: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: [
        'STUDY_MANAGER',
        'PROJECT_MANAGER',
        'QUALITY_ASSURANCE',
        'MONITOR_CRA',
        'COUNTRY_MANAGER',
        'INVESTIGATOR',
        'STUDY_COORDINATOR'
      ]
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Sites and Countries
  countries: [{
    code: String,
    name: String,
    status: {
      type: String,
      enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'TERMINATED'],
      default: 'PLANNED'
    },
    startDate: Date,
    endDate: Date
  }],
  sites: [{
    siteId: String,
    name: String,
    country: String,
    status: {
      type: String,
      enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'TERMINATED'],
      default: 'PLANNED'
    },
    startDate: Date,
    endDate: Date,
    investigator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Documents
  documentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  // Regulatory Information
  regulatoryAuthority: {
    type: String,
    enum: ['FDA', 'EMA', 'OTHER']
  },
  regulatoryStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
    default: 'PENDING'
  },
  // Quality and Compliance
  qualityMetrics: {
    documentCompleteness: {
      type: Number,
      default: 0
    },
    lastAuditDate: Date,
    auditFindings: [{
      date: Date,
      findings: String,
      severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
      }
    }]
  },
  // Archival
  archivalStatus: {
    type: String,
    enum: ['ACTIVE', 'PENDING_ARCHIVAL', 'ARCHIVED'],
    default: 'ACTIVE'
  },
  archivalDate: Date,
  retentionPeriod: {
    type: Number, // in years
    required: true
  },
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Audit Trail
  auditTrail: [{
    action: String,
    timestamp: Date,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes (removed duplicate unique indexes)
trialSchema.index({ title: 'text', description: 'text' });
trialSchema.index({ status: 1 });
trialSchema.index({ phase: 1 });
trialSchema.index({ therapeuticArea: 1 });
trialSchema.index({ sponsor: 1 });
trialSchema.index({ 'cro.name': 1 });
trialSchema.index({ 'countries.code': 1 });
trialSchema.index({ 'sites.siteId': 1 });
trialSchema.index({ regulatoryAuthority: 1 });
trialSchema.index({ archivalStatus: 1 });
trialSchema.index({ startDate: 1 });
trialSchema.index({ endDate: 1 });
trialSchema.index({ createdBy: 1 });

// Virtual populate
trialSchema.virtual('documents', {
  ref: 'Document',
  foreignField: 'study',
  localField: '_id'
});

// Pre-save middleware to validate dates
trialSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Static methods
trialSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

trialSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    startDate: { $gte: startDate },
    endDate: { $lte: endDate }
  });
};

trialSchema.statics.findByCountry = function(countryCode) {
  return this.find({ 'countries.code': countryCode });
};

trialSchema.statics.findBySite = function(siteId) {
  return this.find({ 'sites.siteId': siteId });
};

// Instance methods
trialSchema.methods.isActive = function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
};

trialSchema.methods.addTeamMember = async function(userId, role) {
  if (!this.studyTeam.some(member => member.user.toString() === userId.toString())) {
    this.studyTeam.push({
      user: userId,
      role,
      assignedAt: new Date()
    });
    await this.save();
  }
};

trialSchema.methods.removeTeamMember = async function(userId) {
  this.studyTeam = this.studyTeam.filter(member => 
    member.user.toString() !== userId.toString()
  );
  await this.save();
};

trialSchema.methods.addCountry = async function(countryCode, countryName) {
  if (!this.countries.some(country => country.code === countryCode)) {
    this.countries.push({
      code: countryCode,
      name: countryName,
      status: 'PLANNED'
    });
    await this.save();
  }
};

trialSchema.methods.addSite = async function(siteId, siteName, countryCode, investigatorId, coordinatorId) {
  if (!this.sites.some(site => site.siteId === siteId)) {
    this.sites.push({
      siteId,
      name: siteName,
      country: countryCode,
      status: 'PLANNED',
      investigator: investigatorId,
      coordinator: coordinatorId
    });
    await this.save();
  }
};

trialSchema.methods.addAuditFinding = async function(findings, severity) {
  this.qualityMetrics.auditFindings.push({
    date: new Date(),
    findings,
    severity
  });
  this.qualityMetrics.lastAuditDate = new Date();
  await this.save();
};

trialSchema.methods.updateDocumentCompleteness = async function() {
  const totalDocuments = this.documentIds.length;
  const completedDocuments = this.documentIds.filter(doc => 
    doc.status === 'APPROVED' && doc.completenessStatus === 'COMPLETE'
  ).length;
  
  this.qualityMetrics.documentCompleteness = 
    totalDocuments > 0 ? (completedDocuments / totalDocuments) * 100 : 0;
  
  await this.save();
};

trialSchema.methods.addAuditTrail = async function(action, userId, details, ipAddress) {
  this.auditTrail.push({
    action,
    timestamp: new Date(),
    user: userId,
    details,
    ipAddress
  });
  await this.save();
};

const Trial = mongoose.model('Trial', trialSchema);

module.exports = Trial;