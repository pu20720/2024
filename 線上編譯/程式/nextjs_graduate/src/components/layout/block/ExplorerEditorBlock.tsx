'use client';
import SplitPane, { Pane } from 'split-pane-react';
import 'split-pane-react/esm/themes/default.css'
import React, { useEffect, useState } from 'react'
import EditorTerminalBlock from './EditorTerminalBlock';
import ExtentionNavItem from '../ExtentionNavItem';
import NavExplorer from '@/components/nav/NavExplorer';
import { FILE_TYPE, IOpenedFile } from '@/lib/interface';
import { FaUserCircle } from 'react-icons/fa';
import { TbLogout2 } from 'react-icons/tb';
import { signOut, useSession } from 'next-auth/react';
import { getFileFullType } from '@/lib/functions';

const ExplorerEditorBlock: React.FC = () => {

   const session = useSession();

   // const [navItemLabel, setNavItemLabel] = useState("EXPLORER")
   const [openedData, setOpenedData] = useState<string>("");
   const [fileId, setFileId] = useState<string>("");
   const [fileName, setFileName] = useState<string>("");
   const [ownerId, setOwnerId] = useState<string>("");
   const [userId, setUserId] = useState<string>("");
   const [fileType, setFileType] = useState<FILE_TYPE>("text");

   useEffect(() => {
      if (session.data?.user) {
         setUserId(session.data?.user.id);
         setOwnerId(session.data?.user.id);
      }
   }, [session.data])


   // const handleSelectedItemChange = (label: string) => {
   //    setNavItemLabel(label)
   // };

   const handleOnOpenFile = ({ code, file_id, file_name, owner_id, file_type }: IOpenedFile) => {
      console.log("open", {
         code: code,
         file_id,
         file_name,
         file_type,
         owner_id
      })
      setOpenedData(code ? code : "");
      setFileId(file_id);
      setFileName(file_name);
      setFileType(file_type);
      setOwnerId(owner_id);
   }

   const handleOnLoadFile = (file_id: string, file_name: string, owner_id: string) => {
      setFileId(file_id);
      setFileName(file_name);
      setOwnerId(owner_id);
      setFileType(getFileFullType(file_name));
   }


   const [sizes, setSizes] = useState([
      100,
      '35%',
      'auto',
   ])

   const layoutCSS = {
      height: '100%'
   }

   return (
      <div style={{ height: '100vh' }}>
         <SplitPane
            split='vertical'
            sizes={sizes}
            onChange={setSizes}
         >
            <Pane
               minSize='15%'
               maxSize='80%'
            >
               <div style={{ ...layoutCSS, background: '#1e2227' }}>
                  <div className='flex'>
                     {/* <div className='h-screen'>
                        <ExtentionNavItem onSelectedItemChange={handleSelectedItemChange} />
                     </div> */}
                     <div className='w-full'>
                        <div className='flex border-b-2 border-gray-600'>
                           <div className='pl-2 pr-3 border-r-2 border-gray-700 content-center'>
                              <div
                                 onClick={() => signOut()}
                                 className='text-[#9a9b9d] hover:bg-slate-700 hover:text-gray-300 p-1 rounded-md'>
                                 <TbLogout2 size={18} />
                              </div>
                           </div>
                           <div className='flex items-center justify-between pl-3 h-10'>
                              <div className='flex items-center text-white'>
                                 <FaUserCircle />
                                 <p className='ml-2 text-sm font-mono w-auto'>
                                    {session.data ? session.data?.user?.name : "USER_NAME"}
                                 </p>
                              </div>
                           </div>
                        </div>
                        {/* <p className='pl-5 py-3 text-gray-200 text-sm border-b-2  border-gray-600'>{navItemLabel}</p> */}
                        <div className='h-full'>
                           <NavExplorer onOpenFile={handleOnOpenFile} />
                        </div>
                     </div>
                  </div>
               </div>
            </Pane>
            <EditorTerminalBlock
               code={openedData}
               file_id={fileId}
               file_name={fileName}
               file_type={fileType}
               owner_id={ownerId}
               onLoadFile={handleOnLoadFile}
            />
         </SplitPane >
      </div >
   )
}

export default ExplorerEditorBlock