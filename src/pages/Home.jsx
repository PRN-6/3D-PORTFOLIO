import React, { useRef } from 'react'
import Navbar from '../components/Navbar'
import profileImage from '../assets/profilephoto.jpg'
import { FaGithub, FaLinkedin, FaNode, FaReact } from 'react-icons/fa'
import { SiExpress, SiGmail, SiMongodb, SiRust } from 'react-icons/si'
import { FaXTwitter } from 'react-icons/fa6'
import { DotIcon } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'


const Home = () => {
    const imageRef = useRef(null)
    const heroTitleRef = useRef(null)
    const heroInfoRef = useRef(null)
    const heroStackRef = useRef(null)
    const linkRef = useRef(null)
    const projectRef = useRef(null)

    useGSAP(() => {
        gsap.to(imageRef.current, {
            rotate: 360,
        })

        gsap.from(heroTitleRef.current, {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power2.out'
        })

        gsap.from(heroInfoRef.current, {
            y: 50,
            opacity: 0,
            duration:1,
            ease: 'back.in'
        })

        gsap.from(heroStackRef.current, {
            z:50,
            opacity:0,
            duration:1,
            ease: 'sine.inOut'
        })

        gsap.from(linkRef.current, {
            x: 100,
            opacity:0,
            duration:1,
            ease: 'circ.inOut'
        })

        gsap.from(projectRef.current, {
            x:50,
            opacity:0,
            duration:1,
            ease: 'power4.out'
        })
    }, [])

  return (
    <div>
        <Navbar/>
        <div className='flex flex-row min-h-screen'>
            <div className='w-1/2 p-12 sticky top-0 self-start h-screen'>
                <div className='flex size-60 '>
                    <img
                      ref={imageRef}
                      src={profileImage}
                      alt="profile"
                      className='w-60 h-60 rounded-full object-cover shadow-lg p-6'
                    />
                    <div ref={linkRef} className='pl-15'>
                        <h1 className='text-white pt-12 flex items-center gap-2'>
                            <FaGithub className='w-6 h-6'/>
                            <a href='https://github.com/PRN-6'
                            className='hover:text-blue-300'>
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
                <h1 ref={heroTitleRef} className='text-5xl font-bold pb-8 pt-4'>
                    Prinson Royal Nazareth
                </h1>
                <h2 ref={heroInfoRef} className=''>I’m a self-taught developer with a strong passion for building clean, user-friendly applications.<strong> I love learning new technologies and constantly improving my skills.</strong>
                </h2>
                <h2 className='pt-6'>   
                    Leveling up in:
                    <div ref={heroStackRef} className='flex items-center gap-2 pt-3'>
                        <FaReact className='w-8 h-8' />React<DotIcon/>
                        <SiExpress className='w-8 h-8'/>Express<DotIcon/>
                        <FaNode className='w-8 h-8'/>Node<DotIcon/>
                        <SiMongodb className='w-8 h-8'/>Mongodb<DotIcon/>
                        <SiRust className='w-8 h-8'/>Rust
                    </div>
                </h2>
            </div>
            <div className='w-1/2 h-screen overflow-y-auto p-12'>
                <h1 className='mb-6 text-2xl'>Projects</h1>
                <div ref={projectRef} className='flex items-center gap-4'>
                    <div className='w-1/2 size-100 rounded-2xl bg-amber-900'>
                        left
                    </div>  
                    <div className='w-1/2 size-100 rounded-2xl bg-fuchsia-700'>
                        right
                    </div>
                </div>
                <div className= 'mt-6 '>
                    <h1 className='text-2xl'>
                        Technologies & Tools
                    </h1>
                </div>
               

            </div>

        </div>
        
    </div>
  )
}

export default Home