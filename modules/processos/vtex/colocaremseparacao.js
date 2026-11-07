'use strict';

const samosFB = require('../../../services/samosFB');
const axios   = require('axios');

module.exports = {
    update: async (id, data, params) => {
        let vtex = true;//flag para saber se foi possível atualizar na vtex

        try {
            const sqlUpdateStatus = `update MOVIMENTOS set MOVIMENTOS_STATUS = 'S' where MOVIMENTOS_ID = '${id}'`;
            await samosFB.executeSQL(sqlUpdateStatus, params);
            
            if(data['orderIdVtex']) {
                try {
                    await axios({ 
                        url: `https://hospitalar.myvtex.com/api/oms/pvt/orders/${data['orderIdVtex']}/start-handling`, 
                        method: 'POST',
                        headers: {
                            'Accept'             : 'application/json;charset=utf-8',   
                            'Content-Type'       : 'application/json', 
                            'X-VTEX-API-AppKey'  : process.env[params.client ? (params.client.toUpperCase() + '_X-VTEX-API-AppKey')   : 'X-VTEX-API-AppKey'],
                            'X-VTEX-API-AppToken': process.env[params.client ? (params.client.toUpperCase() + '_X-VTEX-API-AppToken') : 'X-VTEX-API-AppToken']
                        }
                    });
                    
                } catch (error) {
                    console.log(error);
                    vtex = false;
                }
            }

            return { vtex };
            
        } catch(error) {
            const msg = 'Falha ao colocar pedido em separação';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};