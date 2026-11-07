Ext.define('SamosAdmin.movimentos.movimento.form.pessoa.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentospessoa',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            cadastroCpfDuplicadoLiberado: false
        });

        this.setFormulas({

            hideGravar: function (get) {
                return false;
            },

            disableGravar: function(get) {
                return false;
            },

            isCepUnico: function(get) {
                var cep = get('model.PESSOAS_CEP');

                let sufixo = (cep || '').substring(5, 8);

                return sufixo == '000';
            },

            isPessoaFisica: function(get) {
                var cpf = (get('model.PESSOAS_CPFCNPJ') || '').trim();
                return cpf.length <= 11;
            }

        });
    }
});
