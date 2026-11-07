Ext.define('SamosAdminModern.orcamentos.services.Documento', {
    alternateClassName: 'Orcamento.services.Documento',
    singleton: true,

    get: function(nomeDocumento, idEmpresa) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            //model: 'SamosAdmin.atualizacao.documentos.Model',
            proxy: {
                url: 'server/documentos',
                extraParams: {
                    ordem: '0',
                    status: 2,
                    start: 0,
                    limit: 1
                }
            }
        });
        
        store.getProxy().setExtraParam('conteudo', nomeDocumento || '')
        store.getProxy().setExtraParam('empresa',  idEmpresa || configs.getEmpresa().id);

        return store.load()
            .then(records => records[0])
            .catch(error => SamosUtils.Msg.error(error, 'Erro no servidor'));
    },

    verificarNFPendentes: async function(query) {
        const queryNFPendentes = await SamosUtils.Request.nodeApi({
            url: `/consultas/nfpendentes`,
            method: 'GET',
            query: query
        });

        if(queryNFPendentes.results.length == 0) { return false; }

        return queryNFPendentes.results.map(movimento => {
            const emissao  = momentTz(movimento['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
            const numero   = movimento['MOVIMENTOS_NUMERO'];
            const serie    = movimento['MOVIMENTOS_SERIE'];

            return `Data: ${emissao} - ${serie} ${numero}`;
                            
        }).join('<br>');
    },

    atribuirDocumento: async function(documento, movimento) {
        movimento.set({
            'MOVIMENTOS_ID_DOCUMENTOS':    documento.get('DOCUMENTOS_ID'),
            'DOCUMENTOS_NOME':             documento.get('DOCUMENTOS_NOME'),
            'DOCUMENTOS_ALTERAPRECO':      documento.get('DOCUMENTOS_ALTERAPRECO'),
            'DOCUMENTOS_ID_PESSOAS':       documento.get('DOCUMENTOS_ID_PESSOAS'),
            'DOCUMENTOS_LAYOUT':           documento.get('DOCUMENTOS_LAYOUT'),
            'DOCUMENTOS_DESCONTOITEM':     documento.get('DOCUMENTOS_DESCONTOITEM'),
            'DOCUMENTOS_COLETACARTAO':     documento.get('DOCUMENTOS_COLETACARTAO'),
            'DOCUMENTOS_COLETACHEQUE':     documento.get('DOCUMENTOS_COLETACHEQUE'),
            'DOCUMENTOS_COLETATRANSPORTE': documento.get('DOCUMENTOS_COLETATRANSPORTE'),
            'DOCUMENTOS_COLETAENTREGA':    documento.get('DOCUMENTOS_COLETAENTREGA'),
            'DOCUMENTOS_COLETAOUTRO':      documento.get('DOCUMENTOS_COLETAOUTRO'),
            'MOVIMENTOS_ID_OPERACOES':     documento.get('DOCUMENTOS_ID_OPERACOES'),
            'OPERACOES_NOME':              documento.get('OPERACOES_NOME'),
            'OPERACOES_UNICA':             documento.get('OPERACOES_UNICA'),
            'OPERACOES_COMPLEMENTAR':      documento.get('OPERACOES_COMPLEMENTAR'),
            'OPERACOES_FINANCEIRO':        documento.get('OPERACOES_FINANCEIRO'),
            'OPERACOES_FINALIDADE':        documento.get('OPERACOES_FINALIDADE'),
            'OPERACOES_TIPO':              documento.get('OPERACOES_TIPO'),
            'OPERACOES_BAIXAVISTA':        documento.get('OPERACOES_BAIXAVISTA'),
            'OPERACOES_ID_APLICACOES':     documento.get('OPERACOES_ID_APLICACOES'),
            'MOVIMENTOS_ID_APLICACOES':    documento.get('APLICACOES_ID'),
            'APLICACOES_NOME':             documento.get('APLICACOES_NOME'),
            'MOVIMENTOS_ID_PRAZOS':        documento.get('OPERACOES_ID_PRAZOS'),
            'PRAZOS_NOME':                 documento.get('PRAZOS_NOME'),
            'PRAZOS_PARCELAS':             documento.get('PRAZOS_PARCELAS'),
            'PRAZOS_PARCELAMENTO':         documento.get('PRAZOS_PARCELAMENTO'),
            'PESSOAS_TIPO':                documento.get('PESSOAS_TIPO'),
            'CONSUMIDOR_CIDADESNOME':      documento.get('CIDADES_NOME'),
            'CONSUMIDOR_CIDADESESTADO':    documento.get('CIDADES_ESTADO')
        });

        const itensAtualizados = (movimento.get('MOVIMENTOS_ITENS') || []).map(item => {
            item['MOVIMENTOSITENS_ID_OPERACOES'] = documento.get('DOCUMENTOS_ID_OPERACOES');
            return item;
        });

        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);

        if(documento.get('DOCUMENTOS_COLETATRANSPORTE') == 'T') {
            movimento.get('MOVIMENTOS_ENVIO')[0]['MOVIMENTOSENVIO_ID_TRANSPORTES'] = 0;
        };
    } 
});
