import React, { useState, useEffect, useMemo } from 'react'
import ReactPlayer from 'react-player'


import 'antd/dist/antd.css';

const VideoPlayer = (props) => {


    const [play, setplay] = useState(false)
    //control the  positon of the videocomponent
    const [style, setStyle] = useState({})


    const rightStyle = {
        display: "flex",
        justifyContent: "flex-end",
       

    }

    const leftStyle = {
        

    }



    useEffect(() => { console.log(play) }, [play])
    useEffect(() => {
        console.log(props)
        if (props.position === "left")
            setStyle(leftStyle);
        else
            setStyle(rightStyle);


    }, [])//init




    return (
        <div >
            <div style={style} >


                <ReactPlayer
                    url={props.playUrl}
                    playing={play}
                    onClick={() => {
                        console.log("click");
                        setplay((play) => !play)
                    }

                    }
                    width="400px"
                    height="400px"
                />






            </div>

        </div>
    )


}

export default VideoPlayer;