import React from "react";
import Chat from "./chat";
import { Subscribe } from "unstated";
import g from "../../state";
export default class extends React.Component {
  render() {
    return (
      <>
        <Subscribe to={[g]}>
          {G => {
            return (
              <>
                <Chat
                  userInfo={G.state.userInfo}
                  host={G.state.host}
                  receiver={this.props.location.state.addr}
                  remark={this.props.location.state.remark}
                  username={this.props.location.state.username}

                />
              </>
            );
          }}
        </Subscribe>
      </>
    );
  }
}
