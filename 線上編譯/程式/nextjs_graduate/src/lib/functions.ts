import { FILE_TYPE } from "./interface";

export const getFileFullType = (fileName: string) => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    switch (fileExtension) {
        case "c":
            return "c";
        case "cpp":
            return "cpp";
        case "py":
            return "python";
        case "js":
            return "javascript";
        default:
            return "text";
    }
}

export const getFileType = (fileName: string) => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    switch (fileExtension) {
        case "c":
            return "c";
        case "cpp":
            return "cpp";
        case "py":
            return "py";
        case "js":
            return "js";
        default:
            return "text";
    }
}