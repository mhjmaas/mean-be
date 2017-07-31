/**
 * Created by marcelmaas on 01/05/2017.
 */

const nodemailer = require('nodemailer');

export class MailUtil {
  private transporter;

  constructor() {
    let smtpConfig = {
      host: '<YOUR-SMTP-HOST>',
      port: 587,
      secure: false,
      auth: { user: '<YOUR-USER>', pass: '<YOUR-PASSWORD>' },
      tls: { ciphers: 'SSLv3' }
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
  }

  public mail(from, to, cc, bcc, subject, body, html, callback){
    let mailOptions = {
      from: from, // sender address
      replyTo: "apps@rubix.nl",
      to: to, // list of receivers
      cc: cc,
      bcc: bcc,
      subject: subject, // Subject line,
      body: body,
      html: html // html body
    };

    // send mail with defined transport object
    this.transporter.sendMail(mailOptions, function(error, info){
      console.log(error);
      if (error){
        callback("error");
      }
      callback("ok");
    });
  }

  public sendResetMail(user, resetUrl, callback){
    var body = "Deze email kan alleen als html bekeken worden";
    var msg = "Hallo " + user.name + ", <br/><br/>" +
      "Via de website is een wachtwoord reset aangevraagd. Als jij dit niet gedaan hebt kun je deze email negeren. <br/>" +
      "<br/>" +
      "Klik op de volgende link om je wachtwoord te resetten: <a href='"+resetUrl+"'>Wachtwoord herstellen</a><br/>" +
      "<br/>" +
      "Met vriendelijke groet, <br/>" +
      "<br/>" +
      "Rubix";

    this.mail('"Apps" <YOUR_NO_REPLY_MAIL>',user.email, null, null, 'Wachtwoord vergeten', body, msg, callback);
  }

  public sendResetDoneMail(user, callback) {
    var body = "Deze email kan alleen als html bekeken worden";
    var msg = "Hallo " + user.name + ", <br/><br/>" +
      "Je wachtwoord is gewijzigd, je kunt vanaf nu inloggen met je nieuwe wachtwoord. <br/>" +
      "<br/>" +
      "Met vriendelijke groet, <br/>" +
      "<br/>" +
      "Rubix";

    this.mail('"Apps" <YOUR_NO_REPLY_MAIL>',user.email, null, null, 'Wachtwoord hersteld', body, msg, callback);
  }
}

export default new MailUtil();