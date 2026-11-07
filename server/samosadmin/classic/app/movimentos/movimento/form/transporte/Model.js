Ext.define('SamosAdmin.movimentos.movimento.form.transporte.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSENVIO_ID',
    idParent: 'MOVIMENTOSENVIO_ID_MOVIMENTOS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'MOVIMENTOSENVIO_ID': -1,
            'MOVIMENTOSENVIO_ID_CIDADES': configs.getPermissao()['EMPRESAS_ID_CIDADES'],
            'MOVIMENTOSENVIO_REFERENTE' : '',
            'MOVIMENTOSENVIO_QUANTIDADE' : configs.getMovimentos().calculaPesoNfe ? 0 : 1,
            'MOVIMENTOSENVIO_PESOLIQUIDO' : 0,
            'MOVIMENTOSENVIO_CEP' : '',
            'MOVIMENTOSENVIO_ID_TRANSPORTES' : 1,
            'MOVIMENTOSENVIO_PESOBRUTO' : 0,
            'MOVIMENTOSENVIO_MODO': configs.getMovimentos().defaultFretePorConta ? configs.getMovimentos().defaultFretePorConta : ' ',
            'MOVIMENTOSENVIO_NOME': 'O MESMO',
            'MOVIMENTOSENVIO_INSCRICAO': '',
            'MOVIMENTOSENVIO_ENDERECO': '',
            'MOVIMENTOSENVIO_NUMERO': '',
            'MOVIMENTOSENVIO_BAIRRO': '',
            'MOVIMENTOSENVIO_MOTORISTA': '',
            'MOVIMENTOSENVIO_PLACA': '',
            'MOVIMENTOSENVIO_PLACAUF': '',
            'MOVIMENTOSENVIO_ESPECIE': configs.getMovimentos().transporteEspecie || (configs.getMovimentos().calculaPesoNfe ? 'CAIXA(S)': 'CAIXA'),
            'MOVIMENTOSENVIO_MARCA': (configs.getMovimentos().transporteMarca || 'DIVERSOS'),
            'MOVIMENTOSENVIO_VOLUMES': '',
            'MOVIMENTOSENVIO_DATADI': momentServer().format('YYYY-MM-DD'),
            'MOVIMENTOSENVIO_DTDESEMBARQUE': momentServer().format('YYYY-MM-DD')
        };

        this.callParent(arguments);
    },

    fields: [
        'MOVIMENTOSENVIO_ID',             //INTEGER NOT NULL,
        'MOVIMENTOSENVIO_ID_MOVIMENTOS',  //INTEGER NOT NULL,
        'MOVIMENTOSENVIO_ID_USUARIOS',    //INTEGER NOT NULL,
        {
            name: 'MOVIMENTOSENVIO_ID_TRANSPORTES',  //INTEGER NOT NULL,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_MODO',           //CHAR(1),
            critical: true
        },
        {
            name: 'MOVIMENTOSENVIO_CPFCNPJ',        //VARCHAR(15),
            type: 'mask',
            validators: [
                {type: 'cpfcnpj'},
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_NOME',           //VARCHAR(50),
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_INSCRICAO',      //VARCHAR(15),
            validators: [
                {
                    type: 'inscricaoestadual', 
                    module: 'MOVIMENTOSENVIO', 
                    estadoField: 'CIDADES_ESTADO',
                    presence: false
                },
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_CEP',            //VARCHAR(8),
            type: 'mask',
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'TRANSPORTES_EMAIL'
        },
        'VETERINARIOS_NOME',
        'VETERINARIOS_CPF',
        'CIDADES_NOME', 
        'CIDADES_ESTADO',  
        'CIDADES_IBGE', 
        {
            name: 'MOVIMENTOSENVIO_ENDERECO',       //VARCHAR(50),
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_NUMERO',         //VARCHAR(10),
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_BAIRRO',         //VARCHAR(50),
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        'MOVIMENTOSENVIO_ID_CIDADES',     //INTEGER NOT NULL,
        {
            name: 'MOVIMENTOSENVIO_MOTORISTA',      //VARCHAR(50),
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_PLACA',          //VARCHAR(10),
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_PLACAUF'        //VARCHAR(2),            
        },
        {
            name: 'MOVIMENTOSENVIO_QUANTIDADE',     //INTEGER NOT NULL,
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_ESPECIE',        //VARCHAR(20),
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_MARCA',          //VARCHAR(20),
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_VOLUMES',        //VARCHAR(20),
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                }
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_PESOBRUTO',      //NUMERIC(12,3),
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                },
                {type: 'range', min: 0.001}
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_PESOLIQUIDO',    //NUMERIC(12,3),
            validators: [
                {
                    type: 'rule', 
                    value1:'MOVIMENTOSENVIO_ID_TRANSPORTES', 
                    operator:'==', 
                    value2: '1', 
                    allowEmpty: false,
                    action: 'presence'
                },
                {type: 'range', min: 0.001}
            ]
        },
        'MOVIMENTOSENVIO_DI',
        'MOVIMENTOSENVIO_DESEMBARQUE',
        'MOVIMENTOSENVIO_UFDESEMBARQUE',
        'MOVIMENTOSENVIO_VIATRANSPORTE',
        'MOVIMENTOSENVIO_CODEXPORTADOR',
        'MOVIMENTOSENVIO_CODFABRICANTE',
        'MOVIMENTOSENVIO_INTERMEDIARIO',
        {
            name: 'MOVIMENTOSENVIO_DATADI',
            type: 'nodejsdate',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSENVIO_DTDESEMBARQUE',
            type: 'nodejsdate',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOSENVIO_REFERENTE'       //VARCHAR(512)
    ]
});
