'use strict';

const api = require('../..');

module.exports = {
    create: (data, params) => { 
        return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.livroicms().read(params)
				.then(async res => {
					for(let i in res.results){
						let id = res.results[i]['MOVIMENTOS_ID'];
						await api['relatorios/prudenmoveis/reldanfe']().readById(id, params);
					}
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};