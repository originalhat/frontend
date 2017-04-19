import React from 'react';
import Relay from 'react-relay';

import Panel from '../../shared/Panel';
import AutocompleteField from '../../shared/AutocompleteField';
import permissions from '../../../lib/permissions';

import FlashesStore from '../../../stores/FlashesStore';

import TeamMemberCreateMutation from '../../../mutations/TeamMemberCreate';
import TeamMemberUpdateMutation from '../../../mutations/TeamMemberUpdate';
import TeamMemberDeleteMutation from '../../../mutations/TeamMemberDelete';

import Row from './row';
import User from './user';

const PAGE_SIZE = 10;

class Members extends React.Component {
  static displayName = "Team.Members";

  static propTypes = {
    team: React.PropTypes.shape({
      slug: React.PropTypes.string.isRequired,
      members: React.PropTypes.shape({
        edges: React.PropTypes.array.isRequired
      }).isRequired,
      organization: React.PropTypes.object.isRequired,
      permissions: React.PropTypes.shape({
        teamMemberCreate: React.PropTypes.object.isRequired
      }).isRequired
    }).isRequired,
    relay: React.PropTypes.object.isRequired,
    className: React.PropTypes.string
  };

  state = {
    removing: null
  };

  componentDidMount() {
    this.props.relay.setVariables({
      isMounted: true,
      teamSelector: `!${this.props.team.slug}`
    });
  }

  render() {
    return (
      <Panel className={this.props.className}>
        <Panel.Header>Members</Panel.Header>
        {this.renderAutoComplete()}
        {this.renderMembers()}
      </Panel>
    );
  }

  renderMembers() {
    if (this.props.team.members.edges.length > 0) {
      return this.props.team.members.edges.map((edge) => {
        return (
          <Row key={edge.node.id} teamMember={edge.node} onRemoveClick={this.handleTeamMemberRemove} onRoleChange={this.handleRoleChange} relay={this.props.relay} />
        );
      });
    } else {
      return <Panel.Section className="dark-gray">There are no users assigned to this team</Panel.Section>;
    }
  }

  renderAutoComplete() {
    return permissions(this.props.team.permissions).check(
      {
        allowed: "teamMemberCreate",
        render: () => (
          <Panel.Section>
            <AutocompleteField
              onSearch={this.handleUserSearch}
              onSelect={this.handleUserSelect}
              items={this.renderAutoCompleteSuggstions(this.props.relay.variables.memberAddSearch)}
              placeholder="Add user…"
              ref={(_autoCompletor) => this._autoCompletor = _autoCompletor}
            />
          </Panel.Section>
        )
      }
    );
  }

  renderAutoCompleteSuggstions(memberAddSearch) {
    if (!this.props.team.organization.members) {
      return [];
    }

    // Either render the sugggestions, or show a "not found" error
    if (this.props.team.organization.members.edges.length > 0) {
      return this.props.team.organization.members.edges.map(({ node }) => {
        return [<User key={node.id} user={node} />, node];
      });
    } else if (memberAddSearch !== "") {
      return [
        <AutocompleteField.ErrorMessage key="error">
          Could not find a user with name <em>{memberAddSearch}</em>
        </AutocompleteField.ErrorMessage>
      ];
    } else {
      return [];
    }
  }

  handleUserSearch = (memberAddSearch) => {
    this.props.relay.setVariables({ memberAddSearch });
  };

  handleUserSelect = (user) => {
    this._autoCompletor.clear();
    this.props.relay.setVariables({ memberAddSearch: "" });
    this._autoCompletor.focus();

    Relay.Store.commitUpdate(new TeamMemberCreateMutation({
      team: this.props.team,
      user: user
    }), { onFailure: (transaction) => FlashesStore.flash(FlashesStore.ERROR, transaction.getError()) });
  };

  handleTeamMemberRemove = (teamMember, callback) => {
    Relay.Store.commitUpdate(new TeamMemberDeleteMutation({
      teamMember: teamMember
    }), { onSuccess: () => callback(null), onFailure: (transaction) => callback(transaction.getError()) });
  };

  handleRoleChange = (teamMember, role, callback) => {
    Relay.Store.commitUpdate(new TeamMemberUpdateMutation({
      teamMember: teamMember,
      role: role
    }), { onSuccess: () => callback(null), onFailure: (transaction) => callback(transaction.getError()) });
  };
}

export default Relay.createContainer(Members, {
  initialVariables: {
    isMounted: false,
    memberAddSearch: '',
    teamSelector: null,
    pageSize: PAGE_SIZE
  },

  fragments: {
    team: () => Relay.QL`
      fragment on Team {
        slug
        ${TeamMemberCreateMutation.getFragment('team')}

        organization {
          members(search: $memberAddSearch, first: 10, order: RELEVANCE, team: $teamSelector) @include (if: $isMounted) {
            edges {
              node {
                user {
                  id
                  name
                  email
                  avatar {
                    url
                  }
                  ${TeamMemberCreateMutation.getFragment('user')}
                }
              }
            }
          }
        }

        permissions {
          teamMemberCreate {
            allowed
          }
        }

        members(first: $pageSize, order: NAME) {
          edges {
            node {
              id
              role
              user {
                id
                name
                email
                avatar {
                  url
                }
              }
              permissions {
                teamMemberUpdate {
                  allowed
                }
                teamMemberDelete {
                  allowed
                }
              }
              ${TeamMemberDeleteMutation.getFragment('teamMember')}
              ${TeamMemberUpdateMutation.getFragment('teamMember')}
            }
          }
        }
      }
    `
  }
});
