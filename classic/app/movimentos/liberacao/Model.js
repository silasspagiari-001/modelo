Ext.define('SamosAdmin.movimentos.liberacao.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'NOTIFICACAO_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/liberacao',
        timeout: 300000
    },

    constructor: function () {
        this.defaultValues = {
            'NOTIFICACAO_STATUS'     : 'N', // Na liberação: (P)endente (T)Autorizada (F)Negada
            'NOTIFICACAO_TODOS'      : 'F',
            'NOTIFICACAO_ID_USUARIOS': configs.getUsuario().id,
            'USUARIOS_NOMEORIGEM'    : configs.getUsuario().nome,
            'NOTIFICACAO_DATACRIACAO': momentServer().format('YYYY-MM-DD'),
            'NOTIFICACAO_DATAAVISAR' : momentServer().format('YYYY-MM-DD'),
            'NOTIFICACAO_HORACRIACAO': momentServer().format('HH:mm'),
            'NOTIFICACAO_HORAAVISAR' : momentServer().add(5, 'minutes').format('HH:mm')
        };
        this.callParent(arguments);
    },

    fields: [
        'NOTIFICACAO_ID',
        'NOTIFICACAO_STATUS',
        {
            name: 'NOTIFICACAO_SMS',//  CHAR(1),
            type: 'check',
            defaultValue: 'F'
        },
        'NOTIFICACAO_TODOS',
        'NOTIFICACAO_ID_USUARIOS',
        'USUARIOS_NOMEORIGEM', 
        'NOTIFICACAO_ID_DESTINO',
        'USUARIOS_NOMEDESTINO', 
        'USUARIOS_CELULARDESTINO',
        {
            name: 'NOTIFICACAO_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'NOTIFICACAO_DATACRIACAO', 
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'NOTIFICACAO_HORACRIACAO',
        {
            name: 'NOTIFICACAO_DATAAVISAR', 
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'NOTIFICACAO_HORAAVISAR',
        {
            name: 'NOTIFICACAO_DATALEITURA', 
            type: 'nodejsdate',
        },
        'NOTIFICACAO_HORALEITURA',
        {
            name: 'NOTIFICACAO_MENSAGEM', 
            validators: [
                {type: 'length', max: 5120}
            ]
        }
    ]
});
