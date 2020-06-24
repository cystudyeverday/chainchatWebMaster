/* eslint-disable default-case */
import React, { Component, } from "react";
import { Button, Input, List, Icon, Upload, message } from "antd";
import JsEncrypt from "jsencrypt";
import {
  MessageBox,
  Input as InputChat,
  Dropdown,
  SystemMessage,
  MessageList
} from "react-chat-elements";
import io from "socket.io-client";

import FaMenu from "react-icons/lib/md/more-vert";
import { navigate } from "@reach/router";
import { Generate_key, download } from "../../utils";
import g from "../../state";
import { SearchOutlined } from '@ant-design/icons';


import MicRecorder from 'mic-recorder-to-mp3';
import ReactAudioPlayer from 'react-audio-player';
import { saveAs } from 'file-saver'
import VideoPlayer from "./VideoPlayer";


const CryptoJS = require("crypto-js");


const Mp3Recorder = new MicRecorder({ bitRate: 128 });  //not hook



const convertFile = async file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
  });
};

export default class extends Component {
  constructor(props) {
    super(props);

    this.state = {
      show: true,
      messageList: [],
      cluster: 0,
      ws: null,
      receiverPublicKey: "",
      AESKEY: "",
      encryptedAESKEY: "",
      historyData: [],
      loadEarly: false,
      sending: false,
      //voice message
      recorderIsBlocked: true,
      playVoiceUrl: '',
      isRecording: false,

      //receiver is name
   


    };
  }

  loadHistory = async () => {
    this.setState({ loadEarly: true });
    const that = this;
    const data = this.state.historyData;
    const {
      username,
      token,
      privateKey,
      publicKey,
      addr,
      publicKeyAfid
    } = this.props.userInfo;
    const receiver = this.pros.receiver;
    const list = that.state.messageList;
    for (const item of data) {
      if (item.type === "afid") {
        const res = await fetch(
          `${g.state.afsHost}/msg/download?token=${token}&afid=${item.afid}`
        );
        const d = await res.json();
        const obj = JSON.parse(d.Message);
        let encrypt = new JsEncrypt();
        encrypt.setPrivateKey(privateKey);
        const ph = encrypt.decrypt(obj.ph) || this.state.AESKEY;
        const mes = CryptoJS.AES.decrypt(obj.cipher, ph).toString(
          CryptoJS.enc.Utf8
        );
        list.push({
          position: item.sender === addr ? "right" : "left",
          forwarded: true,
          type: "text",
          theme: "white",
          view: "list",
          title: item.sender,
          titleColor: this.getRandomColor(),
          text: mes,
          onLoad: () => {
            console.log("Photo loaded");
          },
          status: "read",
          date: item.timestamp
        });
        this.setState({
          messageList: list
        });
      } else if (item.type === "image") {
        const res = await fetch(
          `${g.state.afsHost}/file/download?token=${token}&afid=${item.afid}`
        );
        const data = await res.blob();
        console.log("here i got")
        console.log(data);
        const base64 = await convertFile(data);
        console.log("=-=");
        console.log(base64);
        list.push({
          position: item.sender === addr ? "right" : "left",
          forwarded: true,
          type: "photo",
          theme: "white",
          view: "list",
          title: data.sender,
          titleColor: this.getRandomColor(),
          data: {
            uri: base64,
            width: 300,
            height: 300
          },
          onLoad: () => {
            console.log("Photo loaded");
          },
          status: "read",
          date: item.timestamp
        });
        this.setState({
          messageList: list
        });
      }
    }
  };

  async componentWillUnmount() {
    // setInterval(this.addMessage.bind(this), 3000);
    if (this.state.ws) this.state.ws.close();
    await g.getFriendList();
  }

  getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  token() {
    return parseInt((Math.random() * 10) % 6);
  }

