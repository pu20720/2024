export interface IFile {
   id: string,
   label: string,
   user_id: string,
}

export interface IFolder {
   id: string;
   label: string;
   parent_folder: string | null;
   user_id: string;
}

export interface ITreeNode {
   id: string,
   name: string,
   fileType: string,
   children?: ITreeNode[],
   isExpanded?: boolean,
   isHighlighted?: boolean,
}


export interface IFolderNode extends IFolder {
   children: IFolderNode[];
   editable?: boolean;
}

export interface IUser {
   id?: string,
   username: string,
   root_folder_id: string,
   create_at: Date,
   chat_delete_at?: Date,
}

export interface IChat {
   id?: string,
   chat_room: number,
   author: string,
   content: string,
   create_at: Date,
}

export interface IOpenedFile {
   code?: string,
   file_id: string,
   file_name: string,
   file_type: FILE_TYPE,
   owner_id: string,
}

/*
-------------------------------------------
----------------Component------------------
-------------------------------------------
*/
export interface IFileTree {
   data: IFolder[];
   rootFolderId: string;
   onFolderSelected: (selectedFolderId: string) => void;
   newFolderClicked: React.MouseEvent | undefined;
   onFoldersUpdate: (newFolders: IFolder[]) => void;
}

export type FILE_TYPE = "c" | "cpp" | "python" | "javascript" | "text"