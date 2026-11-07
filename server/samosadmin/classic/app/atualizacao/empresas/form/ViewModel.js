Ext.define('SamosAdmin.atualizacao.empresas.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formempresas',
    
    constructor: function(){
        this.callParent(arguments);

        this.setFormulas({
            hideImprimir: function(get) {
                return get('updating');
            },

/*            readOnlyAliquota: function(get) {
                const result = get('readOnly') || get('model.EMPRESAS_SIMPLES') == 'F' || 
                                                  parseInt(get('model.EMPRESAS_SIMPLES')) > 0;

                if(result) {
                    this.set('model.EMPRESAS_ALIQUOTA', 0);
                }

                return result;
            },*/

            isCepUnico: function(get) {
                var cep = get('model.EMPRESAS_CEP');

                let sufixo = (cep || '').substring(5, 8);

                return sufixo == '000';
            },

            disableCertificado: function(get) {
                return get('model').phantom
            },

            hideSefaz: function(get) {
                return !get('updating');
            }

        })
    }
});
