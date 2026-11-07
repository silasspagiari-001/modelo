Ext.define('SamosAdmin.movimentos.ordenssky.list.rotas.associadas.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'ordensskyrotasassociadas',

    requires: [
        'SamosAdmin.movimentos.ordenssky.list.rotas.associadas.ViewModel',
        'SamosAdmin.movimentos.ordenssky.list.rotas.associadas.ViewController'
    ],

    modelName: 'SamosAdmin.movimentos.ordenssky.Model',
    hidePaging: true,

    rightbuttons: [
        'Sair'
    ],

    constructor: function(config) {
        Ext.apply(this, {
            columns: [
                {
                    width: 100,
                    text: 'N.º',
                    dataIndex: 'ORDENS_NUMERO',
                    align: 'right'
                },
                {
                    width: 115,
                    text: 'Agendamento',
                    xtype: 'datecolumn',
                    align: 'center',
                    dataIndex: 'ORDENSAVARIADOS_AGENDADA'
                },
                {
                    width: 80,
                    text: 'Hora',
                    align: 'center',
                    dataIndex: 'ORDENSAVARIADOS_HORAAGENDADA'
                },
                {
                    flex: 1,
                    text: 'Nome',
                    dataIndex: 'ORDENS_NOME'
                },
                {
                    width: 110,
                    text: 'Identificação',
                    dataIndex: 'ORDENS_IDENTIFICACAO'
                }
            ]
        });

        this.callParent(arguments);
    }
});
