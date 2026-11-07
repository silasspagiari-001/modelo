'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');
const axios   = require('axios');
const api     = require('../../../modules');

module.exports = {
    create: async (data, params) => {
        try {
            if(!data['xml'] || data['xml'].length < 10) {
                throw 'Não foi possível enviar o XML para a VTEX';
            }

            const sql = `select MOVIMENTOS_NFE, MOVIMENTOS_TOTAL from MOVIMENTOS where
                MOVIMENTOS_NUMERO = '${data['MOVIMENTOS_NUMEROORIGEM']}' and
                MOVIMENTOS_SERIE  = '${data['MOVIMENTOS_SERIEORIGEM']}'`;

            const results    = await samosFB.executeSQL(sql, params);
            const orderId    = results[0]['MOVIMENTOS_NFE'];
            const valorTotal = results[0]['MOVIMENTOS_TOTAL'];

            if(!orderId) {
                return { msg: 'Não há Pedido VTEX associado à nota' };
            }

            const sqlItems = `select 
                MOVIMENTOSITENS_PRECO,
                MOVIMENTOSITENS_QUANTIDADE,
                PRODUTOS_REFERENCIA
            from MOVIMENTOSITENS 
            join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
            join PRODUTOS   on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
            where
                MOVIMENTOS_NUMERO = '${data['MOVIMENTOS_NUMEROORIGEM']}' and
                MOVIMENTOS_SERIE  = '${data['MOVIMENTOS_SERIEORIGEM']}'`;

            const items = await samosFB.executeSQL(sqlItems, params);

            const dataInvoice = {
                'type'           : 'Output',
                'issuanceDate'   : moment().format(),
                'dispatchedDate' : moment().format(),
                'invoiceNumber'  : data['MOVIMENTOS_NUMERO'],
                'invoiceValue'   : parseInt(valorTotal * 100),
                'embeddedInvoice': data['xml'],
                'courier'        : '',
                'trackingNumber' : '',
                'trackingUrl'    : '',
                'items': items.map(item => {
                    return {
                        'id'      : item['PRODUTOS_REFERENCIA'],
                        'price'   : parseInt(item['MOVIMENTOSITENS_PRECO'] * 100),
                        'quantity': parseInt(item['MOVIMENTOSITENS_QUANTIDADE'])
                    }
                })
            };

            console.log('ENVIO NOTA VTEX');
            console.log(dataInvoice);

            const queryEnvioNota = await axios({ 
                url: `https://hospitalar.myvtex.com/api/oms/pvt/orders/${orderId}/invoice`, 
                method: 'POST',
                headers: {
                    'Accept'             : 'application/json;charset=utf-8',   
                    'Content-Type'       : 'application/json', 
                    'X-VTEX-API-AppKey'  : process.env[params.client ? (params.client.toUpperCase() + '_X-VTEX-API-AppKey')   : 'X-VTEX-API-AppKey'],
                    'X-VTEX-API-AppToken': process.env[params.client ? (params.client.toUpperCase() + '_X-VTEX-API-AppToken') : 'X-VTEX-API-AppToken']
                },
                data: dataInvoice
            });

            console.log(queryEnvioNota);

            try {
                checarEmissaoEtiqueta(orderId, data, params);
            } catch (error) {
                console.log(error);
            }

        } catch(error) {
            const msg = 'Falha ao atualizar status do movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

async function checarEmissaoEtiqueta(orderId, data, params) {
    try {
        const queryGetPedidoVtexCompleto = await axios({ 
            url: `https://hospitalar.myvtex.com/api/oms/pvt/orders/${orderId}`, 
            method: 'GET',
            headers: {
                'Accept'             : 'application/json;charset=utf-8',   
                'Content-Type'       : 'application/json', 
                'X-VTEX-API-AppKey'  : process.env[params.client ? (params.client.toUpperCase() + '_X-VTEX-API-AppKey')   : 'X-VTEX-API-AppKey'],
                'X-VTEX-API-AppToken': process.env[params.client ? (params.client.toUpperCase() + '_X-VTEX-API-AppToken') : 'X-VTEX-API-AppToken']
            }
        });
    
        const pedidoVtexCompleto = queryGetPedidoVtexCompleto.data;
        
        if(
            pedidoVtexCompleto.packageAttachment.packages[0] &&
            pedidoVtexCompleto.packageAttachment.packages[0].trackingNumber
        ) {
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
            const hora = moment.tz(params.timezone).format('HH:mm');

            const usuariosNotificar = data['usuariosNotificar'] || [1];

            if(usuariosNotificar.indexOf(params.userId) == -1) {
                usuariosNotificar.push(params.userId);//notifica o usuário que enviou a nota também
            }

            for (let usuarioNotificar of usuariosNotificar) {
                const notificacao = {
                    'NOTIFICACAO_STATUS'      : 'N',
                    'NOTIFICACAO_TODOS'       : 'F',
                    'NOTIFICACAO_ID_USUARIOS' : 2,//VTEX
                    'NOTIFICACAO_ID_DESTINO'  : usuarioNotificar,
                    'NOTIFICACAO_NOME'        : 'Etiqueta Liberada',
                    'NOTIFICACAO_DATACRIACAO' : hoje,
                    'NOTIFICACAO_HORACRIACAO' : hora,
                    'NOTIFICACAO_DATAAVISAR'  : hoje,
                    'NOTIFICACAO_HORAAVISAR'  : hora,
                    'NOTIFICACAO_DATALEITURA' : '30.12.1899',
                    'NOTIFICACAO_HORALEITURA' : '',
                    'NOTIFICACAO_MENSAGEM'    : `Etiqueta Liberada: ${data['MOVIMENTOS_NUMERO']}-${data['MOVIMENTOS_SERIE']}`,
                    'NOTIFICACAO_SMS'         : 'F'
                };
    
                await api.notificacao().create(notificacao, params);
            }
        
        } else {
            await utils.sleep(5 * 60 * 1000)//aguarda 5 minutos
            return await checarEmissaoEtiqueta(orderId, data, params)
        }
        
    } catch (error) {
        console.log(error);
        await utils.sleep(5 * 60 * 1000)//aguarda 5 minutos
        return await checarEmissaoEtiqueta(orderId, data, params)
    }
}