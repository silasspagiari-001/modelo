Ext.define('SamosAdmin.movimentos.movimento.form.transporte.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentostransporte',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                const formMovimento = Ext.$('formmovimentos')[0];                
                return get('updating') || formMovimento.getViewModel().get('isNotaEmitida');
            },

            hideConfirmar: function(get) {
                return get('hideFechar') || !get('hideGravar');
            },

            hideGravar: function (get) {
                const formMovimento = Ext.$('formmovimentos')[0];
                
                return get('readOnly') || !formMovimento.getViewModel().get('readOnly');
            },

            disableConfirmar: function(get) {
                return false;
            },

            disableGravar: function(get) {
                return false;
            },

            transporteAssociations: function(get) {

                [
                    ['MOVIMENTOSENVIO_ID_TRANSPORTES', 'TRANSPORTES_ID'],
                    ['MOVIMENTOSENVIO_NOME',           'TRANSPORTES_NOME'],
                    ['MOVIMENTOSENVIO_MODO',           'TRANSPORTES_MODO'],
                    ['MOVIMENTOSENVIO_CPFCNPJ',        'TRANSPORTES_CPFCNPJ'],
                    ['MOVIMENTOSENVIO_CEP',            'TRANSPORTES_CEP'],
                    ['MOVIMENTOSENVIO_ENDERECO',       'TRANSPORTES_ENDERECO'],
                    ['MOVIMENTOSENVIO_INSCRICAO',      'TRANSPORTES_INSCRICAO'],
                    ['MOVIMENTOSENVIO_NUMERO',         'TRANSPORTES_NUMERO'],
                    ['MOVIMENTOSENVIO_BAIRRO',         'TRANSPORTES_BAIRRO'],
                    ['MOVIMENTOSENVIO_ID_CIDADES',     'TRANSPORTES_ID_CIDADES'],
                    ['TRANSPORTES_EMAIL',              'TRANSPORTES_EMAIL'],
                    ['CIDADES_NOME',                   'CIDADES_NOME'],
                    ['CIDADES_ESTADO',                 'CIDADES_ESTADO'],
                    ['CIDADES_IBGE',                   'CIDADES_IBGE']
                ]
            }
        });
    }
});
