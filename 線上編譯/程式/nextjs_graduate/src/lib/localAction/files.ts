import { IFile } from "../interface";

interface ICreateLocalFile {
    file_id: string,
    owner_id: string
}

interface IDeleteLocalFile {
    file_id: string,
    owner_id: string
}

interface IFetchLocalFileData {
    file_id: string,
    owner_id: string
}

interface IUpdateLocalFileData {
    file_id: string,
    owner_id: string,
    newContent: string,
}

export const fetchLocalFileData = async ({ file_id, owner_id }: IFetchLocalFileData) => {
    try {
        const response = await fetch(`/api/local/file/data?user_id=${owner_id}&file_id=${file_id}`);

        if (response.ok) {
            const result = await response.json();
            return {
                status: response.status,
                message: "Fetch Files Success",
                data: result.content,
            }
        }

        return {
            status: response.status,
            message: "Fetching Files Failed",
            data: [],
        }
    } catch (error) {
        console.error("Error fetching file:", error);
    }
}

export const createLoaclFile = async ({ file_id, owner_id }: ICreateLocalFile) => {
    try {
        const response = await fetch("/api/local/file", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                file_id,
                user_id: owner_id,
            }),
        });

        if (response.ok) {
            return {
                status: response.status,
                message: "Create Files Success",
                data: {
                    owner_id,
                    file_id
                },
            }
        }
        return {
            status: response.status,
            message: "Create Files Failed",
            data: [],
        }
    } catch (error) {
        console.error("Error creating file:", error);
    }
};

export const deleteLoaclFile = async ({ file_id, owner_id }: IDeleteLocalFile) => {
    try {
        const response = await fetch("/api/local/file", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                file_id,
                user_id: owner_id
            }),
        });

        if (response.ok) {
            return {
                status: response.status,
                message: "Delete Files Success",
                data: {
                    file_id,
                    user_id: owner_id
                },
            }
        }
        return {
            status: response.status,
            message: "Delete Files Failed",
            data: [],
        }
    } catch (error) {
        console.error("Error deleting file:", error);
    }
};

export const updateLocalFile = async ({ file_id, owner_id, newContent }: IUpdateLocalFileData) => {
    try {
        const response = await fetch(`/api/local/file/data`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: owner_id,
                file_id,
                newContent,
            }),
        });

        if (response.ok) {
            return {
                status: response.status,
                message: "Update File Success",
                data: {
                    // user_id,
                    // file_id,
                    newContent: newContent
                },
            };
        }

        return {
            status: response.status,
            message: "Update File Failed",
            data: [],
        };
    } catch (error) {
        console.error("Error updating file:", error);
        return {
            status: 500,
            message: "Update File Error",
            error: error instanceof Error ? error.message : String(error),
        };
    }
};