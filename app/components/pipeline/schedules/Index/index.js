import React from 'react';
import Relay from 'react-relay';
import DocumentTitle from 'react-document-title';

import Panel from '../../../shared/Panel';
import Button from '../../../shared/Button';
import permissions from '../../../../lib/permissions';
import Emojify from '../../../shared/Emojify';

import Row from "./row";

class Index extends React.Component {
  static propTypes = {
    pipeline: React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      schedules: React.PropTypes.shape({
        edges: React.PropTypes.arrayOf(
          React.PropTypes.shape({
            node: React.PropTypes.shape({
              id: React.PropTypes.string.isRequired
            }).isRequired
          }).isRequired
        )
      }).isRequired,
      permissions: React.PropTypes.shape({
        pipelineScheduleCreate: React.PropTypes.shape({
          allowed: React.PropTypes.bool.isRequired
        }).isRequired
      }).isRequired
    }).isRequired,
    params: React.PropTypes.shape({
      organization: React.PropTypes.string.isRequired,
      pipeline: React.PropTypes.string.isRequired
    }).isRequired
  };

  render() {
    return (
      <DocumentTitle title={`Schedules · ${this.props.pipeline.name}`}>
        <Panel>
          <Panel.Header>Schedules</Panel.Header>

          <Panel.IntroWithButton>
            <span>Schedules are a way for you to automatically create builds at a pre-defined time.</span>
            {this.renderNewScheduleButton()}
          </Panel.IntroWithButton>
          {this.renderScheduleRows()}
        </Panel>
      </DocumentTitle>
    );
  }

  renderNewScheduleButton() {
    return permissions(this.props.pipeline.permissions).check(
      {
        allowed: "pipelineScheduleCreate",
        render: () => <Button link={`/${this.props.params.organization}/${this.props.params.pipeline}/settings/schedules/new`} theme={"default"} outline={true}>Create a Schedule</Button>
      }
    );
  }

  renderScheduleRows() {
    if (this.props.pipeline.schedules.edges.length > 0) {
      return this.props.pipeline.schedules.edges.map((edge) => {
        return (
          <Row key={edge.node.id} pipelineSchedule={edge.node} />
        );
      });
    } else {
      return (
        <Panel.Row>
          <div className="dark-gray py2 center"><Emojify text="This pipeline doesn't have any schedules yet :eyes:" /></div>
        </Panel.Row>
      );
    }
  }
}

export default Relay.createContainer(Index, {
  fragments: {
    pipeline: () => Relay.QL`
      fragment on Pipeline {
        name
        schedules(first: 100) {
          edges {
            node {
              id
              ${Row.getFragment("pipelineSchedule")}
            }
          }
        }
        permissions {
          pipelineScheduleCreate {
            allowed
            code
            message
          }
        }
      }
    `
  }
});
