Ext.define('SamosAdminModern.receber.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'FINANCEIROS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/financeiros'
    },

    constructor: function () {
        this.defaultValues = {
            'FINANCEIROS_ID_EMPRESAS'     : configs.getEmpresa().id,
            'FINANCEIROS_ID_USUARIOS'     : configs.getUsuario().id,
            'USUARIOS_NOME'               : configs.getUsuario().nome,
            'FINANCEIROS_LOG'             : SamosUtils.Info.getLog(),
            'FINANCEIROS_ID_PORTADORES'   : configs.getEmpresa().id,
            'PORTADORES_NOME'             : 'CARTEIRA',
            'FINANCEIROS_EMISSAO'         : momentServer().format('YYYY-MM-DD'),
            'FINANCEIROS_VENCIMENTO'      : momentServer().format('YYYY-MM-DD'),
            'FINANCEIROS_PAGAMENTO'       : '1899-12-30',
            'FINANCEIROS_BAIXA'           : '1899-12-30',
            'FINANCEIROS_STATUS'          : 'A',
            'FINANCEIROS_EXPORTADO'       : 'F',
            'FINANCEIROS_ID_MOVIMENTOS'   : 0,
            'FINANCEIROS_ID_PRAZOS'       : 0,
            'FINANCEIROS_ID_APLICACOES'   : 1,
            'FINANCEIROS_ID_CUSTOS'       : 1,
            'FINANCEIROS_ORIGINAL'        : 0,
            'FINANCEIROS_ABERTO'          : 0,
            'FINANCEIROS_DESCONTOS'       : 0,
            'FINANCEIROS_JUROS'           : 0,
            'FINANCEIROS_TAXAS'           : 0,
            'FINANCEIROS_PAGO'            : 0,
            'FINANCEIROS_TOTAL'           : 0,
            'FINANCEIROS_NOSSONUMERO'     : 0,
            'FINANCEIROS_ID_EMPRESAORIGEM': 0,
            'FINANCEIROS_NUMEROORIGEM'    : 0,
            'FINANCEIROS_SERIEORIGEM'     : '',
            'FINANCEIROS_BOLETO'          : '',
            'FINANCEIROS_OBSERVACOES'     : ''
        };
        this.callParent(arguments);
    },

    fields: [
        'FINANCEIROS_ID',
        {
            name: 'FINANCEIROS_ID_EMPRESAS',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        'EMPRESAS_FANTASIA',
        'FINANCEIROS_ID_DOCUMENTOS',
        'DOCUMENTOS_NOME',
        'DOCUMENTOS_COLETACARTAO',
        'FINANCEIROS_ID_MOVIMENTOS',
        {
            name: 'FINANCEIROS_ID_USUARIOS',
            validators: [
                {type: 'presence'}
            ]
        },
        'USUARIOS_NOME',
        'USUARIOS_EMAIL',
        'USUARIOS_TELEFONE',
        'USUARIOS_CELULAR',
        {
            name: 'PRAZOCALCULADO_FINANCEIRO',
            persist: false
        },
        {
            name: 'GERALABERTO_FINANCEIRO',
            persist: false
        },
        {
            name: 'GERALPAGO_FINANCEIRO',
            persist: false
        },
        {
            name: 'FINANCEIROS_ID_PESSOAS',
            validators: [
                {type: 'presence'}
            ]
        },
        'PESSOAS_ID_CIDADES',
        {
            name: 'PESSOAS_NOME',
            validators: [
                {type: 'presence'}
            ]
        },
        'PESSOAS_CPFCNPJ',
        'PESSOAS_INSCRICAO',
        'PESSOAS_ENDERECO',
        'PESSOAS_NUMERO',
        'PESSOAS_BAIRRO',
        'PESSOAS_CELULAR',
        'PESSOAS_CREDITO',
        'PESSOAS_EMAIL',
        'PESSOAS_TELEFONE',
        'PESSOAS_CEP',
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        {
            name: 'FINANCEIROS_ID_PORTADORES',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PORTADORES_NOME',
            validators: [
                {type: 'presence'}
            ]
        },
        'BANCOS_NOME',
        {
            name: 'FINANCEIROS_ID_PRAZOS',
            validators: [
                {type: 'presence'}
            ]
        },
        'PRAZOS_NOME',
        {
            name: 'FINANCEIROS_NOSSONUMERO',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FINANCEIROS_NUMERO',
            critical: true
        },
        {
            name: 'FINANCEIROS_SERIE',
            critical: true
        },
        {
            name: 'FINANCEIROS_PARCELA',
            defaultValue: 1,
            validators: [
                {type: 'presence'},
                {type: 'range', min: 1}
            ]
        },
        {
            name: 'FINANCEIROS_PARCELAS',
            defaultValue: 1,
            validators: [
                {type: 'presence'},
                {type: 'range', min: 1}
            ]
        },
        'FINANCEIROS_STATUS',
        {
            name: 'FINANCEIROS_BOLETO', 
        },
        'FINANCEIROS_TIPO',
        'FINANCEIROS_EXPORTADO', 
        {
            name: 'FINANCEIROS_ID_APLICACOES',
            validators: [
                {type: 'presence'}
            ]
        },
        'APLICACOES_NOME',
        {
            name: 'FINANCEIROS_ID_CUSTOS',
            validators: [
                {type: 'presence'}
            ]
        },
        'CUSTOS_NOME',
        {
            name: 'FINANCEIROS_EMISSAO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FINANCEIROS_VENCIMENTO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FINANCEIROS_PAGAMENTO',
            type: 'nodejsdate'
        },
        {
            name: 'FINANCEIROS_BAIXA',
            type: 'nodejsdate'
        },
        {
            name: 'FINANCEIROS_ORIGINAL', 
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FINANCEIROS_ABERTO',   
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ABERTOORIGINAL_FINANCEIRO',
            persist: false
        },
        {
            name: 'FINANCEIROS_DESCONTOS',   
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FINANCEIROS_JUROS',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FINANCEIROS_TAXAS', 
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FINANCEIROS_PAGO',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FINANCEIROS_TOTAL',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FINANCEIROS_OBSERVACOES',
            critical: true
        },
        'FINANCEIROS_ID_EMPRESAORIGEM',
        'FINANCEIROS_NUMEROORIGEM',
        'FINANCEIROS_SERIEORIGEM',
        'FINANCEIROS_LOG'
    ]
});
