Ext.define('SamosAdmin.movimentos.ordensmoveis.services.Documento', {
    alternateClassName: 'Ordemmoveis.services.Documento',
    singleton: true,

    atribuirDocumento: async function(documento, ordemmoveis) {
        ordemmoveis.set({
            'ORDENS_ID_DOCUMENTOS': documento.get('DOCUMENTOS_ID'),
            'DOCUMENTOS_LAYOUT':    documento.get('DOCUMENTOS_LAYOUT'),
            'ORDENS_ID_OPERACOES':  documento.get('DOCUMENTOS_ID_OPERACOES'),
            'ORDENS_ID_PRAZOS':     documento.get('OPERACOES_ID_PRAZOS'),
            'EMPRESAS_CNAE':        documento.get('EMPRESAS_CNAE')
        });

        const itensAtualizados = (ordemmoveis.get('ORDENS_PRODUTOSITENS') || []).map(item => {
            item['ORDENSPRODUTOS_ID_OPERACOES'] = documento.get('DOCUMENTOS_ID_OPERACOES');
            return item;
        });

        ordemmoveis.set('ORDENS_PRODUTOSITENS', itensAtualizados);
    }
});
