import Relay from 'react-relay';
import fromGraphQL from 'react-relay/lib/fromGraphQL';

const QUERIES = {
  "build_header/build": Relay.QL`
    query BuildsShowBuild($build: ID!) {
      build(slug: $build) {
        id
        createdBy {
          __typename
          ...on UnregisteredUser {
            name
            email
            avatar {
              url
            }
          }
          ...on User {
            id
            name
            email
            avatar {
              url
            }
          }
        }
      }
    }
  `,
  "build_header/viewer": Relay.QL`
    query BuildsShowViewer {
      viewer {
        emails(first: 50) {
          edges {
            node {
              id
              address
              verified
            }
          }
        }
      }
    }
  `,
  "organization_show/organization": Relay.QL`
    query PipelinesList($organization: ID!, $team: TeamSelector) {
      organization(slug: $organization) {
        id
        slug
        name
        teams(first: 500) {
          edges {
            node {
              id
              name
              slug
              description
            }
            cursor
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
        pipelines(first: 500, team: $team, order: NAME) {
          edges {
            node {
              id
              name
              slug
              description
              url
              favorite
              defaultBranch
              permissions {
                pipelineFavorite {
                  allowed
                }
              }
              metrics(first: 6) {
                edges {
                  node {
                    label
                    value
                    url
                    id
                  }
                  cursor
                }
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                }
              }
              builds(first: 1, branch: "%default", state: [ RUNNING, CANCELING, PASSED, FAILED, CANCELED, BLOCKED ]) {
                edges {
                  node {
                    id
                    message
                    url
                    commit
                    state
                    startedAt
                    finishedAt
                    canceledAt
                    scheduledAt
                    createdBy {
                      __typename
                      ... on User {
                        id
                        name
                        avatar {
                          url
                        }
                      }
                      ...on UnregisteredUser {
                        name
                        avatar {
                          url
                        }
                      }
                    }
                  }
                  cursor
                }
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    }
  `,
  "navigation/organization": Relay.QL`
    query NavigationOrganization($organization: ID!) {
      organization(slug: $organization) {
        name
        id
        slug
        agents {
          count
        }
        permissions {
          organizationUpdate {
            allowed
          }
          organizationInvitationCreate {
            allowed
          }
          notificationServiceUpdate {
            allowed
          }
          organizationBillingUpdate {
            allowed
          }
          teamAdmin {
            allowed
          }
        }
      }
    }
  `,
  "navigation/viewer": Relay.QL`
    query NavigationViewer {
      viewer {
        id
        user {
          name,
          avatar {
            url
          }
          id
        }
      }
    }
  `,
  "settings_navigation/organization": Relay.QL`
    query GetOrganization($organization: ID!) {
      organization(slug: $organization) {
        id
        name
        slug
        members {
          count
        }
        invitations(state: PENDING) {
          count
        }
        teams {
          count
        }
        permissions {
          organizationUpdate {
            allowed
          }
          organizationInvitationCreate {
            allowed
          }
          notificationServiceUpdate {
            allowed
          }
          organizationBillingUpdate {
            allowed
          }
          teamAdmin {
            allowed
          }
          teamCreate {
            allowed
          }
        }
      }
    }
  `,
  "agents/index": Relay.QL`
    query AgentIndex($organization: ID!) {
      organization(slug: $organization) {
        id
        permissions {
          agentTokenView {
            allowed
          }
        }
        agentTokens(first:50, revoked:false) {
          edges {
            node {
              id
              description
              token
            }
            cursor
          },
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    }
  `,
  "agents/show": Relay.QL`
    query($slug: ID!) {
      agent(slug: $slug) {
        id
        name
        organization {
          id
          name
          slug
        }
        connectedAt
        connectionState
        disconnectedAt
        hostname
        id
        ipAddress
        job {
          __typename
          ... on JobTypeCommand {
            id
            label
            command
            url
            build {
              number
              pipeline {
                name
                id
              }
              id
            }
          }
        }
        lostAt
        metaData
        operatingSystem {
          name
        }
        permissions {
          agentStop {
            allowed
            code
            message
          }
        }
        pid
        pingedAt
        stoppedAt
        stoppedBy {
          name
          id
        }
        userAgent
        uuid
        version
      }
    }
  `,
  "teams/index": Relay.QL`
    query($organization: ID!) {
      organization(slug: $organization) {
        id
        name
        slug
        permissions {
          teamCreate {
            allowed
          }
        }
      }
    }
  `,
  "pipeline/header": Relay.QL`
    query($pipeline: ID!) {
      pipeline(slug: $pipeline) {
        id
        name
        description
        url
        slug
        defaultBranch
        repository {
          url
          provider {
            url
          }
        }
        organization {
          slug
          id
        }
        builds {
          count
        }
        scheduledBuilds: builds(state: SCHEDULED) {
          count
        }
        runningBuilds: builds(state: RUNNING) {
          count
        }
        permissions {
          pipelineUpdate {
            allowed
            code
            message
          }
          buildCreate {
            allowed
            code
            message
          }
        }
      }
    }
  `,
  "pipeline/settings": Relay.QL`
    query($pipeline: ID!) {
      pipeline(slug: $pipeline) {
        id
        repository {
          provider {
            name
            __typename
          }
        }
        teams {
          count
        }
        schedules {
          count
        }
      }
    }
  `
};

class RelayPreloader {
  preload(id, payload, variables) {
    // Get the concrete query
    const concrete = QUERIES[id];
    if (!concrete) {
      throw new Error(`No concrete query defined for \`${id}\``);
    }

    // Create a Relay-readable GraphQL query with the variables loaded in
    const query = fromGraphQL.Query(concrete);
    query.__variables__ = variables;

    // Load it with the payload into the Relay store
    Relay.Store.getStoreData().handleQueryPayload(query, payload);
  }
}

export default new RelayPreloader();
