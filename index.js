'use strict';

const functions = require('@google-cloud/functions-framework');
const bunyan = require('bunyan');
const { DataTypes } = require('sequelize');
const Sequelize = require('sequelize');
const FormData = require('form-data');
const Mailgun = require('mailgun.js');

const log = bunyan.createLogger({
  name: 'webapp',
  streams: [{ path: '/var/log/webapp.log' }],
  serializers: bunyan.stdSerializers,
});

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY || 'key-yourkeyhere' });

functions.cloudEvent('subscribeMessage', async (cloudEvent) => {
  try {
    log.info('Received cloud event:', cloudEvent.data.message.data);
    console.log('Received cloud event:', cloudEvent.data.message.data);

    const base64data = cloudEvent.data.message.data;
    log.info('Base64 data:', base64data);
    console.log('Received cloud event:', cloudEvent.data.message.data);

    const jsonData = Buffer.from(base64data, 'base64').toString();
    log.info('JSON data:', jsonData);

    const messageData = JSON.parse(jsonData);
    const { first_name, last_name, verification_URL, email, token } = messageData;
    log.info("MESSAGE_DATA", messageData);
    log.info("first_name", first_name);
    log.info("verification_URL", verification_URL);
    log.info("email", email);

    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const VerificationToken = sequelize.define('VerificationToken', {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      verification_URL: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sent_date: {
        type: DataTypes.DATE,
        allowNull: false,
      }
    });

    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully');

    await sequelize.authenticate();
    log.info('Database connection successful');

    const now = new Date();
    const timestampString = now.toISOString();
    await VerificationToken.create({
      email,
      verification_URL: verification_URL,
      token : token,
      sent_date: timestampString,
    });

    log.info('Record added to the database');

    const emailData = {
      from: 'Preksha Yadav <mailgun@preksha.me>',
      to: [email], // Use the email ID passed in the message data
      subject: 'Welcome to Preksha!',
      text: `Welcome to Preksha! Thank you for joining Preksha. We are excited to have you on board! ${verification_URL}`
    };

    const msg = await mg.messages.create('preksha.me', emailData);
    console.log('Email sent:', msg);
  } catch (err) {
    console.error('Error handling cloud event:', err);
    log.error('Error handling cloud event:', err);
  }
});


//#############################################

// // index.js
// 'use strict';

// const functions = require('@google-cloud/functions-framework');
// const bunyan = require('bunyan');
// const { DataTypes } = require('sequelize');
// const Sequelize = require('sequelize');

// const log = bunyan.createLogger({
//   name: 'webapp',
//   streams: [{ path: '/var/log/webapp.log' }],
//   serializers: bunyan.stdSerializers,
// });

// functions.cloudEvent('subscribeMessage', async (cloudEvent) => {
//   try {
//     log.info('Received cloud event:', cloudEvent.data.message.data);
//     const base64data = cloudEvent.data.message.data;
//     log.info('Base64 data:', base64data);
//     console.log('Received cloud event:', cloudEvent.data.message.data);

//     const jsonData = Buffer.from(base64data, 'base64').toString();
//     log.info('JSON data:', jsonData);

//     const messageData = JSON.parse(jsonData);
//     const { first_name, last_name, verification_URL, email } = messageData;
//     log.info("MESSAGE_DATA", messageData);
//     log.info("first_name", first_name);
//     log.info("verification_URL", verification_URL);
//     log.info("email", email);

//     const sequelize = new Sequelize({
//       dialect: 'postgres',
//       host: process.env.DB_HOST,
//       port: process.env.DB_PORT,
//       username: process.env.DB_USERNAME,
//       password: process.env.DB_PASSWORD,
//       database: process.env.DB_NAME,
//     });

//     const VerificationToken = sequelize.define('VerificationToken', {
//       email: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       verification_token: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       sent_date: {
//         type: DataTypes.DATE,
//         allowNull: false,
//       },
//     });

//     try {
//       await sequelize.sync({ force: false });
//       console.log('Database synchronized successfully');
//     } catch (error) {
//       console.error('Error synchronizing database:', error);
//       throw error;
//     }

//     await sequelize.authenticate();
//     log.info('Database connection successful');

//     const now = new Date();
//     const timestampString = now.toISOString();
//     await VerificationToken.create({
//       email,
//       verification_token: verification_URL,
//       sent_date: timestampString,
//     });

//     log.info('Record added to the database');
//   } catch (err) {
//     log.error('Error handling cloud event:', err);
//   }
// });
