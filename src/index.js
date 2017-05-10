/* eslint-disable no-console */
/* @flow */
import 'isomorphic-fetch';
import oboe from 'oboe';

import { abortableStream } from './abortable';
import detectIE from './is_ie';

type tDefaults = {
  credentials: string,
  headers?: Object
};

type tGetOptions = {
  headers?: Object,
  [key: string]: void
};

const mode = process.env.NODE_ENV || 'development';
const emoji = {
  up: '\u2B06',
  down: '\u2B07',
  error: '\u274C'
};

const isIE = !!detectIE();

function _mergeOptions( defaults: tDefaults, options: Object ) {
  return {
    ...defaults,
    ...options,
    headers: { ...defaults.headers, ...( options.headers || {} ) }
  };
}

function _handleResponse( response ): void | Promise<string | Object> {
  if ( response.status > 400 ) {
    // if we get an error, try to jsonify and return response. if there is
    // an error when doing jsonification, just send text.
    return response.json()
      .then( json => ( { response: json, code: response.status }  ) )
      .catch( () => ( { response: response.statusText, code: response.status } ) )
      .then( results => {
        if ( mode !== 'production' ) {
          console.error( `${emoji.error} Fetch error: ${response.url}`, results );
        }
        return results;
      })
      .then( results => Promise.reject( results ) );
  } else {
    const contentType = response.headers.get( 'content-type' );
    const results = contentType && ~contentType.indexOf( 'application/json' )
      ? response.json()
      : response.text();
    return results
      .then( res => {
        if ( mode !== 'production' ) {
          console.log( `${emoji.down} Fetch response: ${response.url}`, res );
        }
        return res;
      })
      .catch( err => {
        if ( mode !== 'production' ) {
          console.error( `${emoji.error} Fetch error: ${response.url}`, err );
        }
      });
  }
}

function _fetch( defaults: tDefaults ): Function {
  return ( url, options = {} ): Promise<tResponse> => {
    const mergedOptions = _mergeOptions( defaults, options );
    if ( isIE ) {
      url += ( ~url.indexOf( '?' ) ? '&cache=' : '?' ) + String( Date.now() );
    }
    if ( mode !== 'production' ) { 
      console.log( `${emoji.up} Fetch request: ${url}`, mergedOptions );
    }
    return fetch( url, mergedOptions )
      .then( response => _handleResponse( response ) );
  };
}


function init( { cookie = null, makeUrl = url => url, ...otherOptions }: { cookie: ?string, makeUrl?: Function } = {} ) {

  const defaults = { headers: {}, ...otherOptions };

  if ( cookie ) Object.assign( defaults.headers, { Cookie: cookie } );

  const jsonHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  const goFetch = _fetch( defaults );

  const Api = {

    delete( url: string ): Promise<any> {
      return goFetch( makeUrl( url ), { method: 'DELETE' } );
    },

    download( url: string ): void {
      window.location = makeUrl( url );
    },

    _get( url: string, options: tGetOptions = {} ): Promise<any> {
      return goFetch( url, options );
    },

    get( url: string, options: tGetOptions = {} ): Promise<any> {
      return goFetch( makeUrl( url ), options );
    },

    _post( url: string, params: Object ): Promise<any> {
      const body = JSON.stringify( params );
      return goFetch( url, { method: 'POST', body, headers: jsonHeaders } );
    },

    post( url: string, params: Object ): Promise<any> {
      return Api._post( makeUrl( url ), params );
    },

    put( url: string, params: Object ): Promise<any> {
      const body = JSON.stringify( params );
      return goFetch( makeUrl( url ), { method: 'PUT', body, headers: jsonHeaders } );
    },

    stream( { url, method = 'GET', body = {}, abortable = false }: { url: string, method: string, body: Object, abortable?: boolean } ) {
      const options = { url: makeUrl( url ), body, method, withCredentials: true };
      const request = abortable ? abortableStream( options ) : oboe( options );
      // for isomorphic app, we need to return a promise and don't care so much
      // about streaming, which is for user's benefit anyway
      return typeof window !== 'undefined'
        ? request
        : new Promise( ( resolve, reject ) => {
          request.on( 'done', resolve ).on( 'fail', reject );
        } );
    },

    upload( url: string, files: Array<any> ): Promise<any> {
      const formData = new FormData();

      for ( let i = 0, len = files.length; i < len; i++ ) {
        formData.append( 'file', files[i] );
      }
      return goFetch( makeUrl( url ), {
        method: 'POST',
        body: formData
      } );
    }
  };

  return Api;
}

export default init;

