Ext.define('SamosAdmin.relatorios.vendaperiodo.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendaperiodolist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueTipo          : '3',
            valueTipoCliente   : 'R',
            valueStatus        : 0,
            valueOrdem         : 2,
            valueQuebra        : 0,
            valueOperacao      : 0,
            valueItens         : 0,
            valueVacina        : 0,
            valueEmiinicio     : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueEmifinal      : momentServer().endOf('month').format('DD/MM/YYYY')
        }),


        this.setFormulas({
            hideVacina: function (get) {
                return !configs.getProdutos().vacinas
            },

            hideImprimir: function(get){
                return false;
            },

            labelpessoaf: function(get) {
                // prioridade para o cliente
                if (configs.getClientName() === 'racaforte') {
                    return 'Fornecedor Produto';
                }

                // regra original
                return get('valueTipo') == 2
                    ? 'Pessoa B'
                    : 'Pessoa Final';
            }

            //hideTeste: function(get){
            //    return false;
            //}

        });
        
    }
});
