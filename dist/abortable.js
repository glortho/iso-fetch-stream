'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.abortableStream = abortableStream;

var _oboe = require('oboe');

var _oboe2 = _interopRequireDefault(_oboe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lastRequest = null;
var lastUrl = null;

var isBrowser = typeof window !== 'undefined';

function trackAbortable(url, request) {
  if (isBrowser && lastRequest) lastRequest.abort();
  lastRequest = request;
  lastUrl = url;
}

function clearAbortable(thisRequest) {
  if (isBrowser && lastRequest === thisRequest) {
    lastRequest = null;
    lastUrl = null;
  }
}

function preventRequest(url) {
  return isBrowser && lastUrl ? url === lastUrl : false;
}

function abortableStream(options) {
  var reqId = options.url + JSON.stringify(options.body || {});
  if (preventRequest(reqId)) {
    return Promise.reject('abort');
  } else {
    var request = (0, _oboe2.default)(options).on('done', function () {
      clearAbortable(this);
    });
    trackAbortable(reqId, request);
    return request;
  }
}