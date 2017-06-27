'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /* eslint-disable no-console */


require('isomorphic-fetch');

var _oboe = require('oboe');

var _oboe2 = _interopRequireDefault(_oboe);

var _abortable = require('./abortable');

var _is_ie = require('./is_ie');

var _is_ie2 = _interopRequireDefault(_is_ie);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var mode = process.env.NODE_ENV || 'development';
var emoji = {
  up: '\u2B06',
  down: '\u2B07',
  error: '\u274C'
};

var isIE = !!(0, _is_ie2.default)();

function _mergeOptions(defaults, options) {
  return _extends({}, defaults, options, {
    headers: _extends({}, defaults.headers, options.headers || {})
  });
}

function _handleResponse(response) {
  if (response.status > 400) {
    // if we get an error, try to jsonify and return response. if there is
    // an error when doing jsonification, just send text.
    return response.json().then(function (json) {
      return { response: json, code: response.status };
    }).catch(function () {
      return { response: response.statusText, code: response.status };
    }).then(function (results) {
      if (mode === 'development') {
        console.error(emoji.error + ' Fetch error: ' + response.url, results);
      }
      return results;
    }).then(function (results) {
      return Promise.reject(results);
    });
  } else {
    var contentType = response.headers.get('content-type');
    var results = contentType && ~contentType.indexOf('application/json') ? response.json() : response.text();
    return results.then(function (res) {
      if (mode === 'development') {
        console.log(emoji.down + ' Fetch response: ' + response.url, res);
      }
      return res;
    }).catch(function (err) {
      if (mode === 'development') {
        console.error(emoji.error + ' Fetch error: ' + response.url, err);
      }
    });
  }
}

function _fetch(defaults) {
  return function (url) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var mergedOptions = _mergeOptions(defaults, options);
    if (isIE) {
      url += (~url.indexOf('?') ? '&cache=' : '?') + String(Date.now());
    }
    if (mode === 'development') {
      console.log(emoji.up + ' Fetch request: ' + url, mergedOptions);
    }
    return fetch(url, mergedOptions).then(function (response) {
      return _handleResponse(response);
    });
  };
}

function init() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _ref$cookie = _ref.cookie,
      cookie = _ref$cookie === undefined ? null : _ref$cookie,
      _ref$makeUrl = _ref.makeUrl,
      makeUrl = _ref$makeUrl === undefined ? function (url) {
    return url;
  } : _ref$makeUrl,
      otherOptions = _objectWithoutProperties(_ref, ['cookie', 'makeUrl']);

  var defaults = _extends({ headers: {} }, otherOptions);

  if (cookie) Object.assign(defaults.headers, { Cookie: cookie });

  var jsonHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  var goFetch = _fetch(defaults);

  var Api = {
    delete: function _delete(url) {
      return goFetch(makeUrl(url), { method: 'DELETE' });
    },
    download: function download(url) {
      window.location = makeUrl(url);
    },
    _get: function _get(url) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return goFetch(url, options);
    },
    get: function get(url) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return goFetch(makeUrl(url), options);
    },
    _post: function _post(url, params) {
      var body = JSON.stringify(params);
      return goFetch(url, { method: 'POST', body: body, headers: jsonHeaders });
    },
    post: function post(url, params) {
      return Api._post(makeUrl(url), params);
    },
    put: function put(url, params) {
      var body = JSON.stringify(params);
      return goFetch(makeUrl(url), { method: 'PUT', body: body, headers: jsonHeaders });
    },
    stream: function stream(_ref2) {
      var url = _ref2.url,
          _ref2$method = _ref2.method,
          method = _ref2$method === undefined ? 'GET' : _ref2$method,
          _ref2$body = _ref2.body,
          body = _ref2$body === undefined ? {} : _ref2$body,
          _ref2$abortable = _ref2.abortable,
          abortable = _ref2$abortable === undefined ? false : _ref2$abortable;

      var options = { url: makeUrl(url), body: body, method: method, withCredentials: true };
      var request = abortable ? (0, _abortable.abortableStream)(options) : (0, _oboe2.default)(options);
      // for isomorphic app, we need to return a promise and don't care so much
      // about streaming, which is for user's benefit anyway
      return typeof window !== 'undefined' ? request : new Promise(function (resolve, reject) {
        request.on('done', resolve).on('fail', reject);
      });
    },
    upload: function upload(url, files) {
      var formData = new FormData();

      for (var i = 0, len = files.length; i < len; i++) {
        formData.append('file', files[i]);
      }
      return goFetch(makeUrl(url), {
        method: 'POST',
        body: formData
      });
    }
  };

  return Api;
}

exports.default = init;