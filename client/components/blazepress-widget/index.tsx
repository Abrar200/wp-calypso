import { Dialog } from '@automattic/components';
import { __ } from '@wordpress/i18n';
import { TranslateOptionsText, useTranslate } from 'i18n-calypso';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { BlankCanvas } from 'calypso/components/blank-canvas';
import { LoadingEllipsis } from 'calypso/components/loading-ellipsis';
import WordPressLogo from 'calypso/components/wordpress-logo';
import { showDSP, usePromoteWidget, PromoteWidgetStatus } from 'calypso/lib/promote-post';
import './style.scss';
import { getSelectedSiteSlug } from 'calypso/state/ui/selectors';

export type BlazePressPromotionProps = {
	isVisible: boolean;
	siteId: string | number;
	postId: string | number;
	onClose: () => void;
};

type BlazePressTranslatable = ( original: string, extra?: TranslateOptionsText ) => string;

const BlazePressWidget = ( props: BlazePressPromotionProps ) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
	const { isVisible = false, onClose = () => {} } = props;
	const [ isLoading, setIsLoading ] = useState( true );
	const [ showCancelDialog, setShowCancelDialog ] = useState( false );
	const widgetContainer = useRef< HTMLDivElement >( null );
	const selectedSiteSlug = useSelector( getSelectedSiteSlug );
	const translate = useTranslate() as BlazePressTranslatable;

	// Scroll to top on initial load regardless of previous page position
	useEffect( () => {
		if ( isVisible ) {
			window.scrollTo( 0, 0 );
		}
	}, [ isVisible ] );

	useEffect( () => {
		isVisible &&
			( async () => {
				if ( props.siteId === null || props.postId === null ) {
					return;
				}

				await showDSP(
					selectedSiteSlug,
					props.siteId,
					props.postId,
					onClose,
					( original: string, options?: TranslateOptionsText ): string => {
						if ( options ) {
							// This is a special case where we re-use the translate in another application
							// that is mounted inside calypso
							// eslint-disable-next-line wpcalypso/i18n-no-variables
							return translate( original, options );
						}
						// eslint-disable-next-line wpcalypso/i18n-no-variables
						return translate( original );
					},
					widgetContainer.current
				);
				setIsLoading( false );
			} )();
	}, [ isVisible, props.postId, props.siteId, selectedSiteSlug ] );

	const cancelDialogButtons = [
		{
			action: 'cancel',
			isPrimary: true,
			label: __( 'No, let me finish' ),
		},
		{
			action: 'close',
			label: __( 'Yes, quit' ),
			onClick: async () => {
				setShowCancelDialog( false );
				onClose();
			},
		},
	];

	const promoteWidgetStatus = usePromoteWidget();
	if ( promoteWidgetStatus === PromoteWidgetStatus.DISABLED ) {
		return <></>;
	}

	return (
		<>
			{ isVisible && (
				<BlankCanvas className={ 'blazepress-widget' }>
					<div className={ 'blazepress-widget__header-bar' }>
						<WordPressLogo />
						<h2>Advertising</h2>
						<span
							role="button"
							className={ 'blazepress-widget__cancel' }
							onKeyDown={ () => setShowCancelDialog( true ) }
							tabIndex={ 0 }
							onClick={ () => setShowCancelDialog( true ) }
						>
							Cancel
						</span>
					</div>
					<div
						className={
							isLoading ? 'blazepress-widget__content loading' : 'blazepress-widget__content'
						}
					>
						<Dialog
							isVisible={ showCancelDialog }
							buttons={ cancelDialogButtons }
							onClose={ () => setShowCancelDialog( false ) }
						>
							<h1>{ __( 'Are you sure you want to quit?' ) }</h1>
							<p>{ __( 'All progress in this session will be lost.' ) }</p>
						</Dialog>
						{ isLoading && <LoadingEllipsis /> }
						<div className={ 'blazepress-widget__widget-container' } ref={ widgetContainer }></div>
					</div>
				</BlankCanvas>
			) }
		</>
	);
};

export default BlazePressWidget;
