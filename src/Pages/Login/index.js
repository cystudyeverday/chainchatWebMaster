import React from "react";
import { Form, Icon, Input, Button, Checkbox, Radio } from "antd";
import md5 from "md5";
import { navigate } from "@reach/router";
import sha256 from "sha256";
import bs58 from "bs58";
import { Subscribe } from "unstated";
import g from "../../state";
import io from "socket.io-client";

class NormalLoginForm extends React.Component {
  state = {
    cluster: 3,
   // host: "10.6.71.79:10010"
   host: "47.52.77.166:8092"//sure it is messagenode
  };
  setHost = e =>
    this.setState({
      host: e
    });
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields(async (err, values) => {
      if (!err) {
        console.log("now the afshost is"+g.state.afsHost)
       //now the afshost is changed to host10.6.71.10010
        const timestampRes = await fetch(`${g.state.afsHost}/auth/time`);
        
       // const timestampRes = await fetch(`39.108.80.53:8079/auth/time`);
        const timestampJson = await timestampRes.json();
        const timestamp = timestampJson.CurrentTimeStamp;
        const signature = md5(
          `${values.username}+${values.password}+${timestamp}`
        );
        console.log("time is"+timestamp);
        const formData = new FormData();
        formData.append("email", values.username);
        formData.append("is_expire", 1);
        formData.append("timeStamp", timestamp);
        formData.append("signature", signature);
        console.log(`${g.state.afsHost}/auth/signin`)
        const res = await fetch(`${g.state.afsHost}/auth/signin`, {
          method: "post",
          body: formData
        });
        console.log(res)
        console.log(`${g.state.afsHost}/auth/signin`)
        const data = await res.json();
        const isSuccess = data.SuccStatus > 0;
        if (!isSuccess) return;
        const token = data.Token;
        const expiredTime = data.ExpireAt;
        console.log("tokenisisis"+token);
        // check if keypair exists
        //cy:use token to get the keypair
        const res3 = await fetch(`${g.state.afsHost}/v2/keypair/getall?token=${token}`);
        const data3 = await res3.json();
        console.log("get from token")
        console.log(data3);
        const isSuccess3 = data3.SuccStatus > 0;
        if (!isSuccess3) return;
        const keyPairs = data3.KeyPairs;
        let kpAddr = "";
        if (!keyPairs) {
          // create keypair
          const body = new FormData();
          body.append("token", token);
          body.append("key_type", "rsa");
          const res1 = await fetch(`${g.state.afsHost}/v2/keypair/create`, {
            method: "post",
            body
          });
          const data1 = await res1.json();
          const isSuccess1 = data1.SuccStatus > 0;
          if (!isSuccess1) return;
          kpAddr = data1.KeyPairAddress;
        } else {
          //cy keyaddressexistes 
          kpAddr = keyPairs[0].KeyPairAddress;
        }
   
        //cy:use keypairAddress to get keypair 
        const res2 = await fetch(
          `${g.state.afsHost}/v2/keypair/get?token=${token}&key_pair_address=${kpAddr}`   
        );
        const data2 = await res2.json();
        console.log("get from key pair address")
        const isSuccess2 = data2.SuccStatus > 0;
        if (!isSuccess2) return;
        const publicKey = data2.PublicKey;
        const privateKey = data2.PrivateKey;
        // const privateKey = data2.PublicKey;
        // const publicKey = data2.PrivateKey;
        //makesure address if idendtical
       // const hash = sha256.x2(publicKey);
      //  const addr = bs58.encode(Buffer.from(hash, "hex"));
      //make username as the finder
      const hash = sha256.x2(values.username,);
      const addr = bs58.encode(Buffer.from(hash, "hex"));
        console.log("publc key"+publicKey);
        // websocket connection
        const body1 = new FormData();
        body1.append("token", token);
        // const encrypt = new JsEncrypt();
        // encrypt.setPublicKey(this.state.receiverPublicKey);
        // const encryptedContent = encrypt.encrypt(this.refs.input.state.value);
        // body.append("message", encryptedContent);
        body1.append("message", publicKey);
        console.log(body1);
        const res1 = await fetch(`${g.state.afsHost}/msg/upload`, { // can not fecth
          method: "post",
          body: body1
        });
        const data1 = await res1.json();
        console.log("post publickey")
        console.log(data1)
        const isSuccess1 = data1.SuccStatus > 0;
        if (!isSuccess1) return;  ////will return here====>messagenode 有问题 NDN更新
        const afid = data1.Afid;
        console.log("afid"+afid);
     

        g.login({
          username: values.username,
          token,
          expiredTime,
          publicKey,
          privateKey,
          addr,
          publicKeyAfid: afid
        });
        const uri = `ws://${this.state.host}?user=${addr}`;
        const ws = io(uri);
        ws.on("connect", async function() {
          
          console.log("on connection");
          ws.emit(    //emit 即为把publickey和username提交过去
            
            "publicKey",
            JSON.stringify({
              publicKey: afid,
              username: addr
            })
          );
          g.setWs(ws);
        });

        ws.on("newMes", async str => {
          const obj = JSON.parse(str);
          await g.getFriendList();
          console.log("init friend list success")
        });

        g.setHost(this.state.host);
        // build
        navigate("/friendlist");
      }
    });
  };

  onClusterChange = e => {
    this.setState({
      cluster: e.target.value
    });
    switch (e.target.value) {
      // ACAC
    //   case 0:
    //     this.setHost("47.75.197.211:8079");
    //     break;
    //   case 1:
    //     this.setHost("47.75.197.211:8081");
    //     break;
    //   case 2:
    //     this.setHost("47.52.172.63:8008");
    //     break;
     /* case 3:
        this.setHost("47.52.206.176:8008");
        break;
      case 4:
        this.setHost("47.75.197.211:8008");
        break;*/
      default:
    }
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Form onSubmit={this.handleSubmit} className="login-form">
        <Form.Item>
          {" "}
          {getFieldDecorator("username", {
            rules: [
              {
                required: true,
                message: "Please input your username!"
              }
            ]
          })(
            <Input
              prefix={
                <Icon
                  type="user"
                  style={{
                    color: "rgba(0,0,0,.25)"
                  }}
                />
              }
              placeholder="Username"
            />
          )}{" "}
        </Form.Item>{" "}
        <Form.Item>
          {" "}
          {getFieldDecorator("password", {
            rules: [
              {
                required: true,
                message: "Please input your Password!"
              }
            ]
          })(
            <Input
              prefix={
                <Icon
                  type="lock"
                  style={{
                    color: "rgba(0,0,0,.25)"
                  }}
                />
              }
              type="password"
              placeholder="Password"
            />
          )}{" "}
        </Form.Item>{" "}
        <Form.Item>
          <Radio.Group
            onChange={this.onClusterChange}
            value={this.state.cluster}
          >
            {/* <Radio value={0}> 9242 </Radio> <Radio value={1}> 9243 </Radio>
            <Radio value={2}> 9219 </Radio> */}
            <Radio value={3}> 9220 </Radio>
            <Radio value={4}> 9221 </Radio>
     
          </Radio.Group>{" "}
        </Form.Item>{" "}
        <Form.Item>
          {" "}
          {getFieldDecorator("remember", {
            valuePropName: "checked",
            initialValue: true
          })(<Checkbox> Remember me </Checkbox>)}{" "}
          <a className="login-form-forgot" href="">
            Forgot password{" "}
          </a>{" "}
          <Button  //login之后就是提交i一个表单
            type="primary"
            htmlType="submit"
            className="login-form-button"
          >
            Log in
          </Button>
          Or <a onClick={() => navigate("/register")}> register now! </a>{" "}
        </Form.Item>{" "}
      </Form>
    );
  }
}

const WrappedNormalLoginForm = Form.create({
  name: "normal_login"
})(NormalLoginForm);

export default WrappedNormalLoginForm;
