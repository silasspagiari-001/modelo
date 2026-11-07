Ext.define('SamosAdmin.atualizacao.cidades.services.Model', {
    alternateClassName: 'Cidade.services.Model',
    singleton: true,

    validar: function(txt, cidade, vm){
        if(!cidade.get('CIDADES_IBGE')){
            Ext.Note('warning', 'Cidade sem IBGE');
            
            setTimeout(() => {
                txt.setValue('');

                vm.get('model').set({
                    'EMPRESAS_ID_CIDADES': '',
                    'CIDADES_NOME'       : '',
                    'CIDADES_ESTADO'     : '',
                    'CIDADES_IBGE'       : ''
                });

                txt.focus(true);
            }, 500);
        }
    }
});
