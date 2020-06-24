import {
    Provider,
    Subscribe,
    Container
} from 'unstated'
import _ from 'lodash'
class GlobalState extends Container {
    state = {
        userInfo: null,
        selectedKeys: ["1"],
        friendList: [],
        messageList: [],
        ws: null,
        //host: '127.0.0.1:10010',
       // host:'10.6.71.117:10010',
       // afsHost: '39.108.80.53:8079',
      // afsHost: '10.6.71.117:10010',
      //host is messagenode  afs host is bos
      
     // host:'47.52.77.166:8067',
     host:'47.52.77.166:8092',
      afsHost: '47.52.77.166:8089',
    }

    login = userInfo => this.setState({
        userInfo,
        selectedKeys: ["2"]
    })

    setKeys = e => this.setState({
        selectedKeys: [e]
    })

    getFriendList = async () => {
        const {
            afsHost,
            userInfo,
            host
        } = this.state
        if (!userInfo) return
        // get message from message node
        const mRes = await fetch(`http://${host}/getMessageList?addr=${userInfo.addr}`)
        const mData = await mRes.json()
        console.log("getFriendlist:here is message:")
        console.log(mData)
        console.log(`http://${host}/getMessageList?addr=${userInfo.addr}`)

        let res = await fetch(`${afsHost}/afid/getbytag?token=${userInfo.token}&tag=ChainChat::FriendList-${userInfo.addr}`)
        console.log("getFriendlist:here is getbytag:")
        console.log(`${afsHost}/afid/getbytag?token=${userInfo.token}&tag=ChainChat::FriendList-${userInfo.addr}`)
        let data = await res.json()
        if (data.SuccStatus <= 0) return
        let newFriendList = []
        
        if (!data.Afids || data.Afids.length === 0) {
            console.log("getFriendlist:no friendlist before")

        } else {
            const afid = data.Afids[0].Afid
            res = await fetch(`${afsHost}/msg/download?afid=${afid}&token=${userInfo.token}`)
            console.log(`${afsHost}/msg/download?afid=${afid}&token=${userInfo.token}`)
            data = await res.json()
           // if (data.SuccStatus <= 0) return //====>here it will retrun therefore no new friendlist
          //  newFriendList = JSON.parse(data.Message)
            console.log("getFriendlist:here is FRIENDIST"+data)
            console.log(newFriendList)
            console.log(`${afsHost}/msg/download?afid=${afid}&token=${userInfo.token}`)
        }

        const set = new Set()
        for (const item of newFriendList) {
            set.add(item.addr)
        }
        for (const item of mData) {
            if (!set.has(item.sender)) {
                set.add(item.sender)
                newFriendList = newFriendList.concat({
                    addr: item.sender,
                    remark: 'stranger'
                })
            }
        }

        const newMessageList = []
        for (const item of newFriendList) {
            const mes = mData.filter(m => m.addr = item.addr)
            if (mes.length > 0) {
                const obj = {
                    ...item,
                    messages: mes[0].messages
                }
                console.log("getFriendlist:init message list of"+item)
                console.log(obj)
                newMessageList.push(obj)
            }else{
                const obj = {
                    ...item,
                    messages: []
                }
                console.log("getFriendlist:init message list no newfriend has send me")
                console.log(obj)
                newMessageList.push(obj)
            }
        }
        this.setState({
            friendList: newFriendList,
            messageList: newMessageList
        })
    }

    addFriend = async e => {
        const {
            afsHost,
            userInfo,
            friendList,
            host
        } = this.state
        const newFriendList = _.unionBy(friendList, [e], 'addr')

        console.log("addfriend:frend is "+friendList)
        console.log(e)
        console.log(newFriendList)
       

        // get current friend list by tag
        let res = await fetch(`${afsHost}/afid/getbytag?token=${userInfo.token}&tag=ChainChat::FriendList-${userInfo.addr}`)
        let data = await res.json()
        if (data.SuccStatus <= 0) return
        // if the user's friendlist not exists
        if (!data.Afids || data.Afids.length === 0) {
            console.log("addFriend:user's friendlist does not exist")
            //
        } else {
            //remove the existing friendlist
            const afid = data.Afids[0].Afid
            let body = new FormData()
            body.append('token', userInfo.token)
            body.append('afid', afid)
            res = await fetch(`${afsHost}/afid/remove`, {
                method: 'post',
                body
            })
            data = await res.json()
            if (data.SuccStatus <= 0) return
        }

        // upload new friend list
        let body = new FormData()
        let str = JSON.stringify(newFriendList)
        console.log("addfriend: i am upload new friendlist is")
        console.log(newFriendList)
        body.append('token', userInfo.token)
        body.append('message', str)
        res = await fetch(`${afsHost}/msg/upload`, {
            method: 'post',
            body
        })
        data = await res.json()
        if (data.SuccStatus <= 0) return
        const newFriendListAfid = data.Afid
        console.log("addfriend: uploadsucees,get afid")
        console.log(newFriendListAfid)
        // add afid
        body = new FormData()
        body.append('token', userInfo.token)
        body.append('afid', newFriendListAfid)
        res = await fetch(`${afsHost}/afid/add`, {
            method: 'post',
            body
        })
        data = await res.json()
        if (data.SuccStatus <= 0) return
        console.log("addfriend: uploadsucees,add afid")

        // add tag
        body = new FormData()
        body.append('token', userInfo.token)
        body.append('tag', `ChainChat::FriendList-${userInfo.addr}`)
        body.append('afid', newFriendListAfid)
        res = await fetch(`${afsHost}/afid/addtag`, {
            method: 'post',
            body
        })

        data = await res.json()
        if (data.SuccStatus <= 0) return
        console.log("addfriend: uploadsucees,add tag")

        const mRes = await fetch(`http://${host}/getMessageList?addr=${userInfo.addr}`)
        const mData = await mRes.json()
        const newMessageList = []
        for (const item of newFriendList) {
            const mes = mData.filter(m => m.addr = item.addr)
            const obj = {
                ...item,
                messages: mes
            }
            newMessageList.push(obj)
        }
        this.setState({
            friendList: newFriendList,
            messageList: newMessageList
        })
    }

    setWs = e => this.setState({
        ws: e
    })

    setHost = e => this.setState({
        host: e
    })

    logout = e => this.setState({
        userInfo: null,
        ws: null,
        friendList: [],
        messageList: []
    })
}

const g = new GlobalState()
export default g