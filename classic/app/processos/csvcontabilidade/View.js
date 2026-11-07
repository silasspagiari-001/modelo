Ext.define('SamosAdmin.processos.csvcontabilidade.View', {
    extend: 'SamosModule.list.View',
    xtype: 'csvcontabilidade',

    requires: [
        'SamosAdmin.processos.csvcontabilidade.ViewController',
        'SamosAdmin.processos.csvcontabilidade.ViewModel'
    ],

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    leftbuttons: [
        'Enviar'
    ],

    rightbuttons: [
        'Sair'
    ],

    hidePaging: true,
    checkSelection: true,
    selecionarPrimeiroAposBuscar: false,

    constructor: function() {
        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Email',
                    xtype: 'samoswidgets-textlower',
                    emptyText: '',
                    flex: 1,
                    listeners: {
                        change: function (txt, nv) {
                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                        }
                    }
                },
                {
                    fieldLabel: 'Ordem',
                    width: 135,
                    store: [
                        [0, 'Nome'],
                        [1, 'Contéudo'],
                        [2, 'Fantasia'],
                        [3, 'CPF/CNPJ'],
                        [4, 'Código']
                    ]
                },
                {
                    fieldLabel: 'Ano',
                    width: 90,
                    store: new Array(3).fill(0).map((ano, index) => {
                        return parseInt(momentServer().format('YYYY')) - 1 + index;
                    })
                },
                {
                    fieldLabel: 'Mês',
                    width: 130,
                    /*store: new Array(12).fill(0).map((ano, index) => {
                        return [parseInt(index) + 1, Ext.Date.monthNames[index]];
                    }),*/
                    store: [
                        ['01', 'Janeiro'],
                        ['02', 'Fevereiro'],
                        ['03', 'Março'],
                        ['04', 'Abril'],
                        ['05', 'Maio'],
                        ['06', 'Junho'],
                        ['07', 'Julho'],
                        ['08', 'Agosto'],
                        ['09', 'Setembro'],
                        ['10', 'Outubro'],
                        ['11', 'Novembro'],
                        ['12', 'Dezembro']
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
                        flex: 0.7,
                        text: 'Código',
                        dataIndex: 'EMPRESAS_ID',
                        align: 'center'
                    },
                    {
                        width: 155,
                        text: 'CPF/CNPJ',
                        xtype: 'cpfcnpjcolumn',
                        dataIndex: 'EMPRESAS_CPFCNPJ'
                    },
                    {
                        flex: 2.5,
                        text: 'Razão Social',
                        dataIndex: 'EMPRESAS_NOME'
                    },
                    {
                        flex: 1.9,
                        text: 'Fantasia',
                        dataIndex: 'EMPRESAS_FANTASIA'
                    },
                    {
                        width: 125,
                        xtype: 'phonecolumn',
                        text: 'Telefone',
                        dataIndex: 'EMPRESAS_TELEFONE'
                    },
                    {
                        flex: 2,
                        text: 'Cidade',
                        dataIndex: 'CIDADES_NOME'
                    },
                    {
                        flex: 0.5,
                        text: 'UF',
                        dataIndex: 'CIDADES_ESTADO'
                    }
                ]
            }
        });

        this.callParent(arguments);
    }
});
