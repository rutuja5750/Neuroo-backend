const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: [
      // Administrative Users
      'ETMF_ADMIN',
      'SYSTEM_ADMIN',
      // Sponsor Organization Users
      'STUDY_MANAGER',
      'PROJECT_MANAGER',
      'QUALITY_ASSURANCE',
      // Site-Level Users
      'FILING_LEVEL_MANAGER',
      'FILING_LEVEL_UPLOADER',
      'FILING_LEVEL_VIEWER',
      'FILING_LEVEL_APPROVER',
      'FILING_LEVEL_UNBLINDED',
      // Site Staff
      'INVESTIGATOR',
      'STUDY_COORDINATOR',
      'GENERAL_SITE_USER',
      // Monitoring and Oversight
      'MONITOR_CRA',
      'COUNTRY_MANAGER',
      // External Stakeholders
      'CRO_PERSONNEL',
      'REGULATORY_INSPECTOR',
      'REVIEWER',
      // Specialized Access
      'UNBLINDED_TEAM_MEMBER',
      'NON_USER_PROFILE'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL'],
    default: 'PENDING_APPROVAL'
  },
  organization: {
    type: String,
    required: true,
    trim: true
  },
  department: String,
  phoneNumber: String,
  lastLogin: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: Date,
  // Access Control
  permissions: [{
    type: String,
    enum: [
      'CREATE_STUDY',
      'MANAGE_STUDY',
      'VIEW_STUDY',
      'ARCHIVE_STUDY',
      'MANAGE_USERS',
      'MANAGE_PERMISSIONS',
      'UPLOAD_DOCUMENTS',
      'APPROVE_DOCUMENTS',
      'REVIEW_DOCUMENTS',
      'VIEW_AUDIT_TRAILS',
      'EXPORT_DATA',
      'MANAGE_WORKFLOWS',
      'OVERRIDE_WORKFLOWS',
      'ACCESS_UNBLINDED_DATA'
    ]
  }],
  assignedStudies: [{
    studyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trial'
    },
    accessLevel: {
      type: String,
      enum: ['STUDY', 'COUNTRY', 'SITE'],
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedCountries: [{
    countryCode: String,
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedSites: [{
    siteId: String,
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      }
    },
    documentView: {
      defaultView: {
        type: String,
        enum: ['GRID', 'LIST', 'HIERARCHY'],
        default: 'LIST'
      },
      showMetadata: {
        type: Boolean,
        default: true
      }
    }
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  auditTrail: [{
    action: String,
    timestamp: Date,
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimized queries (removed duplicate unique indexes)
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ organization: 1 });
UserSchema.index({ 'assignedStudies.studyId': 1 });
UserSchema.index({ 'assignedCountries.countryCode': 1 });
UserSchema.index({ 'assignedSites.siteId': 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has specific permission
UserSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Method to check if user has access to a study
UserSchema.methods.hasStudyAccess = function(studyId) {
  return this.assignedStudies.some(study => 
    study.studyId.toString() === studyId.toString()
  );
};

// Method to check if user has access to a country
UserSchema.methods.hasCountryAccess = function(countryCode) {
  return this.assignedCountries.some(country => 
    country.countryCode === countryCode
  );
};

// Method to check if user has access to a site
UserSchema.methods.hasSiteAccess = function(siteId) {
  return this.assignedSites.some(site => 
    site.siteId === siteId
  );
};

// Method to add audit trail entry
UserSchema.methods.addAuditTrail = async function(action, details, ipAddress, userAgent) {
  this.auditTrail.push({
    action,
    timestamp: new Date(),
    details,
    ipAddress,
    userAgent
  });
  await this.save();
};

const User = mongoose.model('User', UserSchema);

module.exports = User; 