  random = type => {
    switch (type) {
      case "message":
        var type = 5;
        var status = "waiting";
        switch (type) {
          case 0:
            type = "photo";
            status = "sent";
            break;
          case 1:
            type = "file";
            status = "sent";
            break;
          case 2:
            type = "system";
            status = "received";
            break;
          case 3:
            type = "location";
            break;
          case 4:
            type = "spotify";
            break;
          default:
            type = "text";
            status = "read";
            break;
        }
        console.log(this.refs.input);

        return {
          position: this.token() >= 1 ? "right" : "left",
          forwarded: true,
          type: type,
          theme: "white",
          view: "list",
          title: "this is a title",
          titleColor: this.getRandomColor(),
          text: this.refs.input.state.value,
          onLoad: () => {
            console.log("Photo loaded");
          },
          status: status,
          date: +new Date()
        };
      case "chat":
        return {
          id: String(Math.random()),
          avatarFlexible: true,
          statusColor: "lightgreen",
          alt: "ewg",
          title: "ewg",
          date: new Date(),
          subtitle: "eg",
          unread: parseInt((Math.random() * 10) % 3),
          dropdownMenu: (
            <Dropdown
              animationPosition="norteast"
              buttonProps={{
                type: "transparent",
                color: "#cecece",
                icon: {
                  component: <FaMenu />,
                  size: 24
                }
              }}
              items={["Menu Item1", "Menu Item2", "Menu Item3"]}
            />
          )
        };
    }
  };

  addMessage = async () => {
    if (!this.refs.input.state.value) {
      return;
    }
    this.setState({ sending: true });
    // send message to get afid
    const {
      username,
      addr,
      token,
      privateKey,
      publicKey
    } = this.props.userInfo;
    console.log("send");
    const body = new FormData();
    body.append("token", token);
    const cipher = CryptoJS.AES.encrypt(
      this.refs.input.state.value,
      this.state.AESKEY
    ).toString();
    const content = JSON.stringify({
      ph: this.state.encryptedAESKEY,
      cipher
    });
    body.append("message", content);
    // body.append("message", this.refs.input.state.value);
    const res = await fetch(`${g.state.afsHost}/msg/upload`, {
      method: "post",
      body
    });
    const data = await res.json();
    const isSuccess = data.SuccStatus > 0;
    if (!isSuccess) return;
    const afid = data.Afid;
    this.state.ws.emit(  //emit can connect with the socket and realtime message
      "chat",
      JSON.stringify({
        sender: addr,
        receiver: this.props.receiver,
        data: afid
      })
    );
    var list = this.state.messageList;
    console.log("you send" + this.refs.input);
    list.push({
      position: "right",
      forwarded: true,
      type: "text",
      theme: "white",
      view: "list",
      title: this.props.userInfo.addr,
      titleColor: this.getRandomColor(),
      text: this.refs.input.state.value,
      onLoad: () => {
        console.log("Photo loaded");
      },
      status: "read",
      date: +new Date()
    });
    this.setState(
      {
        messageList: list,
        sending: false
      },
      () => {
        this.refs.input.clear();
        const ele = document.getElementById("chat-list");
        ele.scrollTop = ele.scrollHeight;
      }
    );
  };

