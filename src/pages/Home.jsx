import React from 'react'
import Navbar from '../components/Navbar'
import profileImage from '../assets/profilephoto.jpg'
import { FaGithub, FaLinkedin, FaNode, FaReact } from 'react-icons/fa'
import { SiExpress, SiGmail, SiMongodb, SiRust } from 'react-icons/si'
import { FaXTwitter } from 'react-icons/fa6'
import { DotIcon } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'


const Home = () => {
    useGSAP(() => {
        gsap.to('#image',{
           rotate:360,
        })
    })

  return (
    <div>
        <Navbar/>
        <div className='flex flex-row min-h-screen'>
            <div className='w-1/2 p-12 sticky top-0 self-start h-screen'>
                <div className='flex size-60 '>
                    <img
                      id='image'
                      src={profileImage}
                      alt="profile"
                      className='w-60 h-60 rounded-full object-cover shadow-lg p-6'
                    />
                    <div className='pl-15'>
                        <h1 className='text-white pt-12 flex items-center gap-2'>
                            <FaGithub className='w-6 h-6'/>
                            <a href='https://github.com/PRN-6'
                            className='hover:text-blue-300 hover:'>
                                Github
                            </a>
                        </h1>
                        <h1 className=" pt-5 flex items-center gap-2">
                            <FaLinkedin className="w-6 h-6" />
                            <a
                                href="https://www.linkedin.com/in/prinson-nazareth/"
                                className=" hover:text-blue-300">
                                LinkedIn
                            </a>
                        </h1>
                        <h1 className=' pt-5 flex items-center gap-2'>
                            <FaXTwitter className='w-6 h-6'/>
                            <a 
                                href="https://x.com/r_prinson66328"
                                className='hover:text-blue-300'>
                                Twitter                                        
                            </a>
                        </h1>
                        <h1 className=' pt-5 flex items-center gap-2'>
                            <SiGmail className='w-6 h-6'/>
                            prinsonroyal1@gmail.com
                        </h1>
                    </div>
                </div>
                <h1 className='text-5xl font-bold pb-8 pt-4'>
                    Prinson Royal Nazareth
                </h1>
                <h2>I’m a self-taught developer with a strong passion for building clean, user-friendly applications.<strong> I love learning new technologies and constantly improving my skills.</strong>
                </h2>
                <h2 className='pt-6'>   
                    Leveling up in:
                    <div className='flex items-center gap-2 pt-3'>
                        <FaReact className='w-8 h-8' />React<DotIcon/>
                        <SiExpress className='w-8 h-8'/>Express<DotIcon/>
                        <FaNode className='w-8 h-8'/>Node<DotIcon/>
                        <SiMongodb className='w-8 h-8'/>Mongodb<DotIcon/>
                        <SiRust className='w-8 h-8'/>Rust
                    </div>
                </h2>
            </div>
            <div className='w-1/2 bg-blue-500'>
                need to create project section 
                skill section 
                

            </div>

        </div>
        
    </div>
  )
}

export default Home