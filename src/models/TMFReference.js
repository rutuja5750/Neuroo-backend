const mongoose = require('mongoose');

// Zone Schema - Based on DIA TMF Reference Model zones
const ZoneSchema = new mongoose.Schema({
  zoneNumber: { type: Number, required: true, unique: true },
  zoneName: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Zone = mongoose.model('Zone', ZoneSchema);

// Section Schema - Based on DIA TMF Reference Model sections
const SectionSchema = new mongoose.Schema({
  sectionNumber: { type: String, required: true },
  sectionName: { type: String, required: true },
  zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true },
  isRequired: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Create compound index for unique section numbers within a zone
SectionSchema.index({ sectionNumber: 1, zone: 1 }, { unique: true });
const Section = mongoose.model('Section', SectionSchema);

// Artifact Schema - Based on DIA TMF Reference Model artifacts
const ArtifactSchema = new mongoose.Schema({
  artifactNumber: { type: String, required: true },
  artifactName: { type: String, required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  ichCode: { type: String }, // ICH reference if applicable
  isRequired: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Create compound index for unique artifact numbers within a section
ArtifactSchema.index({ artifactNumber: 1, section: 1 }, { unique: true });
const Artifact = mongoose.model('Artifact', ArtifactSchema);

// SubArtifact Schema - For further categorization of artifacts
const SubArtifactSchema = new mongoose.Schema({
  subArtifactNumber: { type: String, required: true },
  subArtifactName: { type: String, required: true },
  artifact: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact', required: true },
  isRequired: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Create compound index for unique subArtifact numbers within an artifact
SubArtifactSchema.index({ subArtifactNumber: 1, artifact: 1 }, { unique: true });
const SubArtifact = mongoose.model('SubArtifact', SubArtifactSchema);

// Comment Schema - For document comments
const CommentSchema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Comment = mongoose.model('Comment', CommentSchema);

// Document Schema - For actual document instances in the TMF
const TMFDocumentSchema = new mongoose.Schema({
  documentTitle: { type: String, required: true },
  
  // References to classification hierarchy
  zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  artifact: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' },
  subArtifact: { type: mongoose.Schema.Types.ObjectId, ref: 'SubArtifact' },
  
  version: { type: String, required: true },
  documentDate: { type: Date, default: Date.now },
  expirationDate: { type: Date },
  status: { type: String, enum: ['Draft', 'In Review', 'Approved', 'Effective', 'Superseded', 'Withdrawn', 'Archived'], default: 'Draft' },
  
  fileLocation: { type: String }, 
  fileFormat: { type: String }, 
  fileSize: { type: Number },
  fileUrl: { type: String },
  fileName: { type: String },

  study: { type: String },
  site: { type: String },
  country: { type: String },
 
  accessLevel: { type: String, enum: ['Public', 'Restricted', 'Confidential'], default: 'Restricted' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  indication: { type: String },

  // Comments array with nested replies
  comments: [{
    content: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    replies: [{
      content: { type: String, required: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now }
    }]
  }]

}, { timestamps: true });

const TMFDocument = mongoose.model('TMFDocument', TMFDocumentSchema);

module.exports = {
  Zone,
  Section,
  Artifact,
  SubArtifact,
  TMFDocument,
  Comment
};