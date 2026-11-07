Ext.define('SamosAdmin.movimentos.caixa.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSCAIXA_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/caixa',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'MOVIMENTOSCAIXA_ID_EMPRESAS'   : configs.getEmpresa().id,
            'MOVIMENTOSCAIXA_ID_USUARIOS'   : configs.getUsuario().id,
            'MOVIMENTOSCAIXA_STATUS'        : 'A',
            'MOVIMENTOSCAIXA_NUMERO'        : 'A',            
            'MOVIMENTOSCAIXA_TIPO'          : 'E',
            'MOVIMENTOSCAIXA_EXPORTADO'     : 'N',
            'MOVIMENTOSCAIXA_ID_MOVIMENTOS' : 0,
            'MOVIMENTOSCAIXA_ID_ORDENS'     : 0,
            'MOVIMENTOSCAIXA_LOG'           : SamosUtils.Info.getLog(),
            'MOVIMENTOSCAIXA_HORA'          : momentServer().format('HH:mm:ss'),
            'MOVIMENTOSCAIXA_EMISSAO'       : momentServer().format('YYYY-MM-DD'),
            'MOVIMENTOSCAIXA_VENCIMENTO'    : momentServer().format('YYYY-MM-DD'),
            'MOVIMENTOSCAIXA_ID_FINANCEIROS': 0,
            'MOVIMENTOSCAIXA_DINHEIRO'      : 0,
            'MOVIMENTOSCAIXA_CHEQUE'        : 0,
            'MOVIMENTOSCAIXA_CREDITO'       : 0,
            'MOVIMENTOSCAIXA_DEBITO'        : 0,
            'MOVIMENTOSCAIXA_CREDITOLOJA'   : 0,
            'MOVIMENTOSCAIXA_CREDITOPESSOA' : 0,
            'MOVIMENTOSCAIXA_ALIMENTACAO'   : 0,            
            'MOVIMENTOSCAIXA_REFEICAO'      : 0,
            'MOVIMENTOSCAIXA_PRESENTE'      : 0,
            'MOVIMENTOSCAIXA_COMBUSTIVEL'   : 0,
            'MOVIMENTOSCAIXA_DUPLICATA'     : 0,
            'MOVIMENTOSCAIXA_BOLETO'        : 0,
            'MOVIMENTOSCAIXA_TRANSFERENCIAS': 0,
            'MOVIMENTOSCAIXA_TROCO'         : 0,
            'MOVIMENTOSCAIXA_OUTRO'         : 0,
            'MOVIMENTOSCAIXA_ID_PORTADORES' : 0,
            'CONTROLES_DOCUMENTOS'          : ''
        };

        this.callParent(arguments);
    },

    fields: [
        'MOVIMENTOSCAIXA_ID',
        'MOVIMENTOSCAIXA_EXPORTADO',
        'MOVIMENTOSCAIXA_ID_USUARIOS',
        'MOVIMENTOSCAIXA_ID_MOVIMENTOS',
        'MOVIMENTOSCAIXA_ID_ORDENS',
        {
            name: 'MOVIMENTOSCAIXA_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 512}
            ]
        },        
        {
            name: 'MOVIMENTOSCAIXA_ID_APLICACOES',
            validators: [
                {type: 'presence'}
            ]
        },         
        {
            name: 'APLICACOES_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]            
        },                
        {
            name: 'MOVIMENTOSCAIXA_ID_PESSOAS',
            validators: [
                {type: 'presence'}
            ]
        },        
        {
            name: 'PESSOAS_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },  
        'PESSOAS_CPFCNPJ',
        'PESSOAS_ENDERECO',
        'PESSOAS_NUMERO',
        'PESSOAS_BAIRRO',
        'PESSOAS_CEP',
        'PESSOAS_TELEFONE',
        'PESSOAS_CELULAR',
        'PESSOAS_ID_CIDADES',
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        'PESSOAS_INSCRICAO',
        'PRAZOS_NOME',
        'PRAZOS_PARCELAS',
        'PRAZOS_PARCELAMENTO',
        'CHEQUES_ID_BANCOS',
        'CHEQUES_AGENCIA',
        'CHEQUES_CONTA',
        'CHEQUES_NUMERO',
        {
            name: 'CHEQUES_CPFCNPJ',
            type: 'mask',
            validators: [
                {type: 'presence'},
                {type: 'cpfcnpj'},
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'MOVIMENTOSCAIXA_EMISSAO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSCAIXA_VENCIMENTO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSCAIXA_TIPO',
            validators: [
                {type: 'presence'}
            ]
        },        
        'MOVIMENTOSCAIXA_STATUS',
        'MOVIMENTOSCAIXA_NUMERO',
        {
            name: 'MOVIMENTOSCAIXA_ID_EMPRESAS', 
            critical: true,   
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOSCAIXA_DINHEIRO',
        'MOVIMENTOSCAIXA_CHEQUE',
        'MOVIMENTOSCAIXA_CREDITO',
        'MOVIMENTOSCAIXA_DEBITO',
        'MOVIMENTOSCAIXA_CREDITOLOJA',
        'MOVIMENTOSCAIXA_CREDITOPESSOA',
        'MOVIMENTOSCAIXA_ALIMENTACAO',
        'MOVIMENTOSCAIXA_REFEICAO',
        'MOVIMENTOSCAIXA_PRESENTE',
        'MOVIMENTOSCAIXA_COMBUSTIVEL',
        'MOVIMENTOSCAIXA_DUPLICATA',
        'MOVIMENTOSCAIXA_BOLETO',
        'MOVIMENTOSCAIXA_TRANSFERENCIAS', 
        {
            name: 'MOVIMENTOSCAIXA_ID_PORTADORES',
            validators: [
                {type: 'presence'}
            ]            
        },                
        'CONTAS_NOME',
        'CONTAS_TIPO',
        'ABERTURA_CAIXA',
        'CONTACORRENTES_DOCUMENTO',
        'MOVIMENTOSCAIXA_OUTRO',  
        'MOVIMENTOSCAIXA_TROCO',              
        'MOVIMENTOSCAIXA_LOG',
        'MOVIMENTOSCAIXA_HORA',
        'MOVIMENTOSCAIXA_CARTOES',                  // lista de Cartoes        
        'MOVIMENTOSCAIXA_CHEQUES'                   // lista de Cheques
    ]
});
