/**
 * External dependencies
 */
import React from 'react';
import LinkedStateMixin from 'react-addons-linked-state-mixin';
import page from 'page';
import get from 'lodash/object/get';
import debugModule from 'debug';

/**
 * Internal dependencies
 */
import RoleSelect from 'my-sites/people/role-select';
import TokenField from 'components/token-field';
import FormButton from 'components/forms/form-button';
import FormFieldset from 'components/forms/form-fieldset';
import FormLabel from 'components/forms/form-label';
import FormSettingExplanation from 'components/forms/form-setting-explanation';
import { sendInvites } from 'lib/invites/actions';
import Card from 'components/card';
import Main from 'components/main';
import HeaderCake from 'components/header-cake';
import CountedTextarea from 'components/forms/counted-textarea';
import { createInviteValidation } from 'lib/invites/actions';
import InvitesCreateValidationStore from 'lib/invites/stores/invites-create-validation';

/**
 * Module variables
 */
const debug = debugModule( 'calypso:my-sites:people:invite' );

export default React.createClass( {
	displayName: 'InvitePeople',

	mixins: [ LinkedStateMixin ],

	componentDidMount() {
		InvitesCreateValidationStore.on( 'change', this.refreshValidation );
	},

	componentWillUnmount() {
		InvitesCreateValidationStore.off( 'change', this.refreshValidation );
	},

	componentWillReceiveProps() {
		this.setState( this.resetState() );
	},

	getInitialState() {
		return this.resetState();
	},

	resetState() {
		return ( {
			usernamesOrEmails: [],
			role: 'follower',
			message: '',
			response: false,
			sendingInvites: false,
			getTokenStatus: () => {}
		} );
	},

	onTokensChange( tokens ) {
		this.setState( { usernamesOrEmails: tokens } );
		const { role } = this.state;
		createInviteValidation( this.props.site.ID, tokens, role );
	},

	onMessageChange( event ) {
		this.setState( { message: event.target.value } );
	},

	refreshValidation() {
		const errors = InvitesCreateValidationStore.getErrors( this.props.site.ID ) || [];
		let success = InvitesCreateValidationStore.getSuccess( this.props.site.ID ) || [];
		if ( ! success.indexOf ) {
			success = Object.keys( success ).map( key => success[ key ] );
		}
		this.setState( {
			getTokenStatus: ( value ) => {
				if ( 'string' === typeof value ) {
					if ( errors[ value ] ) {
						return 'is-error';
					}
					if ( success.indexOf( value ) > -1 ) {
						return 'is-success';
					}
				}
			}
		} );
	},

	submitForm( event ) {
		event.preventDefault();
		debug( 'Submitting invite form. State: ' + JSON.stringify( this.state ) );

		this.setState( { sendingInvites: true } );
		sendInvites( this.props.site.ID, this.state.usernamesOrEmails, this.state.role, this.state.message, ( error, data ) => {
			this.setState( {
				sendingInvites: false,
				response: error ? error : data
			} );
		} );
	},

	goBack() {
		const siteSlug = get( this.props, 'site.slug' );
		const fallback = siteSlug ? ( '/people/team/' + siteSlug ) : '/people/team';

		// Go back to last route with /people/team/$site as the fallback
		page.back( fallback );
	},

	renderRoleExplanation() {
		return (
			<a target="_blank" href="http://en.support.wordpress.com/user-roles/">
				{ this.translate( 'Learn more about roles' ) }
			</a>
		);
	},

	renderResponse() {
		return (
			<Card>
				<label>Response:</label><br />
				<code>
					<pre>
						{ JSON.stringify( this.state.response ) }
					</pre>
				</code>
			</Card>
		);
	},

	render() {
		return (
			<Main>
				<HeaderCake isCompact onClick={ this.goBack }/>
				<Card>
					<form onSubmit={ this.submitForm } onChange={ this.validate }>
						<FormFieldset>
							<FormLabel>{ this.translate( 'Usernames or Emails' ) }</FormLabel>
							<TokenField
								isBorderless
								tokenStatus={ this.state.getTokenStatus }
								value={ this.state.usernamesOrEmails }
								onChange={ this.onTokensChange } />
							<FormSettingExplanation>
								{ this.translate(
									'Invite up to 10 email addresses and/or WordPress.com usernames. ' +
									'Those needing a username will be sent instructions on how to create one.'
								) }
							</FormSettingExplanation>
						</FormFieldset>

						<RoleSelect
							id="role"
							name="role"
							key="role"
							includeFollower
							siteId={ this.props.site.ID }
							valueLink={ this.linkState( 'role' ) }
							disabled={ this.state.sendingInvites }
							explanation={ this.renderRoleExplanation() }
							/>

						<FormFieldset>
							<FormLabel htmlFor="message">{ this.translate( 'Custom Message' ) }</FormLabel>
							<CountedTextarea
								name="message"
								id="message"
								showRemainingCharacters
								maxLength={ 500 }
								acceptableLength={ 500 }
								onChange={ this.onMessageChange }
								value={ this.state.message }
								disabled={ this.state.sendingInvites } />
							<FormSettingExplanation>
								{ this.translate(
									'(Optional) You can enter a custom message of up to 500 characters that will be included in the invitation to the user(s).'
								) }
							</FormSettingExplanation>
						</FormFieldset>

						<FormButton disabled={ this.state.sendingInvites }>
							{ this.translate(
								'Send Invitation',
								'Send Invitations', {
									count: this.state.usernamesOrEmails.length || 1,
									context: 'Button label'
								}
							) }
						</FormButton>
					</form>
				</Card>
				{ this.state.response && this.renderResponse() }
			</Main>
		);
	}
} );
