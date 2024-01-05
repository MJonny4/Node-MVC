import fs from "fs";

const deleteFile = (filePath: fs.PathLike) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw err;
        }
    });
};

export default deleteFile;
