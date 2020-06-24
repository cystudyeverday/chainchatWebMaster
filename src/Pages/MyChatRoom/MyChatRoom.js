import React from 'react'
import "./MyChatRoom.css"
import searchUrl from "./search/search.svg"
import FriendList from '../FriendList/index'
import Chat from '../ChatRoom/chat'
import { Subscribe } from "unstated";
import g from "../../state";

const MyChatRoom = ( props ) => {

    return (
        <div className="outContainer">
            MyChatRoom
            <div id="chat-container">
                <div id="search-container">
                    <input type="text" placeholder="Search" />


                </div>

                <div id="conversation-list">
                    <FriendList />
                </div>

                <div id="new-message-container">
                    <a href="#">+</a>
                </div>

                <div id="chat-title">
                    <span> Dary</span>
                    <img ></img>
                </div>

                <div id="chat-message">
                    <Subscribe to={[g]}>
                        {G => {
                            return (
                                <>
                                    <Chat
                                        userInfo={G.state.userInfo}
                                        host={G.state.host}
                                        receiver={props.location.state.addr}
                                        remark={props.location.state.remark}
                                    />

                                </>
                            );
                        }}
                    </Subscribe>
                </div>

                <div id="chat-form">
                    <img src={searchUrl} alt="add file" />
                    <input type="text" placeholder="input the text" />
                </div>

            </div>
        </div>
    )
}

export default MyChatRoom;


/*
  <Chat
                                        userInfo={G.state.userInfo}
                                        host={G.state.host}
                                        receiver="5e6NT4srZBYWLmNRXaRxzrMAmsZfaC3LruFhRGRC8xdy"
                                        remark="not get"
                                    />
*/