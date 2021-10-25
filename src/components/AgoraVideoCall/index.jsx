import React from "react";
import AgoraRTC from "agora-rtc-sdk";

import "./canvas.css";
import "../../assets/fonts/css/icons.css";
let client = AgoraRTC.createClient({ mode: "live", codec: "h264" });

const USER_ID = Math.floor(Math.random() * 1000000001);
const AGORA_APP_ID = "643bc1df4df64e10a4f6fc6d460e1ab0";


class AgoraCanvas extends React.Component {
  
  localStream = AgoraRTC.createStream({
    streamID: USER_ID,
    audio: true,
    video: true,
    screen: false
  });

  state = {
    remoteStreams: []
  };

  componentDidMount() {
    this.initLocalStream();
    this.initClient();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.channel !== this.props.channel && this.props.channel !== "") {
      this.joinChannel();
    }
  }

  initLocalStream = () => {
    let me = this;
    me.localStream.init(
      function() {
        console.log("getUserMedia successfully");
        me.localStream.play("agora_local");
      },
      function(err) {
        console.log(" failed", err);
      }
    );
  };

  initClient = () => {
    client.init(
      AGORA_APP_ID,
      function() {
        console.log("initialized");
      },
      function(err) {
        console.log("failed", err);
      }
    );
    this.subscribeToClient();
  };

  subscribeToClient = () => {
    let me = this;
    client.on("stream-added", me.onStreamAdded);
    client.on("stream-subscribed", me.onRemoteClientAdded);

    client.on("stream-removed", me.onStreamRemoved);

    client.on("peer-leave", me.onPeerLeave);
  };

  onStreamAdded = evt => {
    let me = this;
    let stream = evt.stream;
    console.log("New stream: " + stream.getId());
    me.setState(
      {
        remoteStreams: {
          ...me.state.remoteStream,
          [stream.getId()]: stream
        }
      },
      () => {
        
        client.subscribe(stream, function(err) {
          console.log("Subscribe failed", err);
        });
      }
    );
  };

  joinChannel = () => {
    let me = this;
    client.join(
      null,
      me.props.channel,
      USER_ID,
      function(uid) {
        console.log("User " + uid + " join successful");
        client.publish(me.localStream, function(err) {
          console.log("error: " + err);
        });

        client.on("stream-published", function(evt) {
          console.log("Publish successful");
        });
      },
      function(err) {
        console.log("Joining failed", err);
      }
    );
  };

  onRemoteClientAdded = evt => {
    let me = this;
    let remoteStream = evt.stream;
    me.state.remoteStreams[remoteStream.getId()].play(
      "agora_remote " + remoteStream.getId()
    );
  };

  onStreamRemoved = evt => {
    let me = this;
    let stream = evt.stream;
    if (stream) {
      let streamId = stream.getId();
      let { remoteStreams } = me.state;

      stream.stop();
      delete remoteStreams[streamId];

      me.setState({ remoteStreams });

      console.log("Removed " + stream.getId());
    }
  };

  onPeerLeave = evt => {
    let me = this;
    let stream = evt.stream;
    if (stream) {
      let streamId = stream.getId();
      let { remoteStreams } = me.state;

      stream.stop();
      delete remoteStreams[streamId];

      me.setState({ remoteStreams });

      console.log(evt.uid + " leaved");
    }
  };

  render() {
    return (
      <div>
        <div id="agora_local" style={{ width: "1200px", height: "450px" }} />
        {Object.keys(this.state.remoteStreams).map(key => {
          let stream = this.state.remoteStreams[key];
          let streamId = stream.getId();
          return (
            <div
              key={streamId}
              id={`agora_remote ${streamId}`}
              style={{ width: "400px", height: "400px" }}
            />
          );
        })}
      </div>
    );
  }
}



export default AgoraCanvas;
