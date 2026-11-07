Ext.define('SamosAdmin.movimentos.ordenssky.services.Documento', {
    alternateClassName: 'Ordemsky.services.Documento',
    singleton: true,

    atribuirDocumento: async function(documento, movimento) {
        movimento.set({
            'ORDENS_ID_DOCUMENTOS': documento.get('DOCUMENTOS_ID'),
            'DOCUMENTOS_LAYOUT':    documento.get('DOCUMENTOS_LAYOUT'),
            'ORDENS_ID_OPERACOES':  documento.get('DOCUMENTOS_ID_OPERACOES'),
            'ORDENS_ID_PRAZOS':     documento.get('OPERACOES_ID_PRAZOS')
        });

        const itensAtualizados = (movimento.get('ORDENS_PRODUTOSITENS') || []).map(item => {
            item['ORDENSPRODUTOS_ID_OPERACOES'] = documento.get('DOCUMENTOS_ID_OPERACOES');
            return item;
        });

        movimento.set('ORDENS_PRODUTOSITENS', itensAtualizados);
    }
});
