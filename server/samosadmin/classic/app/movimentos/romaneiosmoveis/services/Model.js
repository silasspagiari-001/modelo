Ext.define('SamosAdmin.movimentos.romaneiosmoveis.services.Model', {
    alternateClassName: 'RomaneioMoveis.services.Model',
    singleton: true,

    definirValoresPadrao: async function(form, nomeDocumento) {
        const documento = await Documento.services.Model.get(nomeDocumento);

        if(!documento){
            Ext.Note('warning', `Documento '${nomeDocumento}' não cadastrado nesta empresa`, 5000);
        }

        await RomaneioMoveis.services.Documento.atribuirDocumento(documento, form);
        form.applyTextSearches();
        return documento;
    }
});
