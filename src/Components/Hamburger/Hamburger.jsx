import { AlignLeft } from 'lucide-react'
import React from 'react'

const Hamburger = () => {
    const handleMenuSidebar = ()=> {
        document.querySelector('body .side-bar-menu-container').classList.add('active')
    }
  return (
    <AlignLeft className='hamburgerIcon d-lg-none' id='hamburger' onClick={handleMenuSidebar}/>
  )
}

export default Hamburger