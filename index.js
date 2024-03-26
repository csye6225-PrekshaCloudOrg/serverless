'use strict';

const functions = require('@google-cloud/functions-framework');
const FormData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY || 'key-yourkeyhere' });
const bunyan = require('bunyan');
const { PubSub } = require('@google-cloud/pubsub');

const pubSubClient = new PubSub();
const severityMap = {
  10: 'DEBUG',    // Bunyan's TRACE level
  20: 'DEBUG',    // Bunyan's DEBUG level
  30: 'INFO',     // Bunyan's INFO level
  40: 'WARNING',  // Bunyan's WARN level
  50: 'ERROR',    // Bunyan's ERROR level
  60: 'CRITICAL', // Bunyan's FATAL level
};

const log = bunyan.createLogger({
  name: 'webapp',
  streams: [
    { path: '/var/log/webapp.log' } // Log file path
  ],
  serializers: bunyan.stdSerializers,
  // Extend the log record using the serializers field
  levelFn: (level, levelName) => {
    return { 'severity': severityMap[level] };
  }
});

const originalWrite = log._emit;
log._emit = function (rec, noemit) {
  rec.severity = severityMap[rec.level];
  originalWrite.call(this, rec, noemit);
};

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
    // console.log('Parsed message data:', messageData);

    // const { first_name, verification_URL, email } = messageData;
    const first_name = messageData.first_name;
    const last_name = messageData.last_name;
    const verification_URL = messageData.verification_URL;
    const email = messageData.email;
    log.info("MESSAGE_DATA",messageData);
    log.info("first_name",first_name);
    log.info("verification_URL",verification_URL);
    log.info("email",email);

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
  }
});