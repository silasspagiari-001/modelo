Ext.define('SamosAdmin.movimentos.ordenssky.list.recebidas.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'ordensskyrecebidas',

    requires: [
        'SamosAdmin.movimentos.ordenssky.list.recebidas.ViewModel',
        'SamosAdmin.movimentos.ordenssky.list.recebidas.ViewController'
    ],

    title: 'Ordens de Serviço Recebidas',
    modelName: 'SamosAdmin.movimentos.ordenssky.Model',
    hidePaging: true,

    rightbuttons: [
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            return 'verde';
        }
    },

    constructor: function(config) {
        Ext.apply(this, {
            width: innerWidth - 300,
            toolbar: [
                {
                    fieldLabel: 'Numero',
                    width: 95
                },
                {
                    fieldLabel: 'Conteúdo',
                    flex: 1
                },
                {
                    xtype: 'datefield',
                    reference: 'datainicio',
                    fieldLabel: 'Inicio',
                    width: 120
                },
                {
                    xtype: 'datefield',
                    fieldLabel: 'Final',
                    width: 120
                },
                {
                    fieldLabel: 'Ordem',
                    width: 135,
                    store: [
                        [0, 'Número'],
                        [1, 'Identificação'],
                        [2, 'Endereço'],
                        [3, 'Captura']
                    ]
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ],

            columns: [
                {
                    width: 90,
                    text: 'N.º',
                    dataIndex: 'ORDENS_NUMERO',
                    align: 'right'
                },
                {
                    width: 240,
                    text: 'Nome',
                    dataIndex: 'ORDENS_NOME'
                },
                {
                    width: 120,
                    text: 'Celular',
                    dataIndex: 'ORDENS_CELULAR',
                    renderer: function(value, meta, record) {
                        return Ext.util.Format.maskRenderer('(99) 99999-9999')(value);
                    }
                },
                {
                    width: 170,
                    text: 'Cidade',
                    dataIndex: 'CIDADES_NOME'
                },
                {
                    width: 40,
                    text: 'Uf',
                    dataIndex: 'CIDADES_ESTADO'
                },
                {
                    width: 100,
                    text: 'Período',
                    dataIndex: 'ORDENS_PERIODO',
                    renderer: function(value, meta, record) {
                        const options = {
                            'M': 'Manhã',
                            'T': 'Tarde',
                            'N': 'Noite',
                            'D': 'Definir'
                        }

                        return options[value];
                    }
                },
                {
                    width: 110,
                    text: 'Identificação',
                    dataIndex: 'ORDENS_IDENTIFICACAO'
                },
                {
                    width: 85,
                    text: 'CEP',
                    dataIndex: 'ORDENS_CEP'
                },
                {
                    width: 240,
                    text: 'Endereço',
                    dataIndex: 'ORDENS_ENDERECO'
                },
                {
                    width: 80,
                    text: 'Número',
                    dataIndex: 'ORDENS_NUMEROLC'
                },
                {
                    width: 200,
                    text: 'Complemento',
                    dataIndex: 'ORDENS_COMPLEMENTO'
                },
                {
                    width: 200,
                    text: 'Bairro',
                    dataIndex: 'ORDENS_BAIRRO'
                },
                {
                    width: 130,
                    text: 'Telefones',
                    dataIndex: 'ORDENS_CONTATOS'
                },
                {
                    width: 200,
                    text: 'Plano',
                    dataIndex: 'ORDENS_PLANO'
                },
                {
                    width: 95,
                    text: 'Captura',
                    xtype: 'datecolumn',
                    align: 'center',
                    dataIndex: 'ORDENS_EMISSAO'
                },
                {
                    width: 115,
                    text: 'Hora Captura',
                    align: 'center',
                    dataIndex: 'ORDENS_HORAEMISSAO'
                },
                {
                    width: 70,
                    text: 'Tempo',
                    dataIndex: 'ORDENS_TEMPO'
                }
            ]
        });

        this.callParent(arguments);
    }
});
