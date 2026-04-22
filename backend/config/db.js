const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error(
        '❌ MONGODB_URI environment variable is not set.\n' +
        '   Please add it to your .env file:\n' +
        '   MONGODB_URI=mongodb+srv://harimurali10a_db_user:harimurali@cluster0.zcnipjp.mongodb.net/?appName=Cluster0'
      );
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    });

    console.log(`\n✅ MongoDB Connected Successfully!`);
    console.log(`   📍 Host: ${conn.connection.host}`);
    console.log(`   💾 Database: ${conn.connection.name}\n`);
    
    return conn;
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Error: ${error.message}\n`);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('⏳ Retrying connection in 5 seconds...\n');
      setTimeout(connectDB, 5000);
    } else {
      console.error('🛑 Production environment requires valid MongoDB connection.');
      process.exit(1);
    }
  }
};

module.exports = connectDB;