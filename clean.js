// setup-mongodb.js - Script para configurar MongoDB automáticamente

require('dotenv').config();
const mongoose = require('mongoose');
const { execSync } = require('child_process');
const fs = require('fs');

async function checkMongoDBConnection() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/openblind_nosql';
  
  try {
    console.log('🍃 Probando conexión a MongoDB...');
    console.log(`📍 URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // 5 segundos timeout
    });
    
    console.log('✅ ¡Conexión exitosa a MongoDB!');
    
    // Probar operaciones básicas
    const testCollection = mongoose.connection.db.collection('connection_test');
    
    const testDoc = await testCollection.insertOne({
      message: 'OpenBlind connection test',
      timestamp: new Date()
    });
    
    console.log('✅ Operación de escritura exitosa');
    
    await testCollection.deleteOne({ _id: testDoc.insertedId });
    console.log('✅ Operación de eliminación exitosa');
    
    await mongoose.disconnect();
    console.log('✅ Desconexión exitosa');
    
    return true;
    
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
}

async function checkLocalMongoDB() {
  try {
    console.log('🔍 Verificando si MongoDB está instalado localmente...');
    
    // Intentar ejecutar mongod --version
    const version = execSync('mongod --version', { encoding: 'utf8', timeout: 5000 });
    console.log('✅ MongoDB encontrado:', version.split('\n')[0]);
    return true;
    
  } catch (error) {
    console.log('❌ MongoDB no encontrado localmente');
    return false;
  }
}

async function checkDockerMongoDB() {
  try {
    console.log('🐳 Verificando Docker...');
    
    const dockerVersion = execSync('docker --version', { encoding: 'utf8', timeout: 5000 });
    console.log('✅ Docker encontrado:', dockerVersion.trim());
    
    // Verificar si ya hay un contenedor de MongoDB corriendo
    try {
      const containers = execSync('docker ps --format "table {{.Names}}\\t{{.Status}}"', { encoding: 'utf8' });
      
      if (containers.includes('mongodb') || containers.includes('mongo')) {
        console.log('✅ Contenedor MongoDB encontrado corriendo');
        return true;
      } else {
        console.log('ℹ️  No hay contenedores MongoDB corriendo');
        return false;
      }
    } catch (error) {
      console.log('ℹ️  No se pudieron listar contenedores Docker');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Docker no encontrado');
    return false;
  }
}

async function setupDockerMongoDB() {
  try {
    console.log('\n🐳 Configurando MongoDB con Docker...');
    
    // Detener cualquier contenedor MongoDB existente
    try {
      execSync('docker stop mongodb-openblind', { stdio: 'ignore' });
      execSync('docker rm mongodb-openblind', { stdio: 'ignore' });
    } catch (e) {
      // Ignorar errores si no existe
    }
    
    // Crear y ejecutar contenedor MongoDB
    const dockerCommand = `docker run -d \\
      --name mongodb-openblind \\
      -p 27017:27017 \\
      -e MONGO_INITDB_DATABASE=openblind_nosql \\
      mongo:7.0`;
    
    console.log('🚀 Iniciando contenedor MongoDB...');
    execSync(dockerCommand, { stdio: 'inherit' });
    
    // Esperar a que MongoDB esté listo
    console.log('⏳ Esperando a que MongoDB esté listo...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return true;
    
  } catch (error) {
    console.error('❌ Error configurando Docker MongoDB:', error.message);
    return false;
  }
}

function updateEnvFile() {
  const envPath = '.env';
  const mongoUri = 'MONGODB_URI=mongodb://localhost:27017/openblind_nosql';
  
  try {
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Verificar si MONGODB_URI ya existe
    if (envContent.includes('MONGODB_URI=')) {
      console.log('ℹ️  MONGODB_URI ya está configurado en .env');
      return;
    }
    
    // Agregar MONGODB_URI al final del archivo
    envContent += `\n# MongoDB Configuration\n${mongoUri}\n`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ MONGODB_URI agregado a .env');
    
  } catch (error) {
    console.error('❌ Error actualizando .env:', error.message);
  }
}

