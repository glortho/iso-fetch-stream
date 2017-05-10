'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = detectIE;
/**
 * detect IE
 * returns version of IE or false, if browser is not Internet Explorer
 * source: http://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery
 */
function detectIE() {
  if (typeof window !== 'undefined') {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
      // IE 11 => return version number
      var rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
      // Edge (IE 12+) => return version number
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }
  }

  // other browser, or server-side
  return false;
}