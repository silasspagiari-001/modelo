Ext.define('SamosAdmin.movimentos.coletas.services.Model', {
    alternateClassName: 'Coleta.services.Model',
    singleton: true,

    definirValoresPadrao: async function(form, nomeDocumento) {
        const documento = await Documento.services.Model.get(nomeDocumento)
        await Coleta.services.Model.atribuirDocumento(documento, form.model);
        form.applyTextSearches();
        return documento;
    },

    atribuirDocumento: async function(documento, coleta) {

        coleta.set({
            'COLETAS_ID_DOCUMENTOS': documento.get('DOCUMENTOS_ID'),
            'COLETAS_NUMERO':        documento.get('DOCUMENTOS_NUMERO'),
            'COLETAS_SERIE':         documento.get('DOCUMENTOS_SERIE')
        });                                         
    }
});
