Ext.define('SamosAdmin.movimentospromocoeslist.View', {
    extend: 'SamosModule.list.View',
    xtype: 'promocoes',

    requires: [
        'SamosAdmin.movimentos.promocoes.form.View',
        'SamosAdmin.movimentos.promocoes.list.ViewController',
        'SamosAdmin.movimentos.promocoes.list.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Alterar Inicio/Validade'
    ],

    rightbuttons: [
        'Sair'
    ],

    hidePaging: true,
    checkSelection: true,
    selecionarPrimeiroAposBuscar: false,

    toolbar: [
        {
            fieldLabel: 'Número',
            width: 80
        },
        {
            fieldLabel: 'Conteúdo',
            flex: 1
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Inicio',
            width: 130
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Final',
            width: 130
        },
        {
            fieldLabel: 'Ordem',
            width: 135,
            store: [
                [0, 'Emissão'],
                [1, 'Número']
            ]
        },
        {
            fieldLabel: 'Status',
            width: 150,
            defaultValue:3,
            store: [
                [0, 'Ativas'],
                [1, 'Inativas'],
                [2, 'Todas'],
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],
    columns: {
        items: [
            {
                flex: false,
                width: 70,
                text: 'N.º',
                dataIndex: 'PROMOCOES_ID',
                align: 'right'
                
            },
            {
                flex: 1,
                text: 'Descrição',
                dataIndex: 'PROMOCOES_NOME'
            },
            {
                flex: false,
                width: 93,
                text: 'Início',
                xtype: 'datecolumn',
                dataIndex: 'PROMOCOES_EMISSAO',
                align: 'center'
            },
            {
                flex: false,
                width: 93,
                text: 'Validade',
                xtype: 'datecolumn',
                dataIndex: 'PROMOCOES_VALIDADE',
                align: 'center'
            }
         ]
    }
});
