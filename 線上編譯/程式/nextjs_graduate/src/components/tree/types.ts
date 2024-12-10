import { IconType } from "react-icons";
import { FaFile, FaJs, FaPython } from "react-icons/fa";

export type FileTypes = "folder" | "txt" | "py" | "js" | "document";

export const FileIcon: Record<string, { icon: IconType }> = {
   "py": { icon: FaPython },
   "js": { icon: FaJs },
   "document": { icon: FaFile }
};