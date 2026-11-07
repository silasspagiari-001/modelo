Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.services.Documento', {
    alternateClassName: 'Romaneioconstrucao.services.Documento',
    singleton: true,

    atribuirDocumento: async function(documento, romaneio) {
        romaneio.set({
            'ROMANEIOS_ID_DOCUMENTOS' : documento.get('DOCUMENTOS_ID'),
            'DOCUMENTOS_LAYOUT'       : documento.get('DOCUMENTOS_LAYOUT'),
            'ROMANEIOS_ID_OPERACOES'  : documento.get('DOCUMENTOS_ID_OPERACOES'),
            'ROMANEIOS_ID_TRANSPORTES': 1,
            'TRANSPORTES_NOME'        : 'O MESMO'
        });
    }
});