  connect = async () => {
    const {
      username,
      token,
      privateKey,
      publicKey,
      addr,
      publicKeyAfid
    } = this.props.userInfo;
    const wshost = `ws://${this.props.host}`;
    const receiver = this.props.receiver;
    const query = `?sender=${encodeURIComponent(
      addr
    )}&receiver=${encodeURIComponent(receiver)}`;
    console.log(wshost + query);
    const ws = io(wshost + query);
    const that = this;
    ws.on("connect", async function () {
      console.log("chat: on connection ");
      that.setState({ ws });
    });
    ws.on("historytest", str => console.log("history test" + str));
    ws.on("history", async str => {
      console.log("history");
      const data = JSON.parse(str);
      console.log(data);
      this.setState({ historyData: data });
    });

    //recieved all the data

    ws.on("res", async str => {
      const list = that.state.messageList;
      console.log(str);
      const data = JSON.parse(str);
      const type = data.type;
      const afid = data.data;

      if (type === "afid") {
        //text message
        const res = await fetch(
          `${g.state.afsHost}/msg/download?token=${token}&afid=${afid}`
        );
        const d = await res.json();
        const isSuccess = d.SuccStatus > 0;
        if (!isSuccess) return;
        const obj = JSON.parse(d.Message);
        console.log(obj);
        let encrypt = new JsEncrypt();
        encrypt.setPrivateKey(privateKey);
        const ph = encrypt.decrypt(obj.ph);
        const mes = CryptoJS.AES.decrypt(obj.cipher, ph).toString(
          CryptoJS.enc.Utf8
        );
        list.push({
          position: "left",
          forwarded: true,
          type: "text",
          theme: "white",
          view: "list",
          title: data.sender,
          titleColor: this.getRandomColor(),
          text: mes,
          onLoad: () => {
            console.log("Message loaded");
          },
          status: "read",
          date: +new Date()
        });

      } else if (type === "image") {  //
        // media type means the afid from image tunnel
        const mediaType = data.data.type
        const mediaAfid = data.data.afid; //afid2 means different afid
        const mediaFileName = data.data.fileName; //only file has this 

        console.log("typejson", mediaType)

        if (mediaType === "image") {
          console.log("type is image")
          const res = await fetch(
            `${g.state.afsHost}/file/download?token=${token}&afid=${mediaAfid}`
          );
          const data = await res.blob();
          console.log("here i got")
          console.log(data);
          const base64 = await convertFile(data);
          console.log("=-=");
          console.log(base64);
          list.push({
            position: "left",
            forwarded: true,
            type: "photo",
            theme: "white",
            view: "list",
            title: data.sender,
            titleColor: this.getRandomColor(),
            data: {
              uri: base64,
              width: 300,
              height: 300
            },
            onLoad: () => {
              console.log("Photo loaded");
            },
            status: "read",
            date: +new Date()
          });


        }
        else if (mediaType === "voice") {
          console.log("type is voice")
          const res = await fetch(
            `${g.state.afsHost}/file/download?token=${token}&afid=${mediaAfid}`
          );
          const data = await res.blob();
          const blobURL = URL.createObjectURL(data)

          let list = this.state.messageList
          list.push({
            position: "left",
            forwarded: true,
            type: "text",
            text: "",
            theme: "white",
            view: "list",
            title: "CLICK TO HEAR",
            titleColor: "orange",
            onLoad: () => {
              console.log("Photo loaded");
            },
            status: "read",

            date: +new Date(),
            onClick: () => {
              this.setState({ playVoiceUrl: blobURL })
              console.log("message is click")
            }


          });

        } else if (mediaType === "file") {
          //accepting file
          console.log("recive type is file")
          const res = await fetch(
            `${g.state.afsHost}/file/download?token=${token}&afid=${mediaAfid}`
          );
          const blob = await res.blob();
          const blobURL = URL.createObjectURL(blob)

          let list = this.state.messageList
          list.push({
            position: "left",
            forwarded: true,
            type: "file",
            text: mediaFileName,  //
            theme: "white",
            view: "list",
            onLoad: () => {
              console.log("Photo loaded");
            },
            status: "read",

            date: +new Date(),
            onClick: () => {
              saveAs(blob, mediaFileName)
              console.log("message is click")
            }


          });
        } else if (mediaType == "video") {
          //url is the downloading url
          let list = this.state.messageList
          list.push({
            listType: "video",
            url: `${g.state.afsHost}/file/download?token=${token}&afid=${mediaAfid}`,
            position: "left"

          })

        }




      }

      that.setState({ messageList: list }, () => {
        const ele = document.getElementById("chat-list");
        ele.scrollTop = ele.scrollHeight;
      });
    });
  };

