Ext.define('SamosAdmin.atualizacao.ncms.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'NCMS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/ncms'
    },

    fields: [
        'NCMS_ID',
        {
            name:'NCMS_STATUS',
            defaultValue: 'T',
            type: 'check'
        },
        {
            name: 'NCMS_NOME', //VARCHAR(512)
            validators: [
                {type: 'presence', max:512}
            ]
        },
        {
            name: 'NCMS_NCM', //VARCHAR(10)
            validators: [
                {type: 'presence', max:10}
            ]
        },
        {
            name: 'NCMS_ALIQUOTANACIONAL',
            validators: [
                {type: 'presence'}
            ]
        },
        'NCMS_CSTPIS',             //VARCHAR(2),
        'NCMS_ALIQUOTAPIS',        //NUMERIC(7,3),
        'NCMS_CSTCOFINS',          //VARCHAR(2),
        'NCMS_ALIQUOTACOFINS',     //NUMERIC(7,3),
        'NCMS_ALIQUOTAFCP',        //NUMERIC(7,3)
        {
            name: 'NCMS_ALIQUOTAIMPORTADO',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'NCMS_ALIQUOTAESTADUAL',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'NCMS_ALIQUOTAMUNICIPAL',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'NCMS_VERSAO', //VARCHAR(10)
            validators: [
                {type: 'presence', max:10}
            ]
        },
        {
            name: 'NCMS_REFERENCIA', //VARCHAR(10)
            validators: [
                {type: 'presence', max:10}
            ]
        },
        {
            name: 'NCMS_CEST', //VARCHAR(10)
        },
        'NCMS_DIFAL'//jsonlist para a grid
    ]

})
