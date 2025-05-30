const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  roleId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['ENTERPRISE', 'TRIAL', 'SITE', 'DOCUMENT'],
    required: true,
    default: 'ENTERPRISE'
  },
  permissions: {
    documents: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      approve: { type: Boolean, default: false },
      sign: { type: Boolean, default: false }
    },
    trials: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      manage: { type: Boolean, default: false }
    },
    sites: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      manage: { type: Boolean, default: false }
    },
    users: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      manage: { type: Boolean, default: false }
    },
    roles: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      manage: { type: Boolean, default: false }
    },
    audit: {
      read: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    settings: {
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false }
    }
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'DEPRECATED'],
    default: 'ACTIVE'
  },
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
RoleSchema.index({ roleId: 1 }, { unique: true });
RoleSchema.index({ name: 1 }, { unique: true });
RoleSchema.index({ level: 1 });
RoleSchema.index({ status: 1 });

// Virtual for checking if role has any permissions
RoleSchema.virtual('hasPermissions').get(function() {
  const permissionGroups = Object.values(this.permissions);
  return permissionGroups.some(group => 
    Object.values(group).some(permission => permission === true)
  );
});

// Pre-save middleware for system roles
RoleSchema.pre('save', function(next) {
  if (this.isSystem && this.isModified('permissions')) {
    throw new Error('Cannot modify permissions of system roles');
  }
  next();
});

const Role = mongoose.model('Role', RoleSchema);

module.exports = Role; 