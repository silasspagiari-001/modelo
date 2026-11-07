'use strict';

const fs      = require('fs');
const path    = require('path');
const appRoot = path.dirname(require.main.filename);
const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const mkdirp  = require('mkdirp');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let sql = '';
            
            try {
                const { empresa, conteudo, ordem, tipo, status, start, limit } = params;
                const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
                let sqlWhere = `where USUARIOS_ID > 0  `;
                    sqlWhere += empresa ? `and USUARIOS_ID_EMPRESAS = ${empresa} ` : '';
                let sqlOrder = '';

                if(conteudo && conteudo.substring(0, 1) == '.') {
                    sqlWhere += `and USUARIOS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
                } else {      
                    if(tipo && tipo != 'z') {
                        sqlWhere += `and USUARIOS_TIPO = '${tipo}' `; 
                    }

                    if(status) {
                        if(status == 0) {//traz os Internos, Externos e Internos/Externos (todos os ativos)
                            sqlWhere += ` and (USUARIOS_STATUS = 'I' or USUARIOS_STATUS = 'E' or USUARIOS_STATUS = 'T') `
                        } else if (status == 1) {
                            sqlWhere += ` and USUARIOS_STATUS = 'I'`
                        } else if (status == 2) {
                            sqlWhere += ` and USUARIOS_STATUS = 'E'`
                        } else if (status == 3) {
                            sqlWhere += ` and USUARIOS_STATUS = 'T'`
                        } else if (status == 4) {
                            sqlWhere += ` and USUARIOS_STATUS = 'F'`
                        } else if (status == 5) {
                            sqlWhere += ` and USUARIOS_STATUS = 'P'`
                        }
                    }

                    if(ordem == 0) {
                        sqlWhere += `and USUARIOS_NOME like '${conteudo}%' `; 
                        sqlOrder = ' order by USUARIOS_NOME ';  
                    } else if (ordem == 1) {
                        sqlWhere += `and USUARIOS_NOME like '%${conteudo}%' `;
                        sqlOrder = ' order by USUARIOS_NOME ';  
                    } else if (ordem == 2) {
                        sqlWhere += `and upper(USUARIOS_LOGIN) like '%${conteudo.toString().toUpperCase()}%' `;
                        sqlOrder = ' order by USUARIOS_LOGIN ';  
                    } else if (ordem == 3) {
                        sqlWhere += `and USUARIOS_CPFCNPJ like '%${conteudo}%' `;
                        sqlOrder = ' order by USUARIOS_CPFCNPJ ';  
                    } else if (ordem == 4) {
                        sqlWhere += conteudo > 0 ? `and USUARIOS_ID = '${conteudo}' ` : '';
                        sqlOrder = ' order by USUARIOS_ID ';  
                    } else if(ordem == 5){
                        try {
                            const id = await samosFB.buscaMultipla({
                                db, conteudo,
                                tabela: 'USUARIOS',
                                chave: 'USUARIOS_ID',
                                campos: [
                                    'USUARIOS_ID', 
                                    'USUARIOS_NOME',
                                    'USUARIOS_CPFCNPJ',
                                    'USUARIOS_RG',
                                    'USUARIOS_EMAIL',
                                    'USUARIOS_LOGIN'
                                ]
                            });
        
                            sqlWhere += `and USUARIOS_ID = '${id}' `;
                            sqlOrder = ' order by USUARIOS_ID '; 
                        } catch (e) {
                            reject(e);
                        }
                    }
                }    

                const sqlCount  = `select count(*) from USUARIOS ${sqlWhere} `;

                sql = `select ${limits} 
                        USUARIOS_ID,
                        USUARIOS_STATUS,
                        USUARIOS_TIPO,
                        USUARIOS_CPFCNPJ,
                        USUARIOS_RG,
                        USUARIOS_CADASTRO,
                        USUARIOS_VALIDADE,
                        USUARIOS_NOME,
                        USUARIOS_CEP,
                        USUARIOS_ENDERECO,
                        USUARIOS_NUMERO,
                        USUARIOS_BAIRRO,
                        USUARIOS_ID_CIDADES,
                        USUARIOS_TELEFONE,
                        USUARIOS_CELULAR,
                        USUARIOS_EMAIL,
                        USUARIOS_LOGIN,
                        USUARIOS_SENHA,
                        USUARIOS_SKYPE,
                        USUARIOS_COMISSAO,
                        USUARIOS_PRIVILEGIADO,
                        USUARIOS_ID_EMPRESAS,
                        USUARIOS_TEMPO,
                        USUARIOS_NASCIMENTO,
                        USUARIOS_EXPEDIENTE,
                        USUARIOS_INTERVALO,
                        USUARIOS_DIASATIVO,
                        USUARIOS_ULTIMOLOG,
                        CIDADES_NOME,CIDADES_ESTADO,CIDADES_IBGE,
                        EMPRESAS_NOME, EMPRESAS_FANTASIA
                    from USUARIOS
                    left outer join CIDADES on CIDADES_ID = USUARIOS_ID_CIDADES
                    left outer join EMPRESAS on EMPRESAS_ID = USUARIOS_ID_EMPRESAS
                    ${sqlWhere} ${sqlOrder}`;

                const total        = await samosFB.count(db, sqlCount);
                const results      = await db.query(sql);

                const caminhoFotos = params.empresacnpj ? `/public/uploads/${params.empresacnpj}/usuarios/` : `/public/uploads/usuarios/`;

                if (fs.existsSync(`${appRoot}${caminhoFotos}`)) {
                    const fotos = await fs.readdirSync(`${appRoot}${caminhoFotos}`);
                    
                    for(let i in results) {
                        const fotoEncontrada = await fotos.find(foto => {
                            return foto.split('.').slice(0, -1).join('.') == results[i]['USUARIOS_ID'];
                        });

                        results[i]['FOTO'] = fotoEncontrada ? 
                            `${caminhoFotos}${fotoEncontrada}` : 
                            'sem_foto';
                    }
                } else {
                    for(let i in results) {
                        results[i]['FOTO'] = 'sem_foto';
                    }
                }

                for(let usuario of results) {
                    usuario['EXPEDIENTEINICIAL_USUARIOS']   = (usuario['USUARIOS_EXPEDIENTE'] || '00:00|23:59').split('|')[0];
                    usuario['EXPEDIENTEFINAL_USUARIOS']     = (usuario['USUARIOS_EXPEDIENTE'] || '00:00|23:59').split('|')[1];
                    usuario['INTERVALOINICIAL_USUARIOS']    = (usuario['USUARIOS_INTERVALO']  || '00:00|00:00').split('|')[0];
                    usuario['INTERVALOFINAL_USUARIOS']      = (usuario['USUARIOS_INTERVALO']  || '00:00|00:00').split('|')[1];
                    usuario['INTERVALOSABINICIAL_USUARIOS'] = (usuario['USUARIOS_SKYPE']      || '00:00|00:00').split('|')[0];
                    usuario['INTERVALOSABFINAL_USUARIOS']   = (usuario['USUARIOS_SKYPE']      || '00:00|00:00').split('|')[1];
                    usuario['DIASATIVODOM_USUARIOS']        = (usuario['USUARIOS_DIASATIVO']  || 'FTTTTTT').split('')[0];
                    usuario['DIASATIVOSEG_USUARIOS']        = (usuario['USUARIOS_DIASATIVO']  || 'FTTTTTT').split('')[1];
                    usuario['DIASATIVOTER_USUARIOS']        = (usuario['USUARIOS_DIASATIVO']  || 'FTTTTTT').split('')[2];
                    usuario['DIASATIVOQUA_USUARIOS']        = (usuario['USUARIOS_DIASATIVO']  || 'FTTTTTT').split('')[3];
                    usuario['DIASATIVOQUI_USUARIOS']        = (usuario['USUARIOS_DIASATIVO']  || 'FTTTTTT').split('')[4];
                    usuario['DIASATIVOSEX_USUARIOS']        = (usuario['USUARIOS_DIASATIVO']  || 'FTTTTTT').split('')[5];
                    usuario['DIASATIVOSAB_USUARIOS']        = (usuario['USUARIOS_DIASATIVO']  || 'FTTTTTT').split('')[6];
                }
                
                samosFB.enviarRespostaSucesso(db, results, total, resolve);
            } catch(error) {
                samosFB.enviarRespostaErro('Falha ao listar', db, error, reject, sql);
            }
        });
    },

    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let sql = '';
            
            try {
                const lastId = await samosFB.lastId(db, 'USUARIOS', 'GEN_USUARIOS_ID', 'USUARIOS_ID');
                
                data['USUARIOS_ID']        = lastId;
                data['USUARIOS_SENHA']     = new Date().getTime().toString().slice(-6);
                data['USUARIOS_NOVASENHA'] = 'T';

                data['USUARIOS_EXPEDIENTE'] = `${data['EXPEDIENTEINICIAL_USUARIOS']}|${data['EXPEDIENTEFINAL_USUARIOS']}`;
                data['USUARIOS_INTERVALO']  = `${data['INTERVALOINICIAL_USUARIOS']}|${data['INTERVALOFINAL_USUARIOS']}`;
                data['USUARIOS_SKYPE']      = `${data['INTERVALOSABINICIAL_USUARIOS']}|${data['INTERVALOSABFINAL_USUARIOS']}`;
                data['USUARIOS_DIASATIVO']  = [
                    (data['DIASATIVODOM_USUARIOS'] === false || data['DIASATIVODOM_USUARIOS'] == 'F') ? 'F' : 'T',
                    (data['DIASATIVOSEG_USUARIOS'] === false || data['DIASATIVOSEG_USUARIOS'] == 'F') ? 'F' : 'T',
                    (data['DIASATIVOTER_USUARIOS'] === false || data['DIASATIVOTER_USUARIOS'] == 'F') ? 'F' : 'T',
                    (data['DIASATIVOQUA_USUARIOS'] === false || data['DIASATIVOQUA_USUARIOS'] == 'F') ? 'F' : 'T',
                    (data['DIASATIVOQUI_USUARIOS'] === false || data['DIASATIVOQUI_USUARIOS'] == 'F') ? 'F' : 'T',
                    (data['DIASATIVOSEX_USUARIOS'] === false || data['DIASATIVOSEX_USUARIOS'] == 'F') ? 'F' : 'T',
                    (data['DIASATIVOSAB_USUARIOS'] === false || data['DIASATIVOSAB_USUARIOS'] == 'F') ? 'F' : 'T'
                ].join('');

                if(data['FOTO'] && data['FOTO'].match(/base64/)) {
                    const foto         = data['FOTO'];
                    const caminhoFotos = params.empresacnpj ? `/public/uploads/${params.empresacnpj}/usuarios/` : `/public/uploads/usuarios/`;
                    const caminho      = `${appRoot}${caminhoFotos}`;

                    if (!fs.existsSync(caminho)){
                        await mkdirp(caminho);
                    }
                    
                    const fotoAntiga = await fs.readdirSync(`${appRoot}${caminhoFotos}`)
                        .find(foto => {
                            return foto.split('.').slice(0, -1).join('.') == data['USUARIOS_ID'];
                        });

                    if(fotoAntiga) {
                        fs.unlinkSync(`${appRoot}${caminhoFotos}${fotoAntiga}`);
                    }
                    
                    const img64    = foto.split('base64,')[1];
                    const extensao = foto.split('data:image/')[1].split(';')[0];

                    fs.writeFileSync(`${caminho}/${data['USUARIOS_ID']}.${extensao}`, img64, 'base64');
                }
                
                samosFB.removeForeignFields(data, 'USUARIOS');
                
                const fields = Object.keys(data).join(',');
                const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
                
                sql = `insert into USUARIOS (${fields}) values (${values})`;
                
                await db.query(sql);
                samosFB.enviarRespostaSucesso(db, data, 1, resolve);
            } catch(error) {
                console.log(sql);
                console.log(error);
                samosFB.enviarRespostaErro('Falha ao salvar', db, error, reject, sql);
            }
        })
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let sql = '';
            
            try {
                if(data['EXPEDIENTEINICIAL_USUARIOS']) {
                    data['USUARIOS_EXPEDIENTE'] = `${data['EXPEDIENTEINICIAL_USUARIOS']}|${data['EXPEDIENTEFINAL_USUARIOS']}`;
                }
                if(data['INTERVALOINICIAL_USUARIOS']) {
                    data['USUARIOS_INTERVALO']  = `${data['INTERVALOINICIAL_USUARIOS']}|${data['INTERVALOFINAL_USUARIOS']}`;
                }
                if(data['INTERVALOSABINICIAL_USUARIOS']) {
                    data['USUARIOS_SKYPE'] = `${data['INTERVALOSABINICIAL_USUARIOS']}|${data['INTERVALOSABFINAL_USUARIOS']}`;
                }

                if(data['DIASATIVODOM_USUARIOS'] || data['DIASATIVODOM_USUARIOS'] === false) {
                    data['USUARIOS_DIASATIVO']  = [
                        (data['DIASATIVODOM_USUARIOS'] === false || data['DIASATIVODOM_USUARIOS'] == 'F') ? 'F' : 'T',
                        (data['DIASATIVOSEG_USUARIOS'] === false || data['DIASATIVOSEG_USUARIOS'] == 'F') ? 'F' : 'T',
                        (data['DIASATIVOTER_USUARIOS'] === false || data['DIASATIVOTER_USUARIOS'] == 'F') ? 'F' : 'T',
                        (data['DIASATIVOQUA_USUARIOS'] === false || data['DIASATIVOQUA_USUARIOS'] == 'F') ? 'F' : 'T',
                        (data['DIASATIVOQUI_USUARIOS'] === false || data['DIASATIVOQUI_USUARIOS'] == 'F') ? 'F' : 'T',
                        (data['DIASATIVOSEX_USUARIOS'] === false || data['DIASATIVOSEX_USUARIOS'] == 'F') ? 'F' : 'T',
                        (data['DIASATIVOSAB_USUARIOS'] === false || data['DIASATIVOSAB_USUARIOS'] == 'F') ? 'F' : 'T'
                    ].join('');
                }

                if(data['FOTO'] && data['FOTO'].match(/base64/)) {
                    const foto         = data['FOTO'];
                    const caminhoFotos = params.empresacnpj ? `/public/uploads/${params.empresacnpj}/usuarios/` : `/public/uploads/usuarios/`;                    
                    const caminho      = `${appRoot}${caminhoFotos}`;

                    if (!fs.existsSync(caminho)){
                        await mkdirp(caminho);
                    }
                    
                    const fotoAntiga = await fs.readdirSync(`${appRoot}${caminhoFotos}`)
                        .find(foto => {
                            return foto.split('.').slice(0, -1).join('.') == data['USUARIOS_ID'];
                        });

                    if(fotoAntiga) {
                        fs.unlinkSync(`${appRoot}${caminhoFotos}${fotoAntiga}`);
                    }

                    const img64    = foto.split('base64,')[1];
                    const extensao = foto.split('data:image/')[1].split(';')[0];

                    fs.writeFileSync(`${caminho}/${data['USUARIOS_ID']}.${extensao}`, img64, 'base64');
                }
                
                samosFB.removeForeignFields(data, 'USUARIOS');
                const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'');
                
                sql = `update USUARIOS set ${values} where USUARIOS_ID = ${id}`;
                
                await db.query(sql);

                samosFB.enviarRespostaSucesso(db, data, 1, resolve);
                api['processos/gerarlog']().create(params);
            } catch(error) {
                samosFB.enviarRespostaErro('Falha ao alterar', db, error, reject, sql);
            }
        });
    },

    delete: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let sql = '';
            
            try {
                sql = `delete from USUARIOS where USUARIOS_ID = ${id}`;
                
                await db.query(sql);
                samosFB.enviarRespostaSucesso(db, [], 1, resolve);
                api['processos/gerarlog']().create(params);
            } catch(error) {
                samosFB.enviarRespostaErro('Falha ao excluir', db, error, reject, sql);
            }
        });
    }
};
