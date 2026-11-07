Ext.define('SamosAdmin.movimentos.notaservicos.services.Documento', {
    alternateClassName: 'NotaServicos.services.Documento',
    singleton: true,

    atribuirDocumento: async function(documento, notaservicos) {
        notaservicos.set({
            'ORDENS_SERIE':                documento.get('DOCUMENTOS_SERIE'),
            'ORDENS_ID_DOCUMENTOS':        documento.get('DOCUMENTOS_ID'),
            'DOCUMENTOS_NOME':             documento.get('DOCUMENTOS_NOME'),
            'DOCUMENTOS_ALTERAPRECO':      documento.get('DOCUMENTOS_ALTERAPRECO'),
            'DOCUMENTOS_ID_PESSOAS':       documento.get('DOCUMENTOS_ID_PESSOAS'),
            'DOCUMENTOS_LAYOUT':           documento.get('DOCUMENTOS_LAYOUT'),
            'DOCUMENTOS_DESCONTOITEM':     documento.get('DOCUMENTOS_DESCONTOITEM'),
            'DOCUMENTOS_COLETACARTAO':     documento.get('DOCUMENTOS_COLETACARTAO'),
            'DOCUMENTOS_COLETACHEQUE':     documento.get('DOCUMENTOS_COLETACHEQUE'),
            'DOCUMENTOS_COLETAENTREGA':    documento.get('DOCUMENTOS_COLETAENTREGA'),
            'DOCUMENTOS_COLETAOUTRO':      documento.get('DOCUMENTOS_COLETAOUTRO'),
            'ORDENS_ID_OPERACOES':         documento.get('DOCUMENTOS_ID_OPERACOES'),
            'OPERACOES_NOME':              documento.get('OPERACOES_NOME'),
            'OPERACOES_FINANCEIRO':        documento.get('OPERACOES_FINANCEIRO'),
            'ORDENS_ID_PRAZOS':            1,
            'PRAZOS_NOME':                 documento.get('PRAZOS_NOME'),
            'PRAZOS_PARCELAS':             documento.get('PRAZOS_PARCELAS'),
            'PRAZOS_PARCELAMENTO':         documento.get('PRAZOS_PARCELAMENTO'),
            'PESSOAS_TIPO':                documento.get('PESSOAS_TIPO'),
            'EMPRESAS_ID_CIDADES':         documento.get('EMPRESAS_ID_CIDADES'),
            'CIDADES_NOMEEMPRESA':         documento.get('CIDADES_NOMEEMPRESA'),
            'CIDADES_ESTADOEMPRESA':       documento.get('CIDADES_ESTADOEMPRESA')
/*          'ORDENS_ID_CIDADES':           documento.get('EMPRESAS_ID_CIDADES'),
            'CIDADES_NOMEPRESTACAO':       documento.get('CIDADES_NOMEEMPRESA'),
            'CIDADES_ESTADOPRESTACAO':     documento.get('CIDADES_ESTADOEMPRESA'),
            'ORDENS_IDSKY':                documento.get('EMPRESAS_ID_CIDADES'),
            'CIDADES_NOMEINCIDENCIA':      documento.get('CIDADES_NOMEEMPRESA'),
            'CIDADES_ESTADOINCIDENCIA':    documento.get('CIDADES_ESTADOEMPRESA') */
        });

    },

    verificarSequenciaNS: async function() {
        const querySequenciaNS = await SamosUtils.Request.nodeApi({
            url: `/consultas/verificasequencians`,
            method: 'GET'
        });

        const lista = querySequenciaNS.results[0]['LISTA'] || ''
        
        return lista.slice(0, -1);
    },

    verificarNSPendentes: async function(query) {
        const queryNSPendentes = await SamosUtils.Request.nodeApi({
            url: `/consultas/nspendentes`,
            method: 'GET',
            query: query
        });

        if(queryNSPendentes.results.length == 0) { return false; }

        return queryNSPendentes.results.map(notaservico => {
            const emissao  = momentTz(notaservico['ORDENS_EMISSAO']).format('DD/MM/YYYY');
            const numero   = notaservico['ORDENS_NUMERO'];
            const serie    = notaservico['ORDENS_SERIE'];

            return `Data: ${emissao} - ${serie} ${numero}`;
                            
        }).join('<br>');
    },

    getProximaNFse: async function() {
        const queryProximaNFs = await SamosUtils.Request.nodeApi({
            url: `/consultas/ultimodocto`,
            method: 'GET',
            query: {
                docto: configs.getEmpresa().id.toString() + '0016',
                empresa: configs.getEmpresa().id,
                tabela: 'ORDENS'
            }
        });

        const numeroNfs = queryProximaNFs.results[0]['ULTIMO'] || 0
        
        return numeroNfs
    }

});
