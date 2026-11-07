Ext.define('SamosAdmin.atualizacao.transportes.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formtransportes',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({

            isCepUnico: function(get) {
                var cep = get('model.TRANSPORTES_CEP');

                let sufixo = (cep || '').substring(5, 8);

                return sufixo == '000';
            },

        });
    }    


});
