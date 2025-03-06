import React from 'react';
import './MediaPlayer.css'; // Ensure this import is present

export default function MediaPlayer({ videoSrc }) {
  return (
    <div className="media-player">
      <div className="media-player-header">
        <div className="media-player-buttons">
          <div className="media-player-button close"></div>
          <div className="media-player-button minimize"></div>
          <div className="media-player-button maximize"></div>
        </div>
        <div className="media-player-title">Windows Media Player</div>
      </div>
      <div className="media-player-body">
        <video controls className="media-player-video">
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}