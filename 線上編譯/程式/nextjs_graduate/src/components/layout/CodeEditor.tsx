import { IOpenedFile } from '@/lib/interface';
import { updateLocalFile } from '@/lib/localAction/files';
import { Editor } from '@monaco-editor/react'
import React, { useEffect, useState } from 'react'
import { FaSave, FaPlay } from 'react-icons/fa';
import { BiSolidFileImport } from "react-icons/bi";
import { IoShareSocial } from "react-icons/io5";
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';

// const socket = io("http://192.168.56.1:3001")

interface ICodeEditor extends IOpenedFile {
   onCompile: (file_id: string, user_id: string) => void;
   onLoadFile: (file_id: string) => void;
}

const CodeEditor = ({
   code, file_id, file_name, owner_id, file_type = "text", onCompile, onLoadFile }: ICodeEditor) => {

   const session = useSession();

   const [newCode, setNewCode] = useState<string>(``);
   const [currentCode, setCurrentCode] = useState<string>("");
   const [hasSave, setHasSave] = useState<boolean>(false);
   const [isOpenLoadFile, setIsOpenLoadFile] = useState<boolean>(false);
   const [loadFileId, setLoadFileId] = useState<string>("");
   // const [canCompile, setCanCompile] = useState<boolean>(true)

   const copyFileId = () => {
      navigator.clipboard.writeText(file_id);
      alert("已複製");
   }

   // useEffect(() => {
   //    if (!session.data?.user) return;
   //    console.log({
   //       owner_id: owner_id,
   //       user_id: session.data?.user.id
   //    })
   //    if (owner_id === session.data?.user.id) {
   //       setCanCompile(true);
   //    } else {
   //       setCanCompile(false);
   //    }
   // }, [owner_id, session.data?.user])

   useEffect(() => {
      setHasSave(false);
      if (code) {
         setNewCode(code);
      } else {
         setNewCode(``);
      }
   }, [code])

   const handleSaveFile = async () => {
      console.log("save", {
         owner_id,
         file_id,
      })
      const response = await updateLocalFile({
         owner_id,
         file_id,
         newContent: currentCode,
      })

      console.log(response);

      if (response.status === 200) {
         setHasSave(false)
      }

   }

   const handleCompileFile = async () => {
      console.log({
         file_id, owner_id
      })
      onCompile(file_id, owner_id);
   }

   const handelCodeUpdate = (e: string) => {
      setCurrentCode(e);
      if (!hasSave) {
         setHasSave(true);
      }
   }

   const handleCancelLoadFile = () => {
      setIsOpenLoadFile(false);
      setLoadFileId("");
   }

   const handleLoadFile = () => {
      setIsOpenLoadFile(false);
      onLoadFile(loadFileId);
      setLoadFileId("");
   }

   // useEffect(() => {
   //    socket.emit("client-ready")
   //    socket.on("get-code-state", () => {
   //       socket.emit("code-state", ({ data: newCode }))
   //    })

   //    socket.on("code-state-from-server", ({ data }) => {
   //       setNewCode(data)
   //    })

   //    socket.on("code-update", ({ data }) => {
   //       setNewCode(data)
   //    })

   //    return () => {
   //       socket.off("get-code-state")
   //       socket.off("code-state-from-server")
   //       socket.off("code-update")
   //    }
   // }, [socket])

   // function handelLoadComplete() {

   // }

   // function handelCodeUpdate(code: string | undefined) {
   //    if (code) {
   //       setNewCode(code)
   //       socket.emit('code-update', { data: code })
   //    }
   // };

   return (
      <div>
         <div className='h-10 flex justify-between pl-5'>
            <div className='flex'>
               <div className='text-[#9a9b9d] content-center border-r-2 border-gray-700'>
                  <div
                     onClick={copyFileId}
                     className='p-1 rounded-md mr-5 hover:bg-slate-600 hover:text-white'>
                     <IoShareSocial size={18} />
                  </div>
               </div>
               <div className='item-center ml-5 h-full content-center'>
                  {
                     hasSave && (
                        <p className='flex text-green-400'>•</p>
                     )
                  }
               </div>
               <p className='content-center text-gray-300 select-none ml-2'>{file_name ? file_name : ""}</p>
            </div>
            <div className='content-center pr-5'>
               <div className='flex gap-x-3'>
                  <div
                     onClick={() => setIsOpenLoadFile(true)}
                     className='p-1 rounded-md text-[#9a9b9d] hover:bg-slate-600 hover:text-white'>
                     <BiSolidFileImport size={18} />
                  </div>
                  <div
                     onClick={handleSaveFile}
                     className='p-1 rounded-md text-[#9a9b9d] hover:bg-slate-600 hover:text-white'>
                     <FaSave size={18} />
                  </div>
                  <div
                     onClick={handleCompileFile}
                     className="p-1 rounded-md text-[#9a9b9d] hover:bg-slate-600 hover:text-white">
                     <FaPlay size={18} />
                  </div>
               </div>
            </div>
         </div>
         <Editor
            theme='vs-dark'
            height="100vh"
            language={file_type}
            value={newCode}
            // onMount={handelLoadComplete}
            onChange={(e) => handelCodeUpdate(e as string)}
            options={{
               tabSize: 4,
               fontSize: 16,
               padding: { top: 20 },
               minimap: {
                  enabled: false,
               },
               cursorStyle: "line",
               formatOnPaste: true,
               autoIndent: "full"
            }}
         />

         {
            isOpenLoadFile && (
               <div className='absolute top-0 left-0 w-full h-full flex justify-center bg-gray-600 bg-opacity-40 items-center'>
                  <div className='relative text-center px-3 pt-8 pb-5 w-[40%] min-w-[300px] bg-gray-200 rounded-md shadow-md shadow-black'>
                     <span
                        onClick={handleCancelLoadFile}
                        className='absolute top-0 right-3 text-3xl cursor-pointer select-none'>&times;</span>
                     <p className='font-bold text-xl'>請輸入要讀取的檔案</p>
                     <input
                        type="text"
                        onChange={(e) => setLoadFileId(e.target.value)}
                        className='bg-transparent border-2 border-gray-400 rounded-md my-5 px-2' />
                     <div className='w-full flex justify-center'>
                        <div
                           onClick={handleLoadFile}
                           className='bg-slate-700 text-white py-1 w-[70%] rounded-md select-none hover:bg-slate-600'>確認</div>
                     </div>
                  </div>
               </div>
            )
         }
      </div >
   )
}

export default CodeEditor