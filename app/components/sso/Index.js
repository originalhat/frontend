import React from 'react';
import Relay from 'react-relay';
import DocumentTitle from 'react-document-title';

import Panel from '../shared/Panel';
import PageHeader from '../shared/PageHeader';
import Spinner from '../shared/Spinner';

import permissions from '../../lib/permissions';

class SSOIndex extends React.PureComponent {
  static propTypes = {
    organization: React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      slug: React.PropTypes.string.isRequired,
      permissions: React.PropTypes.object.isRequired
    }).isRequired,
    relay: React.PropTypes.object.isRequired
  };

  componentDidMount() {
    this.props.relay.forceFetch({ isMounted: true });
  }

  render() {
    return (
      <DocumentTitle title={`SSO · ${this.props.organization.name}`}>
        <div>
          <PageHeader>
            <PageHeader.Title>
              Single Sign On
            </PageHeader.Title>
            <PageHeader.Description>
              SSO enables you to automatically onboard users without having to manually invite them via email. SSO is available via SAML (Okta, Bitium, etc) or Google Apps (GSuite).
            </PageHeader.Description>
          </PageHeader>

          {this.renderDetailsPanel()}
        </div>
      </DocumentTitle>
    );
  }

  renderDetailsPanel() {
    if(!this.props.organization.sso) {
      return (
        <Panel>
          <Panel.Section className="center">
            <Spinner />
          </Panel.Section>
        </Panel>
      );
    }

    if(this.props.organization.sso.isEnabled) {
      return (
        <Panel>
          <Panel.Section>
            <p><span className="green">✔</span> SSO has been enabled for your organization using <strong>{this.props.organization.sso.provider.name}</strong>. Users will be automatically added to your organization when they successfully authenticate using {this.props.organization.sso.provider.name} and their <strong>{this.props.organization.sso.provider.emailDomain}</strong> email address.</p>
            <p>If you need to update your SSO settings or have it disabled, please get in touch with Buildkite Support.</p>
          </Panel.Section>
        </Panel>
      )
    } else {
      return (
        <Panel>
          <Panel.Section>
            <p>SSO has not yet been enabled for your organization.</p>
            <p>If you want to find out more about SSO or have it enabled, please get in touch with Buildkite Support.</p>
          </Panel.Section>
        </Panel>
      )
    }
  }
}

export default Relay.createContainer(SSOIndex, {
  initialVariables: {
    isMounted: false
  },

  fragments: {
    organization: () => Relay.QL`
      fragment on Organization {
        name
        slug
        sso @include(if: $isMounted) {
          isEnabled
          provider {
            name
            ...on SSOProviderGoogle {
              emailDomain
            }
            ...on SSOProviderSAML {
              emailDomain
            }
          }
        }
        permissions {
          organizationUpdate {
            allowed
          }
        }
      }
    `
  }
});
