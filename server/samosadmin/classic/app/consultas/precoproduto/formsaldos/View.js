Ext.define('SamosAdmin.consultas.precoproduto.form.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formprecossaldos',

    requires: [
        'SamosAdmin.consultas.precoproduto.formsaldos.ViewModel',
        'SamosAdmin.consultas.precoproduto.formsaldos.ViewController'
    ],

    leftbuttons: [
        'Fotos'
    ],

    rightbuttons: [
        'Sair'
    ],

    title: 'Saldos',
    hidePaging: true,

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            this.focus();
            const disponivel = record.get('SALDOS_DISPONIVEL');

            if (disponivel == 0) {
                return "zerado";
            } else if (disponivel > 0) {
                return "estoque";
            } else if (disponivel < 0) {
                return "negativo";
            }
        }
    },

    constructor: function() {
        Ext.apply(this, {
            columns: [
                    {
                        text: 'Loja',
                        dataIndex: 'EMPRESAS_ID',
                        flex : false,
                        width: 90,
                        align: 'center'
                    },
                    {
                        text: 'Fantasia',
                        dataIndex: 'EMPRESAS_FANTASIA',
                        flex: 1
                    },
                    {
                        text: 'Saldo',
                        dataIndex: 'SALDOS_DISPONIVEL',
                        flex : false,
                        width: 80,
                        align: 'right'
                    },
                    {
                        text: 'Pendência',
                        dataIndex: 'SALDOS_RESERVADO',
                        hidden: !configs.getUsuario().privilegiado,
                        flex : false,
                        width: 130,
                        align: 'right'
                    },
                    {
                        text: 'Comprado',
                        dataIndex: 'SALDOS_COMPRADO', 
                        hidden: !configs.getUsuario().privilegiado,                          
                        flex : false,
                        width: 130,
                        align: 'right'
                    }
                ],

            footPanel: [
                {
                    xtype: 'label',
                    flex: 1,
                    padding: '10 0 10 15',
                    style: 'font-weight: bold;color: blue;',
                    bind: {
                        text: '{promocoes.nome}'
                    }
                },
                {
                    xtype: 'label',
                    width: 80,
                    padding: '10 0 10 15',
                    style : 'font-weight: bold;color: blue;',
                    bind: {
                        text: '{promocoes.termino}'
                    }
                },
                {
                    xtype: 'label',
                    width: 100,
                    padding: '10 0 10 15',
                    style : 'text-align:right;font-weight: bold;color: blue;',
                    bind: {
                        text: '{promocoes.partida}'
                    }
                },
                {
                    xtype: 'label',
                    width: 100,
                    padding: '10 0 10 15',
                    style : 'text-align:right;font-weight: bold;color: blue;',
                    bind: {
                        text: '{promocoes.partidaA}'
                    }
                },
                {
                    xtype: 'label',
                    width: 100,
                    padding: '10 0 10 15',
                    style : 'text-align:right;font-weight: bold;color: blue;',
                    bind: {
                        text: '{promocoes.partidaB}'
                    }
                },
                {
                    xtype: 'label',
                    width: 140, // 110
                    padding: '10 20 10 15',
                    style : 'text-align:right;font-weight: bold;color: blue;',
                    bind: {
                        text: '{promocoes.partidaC}'
                    }
                }
            ]
        });

        this.callParent(arguments);
    }            
});
