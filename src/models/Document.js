const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  // Core Identification
  documentId: {
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
    trim: true
  },
  // Classification
  documentType: {
    type: String,
    required: [true, 'Please specify document type'],
    enum: [
      'PROTOCOL',
      'INVESTIGATOR_BROCHURE',
      'INFORMED_CONSENT',
      'REGULATORY_DOCUMENT',
      'CLINICAL_REPORT',
      'SAFETY_REPORT',
      'QUALITY_DOCUMENT',
      'TRAINING_DOCUMENT',
      'OTHER'
    ]
  },
  tmfReference: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: Number,
    default: 1
  },
  // Study Association
  study: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trial',
    required: [true, 'Document must belong to a study']
  },
  country: {
    type: String,
    required: true
  },
  site: {
    type: String,
    required: true
  },
  // File Information
  fileUrl: {
    type: String,
    required: [true, 'Please provide file URL']
  },
  fileSize: {
    type: Number,
    required: [true, 'Please provide file size']
  },
  mimeType: {
    type: String,
    required: [true, 'Please provide MIME type']
  },
  pageCount: Number,
  language: {
    type: String,
    default: 'en'
  },
  // Temporal Metadata
  documentDate: {
    type: Date,
    required: true
  },
  creationDate: {
    type: Date,
    default: Date.now
  },
  modificationDate: {
    type: Date,
    default: Date.now
  },
  importDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: Date,
  expirationDate: Date,
  // Authorship and Approval
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contributors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  approvers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    signature: String,
    comments: String
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Status and Workflow
  status: {
    type: String,
    enum: [
      'DRAFT',
      'IN_REVIEW',
      'IN_QC',
      'PENDING_APPROVAL',
      'APPROVED',
      'REJECTED',
      'ARCHIVED',
      'EXPIRED'
    ],
    default: 'DRAFT'
  },
  qualityControlStatus: {
    type: String,
    enum: ['PENDING', 'PASSED', 'FAILED', 'NOT_REQUIRED'],
    default: 'PENDING'
  },
  completenessStatus: {
    type: String,
    enum: ['COMPLETE', 'INCOMPLETE', 'PENDING_REVIEW'],
    default: 'PENDING_REVIEW'
  },
  archivalStatus: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED', 'PENDING_ARCHIVAL'],
    default: 'ACTIVE'
  },
  // Technical Metadata
  securitySettings: {
    accessLevel: {
      type: String,
      enum: ['PUBLIC', 'RESTRICTED', 'CONFIDENTIAL'],
      default: 'RESTRICTED'
    },
    allowedRoles: [{
      type: String,
      enum: [
        'ETMF_ADMIN',
        'SYSTEM_ADMIN',
        'STUDY_MANAGER',
        'PROJECT_MANAGER',
        'QUALITY_ASSURANCE',
        'FILING_LEVEL_MANAGER',
        'FILING_LEVEL_UPLOADER',
        'FILING_LEVEL_VIEWER',
        'FILING_LEVEL_APPROVER',
        'FILING_LEVEL_UNBLINDED',
        'INVESTIGATOR',
        'STUDY_COORDINATOR',
        'GENERAL_SITE_USER',
        'MONITOR_CRA',
        'COUNTRY_MANAGER',
        'CRO_PERSONNEL',
        'REGULATORY_INSPECTOR',
        'REVIEWER',
        'UNBLINDED_TEAM_MEMBER'
      ]
    }]
  },
  // Relationship Metadata
  relatedDocuments: [{
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    relationshipType: {
      type: String,
      enum: ['PARENT', 'CHILD', 'PREDECESSOR', 'SUCCESSOR', 'REFERENCE']
    }
  }],
  // Regulatory and Compliance
  regulatoryAuthority: {
    type: String,
    enum: ['FDA', 'EMA', 'OTHER']
  },
  gcpComplianceStatus: {
    type: String,
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'PENDING_REVIEW'],
    default: 'PENDING_REVIEW'
  },
  retentionRequirements: {
    duration: Number, // in years
    startDate: Date,
    endDate: Date
  },
  // Version History
  previousVersions: [{
    version: Number,
    fileUrl: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changeSummary: String
  }],
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
  }],
  // Additional Metadata
  tags: [{
    type: String,
    trim: true
  }],
  customMetadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes (removed duplicate unique indexes)
documentSchema.index({ title: 'text', description: 'text' });
documentSchema.index({ study: 1 });
documentSchema.index({ country: 1 });
documentSchema.index({ site: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ author: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ 'securitySettings.accessLevel': 1 });
documentSchema.index({ documentDate: 1 });
documentSchema.index({ expirationDate: 1 });
documentSchema.index({ tags: 1 });

// Virtual populate
documentSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'document',
  localField: '_id'
});

// Pre-save middleware to validate file size
documentSchema.pre('save', function(next) {
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (this.fileSize > maxSize) {
    next(new Error('File size exceeds maximum limit of 50MB'));
  }
  next();
});

// Pre-save middleware to update modification date
documentSchema.pre('save', function(next) {
  this.modificationDate = new Date();
  next();
});

// Static methods
documentSchema.statics.findByType = function(type) {
  return this.find({ documentType: type });
};

documentSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

documentSchema.statics.findByTags = function(tags) {
  return this.find({ tags: { $in: tags } });
};

documentSchema.statics.findExpired = function() {
  return this.find({
    expirationDate: { $lte: new Date() },
    status: { $ne: 'ARCHIVED' }
  });
};

// Instance methods
documentSchema.methods.addVersion = async function(fileUrl, userId, changeSummary) {
  const currentVersion = this.version;
  this.previousVersions.push({
    version: currentVersion,
    fileUrl: this.fileUrl,
    uploadedAt: this.modificationDate,
    uploadedBy: this.uploadedBy,
    changeSummary
  });
  
  this.fileUrl = fileUrl;
  this.version = currentVersion + 1;
  this.uploadedBy = userId;
  this.modificationDate = new Date();
  
  await this.save();
};

documentSchema.methods.addAuditTrail = async function(action, userId, details, ipAddress) {
  this.auditTrail.push({
    action,
    timestamp: new Date(),
    user: userId,
    details,
    ipAddress
  });
  await this.save();
};

documentSchema.methods.addApprover = async function(userId, signature, comments) {
  this.approvers.push({
    user: userId,
    approvedAt: new Date(),
    signature,
    comments
  });
  await this.save();
};

documentSchema.methods.addTag = async function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    await this.save();
  }
};

documentSchema.methods.removeTag = async function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  await this.save();
};

documentSchema.methods.isExpired = function() {
  return this.expirationDate && this.expirationDate <= new Date();
};

documentSchema.methods.requiresArchival = function() {
  return this.retentionRequirements.endDate && 
         this.retentionRequirements.endDate <= new Date();
};

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;