const fs = require('fs');

let delFile = async (srcFolder) => {
    await fs.readdir(srcFolder, (err, files) => {
        console.log('список файлов до удаления: ' + files)
        if (!!files) 
        {
            files.forEach((file, i) => {
                fs.unlink(srcFolder + file, err => {
                    if (err) throw err;
                });
            })
        }
    })
    console.log('Файлы успешно удалёны');
}

module.exports = delFile;