  disconnect = () => {
    this.state.ws.disconnect();
    this.setState({ ws: null });
  };
  onImageChange = info => {
    if (info.file.status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  };
  onFileChange = info => {
    console.log(info);
    if (info.file.status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  onVideoSelect = event => {

    console.log("filechaneg")
    console.log(event.target.value)
    const url = URL.createObjectURL(event.target.files[0]);
    console.log(event.target.files)
    console.log(url)
    //clear the file list then can send two same file
    const video = {
      url: url,
      file: event.target.files[0]
    }
    this.uploadVideo(video)
    event.target.value = "";



  }

  onVideoChanged = info => {
    console.log(info);
    if (info.file.status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }

  }



  beforeFileUpload = file => {
    this.uploadFile(file);
    return false;
  };

  beforeImageUpload = file => {

    this.uploadImage(file);
    return false;
  };
  beforeVideoUpload = video => {
    this.uploadVideo(video)
    return false
  }

  uploadFile = async file => {

    console.log("i send a file")
    console.log(file);
    const {

      token,
      addr
    } = this.props.userInfo;
    const body = new FormData();
    body.append("token", token);
    body.append("file", file);
    const res = await fetch(`${g.state.afsHost}/file/upload`, {
      method: "post",
      body
    });
    const data = await res.json();
    if (data.SuccStatus <= 0) return;
    console.log(data);
    const afid = data.Afid;
    //把afid换成有type的数据
    const typeData = {
      afid: afid,
      type: "file",
      fileName: file.name

    }

    this.state.ws.emit(
      "image",
      JSON.stringify({
        sender: addr,
        receiver: this.props.receiver,
        data: typeData
      })
    );
    var list = this.state.messageList;

    const base64 = await convertFile(file);

    list.push({
      position: "right",
      forwarded: true,
      text: file.name,
      type: "file",
      theme: "white",
      view: "list",
      title: "",
      titleColor: "",
      onLoad: () => {
        console.log("file loaded");
      },
      onClick: () => { //file is blob 
        saveAs(file, file.name)
      },
      status: "read",
      data: {
        uri: base64,
      },
      date: +new Date()
    });
    this.setState({
      messageList: list
    });


  };

  uploadImage = async file => {
    console.log(file);
    const {
      username,
      token,
      privateKey,
      publicKey,
      addr
    } = this.props.userInfo;
    const body = new FormData();
    body.append("token", token);
    body.append("file", file);
    const res = await fetch(`${g.state.afsHost}/file/upload`, {
      method: "post",
      body
    });
    const data = await res.json();
    if (data.SuccStatus <= 0) return;
    console.log(data);
    const afid = data.Afid;
    //把afid换成有type的数据
    const typeData = {
      afid: afid,
      type: "image"

    }

    this.state.ws.emit(
      "image",
      JSON.stringify({
        sender: addr,
        receiver: this.props.receiver,
        data: typeData
      })
    );
    var list = this.state.messageList;

    const base64 = await convertFile(file);
    console.log(base64);
    list.push({
      position: "right",
      forwarded: true,
      type: "photo",
      theme: "white",
      view: "list",
      title: this.props.userInfo.addr,
      titleColor: this.getRandomColor(),
      onLoad: () => {
        console.log("Photo loaded");
      },
      status: "read",
      data: {
        uri: base64,
        width: 300,
        height: 300
      },
      date: +new Date()
    });
    this.setState({
      messageList: list
    });
  };

  uploadVideo = async video => {

    console.log("this is video", video)
    const {

      token,
      addr
    } = this.props.userInfo;
    let list = this.state.messageList;
    // const videoUrl=URL.createObjectURL(video)
    const videoUrl = await convertFile(video);
    console.log("push to list");
    list.push({
      listType: "video",
      url: videoUrl,
      // as a sender
      position: "right"
    });
    //push list before
    //work after setState
    this.setState({
      messageList: list
    }, () => {
      const ele = document.getElementById("chat-list");
      ele.scrollTop = ele.scrollHeight;

    })

    const body = new FormData();
    body.append("token", token);
    body.append("file", video);
    const res = await fetch(`${g.state.afsHost}/file/upload`, {
      method: "post",
      body
    });
    const data = await res.json();
    if (data.SuccStatus <= 0) return;
    console.log(data);
    const afid = data.Afid;
    //把afid换成有type的数据
    const typeData = {
      afid: afid,
      type: "video"

    }

    this.state.ws.emit(
      "image",
      JSON.stringify({
        sender: addr,
        receiver: this.props.receiver,
        data: typeData
      })
    );


  }
  //check if the Auido permission is granted on the webpage
  checkAudio = () => {
    navigator.getUserMedia({ audio: true },
      () => {
        console.log('Permission Granted');
        this.setState({ recorderIsBlocked: false })
      },
      () => {
        alert('Aduio Permission Denied');
        this.setState({ recorderIsBlocked: true })

      },
    );

  }

  onStartRecording = () => {

    console.log("recording")
    if (this.state.recorderIsBlocked);
    // this.checkAudio()

    Mp3Recorder
      .start()
      .then(() => {
        this.setState({ isRecording: true })
      }).catch((e) => console.error(e));


  }

  onStopRecording = () => {




    Mp3Recorder
      .stop()
      .getMp3()
      .then(([buffer, blob]) => {
        console.log(buffer, blob);
        const blobURL = URL.createObjectURL(blob)
        //  setBlobUrl(blobURL);

        //push to the MessageList
        this.setState({ isRecording: false })
        var list = this.state.messageList
        list.push({
          position: "right",
          forwarded: true,
          type: "text",
          text: "",
          theme: "white",
          view: "list",
          title: "CLICK TO HEAR",
          titleColor: "orange",
          onLoad: () => {
            console.log("Photo loaded");
          },
          status: "read",

          date: +new Date(),
          onClick: () => {
            this.setState({ playVoiceUrl: blobURL })
            console.log("message is click")
          }


        });

        //update the datasource and roll the list

        this.setState({
          messageList: list
        }, () => {
          const ele = document.getElementById("chat-list");
          ele.scrollTop = ele.scrollHeight;

        })

        //upload the data to afid  async await is not ok in this grammer 
        //blob is from Mp3.reader
        const {
          token,
          addr,
        } = this.props.userInfo;
        const body = new FormData();
        body.append("token", token);
        body.append("file", blob);
        const res = fetch(`${g.state.afsHost}/file/upload`, {
          method: "post",
          body
        }).then(res => res.json())
          .then(
            data => {
              if (data.SuccStatus <= 0) return;
              console.log(data);
              const afid = data.Afid;
              console.log("afid", afid)
              //send to io
              const typeData = {
                afid: afid,
                type: "voice"

              }
              //把data
              this.state.ws.emit(
                "image",
                JSON.stringify({
                  sender: addr,
                  receiver: this.props.receiver,
                  data: typeData

                })
              );

              console.log("i send a voice")


            }

          );










      }).catch((e) => console.log(e));

    console.log("stop recording")

  }


  renderListItem = item => {
    if (item.listType == "video") {
      console.log("this is video")
      //return()
      return (<VideoPlayer playUrl={item.url} position={item.position} />)


    }
    else {
      console.log("this is not video")
      //return(//<List.Item>
      //<MessageBox {...item} />
      //</List.Item>)
      return (<List.Item>
        <MessageBox {...item} />
      </List.Item>)

    }
  }
  async componentDidMount() {
    if (!this.props.userInfo) {
      navigate("/");
      return;
    }
    const {
      username,
      token,
      privateKey,
      publicKey,
      addr,
      publicKeyAfid
    } = this.props.userInfo;
    const host = `http://${this.props.host}`;
    //change the receiver
    const receiver=this.props.receiver;
    console.log(receiver)
    // get receiver's publicKey afid
    //since we use reciver's name 
    //const hash = sha256.x2(receiver);
   // const receiverAddr = bs58.encode(Buffer.from(hash, "hex"));
    const res1 = await fetch(
      `${host}/getPublicKey?username=${encodeURIComponent(receiver)}`
    );
    console.log(encodeURIComponent(receiver))
    if (res1.status !== 200) return;
    const data1 = await res1.json();
    const pkAfid = data1.publicKey;

    // get receiver's publicKey
    const resp = await fetch(
      `${g.state.afsHost}/msg/download?token=${token}&afid=${pkAfid}`
    );
    const d = await resp.json();
    const receiverPublicKey = d.Message;
    // ws.emit("publicKey", JSON.stringify({ publicKey: publicKeyAfid, username: addr }));
    let AESKEY = "";
    const tag = `${addr}-${receiver}`;
    let res = await fetch(
      `${g.state.afsHost}/afid/getbytag?token=${token}&tag=ChainChat::AESKEY-${tag}`
    );
    let data = await res.json();
    if (data.SuccStatus <= 0) return;
    // if the AES Key not exists
    if (!data.Afids || data.Afids.length === 0) {
      AESKEY = Generate_key();
      const encrypt = new JsEncrypt();
      encrypt.setPublicKey(publicKey);
      const encryptedContent = encrypt.encrypt(AESKEY);
      let body = new FormData();
      body.append("token", token);
      body.append("message", encryptedContent);
      res = await fetch(`${g.state.afsHost}/msg/upload`, {
        method: "post",
        body
      });
      data = await res.json();
      if (data.SuccStatus <= 0) return;
      const AESKEYAfid = data.Afid;
      body = new FormData();
      body.append("token", token);
      body.append("afid", AESKEYAfid);
      res = await fetch(`${g.state.afsHost}/afid/add`, {
        method: "post",
        body
      });
      data = await res.json();
      if (data.SuccStatus <= 0) return;
      // add tag
      body = new FormData();
      body.append("token", token);
      body.append("tag", `ChainChat::AESKEY-${tag}`);
      body.append("afid", AESKEYAfid);
      res = await fetch(`${g.state.afsHost}/afid/addtag`, {
        method: "post",
        body
      });
      data = await res.json();
      if (data.SuccStatus <= 0) return;
    } else {
      const afid = data.Afids[0].Afid;
      res = await fetch(
        `${g.state.afsHost}/msg/download?afid=${afid}&token=${token}`
      );
      data = await res.json();
      if (data.SuccStatus <= 0) return;
      let encrypt = new JsEncrypt();
      encrypt.setPrivateKey(privateKey);
      AESKEY = encrypt.decrypt(data.Message);
      console.log("--");
      console.log(privateKey);
      console.log(AESKEY);
    }

    const encrypt = new JsEncrypt();
    encrypt.setPublicKey(receiverPublicKey);
    const encryptedAESKEY = encrypt.encrypt(AESKEY);
    this.setState({ receiverPublicKey, AESKEY, encryptedAESKEY });
    await this.connect();
    //after this is done ,we will have a AESKEY and a encrptAESKEY (to reciever)
  }

  /* replace list with messagelist, this present no line and auto moved



          <MessageList
            className='message-list'
            lockable={true}
            toBottomHeight={'100%'}
            dataSource={this.state.messageList
            } />

  */

  render() {
    return (
      <>

        <ReactAudioPlayer
          src={this.state.playVoiceUrl}
          autoPlay
          onEnded={() => this.setState({ playVoiceUrl: '' })}// or repeat play will be ignore
        />
        <div>
          From: {this.props.userInfo ? `${this.props.userInfo.addr}` : ""}
        </div>
        <div>
          To: {this.props.receiver}({this.props.remark}){this.props.username}
        </div>
        <div style={{}}>
          Status: {this.state.ws ? "Connected" : "Disconnected"}
        </div>
        <Button
          disabled={this.state.loadEarly}
          onClick={() => this.loadHistory()}
        >
          Load History
        </Button>

        <div className="container">

          <List

            id="chat-list"
            className="chat-body"
            itemLayout="vertical"
            dataSource={this.state.messageList}
            renderItem={item => this.renderListItem(item)}

          />

          <div className="chat-actions">
            <Upload
              name="file"
              onChange={this.onImageChange}
              beforeUpload={this.beforeImageUpload}
              showUploadList={false}>

              <Button>
                <Icon
                  type="picture"
                  style={{ fontSize: "16px", color: "#08c" }}
                />
              </Button>
            </Upload>

            <Upload
              onChange={this.onFileChange}
              beforeUpload={this.beforeFileUpload}
              showUploadList={false}
            >
              <Button>
                <Icon type="file" style={{ fontSize: "16px", color: "#08c" }} />
              </Button>


            </Upload>

            <Upload
              onChange={this.onVideoChanged}
              beforeUpload={this.beforeVideoUpload}
              showUploadList={false}
            >
              <Button>
                <Icon type="play-circle" style={{ fontSize: "16px", color: "#08c" }} />
              </Button>

            </Upload>



          </div>




          <InputChat
            className="chat-input"
            placeholder="Input something"
            defaultValue=""
            ref="input"
            multiline={true}
            // buttonsFloat='left'
            onKeyPress={e => {
              if (e.shiftKey && e.charCode === 13) {
                return true;
              }
              if (e.charCode === 13) {
                this.addMessage();
                e.preventDefault();
                return false;
              }
            }}
            rightButtons={
              <div>
                <Button
                  className="chat-input"
                  type={this.state.isRecording ? "danger" : "primary"}
                  shape="circle"
                  onClick={this.state.isRecording ? this.onStopRecording.bind(this) : this.onStartRecording.bind(this)}
                  icon="customer-service"
                >

                </Button>
                <Button
                  disabled={!Boolean(this.state.ws) || this.state.sending}
                  type="dashed"
                  onClick={this.addMessage.bind(this)}
                >
                  Send
              </Button>


              </div>
            }

          //since we use antd 3.X the icon usage of the button is not the same

          />
        </div>
      </>
    );
  }
}
