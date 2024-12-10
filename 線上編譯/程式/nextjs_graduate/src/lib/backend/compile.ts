export const asyncCompileFile = async (input: string, fileType: string, file: File):
    Promise<{ status: number; message: string }> => {
    const formData = new FormData();
    formData.append("input", input);
    formData.append("type", fileType);
    formData.append("file", file);

    const response = await fetch("http://localhost:3333/terminal/running", {
        method: "POST",
        body: formData,
    });

    if (response.ok) {
        const res = await response.json();
        return {
            status: response.status,
            message: res.message,
        };
    }

    return {
        status: response.status,
        message: "Compile File Failed: " + response.statusText,
    };
};