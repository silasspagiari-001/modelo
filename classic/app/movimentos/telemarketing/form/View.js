Ext.define('SamosAdmin.movimentos.telemarketing.form.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formtelemarketing',

    requires: [
        'SamosAdmin.movimentos.telemarketing.list.ViewModel',
        'SamosAdmin.movimentos.telemarketing.list.ViewController'
    ],

    modelName: 'SamosAdmin.movimentos.telemarketing.Model',//'Ext.data.Model',
    hidePaging: true,
    checkSelection: false, 

    leftbuttons: [
        'Novo'
    ],

    rightbuttons: [
        'Sair'
    ],

    height: 600,


    constructor: function() {
        Ext.apply(this, {
            columns: [
                {
                    flex: 1,
                    text: 'Vendedor',
                    dataIndex: 'USUARIOS_LOGIN'
                    
                },
                {
                    flex: false,
                    width: 93,
                    text: 'Data',
                    xtype: 'datecolumn',
                    dataIndex: 'TELEMARKETING_EMISSAO',
                    align: 'center'
                },
                {
                    flex: false,
                    width: 60,
                    text: 'Hora',
                    dataIndex: 'TELEMARKETING_CEP'
                    
                },
                {
                    flex: false,
                    width: 120,
                    text: 'Situação',
                    dataIndex: 'TELEMARKETING_STATUS',
                    renderer: function(value, meta, record) {
                        if (value === 'A') {                    
                            return 'Não localizado';
                        } else if (value === 'B') {
                            return 'Localizado';
                        } else if (value === 'C') {
                            return 'Venda realizada';
                        } else if (value === 'D') {
                            return 'Preço questionado';
                        } else if (value === 'E') {
                            return 'Prazo questionado';
                        } else if (value === 'F') {
                            return 'Sem produto Estoque';
                        } else if (value === 'G') {
                            return 'Aniversariante';
                        } else if (value === 'H') {
                            return 'Pós-venda';
                        }
                    }
                },
                {
                    flex: 1,
                    text: 'Nome do Contato',
                    dataIndex: 'TELEMARKETING_NOME'
                    
                },
                {
                    flex: false,
                    width: 93,
                    text: 'Próximo',
                    xtype: 'datecolumn',
                    dataIndex: 'TELEMARKETING_PROXIMO',
                    align: 'center'
                }        
            ],
            footPanel: [
                {
                    xtype: 'label',
                    flex: 1,
                    padding: '0 0 0 15',
                    style : 'font-weight: bold;color:black;',
                    bind: {
                        text: '{gridformtelemarketing.selection.TELEMARKETING_OBSERVACOES}'
                    }
                }
            ]            
        });

        this.callParent(arguments);
    }
});
