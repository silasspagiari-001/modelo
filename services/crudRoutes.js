'use strict'; 

const fs = require('fs');

const sendError = (res, error) => {
    let msg;

    if(error instanceof Error) {
        msg = error.toString();

    } else if (error.error instanceof Error) {
        error.error = error.error.toString();
        msg = error;
        
    } else {
        msg = error;
        msg.msg = error.error;
    }

    res.status(400).json(msg);
};

const crud = function (server, api, resource) {
    server.get(`/${resource}`, async (req, res, next) => {
        try {
            const response = await api[resource]().read(req.query, req, res);

            //streams não são devolvidos por aqui, mas pelo próprio fs
            if(response instanceof fs.ReadStream) { return }
            
            response ? res.json(response) : res.send();

        } catch(error) {
            sendError(res, error);
        }

        next();
    });

    server.get(`/${resource}/:id`, async (req, res, next) => {
        try {
            const response = await api[resource]().readById(req.params.id, req.query);
            response ? res.json(response) : res.send();
        } catch(error) {
            sendError(res, error);
        }

        next();
    });

    server.post(`/${resource}`, async (req, res, next) => {
        try {
            req.body = typeof req.body == 'object' ? req.body : JSON.parse(req.body);
            const response = await api[resource]().create(req.body, req.query, req, res);
            res.status(201).json(response);
        } catch(error) {
            sendError(res, error);
        }

        next();
    });

    server.put(`/${resource}/:id`, async (req, res, next) => {
        try {
            if(req.params.id !== 'lote') {
                req.body = typeof req.body == 'object' ? req.body : JSON.parse(req.body);
                const response = await api[resource]().update(req.params.id, req.body, req.query, req, res)
                response ? res.json(response) : res.send();
            }
        } catch(error) {
            sendError(res, error);
        }

        next();
    });

    server.delete(`/${resource}/:id`, async (req, res, next) => {
        try {
            if(req.params.id !== 'lote') {
                const response = await api[resource]().delete(req.params.id, req.query);
                res.status(204).json(response);
            }
        } catch(error) {
            sendError(res, error);
        }

        next();
    });

    //métodos em lote

    server.post(`/${resource}/lote`, async (req, res, next) => {
        try {
            req.body = typeof req.body == 'object' ? req.body : JSON.parse(req.body);
            const response = await api[resource]().lote.create(req.body, req.query);
            res.status(201).json(response);
        } catch(error) {
            sendError(res, error);
        }

        next();
    });

    server.put(`/${resource}/lote`, async (req, res, next) => {
        try {
            req.body = typeof req.body == 'object' ? req.body : JSON.parse(req.body);
            const response = await api[resource]().lote.update(req.body, req.query);
            response ? res.json(response) : res.send();
        } catch(error) {
            sendError(res, error);
        }

        next();
    });

    server.delete(`/${resource}/lote`, async (req, res, next) => {
        try {
            req.body = typeof req.body == 'object' ? req.body : JSON.parse(req.body);
            const response = await api[resource]().lote.delete(req.body, req.query);
            res.status(204).json(response);
        } catch(error) {
            sendError(res, error);
        }

        next();
    });
};

function createCrudRoutes (server, api, dir, subfolder) {
    const files = fs.readdirSync(dir);
    
    for(let file of files) {
        let resource = file.split('.');
        let extension = resource.pop();

        if(extension != 'js') {
            createCrudRoutes(server, api, `${dir}/${file}`, `${subfolder}${file}/`);
        } else {
            crud(server, api, `${subfolder}${resource.join('')}`);
        }
    }
};

module.exports = function(server, api, path = 'modules') {
    if(!server) { throw 'server is undefined'; }
    createCrudRoutes(server, api, path , '');
};