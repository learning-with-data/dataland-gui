import React from "react";

import PropTypes from "prop-types";

const RuntimeContext = React.createContext(null);

const connectToRuntime = function (
  WrappedComponent,
  config = { data: false, visualization: false }
) {
  class RuntimeWrapper extends React.Component {
    static contextType = RuntimeContext;

    constructor(props, context) {
      super(props, context);

      this.config = config;
      this.runtime = this.context;

      this.state = {
        data: this.config.data ? this.runtime.getCurrentData() : undefined,
        columns: this.config.data
          ? this.runtime.getCurrentColumns()
          : undefined,
        visualizationSpec: this.config.visualization
          ? this.runtime.getVisualizationSpec()
          : undefined,
      };

      this.setProjectData = this.setProjectData.bind(this);
      this.addProjectDataColumn = this.addProjectDataColumn.bind(this);
      this.startInterpreter = this.startInterpreter.bind(this);
      this.stopInterpreter = this.stopInterpreter.bind(this);

      this._handleDataUpdate = this._handleDataUpdate.bind(this);
      this._handleVisualizationUpdate = this._handleVisualizationUpdate.bind(
        this
      );

      // The following two are here rather than in componentDidMount() as there
      // seems to be race-condition(?) during initialization + project load where
      // the project data is set before these two handlers get registered, and
      // as a result, the next save sends a blank data field to the server.
      // This seems to be due to children's componentDidMount() running first:
      // https://github.com/facebook/react/issues/5737
      this.runtime.on("data-updated", this._handleDataUpdate);
      this.runtime.on("visualization-updated", this._handleVisualizationUpdate);
    }

    _handleDataUpdate(d) {
      if (this.config.data) {
        this.setState({
          data: d,
          columns: this.runtime.getCurrentColumns(),
        });
      }
    }

    _handleVisualizationUpdate(v) {
      if (this.config.visualization) {
        this.setState({ visualizationSpec: v });
      }
    }

    componentWillUnmount() {
      this.runtime.removeListener("data-updated", this._handleDataUpdate);
      this.runtime.removeListener(
        "visualization-updated",
        this._handleVisualizationUpdate
      );
    }

    setProjectData(...args) {
      this.runtime.setDataTable(...args);
    }

    addProjectDataColumn(...args) {
      this.runtime.addColumn(...args);
    }

    async startInterpreter(...args) {
      return this.runtime.startInterpreter(...args);
    }

    stopInterpreter(...args) {
      this.runtime.stopInterpreter(...args);
    }

    render() {
      const { forwardedRef, ...rest } = this.props;

      return (
        <WrappedComponent
          projectData={this.state.data}
          projectDataColumns={this.state.columns}
          projectVisualizationSpec={this.state.visualizationSpec}
          setProjectData={this.setProjectData}
          addProjectDataColumn={this.addProjectDataColumn}
          startInterpreter={this.startInterpreter}
          stopInterpreter={this.stopInterpreter}
          ref={forwardedRef}
          {...rest}
        />
      );
    }
  }

  RuntimeWrapper.propTypes = {
    forwardedRef: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({ current: PropTypes.instanceOf(React.Component) }),
    ]),
  };

  return React.forwardRef((props, ref) => {
    return <RuntimeWrapper {...props} forwardedRef={ref} />;
  });
};

export { connectToRuntime, RuntimeContext };
