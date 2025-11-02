// Script para ver usuarios en la consola
// Ejecutar con: node scripts/viewUsers.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config({ path: '.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error al conectar:', error);
    process.exit(1);
  }
};

const viewUsers = async () => {
  try {
    await connectDB();

    const users = await User.find().select('-password').sort({ createdAt: -1 });

    console.log('\n📊 USUARIOS EN LA BASE DE DATOS:');
    console.log(`Total: ${users.length}\n`);

    if (users.length === 0) {
      console.log('No hay usuarios registrados aún.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Teléfono: ${user.phone || 'No especificado'}`);
        console.log(`   Dirección: ${user.address || 'No especificada'}`);
        console.log(`   Creado: ${user.createdAt}`);
        console.log(`   ID: ${user._id}`);
        console.log('');
      });
    }

    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

viewUsers();

