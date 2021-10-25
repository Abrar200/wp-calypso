import { Title, SubTitle } from '@automattic/onboarding';
import { useI18n } from '@wordpress/react-i18n';
import type * as React from 'react';
import './style.scss';

/* eslint-disable wpcalypso/jsx-classname-namespace */

interface Props {
	goToStep: ( name: string ) => void;
}

const ScanningStep: React.FunctionComponent< Props > = ( { goToStep } ) => {
	const { __ } = useI18n();

	// temp peace of code
	setTimeout( () => {
		goToStep( 'list' );
	}, 3000 );

	return (
		<div className="import-layout__center">
			<div className="import__header scanning__header">
				<div className="import__heading import__heading-center">
					<Title>{ __( 'Scanning your site' ) }</Title>
					<SubTitle>{ __( "We'll be done in no time." ) }</SubTitle>
				</div>
			</div>

			<div className={ 'scanning__content' }>
				<div style={ { textAlign: 'center' } }>Spinner placeholder</div>
			</div>
		</div>
	);
};

export default ScanningStep;
