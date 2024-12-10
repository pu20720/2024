'use client';
import Link from 'next/link'
import React from 'react'
import { signIn, signOut, useSession } from "next-auth/react";
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { useRouter } from 'next/navigation';

const page = () => {

    const session = useSession();
    const router = useRouter();

    if (session.data) {
        router.push("/");
    }

    return (
        <div className='flex flex-col justify-center items-center h-[100vh] bg-gray-800'>
            <div className='bg-white w-[80%] md:max-w-[50%] lg:max-w-[30%] h-80 rounded-xl p-5'>
                <p className='w-full text-center font-bold text-3xl'>登入</p>

                <div className='flex flex-col justify-center items-center h-[80%]'>
                    <div className='flex bg-slate-700 w-fit px-10 py-2 rounded-xl cursor-pointer hover:bg-slate-600'>
                        <div className='flex justify-center'>
                            <svg aria-hidden="true" className="" height="30" version="1.1" viewBox="0 0 64 64" width="30" color='white'>
                                <path data-name="layer2" d="M32 0a32.021 32.021 0 0 0-10.1 62.4c1.6.3 2.2-.7 2.2-1.5v-6c-8.9 1.9-10.8-3.8-10.8-3.8-1.5-3.7-3.6-4.7-3.6-4.7-2.9-2 .2-1.9.2-1.9 3.2.2 4.9 3.3 4.9 3.3 2.9 4.9 7.5 3.5 9.3 2.7a6.93 6.93 0 0 1 2-4.3c-7.1-.8-14.6-3.6-14.6-15.8a12.27 12.27 0 0 1 3.3-8.6 11.965 11.965 0 0 1 .3-8.5s2.7-.9 8.8 3.3a30.873 30.873 0 0 1 8-1.1 30.292 30.292 0 0 1 8 1.1c6.1-4.1 8.8-3.3 8.8-3.3a11.965 11.965 0 0 1 .3 8.5 12.1 12.1 0 0 1 3.3 8.6c0 12.3-7.5 15-14.6 15.8a7.746 7.746 0 0 1 2.2 5.9v8.8c0 .9.6 1.8 2.2 1.5A32.021 32.021 0 0 0 32 0z" fill="#ffffff"></path>
                            </svg>
                        </div>
                        <div
                            onClick={() => signIn("github")}
                            className='content-center ml-5 text-white font-bold select-none'>
                            使用 GitHub 登入
                        </div>
                    </div>
                    {/* <div className='flex bg-slate-700 w-fit px-10 py-2 rounded-xl cursor-pointer hover:bg-slate-600'>
                        <div className='flex justify-center'>
                            <svg aria-hidden="true" className="" height="30" version="1.1" viewBox="0 0 64 64" width="30" color='white'>
                                <path data-name="layer2" d="M32 0a32.021 32.021 0 0 0-10.1 62.4c1.6.3 2.2-.7 2.2-1.5v-6c-8.9 1.9-10.8-3.8-10.8-3.8-1.5-3.7-3.6-4.7-3.6-4.7-2.9-2 .2-1.9.2-1.9 3.2.2 4.9 3.3 4.9 3.3 2.9 4.9 7.5 3.5 9.3 2.7a6.93 6.93 0 0 1 2-4.3c-7.1-.8-14.6-3.6-14.6-15.8a12.27 12.27 0 0 1 3.3-8.6 11.965 11.965 0 0 1 .3-8.5s2.7-.9 8.8 3.3a30.873 30.873 0 0 1 8-1.1 30.292 30.292 0 0 1 8 1.1c6.1-4.1 8.8-3.3 8.8-3.3a11.965 11.965 0 0 1 .3 8.5 12.1 12.1 0 0 1 3.3 8.6c0 12.3-7.5 15-14.6 15.8a7.746 7.746 0 0 1 2.2 5.9v8.8c0 .9.6 1.8 2.2 1.5A32.021 32.021 0 0 0 32 0z" fill="#ffffff"></path>
                            </svg>
                        </div>
                        <div
                            onClick={() => signOut()}
                            className='content-center ml-5 text-white font-bold select-none'>
                            登出
                        </div>
                    </div> */}
                    {/* {
                        JSON.stringify(session.data?.user.id)
                    } */}
                </div>
            </div>
        </div>
    )
}

export default page
