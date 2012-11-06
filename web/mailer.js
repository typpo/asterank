var sendmail = require('sendmail')();

/**
 * Sends mail to me!
 */
function mail(text) {
  sendmail({
      from: 'feedback@asterank.com',
      to: 'typppo@gmail.com',
      subject: 'Asterank Feedback',
      content: text,
    }, function(err, reply) {
      //console.log(err && err.stack);
      //console.dir(reply);
  });
}

module.exports = {
  mail: mail,
}
