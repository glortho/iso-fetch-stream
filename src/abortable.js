import oboe from 'oboe';

let lastRequest = null;
let lastUrl = null;

const isBrowser = typeof window !== 'undefined';

function trackAbortable( url, request ) {
  if ( isBrowser && lastRequest ) lastRequest.abort();
  lastRequest = request;
  lastUrl = url;
}

function clearAbortable( thisRequest ) {
  if ( isBrowser && lastRequest === thisRequest ) {
    lastRequest = null;
    lastUrl = null;
  }
}

function preventRequest( url ) {
  return isBrowser && lastUrl
    ? url === lastUrl
    : false;
}

export function abortableStream( options ) {
  const reqId = options.url + JSON.stringify( options.body || {} );
  if ( preventRequest( reqId ) ) {
    return Promise.reject( 'abort' );
  } else {
    const request = oboe( options )
      .on( 'done', function() {
        clearAbortable( this );
      } );
    trackAbortable( reqId, request );
    return Promise.resolve( request );
  }
}

