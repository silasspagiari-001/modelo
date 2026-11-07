Ext.define('SamosAdmin.movimentos.movimento.form.sefaz.cartas.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSCARTAS_ID',
    idParent: 'MOVIMENTOSCARTAS_ID_MOVIMENTOS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'MOVIMENTOSCARTAS_PROTOCOLO': '',
            'MOVIMENTOSCARTAS_CORRECOES': '',
            'MOVIMENTOSCARTAS_EMISSAO'  : momentServer().format('YYYY-MM-DD'),
            'MOVIMENTOSCARTAS_HORA'     : momentServer().format('HH:mm:ss'),
            'MOVIMENTOSCARTAS_ENVIO'    : '1899-12-30',
            'MOVIMENTOSCARTAS_LOG'      : SamosUtils.Info.getLog()
        };

        this.callParent(arguments);
    },

    fields: [
        'MOVIMENTOSCARTAS_ID',                         // INTEGER NOT NULL
        'MOVIMENTOSCARTAS_ID_MOVIMENTOS',              // INTEGER NOT NULL
        {
            name: 'MOVIMENTOSCARTAS_STATUS',//  CHAR(1)
            type: 'check',
            defaultValue: 'F'
        },
        {
            name: 'MOVIMENTOSCARTAS_EMISSAO',                // DATE NOT NULL
            type: 'nodejsdate'
        },
        {
            name: 'MOVIMENTOSCARTAS_ENVIO', 
            type: 'nodejsdate'           
        },
        'MOVIMENTOSCARTAS_HORA',           //VARCHAR(10),
        'MOVIMENTOSCARTAS_NOME',           //VARCHAR(50),
        'MOVIMENTOS_NFE',                  //VARCHAR(50),
        'MOVIMENTOSCARTAS_PROTOCOLO',      //VARCHAR(15),
        {
            name:  'MOVIMENTOSCARTAS_CORRECOES',       //VARCHAR(512)
            validators: [
                {
                    type: 'length',
                    min: 25, 
                    minOnlyMessage: 'Correções - Mínimo de 15 caracteres'
                }
            ]
        },
        'MOVIMENTOSCARTAS_LOG'
    ]
});
