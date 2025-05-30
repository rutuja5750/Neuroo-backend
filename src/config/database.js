require('dotenv').config();

const config = {
  development: {
    uri: process.env.MONGODB_URI_DEV || 'mongodb://localhost:27017/neurodoc_dev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true
    }
  },
  test: {
    uri: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/neurodoc_test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false
    }
  },
  production: {
    uri: process.env.MONGODB_URI_PROD,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const currentConfig = config[env];

if (!currentConfig.uri) {
  throw new Error(`MongoDB URI is not defined for environment: ${env}`);
}

module.exports = currentConfig; 