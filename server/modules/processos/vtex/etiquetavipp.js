'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const appRoot = path.dirname(require.main.filename);
const mkdirp = require('mkdirp'); 

module.exports = {
    read: async (params) => {
        try {
            const queryImpressaoVipp = await axios({ 
                url: `http://vipp.visualset.com.br/vipp/remoto/ImpressaoRemota.php`, 
                method: 'POST',
                responseType: 'arraybuffer', 
                params: {
                    'Usr'   : process.env[params.client ? (params.client.toUpperCase() + '_USUARIOVIPP') : 'USUARIOVIPP'],
                    'Pwd'   : process.env[params.client ? (params.client.toUpperCase() + '_SENHAVIPP')   : 'SENHAVIPP'],
                    'Filtro': 3,//Etiqueta ViPP
                    'Ordem' : 3,//Etiqueta ViPP
                    'Saida' : 20,//Etiqueta Correios 10x15 (PDF)
                    'Lista' : params['MOVIMENTOS_NUMERO']
                }
            });

            if(queryImpressaoVipp.status != 200){
                throw 'Sem etiqueta para este despacho'
            } else {
                const caminhoPdf = 'public/pdf/';
                const caminhoCompleto = `${appRoot}/public/pdf/`;
                const now = new Date().getTime();

                if (!fs.existsSync(caminhoCompleto)){
                    await mkdirp(caminhoCompleto)
                }
                
                fs.appendFileSync(`${caminhoCompleto}${now}.pdf`, Buffer.from(queryImpressaoVipp.data));

                return { results: [ {name: `${caminhoPdf}${now}.pdf`} ] };
            }
            
        } catch(error) {
            const msg = 'Falha ao obter etiqueta VIPP';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};