import config from '@automattic/calypso-config';
import { throttle } from 'lodash';
import analytics from '../lib/analytics';

// Compute the number of milliseconds between each call to recordTiming
const THROTTLE_MILLIS = 1000 / config( 'statsd_analytics_response_time_max_logs_per_second' );
const NS_TO_MS = 1e-6;

const logAnalyticsThrottled = throttle( function ( sectionName, duration, target ) {
	analytics.statsd.recordTiming( sectionName, 'response-time', duration );
	if ( target ) {
		analytics.statsd.recordCounting( sectionName, `target.${ target }` );
	}
}, THROTTLE_MILLIS );

/*
 * Middleware to log the response time of the node request for a
 * section, as well as which build target was served.
 * Only logs if the request context contains a `sectionName` attribute.
 */
export function logSectionResponse( req, res, next ) {
	const startRenderTime = process.hrtime.bigint();

	res.on( 'close', () => {
		if ( ! req.context?.sectionName ) {
			return;
		}
		const { user, sectionName, target, usedSSSRHandler } = req.context;

		const statKey = `${ sectionName }.loggedin_${ !! user }.ssr_${ usedSSSRHandler }`;

		const responseTime = Number(
			( Number( process.hrtime.bigint() - startRenderTime ) * NS_TO_MS ).toFixed( 3 )
		);

		logAnalyticsThrottled( statKey, responseTime, target );
	} );

	next();
}
