import React, { useEffect, useState } from 'react'
import './style.css';
import TreeView from './TreeView';
import { IFolder, ITreeNode } from '@/lib/interface';

const FileExplorer = ({ foldersData, user_id, onItemSelect }: { foldersData: IFolder[], user_id: string, onItemSelect: (id: string) => void }) => {
   const [data, setData] = useState<ITreeNode[]>([]);

   useEffect(() => {
      const convertToTreeNode = (folders: IFolder[]): ITreeNode[] => {
         const folderMap = new Map<string, ITreeNode>();

         folders.forEach(folder => {
            folderMap.set(folder.id, {
               id: folder.id,
               name: folder.label,
               fileType: 'folder',
               children: [],
               isExpanded: false,
               isHighlighted: false,
            });
         });

         let rootNode: ITreeNode | undefined;

         folders.forEach(folder => {
            const treeNode = folderMap.get(folder.id)!;
            if (folder.parent_folder === null) {
               rootNode = treeNode;
            } else {
               const parentNode = folderMap.get(folder.parent_folder);
               if (parentNode) {
                  parentNode.children?.push(treeNode);
               }
            }
         });

         return rootNode ? rootNode.children || [] : [];
      };

      const treeData = convertToTreeNode(foldersData);
      setData(treeData);
   }, [foldersData]);

   return (
      <div>
         <TreeView data={data} />
         <div
            className="w-full h-[100vh]"
            onClick={() => onItemSelect(user_id)}
         ></div>
      </div>
   )
}

export default FileExplorer
