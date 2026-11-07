Ext.define('SamosAdmin.movimentos.encomendas.services.Documento', {
    alternateClassName: 'Encomenda.services.Documento',
    singleton: true,

    atribuirDocumento: async function(documento, movimento) {
        movimento.set({
            'MOVIMENTOS_ID_DOCUMENTOS':    documento.get('DOCUMENTOS_ID'),
            'DOCUMENTOS_NOME':             documento.get('DOCUMENTOS_NOME'),
            'DOCUMENTOS_LAYOUT':           documento.get('DOCUMENTOS_LAYOUT'),
            'MOVIMENTOS_ID_OPERACOES':     documento.get('DOCUMENTOS_ID_OPERACOES'),
            'MOVIMENTOS_ID_PRAZOS':        documento.get('OPERACOES_ID_PRAZOS')
        });

        const itensAtualizados = (movimento.get('MOVIMENTOS_ITENS') || []).map(item => {
            item['MOVIMENTOSITENS_ID_OPERACOES'] = documento.get('DOCUMENTOS_ID_OPERACOES');
            return item;
        });

        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);
    }
});
