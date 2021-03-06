import React, { useState, useEffect } from "react";
import { navigate } from "@reach/router";
import logo from "./astri-logo.svg";
import Router from "./router";
import "./App.css";
import { Layout, Menu, Breadcrumb, Icon } from "antd";
import { Provider, Subscribe, Container } from "unstated";
import g from "./state";
import MyChatRoom from './Pages/MyChatRoom/MyChatRoom'



const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;

function App() {
   //collapse is a state and its initial is false  because in function there is no this,so can not setting this.state
  const [collapsed, setCollapsed] = useState(false); 

  useEffect(() => {
    const getHost = async () => {
      const res = await fetch("/config.json");//public下的bos地址
      const data = await res.json();
      const bos = data.bos;
      g.setState({ afsHost: bos });
    };
    (async () => {
      await getHost();
    })();
  }, []);//dependcy =[]
  const onCollapse = collapsed => {
    setCollapsed(collapsed);
  };

  return (
    <Provider>
      <Subscribe to={[g]}>
        {G => {
          console.log(G.state.userInfo);
          return (
            <Layout style={{ minHeight: "100vh" }}>
              <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
                <div className="side-logo" />
                <Menu
                  theme="dark"
                  defaultSelectedKeys={["1"]}
                  selectedKeys={G.state.selectedKeys}
                  mode="inline"
                >
                  {!G.state.userInfo && (
                    <Menu.Item
                      key="1"
                      onClick={() => {
                        navigate("/login");
                        G.setKeys("1");
                      }}
                    >
                      <Icon type="login" />
                      <span>Login</span>
                    </Menu.Item>
                  )}
                  {G.state.userInfo && (
                    <Menu.Item
                      key="2"
                      onClick={() => {
                        navigate("/friendlist");
                        G.setKeys("2");
                      }}
                    >
                      <Icon type="team" />
                      <span>FriendList</span>
                    </Menu.Item>
                  )}
                  {G.state.userInfo && (
                    <Menu.Item
                      key="3"
                      onClick={() => {
                        g.logout();
                        navigate("/login");
                      }}
                    >
                      <Icon type="logout" />
                      <span>Logout</span>
                    </Menu.Item>
                  )}
                  {/* <Menu.Item
                    key="5"
                    onClick={() => {
                      navigate("/search");
                      G.setKeys("5");
                    }}
                  >
                    <Icon type="file" />
                    <span>AFS Search</span>
                  </Menu.Item>
                  <Menu.Item
                    key="6"
                    onClick={() => {
                      navigate("/rnode");
                      G.setKeys("6");
                    }}
                  >
                    <Icon type="pie-chart" />
                    <span>AFS Info</span>
                  </Menu.Item> */}
                </Menu>
              </Sider>
              <Layout>
                <Header style={{ background: "#fff", padding: 0 }}>
                  <img src={logo} className="App-logo" alt="logo" />
                </Header>
                <Content style={{ margin: "0 16px" }}>
               <Router />
             { /*<MyChatRoom/>*/}
                </Content>
            
                <Footer style={{ textAlign: "center" }}>
                  NDN Project@ASTRI 2019 - Vayne Tian
                </Footer>
              </Layout>
            </Layout>
          );
        }}
      </Subscribe>
    </Provider>
  );
}

export default App;
