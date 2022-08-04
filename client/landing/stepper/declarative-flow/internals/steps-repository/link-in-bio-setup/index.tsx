/* eslint-disable wpcalypso/jsx-classname-namespace */

import { Gridicon, Button } from '@automattic/components';
import { useI18n } from '@wordpress/react-i18n';
import FormattedHeader from 'calypso/components/formatted-header';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormLabel from 'calypso/components/forms/form-label';
import LinkInBioInput from './link-in-bio-input';
import type { Step } from '../../types';

import './styles.scss';

const LinkInBioSetup: Step = function LinkInBioSetup( { navigation } ) {
	const { __ } = useI18n();

	const onChangeSiteName = () => {
		return;
	};

	const onChangeSiteDescription = () => {
		return;
	};

	const handleSubmit = ( e: React.FormEvent< HTMLFormElement > ) => {
		// Temporary preventDefault.
		e.preventDefault();
		navigation.submit?.();
	};

	return (
		<div className="step-container">
			<form onSubmit={ handleSubmit }>
				<FormattedHeader align={ 'center' } headerText={ __( 'Set up Link in Bio' ) } />
				<div className="link-in-bio-setup__form">
					{ /* replace this component, align with newsletter flow */ }
					<div className="link-in-bio-setup-form-icon__container">
						<div className="link-in-bio-setup-form__icon">
							<Gridicon key={ 'blue' } icon="share-ios" size={ 18 } />
						</div>
						<label>{ __( 'Upload site icon' ) }</label>
					</div>
					{ /*  */ }
					<LinkInBioInput
						inputId={ 'link-in-bio-input-name' }
						inputValue={ 'Invalid input data' } // get value from store?
						isValid={ false }
						onChange={ onChangeSiteName }
						errorMessage={ __( 'Your site needs a name so your subscribers can identify you.' ) }
						label={ __( 'Site name' ) }
					/>
					<LinkInBioInput
						inputId={ 'link-in-bio-input-description' }
						inputValue={ 'Valid input data' } // get value from store?
						isValid={ true }
						onChange={ onChangeSiteDescription }
						errorMessage={ __(
							'Your site needs a brief description so your subscribers can identify you.'
						) }
						label={ __( 'Brief description' ) }
					/>
					<FormFieldset disabled={ false }>
						<FormLabel htmlFor="inputId">{ __( 'Publication address' ) }</FormLabel>
						<div className="link-in-bio-setup-form-field__container">
							<div className="link-in-bio-setup-form-container__address">
								{ 'www.test.link ' }
								<button className="link-in-bio-setup-form__button">{ __( 'Change' ) }</button>
							</div>
						</div>
					</FormFieldset>
				</div>
				<Button className="link-in-bio-setup-form__submit" primary type="submit">
					{ __( 'Continue' ) }
				</Button>
			</form>
		</div>
	);
};

export default LinkInBioSetup;