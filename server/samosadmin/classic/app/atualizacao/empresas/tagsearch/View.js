Ext.define('SamosAdmin.atualizacao.empresas.tagsearch.View', {
    extend: 'SamosWidgets.tagsearch.View',
    xtype: 'empresastagsearch',

    requires: [
        'SamosAdmin.atualizacao.empresas.tagsearch.ViewModel',
        'SamosAdmin.atualizacao.empresas.tagsearch.ViewController'
    ],

    title: 'Empresas',

    rightbuttons: [
        'Selecionar',
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Conteúdo',
            flex: 3
        },
        {
            fieldLabel: 'Ordem',
            width: 135,
            store: [
                [0, 'Nome'],
                [1, 'Contéudo'],
                [2, 'Fantasia'],
                [3, 'CPF/CNPJ'],
                [4, 'Código'],
                [5, 'Genérica']
            ]
        },
        {
            fieldLabel: 'Status',
            width: 135,
            store: [
                [0, 'Ativos'],
                [1, 'Inativos'],
                [2, 'Todos']
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],

    gridListeners: {
        'beforeitemclick': 'onBeforeItemClick'
    },
    
    checkSelection: true,

    columns: [
        {
            text: 'Código',
            dataIndex: 'EMPRESAS_ID',
            width : 100,
            align: 'right'
        },
        {
            text: 'CPF/CNPJ',
            xtype: 'cpfcnpjcolumn',
            dataIndex: 'EMPRESAS_CPFCNPJ',
            flex : 5
        },
        {
            text: 'Fantasia',
            dataIndex: 'EMPRESAS_FANTASIA',
            flex : 6.5
        },
        {
            text: 'Cidade',
            dataIndex: 'CIDADES_NOME',
            flex : 5
        },
        {
            text: 'UF',
            dataIndex: 'CIDADES_ESTADO',
            flex : 1
        }
    ],

    viewConfig: {
        getRowClass: function (record, index) {
            if (record.get('jaAdicionado')){
                return 'disabled-row';
            }
        }        
    }
});