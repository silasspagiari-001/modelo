Ext.define('SamosAdmin.movimentos.ordenssky.ModelAvariados', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENSAVARIADOS_ID',
    idParent: 'ORDENSAVARIADOS_ID_ORDENS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENSAVARIADOS_CRIACAO' : momentServer().format('YYYY-MM-DD')
        };

        this.callParent(arguments);
    },

    fields: [
        'ORDENSAVARIADOS_ID',
        'ORDENSAVARIADOS_ID_ORDENS',
        {
            name: 'ORDENSAVARIADOS_SITUACAO', 
            type: 'check'
        },
        {
            name: 'ORDENSAVARIADOS_REFERENCIA', 
            validators: [
                {type: 'length', max: 15}
            ]
        },
        'ORDENSAVARIADOS_SIGLA',
        'ORDENSAVARIADOS_MODELO',
        {
            name: 'ORDENSAVARIADOS_DESCRICAO', 
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'ORDENSAVARIADOS_SERIAL', 
            validators: [
                {type: 'length', max: 20}
            ]
        },
        {
            name: 'ORDENSAVARIADOS_CARTAO', 
            validators: [
                {type: 'length', max: 20}
            ]
        },
        {
            name: 'ORDENSAVARIADOS_CRIACAO',
            critical: true,
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENSAVARIADOS_HORACRIACAO',
        {
            name: 'ORDENSAVARIADOS_AGENDADA',
            type: 'nodejsdate'
        },
        'ORDENSAVARIADOS_HORAAGENDADA',
        {
            name: 'ORDENSAVARIADOS_LOCACAO',
            type: 'nodejsdate'
        },
        'ORDENSAVARIADOS_HORALOCACAO',
        {
            name: 'ORDENSAVARIADOS_LIMITE',
            type: 'nodejsdate'
        },
        'ORDENSAVARIADOS_HORALIMITE',
        {
            name: 'ORDENSAVARIADOS_EXECUCAO',
            type: 'nodejsdate'
        },
        'ORDENSAVARIADOS_HORAEXECUCAO'
    ]
});
