'use strict';

const fs      = require('fs');
const path    = require('path');
const appRoot = path.dirname(require.main.filename);
const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const mkdirp  = require('mkdirp');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, tipo, status, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';

            let sqlWhere = `where PESSOAS_ID > 0 `;
            let sqlOrder = '';
            let sqlRG = '';

            if(process.env[params.client ? ((params.client || '').toUpperCase() + '_CAMPORG') : 'CAMPORG'] == 'TRUE') {
                sqlRG = 'PESSOAS_TELEFONECOBRANCA AS REGISTRO_GERAL,'
            }    

            if(params.categoria && params.categoria != 'T') {
                sqlWhere += `and PESSOAS_CATEGORIA = ${params.categoria} `
            }
            
            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and PESSOAS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {  
                sqlWhere += status == 0 ? `and PESSOAS_STATUS = 'T' ` : status == 1 ? `and PESSOAS_STATUS = 'F' ` : '';
                
                if(tipo && tipo != 0 && ordem != 6){
                    sqlWhere += `and PESSOAS_TIPO = '${tipo}' `;
                }
                
                if(ordem == 0) {
                    sqlWhere += `and PESSOAS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by PESSOAS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and PESSOAS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by PESSOAS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += `and PESSOAS_ENDERECO like '%${conteudo}%' `;
                    sqlOrder = ' order by PESSOAS_ENDERECO ';  
                } else if (ordem == 3) {
                    sqlWhere += `and PESSOAS_EMAIL like '${conteudo}%' `;
                    sqlOrder = ' order by PESSOAS_EMAIL ';  
                } else if (ordem == 4) {
                    sqlWhere += `and PESSOAS_CPFCNPJ = '${utils.string.onlyNumbers(conteudo)}' `;
                    sqlOrder = ' order by PESSOAS_ID ';  
                } else if (ordem == 5) {
                    sqlWhere += conteudo > 0 ? `and PESSOAS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by PESSOAS_ID ';  
                } else if(ordem == 6){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'PESSOAS',
                        chave: 'PESSOAS_ID',
                        campos: [
                            'PESSOAS_ID', 
                            'PESSOAS_NOME', 
                            'PESSOAS_FANTASIA', 
                            'PESSOAS_CPFCNPJ', 
                            'PESSOAS_INSCRICAO', 
                            'PESSOAS_EMAIL'
                        ],
                        where: "PESSOAS_STATUS = 'T'"
                    }, params);

                    sqlWhere += `and PESSOAS_ID = '${id}' `;
                    sqlOrder = ' order by PESSOAS_ID '; 
                } else if (ordem == 7) {
                    sqlWhere += `and (
                        CIDADES.CIDADES_NOME         like '%${conteudo}%' or
                        CIDADESCOBRANCA.CIDADES_NOME like '%${conteudo}%'
                    )`;
                    sqlOrder = ' order by PESSOAS_NOME ';  
                } else if (ordem == 8) {
                    sqlWhere += `and (
                        PESSOAS_TELEFONE         like '%${conteudo}%' or 
                        PESSOAS_CELULAR          like '%${conteudo}%' or 
                        PESSOAS_CELULARCOBRANCA  like '%${conteudo}%'
                    ) `;
                    sqlOrder = ' order by PESSOAS_NOME ';  
                } else if(ordem == 9) {
                    sqlWhere += `and PESSOAS_FANTASIA like '%${conteudo}%' `; 
                    sqlOrder = ' order by PESSOAS_FANTASIA ';
                }
            }  

            const sqlCount  = `select count(*) from PESSOAS 
                    left outer join CIDADES on CIDADES.CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADES
                    left outer join CIDADES as CIDADESCOBRANCA on CIDADESCOBRANCA.CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADESCOBRANCA 
                ${sqlWhere} `;

            const sql = `select ${limits} PESSOAS.*, 
                    ${sqlRG}
                    CIDADES.CIDADES_NOME,
                    CIDADES.CIDADES_ESTADO,
                    CIDADES.CIDADES_IBGE,
                    CIDADES.CIDADES_STATUS,
                    CIDADESCOBRANCA.CIDADES_NOME   as CIDADES_NOMECOBRANCA,
                    CIDADESCOBRANCA.CIDADES_ESTADO as CIDADES_ESTADOCOBRANCA,
                    CIDADESCOBRANCA.CIDADES_IBGE   as CIDADES_IBGECOBRANCA,
                    USUARIOS_NOME as USUARIOS_NOMEVENDEDOR,
                    USUARIOS_LOGIN as USUARIOS_LOGINVENDEDOR
                from PESSOAS
                left outer join USUARIOS                   on USUARIOS_ID = PESSOAS_ID_USUARIOS
                left outer join CIDADES                    on CIDADES.CIDADES_ID         = PESSOAS.PESSOAS_ID_CIDADES
                left outer join CIDADES as CIDADESCOBRANCA on CIDADESCOBRANCA.CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADESCOBRANCA 
                ${sqlWhere} ${sqlOrder}`;

            let total   = await samosFB.count(sqlCount, params);
            let results = await samosFB.executeSQL(sql, params);

            results.forEach(pessoa => {
                if((params.client || 'racaforte').toUpperCase() == 'RACAFORTE') {                    
                    pessoa['PARTIDA_NFE']     = (pessoa['PESSOAS_IBGE'] || '').split('|')[0] || 'F';
                    pessoa['CLASSE_CADASTRO'] = (pessoa['PESSOAS_IBGE'] || '').split('|')[1] || 'A';
                }
                pessoa['XML_AUTOMATICO'] = (pessoa['PESSOAS_INCLUSAO'] || '').split('|')[1] || 'F';
                pessoa['VCTO_FIXO'] = (pessoa['PESSOAS_OBSERVACOES'] || '').split('|')[1] || '';
                pessoa['PESSOAS_OBSERVACOES'] = (pessoa['PESSOAS_OBSERVACOES'] || '').split('|')[0];
                pessoa['PESSOAS_OBSERVACOES'] = pessoa['PESSOAS_OBSERVACOES'].replace(/\\n/g, '\n');
            });

            const caminhoFotos = params.client ? `/public/uploads/${params.client}/pessoas/` : `/public/uploads/pessoas/`;

            if (fs.existsSync(`${appRoot}${caminhoFotos}`)) {
                const fotos = await fs.readdirSync(`${appRoot}${caminhoFotos}`);
                
                for(let i in results) {
                    const fotoEncontrada = await fotos.find(foto => {
                        return foto.split('.').slice(0, -1).join('.') == results[i]['PESSOAS_ID'];
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

            for (let i in results) {
                try {
                    results[i]['XML_AUTOMATICO'] = results[i]['PESSOAS_INCLUSAO'].split('|')[1] || 'F';
                    results[i]['PESSOAS_FORMULA'] = JSON.parse(results[i]['PESSOAS_FORMULA']) || [];
                    for (let j in results[i]['PESSOAS_FORMULA']) {                        
                        if(results[i]['PESSOAS_FORMULA'][j]['ID']) {   // entra aqui se for preco específico do cliente
                            results[i]['PESSOAS_FORMULA'][j]['ID_ITEM'] = (parseInt(j) + 1) * (-1)
                            results[i]['PESSOAS_FORMULA'][j]['PRODUTOS_NOME'] = (await samosFB.executeSQL(`
                                select PRODUTOS_NOME from PRODUTOS where PRODUTOS_ID = ${results[i]['PESSOAS_FORMULA'][j]['ID']}
                            `, params))[0]['PRODUTOS_NOME'];
                        }

                        if( results[i]['PESSOAS_FORMULA'][j]['tipo'] ){   // entra aqui se for formula de transporte
                            results[i]['FORMULA_TIPO'] = results[i]['PESSOAS_FORMULA'][j]['tipo'],
                            results[i]['FORMULA_URBANOA'] = results[i]['PESSOAS_FORMULA'][j]['urbA'],
                            results[i]['FORMULA_URBANOB'] = results[i]['PESSOAS_FORMULA'][j]['urbB'],
                            results[i]['FORMULA_SUBURBANOA'] = results[i]['PESSOAS_FORMULA'][j]['subA'],
                            results[i]['FORMULA_SUBURBANOB'] = results[i]['PESSOAS_FORMULA'][j]['subB']
                        }

                        if( results[i]['PESSOAS_FORMULA'][j]['codigo'] ){   // entra aqui se for formula de fornecedor
                            results[i]['FORMULA_CODIGO']   = results[i]['PESSOAS_FORMULA'][j]['codigo'],
                            results[i]['FORMULA_DESCONTO'] = results[i]['PESSOAS_FORMULA'][j]['desconto'],
                            results[i]['FORMULA_IPI']      = results[i]['PESSOAS_FORMULA'][j]['ipi'],
                            results[i]['FORMULA_SEGURO']   = results[i]['PESSOAS_FORMULA'][j]['seguro'],
                            results[i]['FORMULA_PRAZO']    = results[i]['PESSOAS_FORMULA'][j]['prazo'],
                            results[i]['FORMULA_FRETE']    = results[i]['PESSOAS_FORMULA'][j]['frete'],
                            results[i]['FORMULA_DESPESAS'] = results[i]['PESSOAS_FORMULA'][j]['despesas']
                        }
                    }
                    results[i]['PESSOAS_FORMULA'] = JSON.stringify(results[i]['PESSOAS_FORMULA'])
                } catch (e) {}
            }

            if((params.propriedades || '').toUpperCase().match(/TRUE/)) { // Tabela de propriedades
                await Promise.all(results.map(async result => {
                    const sqlPropriedades = `
                            select PROPRIEDADES.*, CIDADES_NOME as CIDADES_NOMEPROPRIEDADE, CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
                            (PROPRIEDADES_ENDERECO || ', ' || PROPRIEDADES_NUMERO) as ENDERECO_COMPLETO,
                            (CIDADES_NOME || '/' || CIDADES_ESTADO) as CIDADE_COMPLETA,
                            ${result['PESSOAS_ID']} as PESSOAS_ID,
                            '${result['CLASSE_CADASTRO']}' as CLASSE_CADASTRO,
                            '${result['PESSOAS_OBSERVACOES']}' as PESSOAS_OBSERVACOES,
                            PROPRIEDADES_ID as ID_PROPRIEDADE,
                            '${result['PESSOAS_NOME'].replace(/[^a-zA-Z0-9-]/g, ' ')}' as PESSOAS_NOME,
                            '${result['PESSOAS_NOME'].replace(/[^a-zA-Z0-9-]/g, ' ')}' as MOVIMENTOS_NOME                            
                            from PROPRIEDADES
                            left outer join CIDADES on CIDADES_ID = PROPRIEDADES_ID_CIDADES
                            where PROPRIEDADES_ID_PESSOAS = ${result['PESSOAS_ID']}
                            order by PROPRIEDADES_NOME`;
        
                    result['PESSOAS_PROPRIEDADES'] = await samosFB.executeSQL(sqlPropriedades, params);


                    if((params.client || 'racaforte').toUpperCase() == 'RACAFORTE') {
                        if((result['PESSOAS_PROPRIEDADES'] || []).length == 1) {
                            result['ID_PROPRIEDADE']            = result['PESSOAS_PROPRIEDADES'][0]['PROPRIEDADES_ID'];
                            result['PROPRIEDADES_STATUS']       = result['PESSOAS_PROPRIEDADES'][0]['PROPRIEDADES_STATUS'];
                            result['PROPRIEDADES_NOME']         = result['PESSOAS_PROPRIEDADES'][0]['PROPRIEDADES_NOME'];
                            result['PROPRIEDADES_ENDERECO']     = result['PESSOAS_PROPRIEDADES'][0]['PROPRIEDADES_ENDERECO'];
                            result['PROPRIEDADES_BAIRRO']       = result['PESSOAS_PROPRIEDADES'][0]['PROPRIEDADES_BAIRRO'];                            
                            result['PROPRIEDADES_CEP']          = result['PESSOAS_PROPRIEDADES'][0]['PROPRIEDADES_CEP'];                            
                            result['PROPRIEDADES_CELULAR']      = result['PESSOAS_PROPRIEDADES'][0]['PROPRIEDADES_CELULAR'];                            
                            result['PROPRIEDADES_NUMERO']       = result['PESSOAS_PROPRIEDADES'][0]['PROPRIEDADES_NUMERO'];                            
                            result['PROPRIEDADES_CPFCNPJ']      = result['PESSOAS_PROPRIEDADES'][0]['PROPRIEDADES_CPFCNPJ'];
                            result['PROPRIEDADES_INSCRICAO']    = result['PESSOAS_PROPRIEDADES'][0]['PROPRIEDADES_INSCRICAO'];
                            result['CIDADES_NOMEPROPRIEDADE']   = result['PESSOAS_PROPRIEDADES'][0]['CIDADES_NOMEPROPRIEDADE'];
                            result['CIDADES_ESTADOPROPRIEDADE'] = result['PESSOAS_PROPRIEDADES'][0]['CIDADES_ESTADOPROPRIEDADE'];
                        } else {
                           result['ID_PROPRIEDADE'] = 0;
                        }    
                    } else {
                        result['ID_PROPRIEDADE'] = 0;
                    }
                }))    
            } 

            if((params.assistencias || '').toUpperCase().match(/TRUE/)) { // Tabela de Assistencia tecnica
                await Promise.all(results.map(async result => {
                    const sqlAssistencias = `
                            select ORDENS_ID, 
                                   ORDENS_NUMERO, 
                                   ORDENS_SERIE,
                                   ORDENS_EMISSAO,
                                   ORDENS_ID_PESSOAS,
                                   ORDENS_REFERENCIA,
                                   ORDENS_OBSERVACOES as OBSBRUTA
                            from ORDENS
                            where ORDENS_ID_PESSOAS = ${result['PESSOAS_ID']}
                            order by ORDENS_EMISSAO descending`;

                    let resultsAssistencias = await samosFB.executeSQL(sqlAssistencias, params);

                    await Promise.all(resultsAssistencias.map(async resultAssistencia => {
                        resultAssistencia['ORDENS_OBSERVACOES'] = resultAssistencia['OBSBRUTA'].replace(/\\n/g, '\n')
                    }))    
               
                    result['PESSOAS_ASSISTENCIAS'] = resultsAssistencias;
                }))    
            } 

            if(tipo == 'C' && (params.client || '').toUpperCase().match(/PRUDENMOVEIS|EDULAR/)) {
                let idFilial = params.empresaLogada.toString();
                let contasFilial = (results || []).filter(conta => {
                    return conta['PESSOAS_PAGINA'].indexOf(idFilial) > 0;
                });
                let totalFilial = contasFilial.length;
                results = contasFilial;
                total = totalFilial;
            }
            
            return { results, total }            
        } catch(error) {
            const msg = 'Falha ao buscar pessoas';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (pessoa, params) => {
        try {
            const idCidade    = pessoa['PESSOAS_ID_CIDADES'];
            const cidadesIbge = pessoa['CIDADES_IBGE'];
            const cepsIbge    = pessoa['CEPS_IBGE'];

            if(pessoa['FOTO'] && pessoa['FOTO'].match(/base64/)) {
                const foto         = pessoa['FOTO'];
                const caminhoFotos = params.client ? `/public/uploads/${params.client}/pessoas/` : `/public/uploads/pessoas/`;
                const caminho      = `${appRoot}${caminhoFotos}`;

                if (!fs.existsSync(caminho)){
                    await mkdirp(caminho);
                }
                
                const fotoAntiga = await fs.readdirSync(`${appRoot}${caminhoFotos}`)
                    .find(foto => {
                        return foto.split('.').slice(0, -1).join('.') == pessoa['PESSOAS_ID'];
                    });

                if(fotoAntiga) {
                    fs.unlinkSync(`${appRoot}${caminhoFotos}${fotoAntiga}`);
                }

                const xmlAuto = pessoa['XML_AUTOMATICO'];
                if( xmlAuto ){
                    pessoa['PESSOAS_INCLUSAO'] = pessoa['PESSOAS_INCLUSAO'] + '|' + xmlAuto;
                }

                if((params.client || 'racaforte').toUpperCase() == 'RACAFORTE') {
                    const partidaNfe = pessoa['PARTIDA_NFE'] || 'F';
                    const classePessoa = pessoa['CLASSE_CADASTRO'] || 'A'
                    if( partidaNfe && classePessoa ){
                        pessoa['PESSOAS_IBGE'] = pessoa['PARTIDA_NFE'] + '|' + pessoa['CLASSE_CADASTRO'];
                    }    
                }
                
                const vctoFixo = pessoa['VCTO_FIXO'];

                if( vctoFixo ){
                    pessoa['PESSOAS_OBSERVACOES'] = pessoa['PESSOAS_OBSERVACOES'] + '|' + vctoFixo;
                }
                
                const img64    = foto.split('base64,')[1];
                const extensao = foto.split('data:image/')[1].split(';')[0];

                fs.writeFileSync(`${caminho}/${pessoa['PESSOAS_ID']}.${extensao}`, img64, 'base64');
            }

            if(process.env[params.client ? ((params.client || '').toUpperCase() + '_CAMPORG') : 'CAMPORG'] == 'TRUE') {
                pessoa['PESSOAS_TELEFONECOBRANCA'] = pessoa['REGISTRO_GERAL'] || '';
            }

            await samosFB.insert('PESSOAS', pessoa, params);
            await utils.dblog(params); 

            await verificarIBGECidades(idCidade, cidadesIbge, cepsIbge, params);

            return { results: pessoa };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar pessoa' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, pessoa, params) => {
        try {
            if(pessoa['FOTO'] && pessoa['FOTO'].match(/base64/)) {
                const foto         = pessoa['FOTO'];
                const caminhoFotos = params.client ? `/public/uploads/${params.client}/pessoas/` : `/public/uploads/pessoas/`;
                const caminho      = `${appRoot}${caminhoFotos}`;

                if (!fs.existsSync(caminho)){
                    await mkdirp(caminho);
                }
                
                const fotoAntiga = await fs.readdirSync(`${appRoot}${caminhoFotos}`)
                    .find(foto => {
                        return foto.split('.').slice(0, -1).join('.') == pessoa['PESSOAS_ID'];
                    });

                if(fotoAntiga) {
                    fs.unlinkSync(`${appRoot}${caminhoFotos}${fotoAntiga}`);
                }

                const img64    = foto.split('base64,')[1];
                const extensao = foto.split('data:image/')[1].split(';')[0];

                fs.writeFileSync(`${caminho}/${pessoa['PESSOAS_ID']}.${extensao}`, img64, 'base64');
            }

            let formula = (pessoa['PESSOAS_FORMULA'] || '');
            if( formula.indexOf('tipo') != -1 || formula.indexOf('codigo') != -1) {
                formula = '[' + formula + ']';
            }

            if((params.client || 'racaforte').toUpperCase() == 'RACAFORTE') {
                pessoa['PESSOAS_IBGE'] = pessoa['PARTIDA_NFE'] + '|' + pessoa['CLASSE_CADASTRO'];
            }

            const xmlAuto = pessoa['XML_AUTOMATICO'];
            if( xmlAuto ){
                pessoa['PESSOAS_INCLUSAO'] = (pessoa['PESSOAS_INCLUSAO'].split('|')[0]) + '|' + xmlAuto;
            }

            const vctoFixo = pessoa['VCTO_FIXO'];

            if( vctoFixo ){
                pessoa['PESSOAS_OBSERVACOES'] = (pessoa['PESSOAS_OBSERVACOES'].split('|')[0]) + '|' + vctoFixo;
            }

            delete pessoa['PESSOAS_FORMULA'];
            
            const idCidade    = pessoa['PESSOAS_ID_CIDADES'];
            const cidadesIbge = pessoa['CIDADES_IBGE']
            const cepsIbge    = pessoa['CEPS_IBGE'];

            if(params.client.toUpperCase().match(/STILOMOVEIS/) &&
               (pessoa['PESSOAS_NOME'] || '').match(/\*/)){
                pessoa['PESSOAS_TIPO'] = 'N';
            }

            if(process.env[params.client ? ((params.client || '').toUpperCase() + '_CAMPORG') : 'CAMPORG'] == 'TRUE') {
                pessoa['PESSOAS_TELEFONECOBRANCA'] = pessoa['REGISTRO_GERAL'] || '';
            }

            await samosFB.update(id, 'PESSOAS', pessoa, params);

            delete pessoa['PESSOAS_OBSERVACOES']; //para não dar bug na view, não retorna a observação persistida

            const formulaJSONs = JSON.parse(`${formula || "[]"}`) || [];
            const formulaTratada = [];

            for( let i = 0 ; i < formulaJSONs.length ; i++ )
            {
                const formulaObj  = formulaJSONs[i];
                if(formulaObj['ID']) { // Preço específico
                    formulaTratada.push({
                        'ID' : formulaObj['ID'],
                        'RS' : formulaObj['RS']
                    });
                }
                if(formulaObj['tipo']) { // Parâmetros transporte
                    formulaTratada.push({
                        'tipo' : formulaObj['tipo'],
                        'urbA' : formulaObj['urbA'],
                        'subA' : formulaObj['subA'],
                        'urbB' : formulaObj['urbB'],
                        'subB' : formulaObj['subB']
                    });
                }
                if(formulaObj['codigo']) { // Parâmetros fornecedor
                    formulaTratada.push({
                        'codigo'  : formulaObj['codigo'],
                        'desconto': formulaObj['desconto'],
                        'ipi'     : formulaObj['ipi'],
                        'seguro'  : formulaObj['seguro'],
                        'prazo'   : formulaObj['prazo'],
                        'frete'   : formulaObj['frete'],
                        'despesas': formulaObj['despesas']
                    });
                }
            }

            if(formulaTratada){
                let items = JSON.stringify(formulaTratada)
                    .replace(/\\"/ig, '"')
                    .slice(1, -1);

                //Se nao tem chave, adiciona
                if( items[0] != '[' && items[items.length-1] != ']' ){
                    items = `[${items}]`;
                }

                //se for parametros de transporte ou de fornecedor ele tira a chave
                if((items.indexOf('tipo') != -1 || items.indexOf('codigo') != -1 ) && items[0] == '[' && items[items.length-1] == ']' ){
                    items = items.slice(1, items.length-1);
                }

                const sql = `update PESSOAS 
                    set PESSOAS_FORMULA = '${items}',
                        PESSOAS_ID      = ${id} 
                    where  PESSOAS_ID   = ${id}`;

                await samosFB.executeSQL(sql, params);
            }

            await utils.dblog(params);
            await verificarIBGECidades(idCidade, cidadesIbge, cepsIbge, params);

            return { results: pessoa };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar pessoa' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'PESSOAS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar pessoa';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    lote: {
        update: async (pessoas, params) => {
            try {
                await samosFB.update('PESSOAS', pessoas, params);
                await utils.dblog(params);
                return { results: pessoas };
            } catch(error) {
                const msg = error.message ? 'Falha ao alterar pessoas por lote' : error;
                console.log(msg);
                console.log(error);
                throw { msg, error };
            }
        }
    }
};

const verificarIBGECidades = async function(idCidade, cidadesIbge, cepsIbge, params) {
    if((parseInt(idCidade) == parseInt(cidadesIbge)) && cepsIbge) {
        const sqlUpdate = `update CIDADES set CIDADES_IBGE = '${cepsIbge}' where CIDADES_ID = '${idCidade}'`;
        
        try {
            await samosFB.executeSQL(sqlUpdate, params);
        } catch(error) {
            //se der erro só joga no log, não para a aplicação
            console.log(error);
        }
    }
};