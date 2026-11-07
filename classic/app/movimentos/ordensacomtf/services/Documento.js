Ext.define('SamosAdmin.movimentos.ordensacomtf.services.Documento', {
    alternateClassName: 'Ordemacomtf.services.Documento',
    singleton: true,

    atribuirDocumento: async function(documento, ordem) {
        ordem.set({
            'ORDENS_ID_DOCUMENTOS'   :  documento.get('DOCUMENTOS_ID'),
            'DOCUMENTOS_LAYOUT'      :  documento.get('DOCUMENTOS_LAYOUT'),
            'DOCUMENTOS_ALTERAPRECO' :  documento.get('DOCUMENTOS_ALTERAPRECO'),
            'ORDENS_ID_OPERACOES'    :  documento.get('DOCUMENTOS_ID_OPERACOES'),
            'ORDENS_ID_PRAZOS'       :  documento.get('OPERACOES_ID_PRAZOS'),
            'OPERACOES_FINANCEIRO'   :  documento.get('OPERACOES_FINANCEIRO'),
            'PRAZOS_NOME'            :  documento.get('PRAZOS_NOME')
        });

        const itensAtualizados = (ordem.get('ORDENS_PRODUTOSITENS') || []).map(item => {
            item['ORDENSPRODUTOS_ID_OPERACOES'] = documento.get('DOCUMENTOS_ID_OPERACOES');
            return item;
        });

        ordem.set('ORDENS_PRODUTOSITENS', itensAtualizados);
    }
});
