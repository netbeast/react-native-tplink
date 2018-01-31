'use strict';

const {Platform} = require('react-native');
const {NetworkInfo} = require('react-native-network-info');

// #Encryption
// 4 byte big-endian length header
// Followed by the payload where each byte is XOR'd with the previous encrypted byte

module.exports.encrypt = function (input, firstKey) {
  if (typeof firstKey === 'undefined') firstKey = 0xAB;
  var buf = new Buffer(input.length); // node v6: Buffer.alloc(input.length)

  var key = firstKey;
  for (var i = 0; i < input.length; i++) {
    buf[i] = input.charCodeAt(i) ^ key;
    key = buf[i];
  }
  return buf;
};

module.exports.encryptWithHeader = function (input, firstKey) {
  if (typeof firstKey === 'undefined') firstKey = 0xAB;
  var bufMsg = module.exports.encrypt(input, firstKey);
  var bufLength = new Buffer(4); // node v6: Buffer.alloc(4)
  bufLength.writeUInt32BE(input.length, 0);
  return Buffer.concat([bufLength, bufMsg], input.length + 4);
};

module.exports.decrypt = function (input, firstKey) {
  if (typeof firstKey === 'undefined') firstKey = 0x2B;
  var buf = new Buffer(input); // node v6: Buffer.from(input)
  var key = firstKey;
  var nextKey;
  for (var i = 0; i < buf.length; i++) {
    nextKey = buf[i];
    buf[i] = buf[i] ^ key;
    key = nextKey;
  }
  return buf;
};

const _fetchIP = Platform.OS === 'android'
  ? NetworkInfo.getIPV4Address
  : NetworkInfo.getIPAddress

function getIPAddress (callback) {
  _fetchIP((ip = '') => {
    callback(ip.split('%')[0])
  }) 
}

/**
 * Return all ip addresses of the machine
 * @return {Array} list containing ip address info
 */
module.exports.getHostIPs = function() {
  return new Promise((resolve, reject) => {
    let _ip;
    getIPAddress(ip => {
      resolve(_ip = ip);
    });

    setTimeout(() => {
      if (!_ip) reject(new Error('Could not retrieve own ip'));
    }, 1000);
  });
};
