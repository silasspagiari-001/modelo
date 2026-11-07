Ext.define('SamosAdminModern.pedidos.form.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.pedidosform',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            status: function(get) {
                if(configs.getClientName() == 'hospitalar') {
                    return { 
                        'Q': 'Pendente',
                        'N': 'Não Faturado',
                        'M': 'Não Faturado',
                        'S': 'Em Separação',
                        'P': 'Em Conferência',
                        'I': 'Fechado',
                        'F': 'Faturado',
                        'E': 'Faturado',
                        'C': 'Cancelado',
                        'B': 'Cancelado',
                        'H': 'Transferir',
                        'A': 'Nota Emitida',
                        'R': 'Preparando Entrega'
                    }[
                        get('model.MOVIMENTOS_STATUS')
                    ]
                    
                } else {
                    return { 
                        'N': 'Não Faturado',
                        'M': 'Não Faturado',
                        'F': 'Faturado',
                        'E': 'Faturado',
                        'C': 'Cancelado',
                        'B': 'Cancelado',
                        'H': 'Transferir',
                        'A': 'Nota Emitida'
                    }[
                        get('model.MOVIMENTOS_STATUS')
                    ]
                }
            },

            situacao: function(get) {
                return (
                    configs.getMovimentos().conferenciaItensPedido ? { 
                        '0': 'A Conferir',
                        '1': 'Conferido'
                    } : 
                    configs.getMovimentos().sistemaDeAprovacao ? {
                        'P': 'Pendente',
                        'A': 'Aprovado',
                        'R': 'Reprovado'
                    } : {
                        '0': 'Entregue',
                        '1': 'Entregar'
                    })
                    [
                        get('model.MOVIMENTOS_SITUACAO')
                    ]
            },

            valorProdutos: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_PRODUTOS'));
            },

            valorPartida: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_IMPOSTO'));
            },

            valorPercentual: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_PERCENTUAL'));
            },

            valorDescontos: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_DESCONTOS'));
            },

            valorDespesas: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_DESPESAS'));
            },

            valorTotal: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_TOTAL'));
            },

            hideConferencia: function (get) {
                return !configs.getMovimentos().conferenciaItensPedido ||
                       get('model.MOVIMENTOS_STATUS') != 'S' || 
                       get('model.MOVIMENTOS_SITUACAO') == 1;
            },

            modelNumero: function(get) {
                var idProperty = get('model').getIdProperty ? get('model').getIdProperty() : '',
                    numeroProperty = idProperty.split('_')[0] + '_NUMERO',
                    force = get('forceChangeId'),
                    numero = get('model').get ? get('model').get(numeroProperty) : '';

                return !numero ? '******' : numero;
            }
        });
    }
});
