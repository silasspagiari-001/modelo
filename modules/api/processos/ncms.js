'use strict';

const nodeFirebird    = require('node-firebird');
const moment          = require('moment-timezone');
const email           = require('../../email');
const fs              = require('fs');
const { string } = require('../../../services/samosUtils');

module.exports = {
    read: async (params) => {
        let { cliente,hostname,portnumber} = params;

        const pathORIGEM   = '/home/samosadmin/automacao/dados/samosdb.fdb';
        const pathDESTINO  = process.platform === 'win32'?'c:\\databases\\' + cliente.trim() + '\\samosdb.fdb':'/home/samosadmin/' + cliente.trim() + '/dados/samosdb.fdb';

        const configORIGEM = {
            database: pathORIGEM,
            host: 'databases.samosweb.com.br',
            port: '3060',
            user: 'SYSDBA',
            password: 'masterkey',
            role: null,
            pageSize: 16384,
            timeout: 5000
        };
        
        const configDESTINO = {
            database: pathDESTINO,
            host: hostname.trim(),
            port: portnumber.trim(),
            user: 'SYSDBA',
            password: 'masterkey',
            role: null,
            pageSize: 16384,
            timeout: 5000
        };

        const NCMS_VERSAO_ORIGEM = await queryFirebird(
            configORIGEM,
            "select max(NCMS_VERSAO) as NCMS_VERSAO from NCMS"
        );

        const NCMS_VERSAO_DESTINO = await queryFirebird(
            configDESTINO,
            "select max(NCMS_VERSAO) as NCMS_VERSAO from NCMS"
        );

        if ( NCMS_VERSAO_ORIGEM[0]['NCMS_VERSAO'] != NCMS_VERSAO_DESTINO[0]['NCMS_VERSAO']) {

            let NCMS_ORIGEM = [];

            try {
                NCMS_ORIGEM = await queryFirebird(configORIGEM,"select * from NCMS order by NCMS_NCM");
            } catch (erro) {
                console.error("Erro:", erro.message);
            }

            const sqlUpdateNCMS = `update NCMS set NCMS_STATUS = 'F'`;
            
            let resultUpdateNCMS = [];         
                                        
            try {
                resultUpdateNCMS = await queryFirebird(configDESTINO,sqlUpdateNCMS);
            } catch (error) {
                console.error(`Erro ao carregar destino:`, error.message);
            }


            const sqlNcmsBlock = `execute block
                                as
                                    declare variable V_ULTIMO integer;
                                begin
                                    select max(NCMS_ID)
                                    from NCMS
                                    into :V_ULTIMO;
                                    execute statement 'alter sequence GEN_NCMS_ID restart with ' || coalesce(:V_ULTIMO,0);
                                end`;
            
            let resultNcmsBLock = [];         
                                        
            try {
                resultNcmsBLock = await queryFirebird(configDESTINO,sqlNcmsBlock);
            } catch (error) {
                console.error(`Erro ao carregar destino:`, error.message);
            }

            for (const itens of NCMS_ORIGEM) {
                    const sqlExecuteBlock = `execute block returns (RETORNO varchar(20))
                                            as
                                                begin
                                                    RETORNO = 'sucesso';
                                                    if (exists(select NCMS_NCM from NCMS where NCMS_NCM = '${itens.NCMS_NCM}')) then
                                                        begin
                                                            update NCMS set NCMS_STATUS            = 'T',
                                                                            NCMS_NOME              = left('${itens.NCMS_NOME.replace(/'/g, "''")}',512),
                                                                            NCMS_ALIQUOTANACIONAL  = ${toNumber(itens.NCMS_ALIQUOTANACIONAL)},
                                                                            NCMS_ALIQUOTAESTADUAL  = ${toNumber(itens.NCMS_ALIQUOTAESTADUAL)},
                                                                            NCMS_ALIQUOTAIMPORTADO = ${toNumber(itens.NCMS_ALIQUOTAIMPORTADO)},
                                                                            NCMS_ALIQUOTAMUNICIPAL = ${toNumber(itens.NCMS_ALIQUOTAMUNICIPAL)},
                                                                            NCMS_VERSAO            = '${itens.NCMS_VERSAO}'
                                                            where NCMS_NCM = '${itens.NCMS_NCM}';
                                                            when any do
                                                                begin
                                                                    RETORNO = 'erro ao atualizar';
                                                                end  
                                                        end
                                                    else
                                                        begin
                                                            insert into NCMS (NCMS_ID,
                                                                            NCMS_STATUS,
                                                                            NCMS_NOME,
                                                                            NCMS_NCM,
                                                                            NCMS_ALIQUOTANACIONAL,
                                                                            NCMS_ALIQUOTAESTADUAL,
                                                                            NCMS_ALIQUOTAIMPORTADO,
                                                                            NCMS_ALIQUOTAMUNICIPAL,
                                                                            NCMS_VERSAO
                                                                            ) values (
                                                                                        gen_id(GEN_NCMS_ID, 1),
                                                                                        'T',
                                                                                        left('${itens.NCMS_NOME.replace(/'/g, "''")}',512),
                                                                                        left('${itens.NCMS_NCM}',10),
                                                                                        ${toNumber(itens.NCMS_ALIQUOTANACIONAL)},
                                                                                        ${toNumber(itens.NCMS_ALIQUOTAESTADUAL)},
                                                                                        ${toNumber(itens.NCMS_ALIQUOTAIMPORTADO)},
                                                                                        ${toNumber(itens.NCMS_ALIQUOTAMUNICIPAL)},
                                                                                        '${itens.NCMS_VERSAO}'
                                                                                        );
                                                                    when any do
                                                                        begin
                                                                            RETORNO = 'erro ao inserir';
                                                                        end 
                                                        end

                                                    suspend;

                                            end`;

                let resultado = [];                                       
                                            
                try {
                resultado = await queryFirebird(configDESTINO,sqlExecuteBlock);
                } catch (error) {
                    console.error(`Erro ao carregar destino:`, error.message);
                }
                
    //            console.log(cliente + '  ' + itens.NCMS_NCM);
                    
            }

        }

        return [{ result: 'sucesso' }];

    }

};

function toNumber(valor){
    const numero = Number(valor);
    return Number.isNaN(numero) ? 0 : numero;
}

async function queryFirebird(config, sql) {
    const result = await new Promise((resolve, reject) => {
        nodeFirebird.attach(config, (error, db) => {
            if (error) {
                return reject(error);
            }
            db.query(sql, (queryError, results) => {
                db.detach();
                if (queryError) {
                    return reject(queryError);
                }
                resolve(results);
            });
        });
    });
    return result;
}
