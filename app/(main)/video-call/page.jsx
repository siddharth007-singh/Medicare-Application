import React from 'react'
import VideoCall from './video-call-ui';

const VideoCallPage = async ({ searchParams }) => {
    //Takings details from params.
    const { sessionId, token } = await searchParams;

  return <VideoCall sessionId={sessionId} token={token} />
}

export default VideoCallPage