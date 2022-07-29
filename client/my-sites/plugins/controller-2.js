import { __ } from '@wordpress/i18n';
import { includes } from 'lodash';
import { createElement } from 'react';
import { BASE_STALE_TIME } from 'calypso/data/marketplace/constants';
import {
	getFetchWPCOMFeaturedPlugins,
	getFetchWPCOMPlugins,
	getFetchWPCOMPlugin,
} from 'calypso/data/marketplace/use-wpcom-plugins-query';
import {
	getFetchWPORGPlugins,
	getFetchWPORGInfinitePlugins,
} from 'calypso/data/marketplace/use-wporg-plugin-query';
import { normalizePluginData } from 'calypso/lib/plugins/utils';
import { getSiteFragment } from 'calypso/lib/route';
import { fetchPluginInformation } from 'calypso/lib/wporg';
import { PLUGINS_WPORG_PLUGIN_RECEIVE } from 'calypso/state/action-types';
import { appendBreadcrumb } from 'calypso/state/breadcrumb/actions';
import { requestProductsList } from 'calypso/state/products-list/actions';
import { createQueryClient } from 'calypso/state/query-client';
import { getSelectedSite } from 'calypso/state/ui/selectors';
import { ALLOWED_CATEGORIES, getCategories } from './categories/use-categories';
import PlanSetup from './jetpack-plugins-setup';
import PluginDetails from './plugin-details';
import PluginEligibility from './plugin-eligibility';
import PluginsBrowser from './plugins-browser';

function renderSinglePlugin( context, siteUrl ) {
	const pluginSlug = decodeURIComponent( context.params.plugin );

	// Render single plugin component
	context.primary = createElement( PluginDetails, {
		path: context.path,
		pluginSlug,
		siteUrl,
	} );
}
// The plugin browser can be rendered by the `/plugins/:plugin/:site_id?` route. In that case,
// the `:plugin` param is actually the side ID or category.
function getCategoryForPluginsBrowser( context ) {
	if ( context.params.plugin && includes( ALLOWED_CATEGORIES, context.params.plugin ) ) {
		return context.params.plugin;
	}

	return context.params.category;
}

function getProps( context ) {
	const searchTerm = context.query.s;
	const category = getCategoryForPluginsBrowser( context );

	if ( searchTerm && ! context.serverSideRender ) {
		context.serverSideRender = true;
	}

	const props = {
		path: context.path,
		category,
		searchTerm,
		search: searchTerm,
		locale: context.lang,
		tag: category || '',
	};
	return props;
}

function renderPluginsBrowser( context ) {
	const props = {
		...getProps( context ),
	};

	context.primary = <PluginsBrowser { ...props } />;
}

export function renderPluginWarnings( context, next ) {
	const state = context.store.getState();
	const site = getSelectedSite( state );
	const pluginSlug = decodeURIComponent( context.params.plugin );

	context.primary = createElement( PluginEligibility, {
		siteSlug: site.slug,
		pluginSlug,
	} );
	next();
}

export function renderProvisionPlugins( context, next ) {
	context.primary = createElement( PlanSetup, {
		forSpecificPlugin: context.query.only || false,
	} );
	next();
}

function plugin( context, next ) {
	const siteUrl = getSiteFragment( context.path );
	renderSinglePlugin( context, siteUrl );
	next();
}

// The plugin browser can be rendered by the `/plugins/:plugin/:site_id?` route.
// If the "plugin" part of the route is actually a site,
// render the plugin browser for that site. Otherwise render plugin.
export function browsePluginsOrPlugin( context, next ) {
	const siteUrl = getSiteFragment( context.path );
	if (
		( context.params.plugin && siteUrl && context.params.plugin === siteUrl.toString() ) ||
		context.query?.s
	) {
		browsePlugins( context, next );
		return;
	}

	plugin( context, next );
}

export function browsePlugins( context, next ) {
	renderPluginsBrowser( context );
	next();
}

function prefetchPluginsData( queryClient, fetchParams, infinite ) {
	const queryType = infinite ? 'fetchInfiniteQuery' : 'fetchQuery';

	return queryClient[ queryType ]( ...fetchParams, {
		enabled: true,
		staleTime: BASE_STALE_TIME,
		refetchOnMount: false,
	} ).catch( () => {} );
}

