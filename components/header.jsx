import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'

const Header = () => {
  return (
    <header className='fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-10 supports-[backdrop-filter]:bg-background/60'>
        <nav className='container mx-auto px-4 h-16 flex items-center justify-between'>
            <Link href="/">
                <Image
                    src="/logo-single.png"
                    alt="Logo"
                    width={200}
                    height={66}
                    className='h-10 w-auto object-contain'
                />
            </Link>


          <div className='flex items-center space-x-2'>
            <SignedOut>
              <SignInButton>
                <Button variant="outline" className="bg-white text-black hover:bg-gray-100">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>

          
            <SignedIn>
              <UserButton/>
            </SignedIn>
          </div> 
        </nav>
    </header>
  )
}

export default Header 