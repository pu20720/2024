import { useEffect, useState } from "react";
import { FaFolder, FaFolderOpen } from "react-icons/fa6";
import './style.css';
import { FileIcon } from "./types";
import React from "react";
import { ITreeNode } from "@/lib/interface";

const TreeNode = ({ node, selectedId, setSelectedId }: { node: ITreeNode, selectedId: string, setSelectedId: (id: string) => void }) => {
   const [isOpen, setIsOpen] = useState(false);

   const toggle = () => {
      if (node.id === selectedId) {
         setIsOpen(!isOpen)
      }
      setSelectedId(node.id)
   };

   return (
      <div className="relative">
         <div className="tree-node select-none relative">
            {(node.children && isOpen) && (
               <div className="h-[calc(100%-35px)] mt-[30px] w-[8px] absolute border-dashed border-r-[1px] border-slate-500"></div>
            )}
            <div
               className={`h-[25px] toggle-content flex ${isOpen ? "open" : ""} hover:bg-slate-800`}
               onClick={toggle}
            >
               <div className="flex items-center mr-1">
                  {node.fileType === "folder" && (isOpen ? <FaFolderOpen /> : <FaFolder />)}
                  {
                     node.fileType !== "folder" && (
                        FileIcon[node.fileType].icon && React.createElement(FileIcon[node.fileType].icon)
                     )
                  }
               </div>
               <span>{node.name}</span>
            </div>
            <div className={`children ${isOpen ? 'open' : ''}`}>
               {node.children && <TreeView data={node.children} />}
            </div>
         </div>
      </div>
   )
};

const TreeView = ({ data }: { data: ITreeNode[] }) => {

   const [selectedId, setSelectedId] = useState<string>("");

   useEffect(() => {
      console.log("selectedId", selectedId);
   }, [selectedId]);

   return (
      <div className="tree-view">
         {data.map((node) => (
            <TreeNode key={node.id} node={node} selectedId={selectedId} setSelectedId={setSelectedId} />
         ))}
      </div>
   )
}

export default TreeView;