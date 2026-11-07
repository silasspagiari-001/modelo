Ext.define('SamosAdmin.movimentos.romaneiosindustria.services.Documento', {
    alternateClassName: 'RomaneioIndustria.services.Documento',
    singleton: true,

    atribuirDocumento: function(documento, form) {
        const romaneio = form.model;

        romaneio.set({
            'ROMANEIOS_ID_DOCUMENTOS': documento.get('DOCUMENTOS_ID'),
            'DOCUMENTOS_LAYOUT'      : documento.get('DOCUMENTOS_LAYOUT'),  
        });   

        const jaAtribuidoPessoa = (parseInt(romaneio.get('ROMANEIOS_ID_PESSOAS')) > 0);

        if(!jaAtribuidoPessoa) {
            romaneio.set({
                'ROMANEIOS_ID_PESSOAS': documento.get('DOCUMENTOS_ID_PESSOAS'),
                'PESSOAS_NOME'        : documento.get('PESSOAS_NOME'),
                'PESSOAS_CPFCNPJ'     : documento.get('PESSOAS_CPFCNPJ'),
                'CIDADES_NOME'        : documento.get('CIDADES_NOME'),
                'CIDADES_ESTADO'      : documento.get('CIDADES_ESTADO'),
                'PESSOAS_EMAIL'       : documento.get('PESSOAS_EMAIL'),
                'PESSOAS_TELEFONE'    : documento.get('PESSOAS_TELEFONE'),
                'PESSOAS_CELULAR'     : documento.get('PESSOAS_CELULAR'),
                'PESSOAS_FORMULA'     : documento.get('PESSOAS_FORMULA')
            }); 
        }
    }
});
