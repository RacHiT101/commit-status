import React, { Component } from "react";
import "./ProjectDetails.css";
var axios = require("axios");

const params = {};

if (process.env.REACT_APP_GITHUB_TOKEN) {
  params.headers = {
    Authorization: process.env.REACT_APP_GITHUB_TOKEN,
  };
}

export default class ProjectDetails extends Component {
  state = {
    commitDetails: null,
    shouldRefresh: false,
  };
  // Use a class property for the Axios cancellation token
  cancelToken = axios.CancelToken.source();

  componentDidMount = () => {
    axios
      .get(`https://api.github.com/repos/${this.props.name}/commits`, params)
      .then((data) => {
        this.setState({ commitDetails: data.data });
      });
  };

  componentDidUpdate = (prevProps) => {
    if (
      (this.props.isRefreshEnabled &&
        this.state.shouldRefresh &&
        !this.interval) ||
      prevProps.refreshIntervalMillis !== this.props.refreshIntervalMillis
    ) {
      // Refresh is allowed globally, this component should refresh, but is not refreshing
      this.stopLocalAutoRefresh();
      this.startLocalAutoRefresh();
    } else if (!this.props.isRefreshEnabled && this.interval) {
      // Refresh is NOT allowed globally, but this project is refreshing
      this.stopLocalAutoRefresh();
    }
  };

  componentWillUnmount() {
    this.stopLocalAutoRefresh();

    // Cancel the Axios request when the component unmounts
    this.cancelToken.cancel("Component unmounted");
  }

  interval = null;

  stopLocalAutoRefresh = () => {
    clearInterval(this.interval);
    this.interval = null;
  };

  startLocalAutoRefresh = () => {
    this.interval = setInterval(() => {
      this.fetchCommitDetails();
    }, this.props.refreshIntervalMillis);
  };

  async fetchCommitDetails() {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${this.props.name}/commits`,
        { ...params, cancelToken: this.cancelToken.token } // Pass cancellation token
      );
      this.setState({ commitDetails: response.data });
    } catch (error) {
      if (axios.isCancel(error)) {
        // Request was canceled, ignore
      } else {
        // Handle other errors
        console.error(error);
      }
    }
  }

  toggleAutoRefresh(e) {
    e.stopPropagation(); // Prevent the click event from being fired on the parent elements as well
    if (!this.props.isRefreshEnabled) {
      // Should not be able to change state if refresh is disabeled globally
      return;
    }

    this.setState(
      (prevState) => {
        return {
          shouldRefresh: !prevState.shouldRefresh,
        };
      },
      () => {
        this.stopLocalAutoRefresh();

        if (this.state.shouldRefresh && this.props.isRefreshEnabled) {
          this.startLocalAutoRefresh();
        }
      }
    );
  }

  render() {
    const tableHeading = ["Commiter", "Message", "Date", "changes"];
    if (!this.state.commitDetails) {
      return (
        <div>
          <h5>Loading details ...</h5>
        </div>
      );
    }
    let toggleMessage = "Toggle Auto Refresh OFF";
    if (!this.props.isRefreshEnabled) {
      toggleMessage = "Refresh Disabeled Globally";
    } else if (!this.state.shouldRefresh) {
      toggleMessage = "Toggle Auto Refresh ON";
    }
    return (
      <div className="ProjectDetails">
        <button
          onClick={(e) => this.toggleAutoRefresh(e)}
          className="autoRefreshButton"
        >
          {toggleMessage}
        </button>
        Commit Details
        <div className="card">
          {tableHeading.map((item, index) => {
            return <div className="heading">{item}</div>;
          })}
        </div>
        <div>
          {this.state.commitDetails.map((details, index) => {
            return (
              <div className="card">
                <div className="name">{details.commit.committer.name}</div>
                <div className="message">{details.commit.message}</div>
                <div className="date">{details.commit.committer.date}</div>
                <div className="changes">
                  <a
                    href={details.html_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    See changes here
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
