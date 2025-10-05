import React from 'react'
import './Loading.css'
import LogoImg from '../../assets/logo.jpg'

const Loading = () => {
  return (
    <div className="loading-main-container">
        <img src={LogoImg} alt="" />
        <div className="main-loader"></div>
    </div>
  )
}

export default Loading