async function enableMongoDBInCode() {
  try {
    const databaseServicePath = './src/services/databaseService.js';
    
    if (!fs.existsSync(databaseServicePath)) {
      console.log('❌ Archivo databaseService.js no encontrado');
      return;
    }
    
    let content = fs.readFileSync(databaseServicePath, 'utf8');
    
    // Verificar si MongoDB ya está habilitado
    if (content.includes('await this.initializeMongoDB();') && 
        !content.includes('// await this.initializeMongoDB();')) {
      console.log('✅ MongoDB ya está habilitado en el código');
      return;
    }
    
    // Habilitar MongoDB
    content = content.replace(
      /\/\/ Skip MongoDB for now.*\n.*logService\.info\('MongoDB initialization skipped.*\n/,
      'await this.initializeMongoDB();\n'
    );
    
    fs.writeFileSync(databaseServicePath, content);
    console.log('✅ MongoDB habilitado en databaseService.js');
    
  } catch (error) {
    console.error('❌ Error habilitando MongoDB en código:', error.message);
  }
}

async function main() {
  console.log('🔧 Configuración automática de MongoDB para OpenBlind\n');
  
  // 1. Verificar conexión actual
  const isConnected = await checkMongoDBConnection();
  
  if (isConnected) {
    console.log('\n🎉 ¡MongoDB ya está funcionando correctamente!');
    return;
  }
  
  console.log('\n🔧 MongoDB no está disponible. Intentando configurar...\n');
  
  // 2. Verificar opciones disponibles
  const hasLocalMongo = await checkLocalMongoDB();
  const hasDocker = await checkDockerMongoDB();
  
  // 3. Intentar configurar
  if (hasDocker) {
    console.log('\n🐳 Usando Docker para configurar MongoDB...');
    const dockerSuccess = await setupDockerMongoDB();
    
    if (dockerSuccess) {
      updateEnvFile();
      enableMongoDBInCode();
      
      console.log('\n⏳ Verificando conexión final...');
      setTimeout(async () => {
        const finalCheck = await checkMongoDBConnection();
        if (finalCheck) {
          console.log('\n🎉 ¡MongoDB configurado exitosamente con Docker!');
          console.log('\n📋 Próximos pasos:');
          console.log('   1. Reinicia tu servidor: npm start');
          console.log('   2. Prueba el registro de usuario');
          console.log('   3. Los warnings de MongoDB deberían desaparecer');
        } else {
          console.log('\n❌ La configuración no fue exitosa. Revisa los logs arriba.');
        }
      }, 5000);
      
    } else {
      showManualInstructions();
    }
    
  } else if (hasLocalMongo) {
    console.log('\n🍃 MongoDB está instalado pero no corriendo.');
    console.log('💡 Intenta iniciarlo manualmente:');
    console.log('   Windows: services.msc → MongoDB → Start');
    console.log('   macOS: brew services start mongodb-community');
    console.log('   Linux: sudo systemctl start mongod');
    
  } else {
    showManualInstructions();
  }
}

function showManualInstructions() {
  console.log('\n📖 Instrucciones de configuración manual:');
  console.log('');
  console.log('🐳 OPCIÓN 1 - Docker (Recomendado):');
  console.log('   docker run -d --name mongodb-openblind -p 27017:27017 mongo:7.0');
  console.log('');
  console.log('🍃 OPCIÓN 2 - MongoDB Community:');
  console.log('   1. Descargar: https://www.mongodb.com/try/download/community');
  console.log('   2. Instalar y ejecutar como servicio');
  console.log('');
  console.log('☁️  OPCIÓN 3 - MongoDB Atlas (Cloud):');
  console.log('   1. Crear cuenta: https://www.mongodb.com/atlas');
  console.log('   2. Crear cluster gratuito M0');
  console.log('   3. Obtener connection string');
  console.log('');
  console.log('📝 Después de la instalación:');
  console.log('   1. Actualizar MONGODB_URI en .env');
  console.log('   2. Reiniciar el servidor');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkMongoDBConnection,
  setupDockerMongoDB,
  updateEnvFile,
  enableMongoDBInCode
};