export async function fetchPlugin( context, next ) {
	if ( ! context.isServerSide ) {
		return next();
	}

	const queryClient = await createQueryClient();
	const store = context.store;

	const pluginSlug = context.params?.plugin;
	await Promise.all( [
		prefetchPluginsData( queryClient, getFetchWPCOMPlugin( pluginSlug ) ),
		requestProductsList( { type: 'all', presist: true } )( store.dispatch ),
		// fetchPluginData( pluginSlug )( store.dispatch, store.getState ),
		fetchPluginInformation( pluginSlug, context.lang ).then(
			( data ) => {
				const fullPlugin = normalizePluginData( { detailsFetched: Date.now() }, data );
				store.dispatch( {
					type: PLUGINS_WPORG_PLUGIN_RECEIVE,
					pluginSlug,
					data: fullPlugin,
				} );
				store.dispatch(
					appendBreadcrumb( {
						label: __( 'Plugins' ),
						href: `/plugins`,
						id: 'plugins',
						helpBubble: __( 'Add new functionality and integrations to your site with plugins.' ),
					} )
				);
				store.dispatch(
					appendBreadcrumb( {
						label: fullPlugin.name,
						href: `/plugins/${ pluginSlug }`,
						id: `plugin-${ pluginSlug }`,
					} )
				);
			},
			() => {}
		),
	] );

	context.queryClient = queryClient;
	next();
}

export async function fetchPlugins( context, next ) {
	if ( ! context.isServerSide ) {
		return next();
	}

	const options = {
		...getProps( context ),
	};
	const queryClient = await createQueryClient();
	const store = context.store;

	await Promise.all( [
		prefetchPluginsData(
			queryClient,
			getFetchWPCOMPlugins( true, 'all', options.search, options.tag )
		),
		options.search
			? prefetchPluginsData( queryClient, getFetchWPORGInfinitePlugins( options ), true )
			: Promise.resolve(),
		prefetchPluginsData( queryClient, getFetchWPORGPlugins( { ...options, category: 'popular' } ) ),
		prefetchPluginsData( queryClient, getFetchWPCOMFeaturedPlugins() ),
	] );

	store.dispatch(
		appendBreadcrumb( {
			label: __( 'Plugins' ),
			href: `/plugins`,
			id: 'plugins',
			helpBubble: __( 'Add new functionality and integrations to your site with plugins.' ),
		} )
	);

	if ( options.search ) {
		store.dispatch(
			appendBreadcrumb( {
				label: __( 'Search Results' ),
				href: `/plugins?s=${ options.search }`,
				id: 'plugins-search',
			} )
		);
	}

	context.queryClient = queryClient;
	next();
}

export async function fetchCategoryPlugins( context, next ) {
	if ( ! context.isServerSide ) {
		return next();
	}

	const options = {
		...getProps( context ),
	};
	const categories = getCategories();
	const categoryTags = categories[ options.category || '' ]?.tags || [ options.category ];
	options.tag = categoryTags.join( ',' );

	const queryClient = await createQueryClient();
	const store = context.store;

	await Promise.all( [
		prefetchPluginsData(
			queryClient,
			getFetchWPCOMPlugins( true, 'all', options.search, options.tag )
		),
		options.search
			? prefetchPluginsData( queryClient, getFetchWPORGInfinitePlugins( options ), true )
			: Promise.resolve(),
		prefetchPluginsData( queryClient, getFetchWPORGInfinitePlugins( options ), true ),
	] );

	store.dispatch(
		appendBreadcrumb( {
			label: __( 'Plugins' ),
			href: `/plugins`,
			id: 'plugins',
			helpBubble: __( 'Add new functionality and integrations to your site with plugins.' ),
		} )
	);

	if ( options.category ) {
		store.dispatch(
			appendBreadcrumb( {
				label: options.category,
				href: `/plugins/browse/${ options.category }`,
				id: 'category',
			} )
		);
	}

	context.queryClient = queryClient;

	next();
}
