'use client';
import SplitPane, { Pane } from 'split-pane-react';
import { FaSave } from "react-icons/fa";
import 'split-pane-react/esm/themes/default.css'
import React, { useEffect, useState } from 'react'
import CodeEditor from '../CodeEditor';
import { FILE_TYPE, IOpenedFile } from '@/lib/interface';
import { asyncCompileFile } from '@/lib/backend/compile';
import { asyncfetchFile, asyncfetchFileData } from '@/lib/actions/files';
import { fetchLocalFileData } from '@/lib/localAction/files';
import { getFileFullType } from '@/lib/functions';

interface IEditorTerminalBlock extends IOpenedFile {
   onLoadFile: (file_id: string, file_name: string, oner_id: string) => void;
}

const EditorTerminalBlock = ({
   code, file_id, file_name, owner_id, file_type = "text", onLoadFile
}: IEditorTerminalBlock) => {

   const [sizes, setSizes] = useState([
      100,
      '5%',
      'auto',
   ]);

   const layoutCSS = {
      height: '100%'
   };

   const [compileInput, setCompileInput] = useState<string>("");
   const [compileOutput, setCompileOutput] = useState<string>("");
   const [codeData, setCodeData] = useState<string>("");
   const [fileId, setFileId] = useState<string>("");
   const [fileName, setFileName] = useState<string>("");
   const [ownerId, setOwnerId] = useState<string>("");
   const [fileType, setFileType] = useState<FILE_TYPE>("text");

   useEffect(() => { setOwnerId(owner_id) }, [owner_id])
   useEffect(() => { setFileId(file_id) }, [file_id])
   useEffect(() => { setFileName(file_name) }, [file_name])
   useEffect(() => { setFileType(file_type) }, [file_type])
   useEffect(() => {
      setCodeData(code ? code : "");
   }, [code])

   const handleOnCompile = async (file_id: string, owner_id: string) => {
      const fileData = await asyncfetchFile(owner_id, file_id);
      if (fileData.data) {
         const res = await asyncCompileFile(compileInput, file_type, fileData.data)
         const data = res.message
         setCompileOutput(
            data
               .replaceAll(new RegExp(`uploads/${file_id}\\.(c|cpp|py|js)\\b`, 'g'), file_name)
               .replaceAll('/home/cmrdb/nestjs_graduate/', '')
         )
      }
   }

   const handleOnLoadFile = async (file_id: string) => {
      const fileData = await asyncfetchFileData(file_id);
      if (fileData.data) {
         const oner_id = fileData.data.user_id;

         const res = await fetchLocalFileData({
            file_id: file_id,
            owner_id: oner_id
         })

         if (res) {
            onLoadFile(fileData.data.id, fileData.data.label, oner_id)
            console.log({
               code: res.data,
               filename: fileData.data.label,
               fileid: fileData.data.id,
               fileType: getFileFullType(fileData.data.label),
               ownerId: oner_id
            })
            setCodeData(res.data);
            setFileName(fileData.data.label);
            setFileId(fileData.data.id);
            setOwnerId(oner_id);
            setFileType(getFileFullType(fileData.data.label));
         }
         return;
      }
      alert("檔案不存在")
   }

   return (
      <div style={{ height: '100vh' }}>
         <SplitPane
            split='horizontal'
            sizes={sizes}
            onChange={setSizes}
         >
            <Pane minSize='20%' maxSize='90%'>
               <div style={{ ...layoutCSS, background: '#23272e' }}>
                  {/* <div className='flex justify-between border-b-2 border-slate-600'>
                     <p className='px-5 py-3 text-gray-200 text-sm'>EDITOR</p>

                  </div>
                  <div> */}
                  <CodeEditor
                     code={codeData}
                     file_id={fileId}
                     file_name={fileName}
                     file_type={fileType}
                     owner_id={ownerId}
                     onCompile={handleOnCompile}
                     onLoadFile={handleOnLoadFile}
                  />
                  {/* </div> */}
               </div>
            </Pane>
            <div style={{ ...layoutCSS, background: '#2a2f38' }}>
               <div className='grid grid-cols-3 h-full'>
                  <div className='col-span-1 border-r-[1px] border-gray-700'>
                     <p className='pl-5 py-3 text-gray-200 text-sm border-b-2 border-gray-600 select-none'>INPUT</p>
                     <div className='pt-3 pl-7 pr-3 h-full text-white font-sans text-sm'>
                        <textarea
                           className='w-full h-[100%] bg-transparent outline-none'
                           onChange={(e) => setCompileInput(e.target.value)}></textarea>
                     </div>
                  </div>
                  <div className='col-span-2'>
                     <p className='pl-5 py-3 text-gray-200 text-sm border-b-2  border-gray-600 select-none'>TERMINAL</p>
                     <div className='pt-3 pl-7 pr-3 h-full text-white font-sans text-sm'>
                        <pre className='whitespace-pre-wrap'>
                           {compileOutput}
                        </pre>
                     </div>
                  </div>
               </div>
            </div>
         </SplitPane >
      </div>
   )
}

export default EditorTerminalBlock