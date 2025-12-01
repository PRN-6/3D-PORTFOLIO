import React from 'react'
import { Link } from 'react-router'
import { FaSun, FaMoon } from 'react-icons/fa';

const Navbar = () => {
  return (
    <header >
        <div className='mx-auto h-16 p-4 bg-black'>
            <div className='flex items-center justify-between'>
                <div className='flex items-end justify-end gap-6 w-full px-6 text-1xl'>
                    <Link to={"/about"}>
                        <h3>
                            About
                        </h3>
                    </Link>
                    <Link to={"/projects"}>
                        <h3>
                            Projects
                        </h3>
                    </Link>
                    <div className='btn btn-primary'>
                        <FaSun size={20} className="text-white-300" />
                    </div>
                </div>
            </div>
        </div>
    </header>
    )
}

export default Navbar