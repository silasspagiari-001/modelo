'use strict'; 

const fs = require('fs');

const createApi = (api, dir, subfolder) => {
    fs.readdir(`${dir}`, (err, files) => {
        if(err) { throw(err); }
    
        for(let file of files) {
            const resource = file.split('.');
            const extension = resource.pop();

            if(extension != 'js') {
                createApi(api, `${dir}/${file}`, `${subfolder}${file}/`);
            } else {
                api[`${subfolder}${resource.join('')}`] = function() {
                    return require(`./${subfolder}${resource.join('')}`);
                };
            }
        }
    });
};

module.exports = (function() {
    const api = {
        auth: () => require('./auth')
    };

    createApi(api, `${__dirname}`, '');

    return api;
})();
